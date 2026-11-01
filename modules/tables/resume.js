/* Le résumé des tables pour le portail (D-19), publié par KR.publierResume('tables', …) à
   l'ouverture du module et en fin de séance. Contrat : docs/ARCHITECTURE.md.
   - progres : l'album à tampons (D-20), son avancement en tampons sur 144 (36 cartes × 4), qui ne
     redescend jamais puisqu'un tampon ne se perd pas ;
   - du : une séance chaque jour (« Peu et souvent »), annoncée par les cartes qui reviennent quand
     il y en a ; calculée pour demain si l'enfant a déjà joué aujourd'hui ;
   - parent : l'état réel (boîtes), en français.
   Logique pure. Dépend de moteur.js (Tables), album.js (Album) et commun/textes.js (Textes).
   Tests : test/resume.test.js */
(function (racine) {
  'use strict';
  const MINUTES = 5;
  const JOURS_GARDES = 14;

  const deux = (cle, valeurs) => ({ en: racine.Textes.t(cle, valeurs, 'en'), fr: racine.Textes.t(cle, valeurs, 'fr') });
  const liste8 = l => l.slice(0, 8).join(', ') + (l.length > 8 ? ` et ${l.length - 8} autre${l.length > 9 ? 's' : ''}` : '');

  function phraseParent(etat) {
    const T = racine.Tables;
    const A = racine.Album;
    const tp = (cle, valeurs) => racine.Textes.t(cle, valeurs, 'fr');
    const vus = Object.keys(etat.faits || {}).filter(k => etat.faits[k] && etat.faits[k].vu);
    if (!vus.length) return tp('parent_pas_commence');
    const { rates, lents } = T.fragiles(etat);
    const phrase = (l, un, plusieurs) => tp(l.length === 1 ? un : plusieurs, { n: l.length, liste: liste8(l) });
    const morceaux = [
      tp('parent_auto', { n: T.compteOr(etat) }),
      rates.length ? phrase(rates, 'parent_fragile_un', 'parent_fragiles') : tp('parent_aucun_fragile'),
      lents.length ? phrase(lents, 'parent_lent_un', 'parent_lents') : '',
      `Album : ${A.total(etat)} tampon${A.total(etat) > 1 ? 's' : ''}, ${A.nbOr(etat)} carte${A.nbOr(etat) > 1 ? 's' : ''} en or.`,
      etat.jours.length === 1 ? tp('parent_jour_un') : tp('parent_jours', { n: etat.jours.length }),
    ];
    return 'Les tables : ' + morceaux.filter(Boolean).join(' ');
  }

  function resume(etat, maintenant) {
    const T = racine.Tables;
    const A = racine.Album;
    const j = T.jour(maintenant);
    const total = A.total(etat);
    const or = A.nbOr(etat);
    const max = A.PAIRES.length * T.TAMPONS_OR;
    const gagnes = A.duJour(etat, j).gagnes;

    let phrase;
    if (!total) phrase = deux('res_nouveau');
    else if (or === A.PAIRES.length) phrase = deux('res_tout_or', { n: or });
    else if (or) phrase = deux('res_tampons_or', { n: total, or });
    else phrase = deux(total === 1 ? 'tampon_un' : 'tampons_n', { n: total });

    let du;
    if (!etat.diagnostic) {
      du = { des: j, nature: 'decouverte', phrase: deux('res_on_commence'), minutes: MINUTES };
    } else {
      const ref = (etat.jours || []).includes(j) ? T.ajouterJours(j, 1) : j;
      const cartes = new Set();
      Object.keys(etat.faits || {}).forEach(k => {
        const f = etat.faits[k];
        const [a, b] = k.split('x').map(Number);
        if (!f || !f.vu || !f.prochain || f.prochain > ref || T.familleDuFait(a, b) >= (etat.familles || 1)) return;
        cartes.add(T.cle(Math.min(a, b), Math.max(a, b)));
      });
      du = cartes.size
        ? { des: ref, nature: 'revision', phrase: deux(cartes.size === 1 ? 'res_carte_revient' : 'res_cartes_reviennent', { n: cartes.size }), minutes: MINUTES }
        : { des: ref, nature: 'seance', phrase: deux('entrainement'), minutes: MINUTES };
    }

    const depuis = T.ajouterJours(j, 1 - JOURS_GARDES);
    return {
      progres: {
        avancement: max ? total / max : 0,
        phrase,
        aujourdhui: gagnes ? deux(gagnes === 1 ? 'res_plus_tampon' : 'res_plus_tampons', { n: gagnes }) : null,
        jour: j,
      },
      du,
      jours: Array.from(new Set(etat.jours || [])).filter(x => x >= depuis && x <= j).sort(),
      parent: phraseParent(etat),
    };
  }

  racine.TablesResume = { resume, phraseParent };
})(typeof window !== 'undefined' ? window : globalThis);
