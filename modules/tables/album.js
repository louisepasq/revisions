/* L'album à tampons des tables (D-20), vu par l'enfant : cartes, pages par famille, cartes
   proches de l'or, bilan du jour. Logique pure, sans affichage : les règles des tampons vivent
   dans moteur.js (enregistrer, tamponner, migrer), ce fichier ne fait que les lire.
   Dépend de moteur.js (window.Tables). Tests : node modules/tables/album.test.js */
(function (racine) {
  'use strict';
  const T = racine.Tables;

  // Les 36 paires de 2 à 9, chacune une carte.
  const PAIRES = [];
  for (let a = 2; a <= 9; a++) for (let b = a; b <= 9; b++) PAIRES.push([a, b]);

  /* La table de la famille d'abord, comme dans la maquette : « 5 × 2 », « 4 × 3 », « 8 × 7 ». */
  function ecrit(a, b) {
    const tables = T.FAMILLES[T.familleDuFait(a, b)].tables;
    const [p, g] = [Math.min(a, b), Math.max(a, b)];
    return !tables.includes(p) && tables.includes(g) ? [g, p] : [p, g];
  }

  /* Pour une carte dorée qui retombe : 'demain' si l'erreur date d'aujourd'hui, sinon 'auj'
     (le fait est dû, il revient à la prochaine séance). */
  function revient(etat, a, b, j) {
    const dates = [T.cle(a, b), T.cle(b, a)]
      .map(k => etat.faits[k])
      .filter(f => f && f.vu && f.dernierJuste === false && f.prochain)
      .map(f => f.prochain);
    if (!dates.length) return null;
    return dates.some(d => d >= j) ? 'demain' : 'auj';
  }

  function carte(etat, a, b, j) {
    const jours = T.tampons(etat, a, b);
    const or = jours.length >= T.TAMPONS_OR;
    const [x, y] = ecrit(a, b);
    const revoir = T.aRevoir(etat, a, b);
    return {
      a: x, b: y,
      cle: T.cleCarte(a, b),
      famille: T.familleDuFait(a, b),
      n: jours.length,
      jours,
      duJour: jours.includes(j),
      or,
      orAuj: or && jours[T.TAMPONS_OR - 1] === j,
      presque: !or && jours.length === T.TAMPONS_OR - 1,
      revoir,
      revient: revoir ? revient(etat, a, b, j) : null,
    };
  }

  function cartes(etat, j) {
    return PAIRES.map(([a, b]) => carte(etat, a, b, j));
  }

  function total(etat) {
    return PAIRES.reduce((s, [a, b]) => s + T.tampons(etat, a, b).length, 0);
  }

  function nbOr(etat) {
    return PAIRES.filter(([a, b]) => T.estOr(etat, a, b)).length;
  }

  /* Une page par famille, dans l'ordre d'Eduscol. Les familles pas encore ouvertes sont
     montrées (en pointillé à l'écran), jamais cadenassées ; leur ouverture suit les boîtes
     réelles (majFamilles), jamais les tampons. */
  function pages(etat, j) {
    const toutes = cartes(etat, j);
    return T.FAMILLES.map((f, i) => {
      const cs = toutes.filter(c => c.famille === i)
        .sort((p, q) => p.cle.localeCompare(q.cle, 'en', { numeric: true }));
      const or = cs.filter(c => c.or).length;
      return {
        index: i,
        id: f.id,
        tables: f.tables.filter(t => t >= 2 && t <= 9),
        ouverte: i < (etat.familles || 1),
        cartes: cs,
        or,
        presque: cs.filter(c => c.presque).length,
        complet: cs.length > 0 && or === cs.length,
      };
    });
  }

  /* Les cartes les plus proches de l'or, parmi celles qui ont déjà des tampons. Rien n'annonce
     qu'une carte peut dorer aujourd'hui (D-20) : l'or se découvre en fin de séance. */
  function proches(etat, j, n) {
    return cartes(etat, j)
      .map((c, i) => ({ c, i }))
      .filter(({ c }) => !c.or && c.n > 0)
      .sort((p, q) => q.c.n - p.c.n || p.c.famille - q.c.famille || p.i - q.i)
      .slice(0, n || 3)
      .map(({ c }) => c);
  }

  /* Ce que la journée a apporté : cartes tamponnées aujourd'hui, cartes dorées aujourd'hui. */
  function duJour(etat, j) {
    const cs = cartes(etat, j);
    const dorees = cs.filter(c => c.orAuj);
    const tamponnees = cs.filter(c => c.duJour && !c.orAuj);
    return { dorees, tamponnees, gagnes: dorees.length + tamponnees.length };
  }

  /* « Tomorrow, 2 × 6 comes back for a stamp » : un fait de 2 à 9 dû demain, dont la carte n'est
     pas dorée, le plus proche de l'or d'abord. Rend [a, b] dans le sens où il revient, ou null. */
  function prochainTampon(etat, maintenant) {
    const j = T.jour(maintenant);
    const demain = T.ajouterJours(j, 1);
    const l = [];
    for (let a = 2; a <= 9; a++) for (let b = 2; b <= 9; b++) {
      const f = etat.faits[T.cle(a, b)];
      if (!f || !f.vu || f.prochain !== demain || T.estOr(etat, a, b)) continue;
      if (T.familleDuFait(a, b) >= (etat.familles || 1)) continue;
      l.push({ a, b, n: T.tampons(etat, a, b).length, boite: f.boite || 0 });
    }
    l.sort((p, q) => q.n - p.n || p.boite - q.boite || p.a - q.a || p.b - q.b);
    return l.length ? [l[0].a, l[0].b] : null;
  }

  /* La grille de Pythagore, en bascule depuis l'album, sur les mêmes données (relecture de la
     progression, proposition 8) : 'pas', 'com' (1 ou 2 tampons), 'pre' (3), 'or', 'auj' (doré
     aujourd'hui). null hors des cartes (lignes 1 et 10). */
  function etatCase(etat, a, b, j) {
    if (!T.estCarte(a, b)) return null;
    const c = carte(etat, a, b, j);
    if (c.or) return c.orAuj ? 'auj' : 'or';
    if (c.n >= 3) return 'pre';
    if (c.n >= 1) return 'com';
    return 'pas';
  }

  racine.Album = { PAIRES, ecrit, carte, cartes, total, nbOr, pages, proches, duJour, prochainTampon, etatCase };
})(typeof window !== 'undefined' ? window : globalThis);
