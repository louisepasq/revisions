/* Le résumé du voyage « De l'univers à Éguilles » pour le portail (D-19), publié par
   KR.publierResume('zoom', …) à l'ouverture du module et en fin de séance. Contrat :
   docs/ARCHITECTURE.md.
   - progres : les lieux découverts (retrouvés au moins une fois) sur ceux du programme de l'enfant ;
   - du : le grand voyage tant qu'il n'est pas fait, puis les lieux qui reviennent, sinon les lieux
     nouveaux des étapes ouvertes, sinon la prochaine date de révision ; calculé pour demain si
     une séance est finie aujourd'hui (une réponse seule ne suffit pas, D-22 point 10) ;
   - fini : la dernière séance finie { jour, nature, minutes }, comptée dans le plafond du « Today » ;
   - parent : en français, comme l'ancien coin parent.
   Logique pure. Dépend de moteur.js (Zoom), contenu.js (ZoomContenu) et commun/textes.js.
   Tests : test/resume.test.js */
(function (racine) {
  'use strict';
  const MINUTES = 5;
  const JOURS_GARDES = 14;

  const deux = (cle, valeurs) => ({ en: racine.Textes.t(cle, valeurs, 'en'), fr: racine.Textes.t(cle, valeurs, 'fr') });
  const liste8 = l => l.slice(0, 8).join(', ') + (l.length > 8 ? ` et ${l.length - 8} autre${l.length > 9 ? 's' : ''}` : '');

  function phraseParent(etat, prog) {
    const Z = racine.Zoom;
    const C = racine.ZoomContenu;
    const tp = (cle, valeurs) => racine.Textes.t(cle, valeurs, 'fr');
    if (!(etat.jours || []).length) return tp('parent_zoom_pas');
    const c = Z.compte(etat, prog);
    const etape = C.ETAGES.find(e => e.id === c.etape);
    const fragiles = Z.fragiles(etat, prog).map(id => C.lieu(id).nom);
    return `${tp('parent_zoom')} : ${tp('parent_zoom_resume', { n: c.decouverts, total: c.total, or: c.parCoeur, etape: etape ? etape.nom : c.etape })}`
      + (fragiles.length ? ' ' + tp('parent_zoom_fragiles', { liste: liste8(fragiles) }) : '');
  }

  /* Les lieux qui ont une carte à revoir au plus tard le jour ref, dans les étapes ouvertes. */
  function lieuxDus(etat, prog, ref) {
    const Z = racine.Zoom;
    const dus = new Set();
    Z.lieuxOuverts(etat, prog).forEach(o => {
      const t = etat.cartes[Z.cle(o.lieu, 'toucher')];
      if (!t || !t.vu) return;
      if (t.prochain && t.prochain <= ref) dus.add(o.lieu);
      const n = etat.cartes[Z.cle(o.lieu, 'nommer')];
      if (n && n.vu ? n.prochain && n.prochain <= ref : t.boite >= Z.BOITE_NOMMER) dus.add(o.lieu);
    });
    return dus;
  }

  function resume(etat, enfant, maintenant) {
    const Z = racine.Zoom;
    const prog = racine.ZoomContenu.programme(enfant);
    const j = Z.jour(maintenant);
    const c = Z.compte(etat, prog);

    let phrase;
    if (!c.decouverts) phrase = deux('res_nouveau');
    else if (c.parCoeur) phrase = deux('res_lieux_or', { n: c.decouverts, total: c.total, or: c.parCoeur });
    else phrase = deux('res_lieux', { n: c.decouverts, total: c.total });

    // Les lieux montés aujourd'hui : une carte retrouvée juste aujourd'hui (une montée par jour).
    const montes = new Set(Object.keys(etat.cartes || {})
      .filter(k => (etat.cartes[k].justesJours || []).includes(j))
      .map(k => k.split('|')[0]));

    let du = null;
    if (!etat.intro) {
      du = { des: j, nature: 'decouverte', phrase: deux('res_grand_voyage'), minutes: MINUTES };
    } else {
      // Le voyage ne sort du « Today » qu'une séance finie (D-22, point 10) : une réponse seule ne suffit pas.
      const ref = Z.seanceFinieLe(etat, j) ? Z.ajouterJours(j, 1) : j;
      const dus = lieuxDus(etat, prog, ref);
      const nouveaux = Z.lieuxOuverts(etat, prog).some(o => { const t = etat.cartes[Z.cle(o.lieu, 'toucher')]; return !t || !t.vu; });
      if (dus.size) {
        du = { des: ref, nature: 'revision', phrase: deux(dus.size === 1 ? 'res_lieu_revient' : 'res_lieux_reviennent', { n: dus.size }), minutes: MINUTES };
      } else if (nouveaux) {
        du = { des: ref, nature: 'decouverte', phrase: deux('res_nouveaux_lieux'), minutes: MINUTES };
      } else {
        // Tout est appris et rien n'est dû : la prochaine révision prévue, pour que le portail la propose ce jour-là.
        const prochaines = Object.values(etat.cartes || {}).filter(x => x && x.vu && x.prochain > ref).map(x => x.prochain).sort();
        if (prochaines.length) {
          const n = lieuxDus(etat, prog, prochaines[0]).size || 1;
          du = { des: prochaines[0], nature: 'revision', phrase: deux(n === 1 ? 'res_lieu_revient' : 'res_lieux_reviennent', { n }), minutes: MINUTES };
        }
      }
    }

    const depuis = Z.ajouterJours(j, 1 - JOURS_GARDES);
    return {
      progres: {
        avancement: c.total ? c.decouverts / c.total : null,
        phrase,
        aujourdhui: montes.size ? deux(montes.size === 1 ? 'res_plus_lieu' : 'res_plus_lieux', { n: montes.size }) : null,
        jour: j,
      },
      du,
      // La dernière séance finie, que le portail compte dans le plafond du jour (D-22, point 1).
      fini: etat.seanceFinie ? { jour: etat.seanceFinie.jour, nature: etat.seanceFinie.nature, minutes: MINUTES } : null,
      jours: Array.from(new Set(etat.jours || [])).filter(x => x >= depuis && x <= j).sort(),
      parent: phraseParent(etat, prog),
    };
  }

  racine.ZoomResume = { resume, phraseParent };
})(typeof window !== 'undefined' ? window : globalThis);
