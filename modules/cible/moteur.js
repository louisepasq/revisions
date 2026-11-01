/* Moteur du jeu du nombre cible (façon Mathador, règles d'Henri : décision D-18).
   Logique pure, sans affichage : tirage, résolution exhaustive, score, indice.
   Script classique (pas de module ES) pour fonctionner aussi ouvert depuis le disque. */
(function (racine) {
  'use strict';

  const POINTS = { '+': 1, '×': 1, '−': 2, '÷': 3 };
  const COUP_PARFAIT = 13;
  const COUT_INDICE = 3;
  const DES = [4, 6, 8, 12, 20]; // les cinq dés du jeu de classe : un petit nombre par dé
  const CIBLE_MAX = 99;

  function calculer(a, op, b) {
    if (op === '+') return a + b;
    if (op === '×') return a * b;
    if (op === '−') return a > b ? a - b : null; // pas de nombre négatif ni de zéro
    if (op === '÷') return b > 1 && a % b === 0 ? a / b : null; // division exacte, jamais par 1
    return null;
  }

  /* Score d'une suite d'étapes [{ a, op, b, r }] qui atteint la cible. */
  function score(etapes, nombresDeDepart) {
    const ops = new Set(etapes.map(e => e.op));
    if (etapes.length === nombresDeDepart - 1 && ops.size === 4) return COUP_PARFAIT;
    return etapes.reduce((s, e) => s + POINTS[e.op], 0);
  }

  /* Toutes les façons d'atteindre la cible : le meilleur score, une solution qui l'atteint,
     une solution la plus courte (pour l'indice), et le nombre de chemins trouvés. */
  function resoudre(cible, nombres) {
    let meilleur = null;
    let plusCourte = null;
    let chemins = 0;
    const vus = new Set();
    function chercher(valeurs, etapes) {
      const cle = valeurs.slice().sort((x, y) => x - y).join(',') + '|' + etapes.map(e => e.op).sort().join('');
      if (vus.has(cle)) return;
      vus.add(cle);
      for (let i = 0; i < valeurs.length; i++) {
        for (let j = 0; j < valeurs.length; j++) {
          if (i === j) continue;
          for (const op of ['+', '×', '−', '÷']) {
            if ((op === '+' || op === '×') && j < i) continue; // commutatif : une seule fois
            const r = calculer(valeurs[i], op, valeurs[j]);
            if (r === null) continue;
            const etape = { a: valeurs[i], op, b: valeurs[j], r };
            const suite = etapes.concat([etape]);
            if (r === cible) {
              chemins++;
              const s = score(suite, nombres.length);
              if (!meilleur || s > meilleur.score) meilleur = { score: s, etapes: suite };
              if (!plusCourte || suite.length < plusCourte.length) plusCourte = suite;
            }
            const reste = valeurs.filter((_, k) => k !== i && k !== j).concat([r]);
            if (reste.length > 1) chercher(reste, suite);
          }
        }
      }
    }
    if (nombres.includes(cible)) plusCourte = plusCourte || [];
    chercher(nombres.slice(), []);
    return { possible: !!meilleur, meilleur: meilleur ? meilleur.score : 0, solution: meilleur ? meilleur.etapes : null, plusCourte, chemins };
  }

  /* Générateur pseudo-aléatoire reproductible, pour qu'un tirage se rejoue (tests, partage). */
  function hasard(graine) {
    let s = 0;
    for (const c of String(graine)) s = (s * 31 + c.charCodeAt(0)) >>> 0;
    return () => { s = (s * 1103515245 + 12345) >>> 0; return s / 4294967296; };
  }

  /* Un tirage jouable : cinq nombres (un par dé), une cible de 10 à 99 atteignable,
     qui n'est pas déjà un des cinq nombres, et dont le meilleur score atteint au moins `scoreMin`. */
  function tirer(graine, scoreMin) {
    const alea = hasard(graine);
    for (let essai = 0; essai < 400; essai++) {
      const nombres = DES.map(d => 1 + Math.floor(alea() * d));
      const cible = 10 + Math.floor(alea() * (CIBLE_MAX - 9));
      if (nombres.includes(cible)) continue;
      const r = resoudre(cible, nombres);
      if (r.possible && r.meilleur >= (scoreMin || 1)) return { cible, nombres, meilleur: r.meilleur, solution: r.solution, plusCourte: r.plusCourte };
    }
    return null;
  }

  /* Une partie en cours : les nombres disponibles, les étapes faites, les indices pris. */
  function nouvellePartie(tirage) {
    return { cible: tirage.cible, depart: tirage.nombres.slice(), dispo: tirage.nombres.map((v, k) => ({ v, id: 'd' + k })), etapes: [], indices: 0, meilleur: tirage.meilleur, gagnee: false };
  }

  function jouer(partie, idA, op, idB) {
    const A = partie.dispo.find(x => x.id === idA);
    const B = partie.dispo.find(x => x.id === idB);
    if (!A || !B || idA === idB) return { ok: false, raison: 'choix' };
    const r = calculer(A.v, op, B.v);
    if (r === null) return { ok: false, raison: op === '÷' ? 'division' : 'negatif' };
    const id = 'r' + partie.etapes.length;
    partie.dispo = partie.dispo.filter(x => x.id !== idA && x.id !== idB).concat([{ v: r, id }]);
    partie.etapes.push({ a: A.v, op, b: B.v, r, idA, idB, id });
    if (r === partie.cible) partie.gagnee = true;
    return { ok: true, r, gagnee: partie.gagnee };
  }

  /* Annule la dernière étape : les deux nombres reviennent. */
  function annuler(partie) {
    const e = partie.etapes.pop();
    if (!e) return false;
    const ancienne = { a: e.a, b: e.b };
    partie.dispo = partie.dispo.filter(x => x.id !== e.id)
      .concat([{ v: ancienne.a, id: e.idA }, { v: ancienne.b, id: e.idB }]);
    partie.gagnee = partie.etapes.some(x => x.r === partie.cible);
    return true;
  }

  function scorePartie(partie) {
    if (!partie.gagnee) return 0;
    const brut = score(partie.etapes, partie.depart.length);
    return Math.max(1, brut - COUT_INDICE * partie.indices);
  }

  /* Indice : la première étape d'une solution qui part des nombres encore disponibles. */
  function indice(partie) {
    const r = resoudre(partie.cible, partie.dispo.map(x => x.v));
    if (!r.possible) return null;
    const chemin = r.plusCourte && r.plusCourte.length ? r.plusCourte : r.solution;
    partie.indices++;
    return chemin[0];
  }

  racine.Cible = { POINTS, COUP_PARFAIT, COUT_INDICE, CIBLE_MAX, calculer, score, resoudre, tirer, nouvellePartie, jouer, annuler, scorePartie, indice };
})(typeof window !== 'undefined' ? window : globalThis);
