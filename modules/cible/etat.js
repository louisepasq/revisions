/* Jeu du nombre cible : l'état d'un enfant (clé <enfant>.cible), sa sauvegarde locale et le
   résumé publié pour le portail (D-19). Logique pure en dehors de charger et sauver.
   Dépend de commun/textes.js pour les phrases du résumé. Script classique, chargé aussi par node. */
(function (racine) {
  'use strict';

  const VERSION = 1;
  const GARDEES = 30; // dernières parties gagnées gardées pour le coin parent

  function etatNeuf() {
    return { version: VERSION, parties: 0, gagnees: 0, parfaits: 0, meilleurs: 0, indices: 0, jours: [], dernieres: [] };
  }

  function jour(d) {
    const x = d || new Date();
    return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
  }

  function normaliser(e) {
    const n = Object.assign(etatNeuf(), e && typeof e === 'object' ? e : {});
    n.jours = Array.isArray(n.jours) ? n.jours.filter(j => typeof j === 'string') : [];
    n.dernieres = Array.isArray(n.dernieres) ? n.dernieres : [];
    return n;
  }

  function charger(enfant) {
    try { return normaliser(JSON.parse(racine.localStorage.getItem(enfant + '.cible'))); } catch (e) { return etatNeuf(); }
  }
  function sauver(enfant, etat) {
    try { racine.localStorage.setItem(enfant + '.cible', JSON.stringify(etat)); return true; } catch (e) { return false; }
  }

  function marquerJour(etat, maintenant) {
    const j = jour(maintenant);
    if (!etat.jours.includes(j)) etat.jours.push(j);
    etat.jours.sort();
    return etat;
  }

  /* Une partie commencée (nouvelle cible) : sert aussi de graine au tirage suivant. */
  function commencer(etat) { etat.parties++; return etat; }

  /* Une partie gagnée : { cible, nombres, score, meilleur, indices, chrono, etapes }. */
  function gagner(etat, p, maintenant) {
    marquerJour(etat, maintenant);
    // Le jour de la découverte (D-22) : la première cible atteinte. Champ facultatif, hors d'etatNeuf
    // pour qu'un état enregistré se relise à l'identique ; un état d'avant D-22 qui a déjà gagné ne le reçoit jamais.
    if (!etat.gagnees && !etat.decouvert) etat.decouvert = jour(maintenant);
    etat.gagnees++;
    if (p.parfait) etat.parfaits++;
    if (p.score >= p.meilleur && !p.indices) etat.meilleurs++;
    etat.indices += p.indices || 0;
    etat.dernieres.push({ jour: jour(maintenant), cible: p.cible, nombres: p.nombres, score: p.score, meilleur: p.meilleur, indices: p.indices || 0, chrono: p.chrono || 0 });
    if (etat.dernieres.length > GARDEES) etat.dernieres = etat.dernieres.slice(-GARDEES);
    return etat;
  }

  /* Les sept jours de la semaine en cours, pour KR.semaine. */
  function joursDeLaSemaine(etat, maintenant) {
    const d = new Date(maintenant);
    d.setHours(12, 0, 0, 0);
    const lundi = new Date(d);
    lundi.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    const auj = jour(maintenant);
    return Array.from({ length: 7 }, (_, i) => {
      const x = new Date(lundi);
      x.setDate(lundi.getDate() + i);
      const j = jour(x);
      return { fait: etat.jours.includes(j), aujourdhui: j === auj, avenir: j > auj };
    });
  }

  function phrase(cle, cleUn, n) {
    const T = racine.Textes;
    const k = n === 1 ? cleUn : cle;
    return { en: T.t(k, { n }, 'en'), fr: T.t(k, { n }, 'fr') };
  }

  /* Le résumé standard du portail (contrat de progression du 01/11/2026). */
  function resume(etat, maintenant) {
    const T = racine.Textes;
    const auj = jour(maintenant);
    const d = new Date(maintenant);
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() - 13);
    const depuis = jour(d);
    const gagneesAuj = etat.dernieres.filter(p => p.jour === auj).length;
    const progres = {
      avancement: null, // un jeu sans programme à parcourir : la phrase porte le progrès
      phrase: etat.gagnees ? phrase('res_cible_atteintes', 'res_cible_atteinte_un', etat.gagnees) : { en: T.t('res_cible_a_toi', null, 'en'), fr: T.t('res_cible_a_toi', null, 'fr') },
      aujourdhui: gagneesAuj ? phrase('res_cible_auj', 'res_cible_auj_un', gagneesAuj) : null,
      jour: auj,
    };
    return {
      progres,
      // Un jeu libre (D-22, point 6) : rien n'est dû une fois découvert, l'enfant y vient quand il veut.
      // Tant qu'aucune cible n'est atteinte, c'est une découverte, que le portail ne propose que deux
      // jours par semaine ; elle ne sort du « Today » qu'une cible atteinte (point 10).
      du: etat.gagnees ? null : { des: auj, nature: 'decouverte', phrase: { en: T.t('res_nouveau', null, 'en'), fr: T.t('res_nouveau', null, 'fr') }, minutes: 5 },
      // La séance de découverte finie, comptée dans le plafond du jour où elle a eu lieu (point 1).
      fini: etat.decouvert ? { jour: etat.decouvert, nature: 'decouverte', minutes: 5 } : null,
      jours: etat.jours.filter(j => j >= depuis && j <= auj),
      parent: phraseParent(etat),
    };
  }

  /* Le coin parent est en français. Jamais de comparaison entre enfants : seulement ses parties. */
  function phraseParent(etat) {
    if (!etat.gagnees) return etat.parties ? "Le nombre cible : commencé, aucune cible atteinte pour l'instant." : "Le nombre cible n'a pas encore commencé.";
    const pl = (n, un, plusieurs) => (n === 1 ? '1 ' + un : n + ' ' + plusieurs);
    let s = `Le nombre cible : ${pl(etat.gagnees, 'cible atteinte', 'cibles atteintes')} en ${pl(etat.jours.length, 'jour', 'jours')}`;
    if (etat.parfaits) s += `, dont ${pl(etat.parfaits, 'coup parfait', 'coups parfaits')}`;
    s += '.';
    if (etat.indices) s += ` ${pl(etat.indices, 'indice pris', 'indices pris')}.`;
    const der = etat.dernieres[etat.dernieres.length - 1];
    if (der) s += ` Dernière partie : ${der.score} point${der.score > 1 ? 's' : ''} sur ${der.meilleur} possibles.`;
    return s;
  }

  racine.CibleEtat = { VERSION, etatNeuf, normaliser, jour, charger, sauver, marquerJour, commencer, gagner, joursDeLaSemaine, resume, phraseParent };
})(typeof window !== 'undefined' ? window : globalThis);
