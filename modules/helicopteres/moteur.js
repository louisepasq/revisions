/* Moteur du module des hélicoptères : l'état d'un enfant (clé <enfant>.helicopteres), les étapes qui
   s'ouvrent, les cartes de Leitner, le carnet de pilote (tampons et objets) et l'expérience.
   Les boîtes de Leitner sont celles du zoom : Zoom.enregistrer (une montée par jour, une erreur en
   boîte 1 revue le jour même), Zoom.jour, Zoom.ajouterJours, Zoom.joursDeLaSemaine et Zoom.finirSeance,
   sur des cartes rangées sous '<carte>|q'. Dépend de modules/zoom/moteur.js et de contenu.js.
   Logique pure en dehors de charger et sauver. Script classique, chargé aussi par node. */
(function (racine) {
  'use strict';

  const MODULE = 'helicopteres';
  const VERSION = 1;
  const TYPE = 'q'; // le seul type de question : '<carte>|q' dans etat.cartes
  const TAILLE_SEANCE = 8;
  const NOUVELLES_PAR_JOUR = 4; // comme les tables (D-20) : au plus quatre cartes nouvelles par jour
  const RETOUR_APRES = 3;
  const BOITE_TAMPON = 3; // une commande est maîtrisée quand ses deux cartes sont en boîte 3 ou plus
  const MESURES = 3; // trois mesures par modèle (D-24, point 2)

  const Z = () => racine.Zoom;
  const HC = () => racine.HeliContenu;
  const cle = id => id + '|' + TYPE;

  /* L'état neuf. `langue` et `seanceFinie` sont facultatifs et n'y entrent pas : un état enregistré
     sans eux se relit tel quel, et le choix de langue s'affiche au lancement suivant. */
  function etatNeuf() {
    return {
      version: VERSION, etapes: {}, cartes: {}, jours: [], brevet: {}, objets: {}, tampons: [],
      mission: null, couleur: null, conception: null, parties: [], trouves: [],
      experience: { hypothese: null, verifs: [], mesures: {}, conclusion: null },
    };
  }

  const estObjet = v => v !== null && typeof v === 'object' && !Array.isArray(v);
  /* Relit un état enregistré sans rien perdre : les champs connus mal formés reprennent leur forme
     neuve, tout le reste est gardé tel quel. */
  function normaliser(brut) {
    const n = Object.assign(etatNeuf(), estObjet(brut) ? brut : {});
    ['etapes', 'cartes', 'brevet', 'objets'].forEach(k => { if (!estObjet(n[k])) n[k] = {}; });
    ['jours', 'tampons', 'parties', 'trouves'].forEach(k => { if (!Array.isArray(n[k])) n[k] = []; });
    if (!estObjet(n.experience)) n.experience = etatNeuf().experience;
    if (!estObjet(n.experience.mesures)) n.experience.mesures = {};
    if (!Array.isArray(n.experience.verifs)) n.experience.verifs = [];
    return n;
  }

  function noterJour(etat, maintenant) {
    const j = Z().jour(maintenant);
    if (!etat.jours.includes(j)) etat.jours.push(j);
    etat.jours.sort();
    return j;
  }

  /* ---------- Étapes ---------- */
  const faite = (etat, id) => !!etat.etapes[id];
  const ouverte = (etat, id) => HC().etape(id).apres.every(x => faite(etat, x));

  /* Une étape finie : sa date, l'objet du carnet qu'elle donne (D-25), le jour pratiqué.
     Rend l'objet reçu, ou null s'il l'était déjà. */
  function finirEtape(etat, id, maintenant) {
    const j = noterJour(etat, maintenant);
    if (!etat.etapes[id]) etat.etapes[id] = j;
    const objet = HC().etape(id).objet;
    if (etat.objets[objet]) return null;
    etat.objets[objet] = j;
    return objet;
  }

  /* La prochaine étape à faire dans l'app (ni l'atelier ni la sortie, qui se font hors de l'écran). */
  function etapeSuivante(etat) {
    const e = HC().ETAPES.find(x => x.jeu && !faite(etat, x.id) && ouverte(etat, x.id));
    return e ? e.id : null;
  }
  const nbEtapes = etat => HC().ETAPES.filter(e => faite(etat, e.id)).length;

  /* ---------- Cartes de Leitner ---------- */
  const lire = (etat, id) => etat.cartes[cle(id)] || null;
  const boite = (etat, id) => { const c = lire(etat, id); return c && c.vu ? c.boite : 0; };
  const cartesOuvertes = etat => HC().CARTES.filter(c => faite(etat, c.etape));
  const nouvellesDuJour = (etat, j) => Object.values(etat.cartes).filter(c => c && c.debut === j).length;

  /* Les cartes de la séance du jour : celles qui reviennent, puis des nouvelles (quatre par jour au
     plus), dans l'ordre des étapes ; vide si rien n'est dû. */
  function seance(etat, maintenant, taille) {
    taille = taille || TAILLE_SEANCE;
    const j = Z().jour(maintenant);
    const ouvertes = cartesOuvertes(etat);
    const dues = ouvertes.filter(c => { const x = lire(etat, c.id); return x && x.vu && x.prochain <= j; })
      .sort((a, b) => lire(etat, a.id).prochain.localeCompare(lire(etat, b.id).prochain) || boite(etat, a.id) - boite(etat, b.id));
    const place = Math.max(0, NOUVELLES_PAR_JOUR - nouvellesDuJour(etat, j));
    const neuves = ouvertes.filter(c => { const x = lire(etat, c.id); return !x || !x.vu; }).slice(0, place);
    return [...dues.slice(0, Math.max(0, taille - neuves.length)), ...neuves].slice(0, taille).map(c => ({ carte: c.id }));
  }
  const nbDues = (etat, maintenant) => seance(etat, maintenant, 99).length;

  function creerSeance(etat, maintenant, taille) {
    return { questions: seance(etat, maintenant, taille), index: 0, vues: new Set(), montees: [], brevetAvant: Object.keys(etat.brevet) };
  }
  const courante = s => s.questions[s.index] || null;
  const finie = s => s.index >= s.questions.length;
  function suivante(s) { s.index++; return courante(s); }

  /* Seule la première réponse d'une carte dans la séance compte ; une erreur la fait revenir trois
     questions plus loin (comme le zoom). */
  function repondre(s, etat, juste, maintenant) {
    const q = courante(s);
    if (!q) return null;
    const premier = !s.vues.has(q.carte);
    s.vues.add(q.carte);
    if (!premier) return { juste, premier };
    const j = noterJour(etat, maintenant);
    const avant = lire(etat, q.carte);
    if (!avant || !avant.vu) {
      etat.cartes[cle(q.carte)] = { boite: 0, vu: false, prochain: null, justesJours: [], erreurs: 0, debut: j };
    }
    const r = Z().enregistrer(etat, q.carte, TYPE, juste, maintenant);
    if (r.monte) s.montees.push(q.carte);
    if (!juste) s.questions.splice(Math.min(s.index + 1 + RETOUR_APRES, s.questions.length), 0, Object.assign({}, q, { retour: true }));
    return { juste, premier };
  }

  function avancement(s) {
    const compte = l => l.filter(x => !x.retour).length;
    const total = compte(s.questions);
    return { n: Math.max(1, Math.min(compte(s.questions.slice(0, s.index + 1)), total)), total: Math.max(1, total) };
  }

  /* ---------- Carnet de pilote (D-25) ----------
     Un tampon par commande maîtrisée : ses deux cartes en boîte 3 ou plus. Un tampon posé ne
     s'enlève jamais, même si une carte redescend (esprit de D-20) ; il n'ouvre rien. */
  const cartesDe = cmd => HC().CARTES.filter(c => c.commande === cmd).map(c => c.id);
  const maitrisee = (etat, cmd) => cartesDe(cmd).every(id => boite(etat, id) >= BOITE_TAMPON);
  function majBrevet(etat, maintenant) {
    const nouveaux = [];
    HC().COMMANDES.forEach(c => {
      if (!etat.brevet[c.id] && maitrisee(etat, c.id)) { etat.brevet[c.id] = Z().jour(maintenant); nouveaux.push(c.id); }
    });
    return nouveaux;
  }
  /* Les tampons pas encore montrés en grand (l'animation se joue une fois). */
  const tamponsAMontrer = etat => Object.keys(etat.brevet).filter(c => !etat.tampons.includes(c));
  function tamponMontre(etat, cmd) { if (!etat.tampons.includes(cmd)) etat.tampons.push(cmd); }

  /* ---------- L'expérience (D-24, point 2) ----------
     Durées en dixièmes de seconde, trois par modèle ; la durée du milieu (la médiane, sans le mot). */
  function noterMesure(etat, modele, rang, dixiemes) {
    const m = etat.experience.mesures;
    if (!Array.isArray(m[modele])) m[modele] = [];
    m[modele][rang] = Math.max(1, Math.min(999, Math.round(dixiemes)));
    return m[modele];
  }
  function milieu(liste) {
    const l = (liste || []).filter(x => typeof x === 'number').slice().sort((a, b) => a - b);
    if (!l.length) return null;
    return l.length % 2 ? l[(l.length - 1) / 2] : Math.round((l[l.length / 2 - 1] + l[l.length / 2]) / 2);
  }
  const mesuresCompletes = etat => HC().ATELIER.modeles.every(m => (etat.experience.mesures[m.id] || []).filter(x => typeof x === 'number').length >= MESURES);

  /* ---------- Bilan pour le portail et le coin parent ---------- */
  function compte(etat) {
    const cartes = HC().CARTES;
    return {
      etapes: nbEtapes(etat),
      totalEtapes: HC().ETAPES.length,
      retrouvees: cartes.filter(c => boite(etat, c.id) >= 1).length,
      sues: cartes.filter(c => boite(etat, c.id) >= BOITE_TAMPON).length,
      totalCartes: cartes.length,
      tampons: Object.keys(etat.brevet).length,
    };
  }
  const fragiles = etat => HC().CARTES.filter(c => { const x = lire(etat, c.id); return x && x.vu && x.erreurs > 0 && x.boite <= 2; }).map(c => c.id);

  const joursDeLaSemaine = (etat, maintenant) => Z().joursDeLaSemaine(etat, maintenant);
  /* Une séance (de cartes ou d'étape) arrivée à son écran de fin : seul ce moment fait sortir le
     module du « Today » (D-22, point 10) ; voir Zoom.finirSeance. */
  const finirSeance = (etat, maintenant) => Z().finirSeance(etat, maintenant);

  function charger(enfant) {
    try {
      const brut = racine.localStorage.getItem(enfant + '.' + MODULE);
      return brut ? normaliser(JSON.parse(brut)) : etatNeuf();
    } catch (e) {
      return etatNeuf();
    }
  }
  function sauver(enfant, etat) {
    try { racine.localStorage.setItem(enfant + '.' + MODULE, JSON.stringify(etat)); return true; } catch (e) { return false; }
  }

  racine.Helico = {
    MODULE, VERSION, TAILLE_SEANCE, NOUVELLES_PAR_JOUR, BOITE_TAMPON, MESURES, cle, etatNeuf, normaliser, noterJour,
    faite, ouverte, finirEtape, etapeSuivante, nbEtapes, lire, boite, cartesOuvertes, nouvellesDuJour, seance, nbDues,
    creerSeance, courante, finie, suivante, repondre, avancement, maitrisee, majBrevet, tamponsAMontrer, tamponMontre,
    noterMesure, milieu, mesuresCompletes, compte, fragiles, joursDeLaSemaine, finirSeance, charger, sauver,
  };
})(typeof window !== 'undefined' ? window : globalThis);
