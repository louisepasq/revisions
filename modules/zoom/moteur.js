/* Moteur du zoom : rappel actif par boîtes de Leitner, une carte par lieu et par type de question
   (« toucher » le lieu nommé, « nommer » le lieu montré), étapes qui s'ouvrent l'une après l'autre.
   Générique : il ne connaît que le programme qu'on lui passe, { etages: [{ id, lieux: [id…] }],
   groupes: { id: groupe } } (voir contenu.js), jamais la géographie.
   Script classique (pas de module ES) pour fonctionner aussi ouvert depuis le disque. */
(function (racine) {
  'use strict';

  const INTERVALLE_JOURS = [0, 1, 2, 4, 7, 21];
  const BOITE_MAX = 5;
  const BOITE_NOMMER = 2; // « nommer » naît quand « toucher » atteint cette boîte : où, avant comment ça s'appelle
  const BOITE_ETAGE = 2; // un lieu compte pour ouvrir l'étape suivante à partir de cette boîte
  const SEUIL_ETAGE = 0.8; // quatre lieux sur cinq
  const NOUVEAUX_PAR_SEANCE = 3;
  const TAILLE_SEANCE = 10;
  const RETOUR_APRES = 3;
  /* Rapide : premier toucher en moins de 4 secondes. Sert seulement à la voix (D-11 bis) ; une carte
     se cherche plus longtemps qu'un fait des tables, d'où 4 secondes au lieu de 3. */
  const RAPIDE_MS = 4000;
  const RANG = { gris: 0, bronze: 1, argent: 2, or: 3 };

  const cle = (lieu, type) => lieu + '|' + type;

  function jour(date) {
    const d = new Date(date);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function ajouterJours(jourIso, n) {
    const [y, m, d] = jourIso.split('-').map(Number);
    return jour(new Date(y, m - 1, d + n));
  }

  function etatNeuf() {
    return { version: 1, cartes: {}, etages: 1, jours: [], intro: false };
  }

  function carte(etat, lieu, type) {
    const k = cle(lieu, type);
    if (!etat.cartes[k]) etat.cartes[k] = { boite: 0, vu: false, prochain: null, justesJours: [], erreurs: 0 };
    return etat.cartes[k];
  }
  const lire = (etat, lieu, type) => etat.cartes[cle(lieu, type)] || null;
  const boite = (etat, lieu, type) => { const c = lire(etat, lieu, type); return c && c.vu ? c.boite : 0; };

  function noterJour(etat, j) {
    if (!etat.jours.includes(j)) etat.jours.push(j);
  }

  /* Première rencontre : le lieu est montré et nommé, l'enfant le touche une fois. Ce n'est pas
     encore un rappel : la carte « toucher » naît en boîte 0, à revoir le jour même. */
  function decouvrir(etat, lieu, maintenant) {
    const c = carte(etat, lieu, 'toucher');
    const j = jour(maintenant);
    noterJour(etat, j);
    if (c.vu) return;
    c.vu = true;
    c.boite = 0;
    c.prochain = j;
  }

  /* Pas de seuil de temps : juste du premier coup, à des jours différents, fait monter d'une boîte
     (une seule montée par jour) ; une erreur ramène en boîte 1, à revoir le jour même. */
  function enregistrer(etat, lieu, type, juste, maintenant) {
    const c = carte(etat, lieu, type);
    const j = jour(maintenant);
    c.vu = true;
    c.dernierJuste = !!juste;
    noterJour(etat, j);
    if (!juste) {
      c.erreurs++;
      c.boite = 1;
      c.prochain = j;
      return { monte: false };
    }
    let monte = false;
    if (!c.justesJours.includes(j)) {
      c.justesJours.push(j);
      if (c.boite < BOITE_MAX) { c.boite++; monte = true; }
    }
    c.prochain = ajouterJours(j, INTERVALLE_JOURS[c.boite]);
    return { monte };
  }

  /* L'état d'un lieu, pour colorer la carte comme la grille des tables. */
  function couleur(etat, lieu) {
    const t = lire(etat, lieu, 'toucher');
    if (!t || !t.vu || !t.boite) return 'gris'; // montré mais pas encore retrouvé
    if (t.boite >= 4 && boite(etat, lieu, 'nommer') >= 3) return 'or';
    if (t.boite >= 3) return 'argent';
    return 'bronze';
  }

  function majEtages(etat, prog) {
    while (etat.etages < prog.etages.length) {
      const lieux = prog.etages[etat.etages - 1].lieux;
      const acquis = lieux.filter(l => boite(etat, l, 'toucher') >= BOITE_ETAGE).length;
      if (lieux.length && acquis / lieux.length < SEUIL_ETAGE) break;
      etat.etages++;
    }
    return etat.etages;
  }

  function lieuxOuverts(etat, prog) {
    const l = [];
    prog.etages.slice(0, Math.max(1, etat.etages)).forEach((e, rang) => e.lieux.forEach(id => l.push({ lieu: id, etage: e.id, rang })));
    return l;
  }

  function melanger(liste, graine) {
    let s = 0;
    for (const c of String(graine)) s = (s * 31 + c.charCodeAt(0)) >>> 0;
    const l = liste.slice();
    for (let i = l.length - 1; i > 0; i--) {
      s = (s * 1103515245 + 12345) >>> 0;
      const k = s % (i + 1);
      [l[i], l[k]] = [l[k], l[i]];
    }
    return l;
  }

  /* Une séance d'environ cinq minutes : les cartes dues, trois lieux nouveaux au plus (chacun
     d'abord montré, puis demandé trois questions plus loin), puis des révisions. Les questions
     sont rangées par étape, dans l'ordre du zoom, pour que l'enfant ne saute pas d'une carte à
     l'autre à chaque question. */
  function seance(etat, prog, maintenant, taille) {
    taille = taille || TAILLE_SEANCE;
    const j = jour(maintenant);
    const ouverts = lieuxOuverts(etat, prog);
    const candidats = [];
    ouverts.forEach(o => {
      const t = lire(etat, o.lieu, 'toucher');
      if (!t || !t.vu) return;
      candidats.push(Object.assign({ type: 'toucher', c: t }, o));
      if (t.boite >= BOITE_NOMMER) candidats.push(Object.assign({ type: 'nommer', c: lire(etat, o.lieu, 'nommer') }, o));
    });
    // Mélangées avant le tri : à égalité, une étape lointaine a autant de chances qu'une proche.
    const dus = melanger(candidats.filter(x => !x.c || !x.c.vu || x.c.prochain <= j), 'dus' + j)
      .sort((a, b) => ((a.c && a.c.vu ? a.c.prochain : '9') || '').localeCompare((b.c && b.c.vu ? b.c.prochain : '9') || '')
        || (a.c ? a.c.boite : 0) - (b.c ? b.c.boite : 0));
    const revisions = melanger(candidats.filter(x => x.c && x.c.vu && x.c.prochain > j && x.c.boite < 4), 'rev' + j)
      .sort((a, b) => a.c.boite - b.c.boite || a.c.prochain.localeCompare(b.c.prochain));
    const nouveaux = ouverts.filter(o => { const t = lire(etat, o.lieu, 'toucher'); return !t || !t.vu; }).slice(0, NOUVEAUX_PAR_SEANCE);

    const choisis = [];
    const prendre = (liste, n) => { for (const x of liste) { if (choisis.length >= n) break; if (!choisis.some(c => c.lieu === x.lieu && c.type === x.type)) choisis.push(x); } };
    prendre(dus, taille - nouveaux.length);
    prendre(revisions, taille - nouveaux.length);
    if (!choisis.length && !nouveaux.length) {
      prendre(melanger(candidats, 'acquis' + j), Math.min(5, taille));
    }

    const questions = [];
    const rangs = Array.from(new Set([...choisis, ...nouveaux].map(x => x.rang))).sort((a, b) => a - b);
    rangs.forEach(rang => {
      const groupe = melanger(choisis.filter(x => x.rang === rang), j + rang).map(x => ({ type: x.type, lieu: x.lieu, etage: x.etage }));
      const neufs = nouveaux.filter(x => x.rang === rang);
      let pos = 0;
      neufs.forEach(n => {
        groupe.splice(pos, 0, { type: 'decouverte', lieu: n.lieu, etage: n.etage });
        groupe.splice(Math.min(pos + 1 + RETOUR_APRES, groupe.length), 0, { type: 'toucher', lieu: n.lieu, etage: n.etage });
        pos += 2;
      });
      questions.push(...groupe);
    });
    return questions;
  }

  /* Les noms proposés pour « nommer » : le lieu et des voisins du même groupe et de la même étape
     (des planètes pour une planète), puis de la même étape. */
  function choix(prog, lieu, n, graine) {
    const etage = prog.etages.find(e => e.lieux.includes(lieu));
    const autres = etage ? etage.lieux.filter(l => l !== lieu) : [];
    const g = prog.groupes[lieu];
    const memes = melanger(autres.filter(l => prog.groupes[l] === g), graine);
    const reste = melanger(autres.filter(l => prog.groupes[l] !== g), graine + 'r');
    const pris = [...memes, ...reste].slice(0, Math.max(1, n) - 1);
    const pos = melanger([...Array(pris.length + 1).keys()], graine + 'p')[0];
    pris.splice(pos, 0, lieu);
    return pris;
  }

  function creerSeance(etat, prog, maintenant, taille) {
    return { questions: seance(etat, prog, maintenant, taille), index: 0, justes: 0, reponses: 0, montees: [], vues: new Set(), etagesAvant: etat.etages };
  }

  const courante = s => s.questions[s.index] || null;

  /* Seule la première réponse d'une carte dans la séance compte ; une erreur fait revenir la
     carte trois questions plus loin. */
  function repondre(s, etat, juste, maintenant) {
    const q = courante(s);
    if (!q) return null;
    if (q.type === 'decouverte') { decouvrir(etat, q.lieu, maintenant); return { juste: true, premier: false }; }
    const k = cle(q.lieu, q.type);
    const premier = !s.vues.has(k);
    s.vues.add(k);
    s.reponses++;
    if (juste) s.justes++;
    if (premier) {
      const avant = couleur(etat, q.lieu);
      enregistrer(etat, q.lieu, q.type, juste, maintenant);
      const apres = couleur(etat, q.lieu);
      if (RANG[apres] > RANG[avant]) s.montees.push({ lieu: q.lieu, couleur: apres });
      if (!juste) s.questions.splice(Math.min(s.index + 1 + RETOUR_APRES, s.questions.length), 0, Object.assign({}, q, { retour: true }));
    }
    return { juste, premier };
  }

  function suivante(s) {
    s.index++;
    return courante(s);
  }
  const finie = s => s.index >= s.questions.length;

  /* Avancement affiché : les découvertes et les retours ne comptent pas comme des questions. */
  function avancement(s) {
    const compte = l => l.filter(x => x.type !== 'decouverte' && !x.retour).length;
    const total = compte(s.questions);
    return { n: Math.max(1, Math.min(compte(s.questions.slice(0, s.index + 1)), total)), total: Math.max(1, total) };
  }

  function joursDeLaSemaine(etat, maintenant) {
    const d = new Date(maintenant);
    const decalage = (d.getDay() + 6) % 7;
    const lundi = new Date(d.getFullYear(), d.getMonth(), d.getDate() - decalage);
    return Array.from({ length: 7 }, (_, i) => {
      const j = jour(new Date(lundi.getFullYear(), lundi.getMonth(), lundi.getDate() + i));
      return { jour: j, fait: etat.jours.includes(j), aujourdhui: i === decalage, avenir: i > decalage };
    });
  }

  function bilan(s, etat, prog, maintenant) {
    majEtages(etat, prog);
    const demainIso = ajouterJours(jour(maintenant), 1);
    const demain = Object.keys(etat.cartes)
      .filter(k => etat.cartes[k].prochain === demainIso)
      .sort((a, b) => etat.cartes[a].boite - etat.cartes[b].boite)
      .map(k => k.split('|')[0])[0] || null;
    return {
      justes: s.justes,
      reponses: s.reponses,
      montees: s.montees,
      nouvelEtage: etat.etages > s.etagesAvant ? prog.etages[etat.etages - 1].id : null,
      demain,
      semaine: joursDeLaSemaine(etat, maintenant),
    };
  }

  /* Pour le portail et le coin parent. */
  function compte(etat, prog) {
    const tous = prog.etages.flatMap(e => e.lieux);
    const c = tous.map(l => couleur(etat, l));
    return {
      total: tous.length,
      decouverts: c.filter(x => x !== 'gris').length,
      parCoeur: c.filter(x => x === 'or').length,
      etape: prog.etages[Math.min(etat.etages, prog.etages.length) - 1].id,
    };
  }

  function fragiles(etat, prog) {
    return prog.etages.flatMap(e => e.lieux).filter(l => {
      const t = lire(etat, l, 'toucher');
      const n = lire(etat, l, 'nommer');
      return [t, n].some(c => c && c.vu && c.erreurs > 0 && c.boite <= 2);
    });
  }

  /* Une séance arrivée à son écran de fin (D-22, point 10) : seul ce moment fait sortir le voyage du
     « Today ». Champ facultatif `seanceFinie: { jour, nature }`, absent d'un état d'avant D-22 (il
     n'entre pas dans etatNeuf, pour qu'un état enregistré se relise à l'identique) ; `nature` est
     celle de ce que le résumé proposait à l'ouverture, et la première séance finie d'un jour fait foi. */
  function finirSeance(etat, maintenant) {
    const j = jour(maintenant);
    if (etat.seanceFinie && etat.seanceFinie.jour === j) return etat;
    const du = etat.resume && etat.resume.du;
    etat.seanceFinie = { jour: j, nature: du && du.des <= j && du.nature ? du.nature : 'seance' };
    return etat;
  }
  const seanceFinieLe = (etat, j) => !!(etat.seanceFinie && etat.seanceFinie.jour === j);

  function charger(enfant) {
    try {
      const brut = localStorage.getItem(enfant + '.zoom');
      return brut ? Object.assign(etatNeuf(), JSON.parse(brut)) : etatNeuf();
    } catch (e) {
      return etatNeuf();
    }
  }

  function sauver(enfant, etat) {
    try { localStorage.setItem(enfant + '.zoom', JSON.stringify(etat)); return true; } catch (e) { return false; }
  }

  racine.Zoom = {
    MODULE: 'zoom', RAPIDE_MS, TAILLE_SEANCE, NOUVEAUX_PAR_SEANCE, INTERVALLE_JOURS, BOITE_NOMMER, ajouterJours,
    cle, jour, etatNeuf, boite, decouvrir, enregistrer, couleur, majEtages, lieuxOuverts, seance, choix,
    creerSeance, courante, repondre, suivante, finie, avancement, bilan, compte, fragiles, joursDeLaSemaine,
    finirSeance, seanceFinieLe, charger, sauver,
  };
})(typeof window !== 'undefined' ? window : globalThis);
