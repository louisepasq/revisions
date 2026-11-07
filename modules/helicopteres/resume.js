/* Le résumé du module des hélicoptères pour le portail (D-19), publié par
   KR.publierResume('helicopteres', …) à l'ouverture du module, à la fin d'une étape et à la fin d'une
   séance de cartes. Contrat : docs/ARCHITECTURE.md, section 8.
   - progres : les étapes faites et les cartes sues, les tampons du carnet ;
   - du : les cartes qui reviennent (révision), sinon la prochaine étape faite dans l'app (découverte ;
     l'atelier et la sortie se font hors de l'écran et ne sont jamais proposés), sinon des cartes
     nouvelles, sinon la prochaine révision prévue ; calculé pour demain si une séance est finie
     aujourd'hui (D-22, point 10) ;
   - fini : la dernière séance finie, comptée dans le plafond du « Today » ;
   - parent : en français.
   Logique pure. Dépend de modules/zoom/moteur.js (Zoom), contenu.js, moteur.js (Helico) et
   commun/textes.js. Tests : test/resume.test.js. */
(function (racine) {
  'use strict';
  const MINUTES_CARTES = 5;
  const MINUTES_ETAPE = 8;
  const JOURS_GARDES = 14;

  const deux = (cle, valeurs) => ({ en: racine.Textes.t(cle, valeurs, 'en'), fr: racine.Textes.t(cle, valeurs, 'fr') });

  function phraseParent(etat) {
    const H = racine.Helico;
    const HC = racine.HeliContenu;
    const tp = (cle, valeurs) => racine.Textes.t(cle, valeurs, 'fr');
    if (!(etat.jours || []).length) return tp('parent_heli_pas');
    const c = H.compte(etat);
    let s = tp('parent_heli', { e: c.etapes, total: c.totalEtapes, n: c.retrouvees, cartes: c.totalCartes, t: c.tampons });
    const x = etat.experience || {};
    const nbMesures = Object.values(x.mesures || {}).reduce((n, l) => n + (Array.isArray(l) ? l.filter(v => typeof v === 'number').length : 0), 0);
    if (x.hypothese || nbMesures) {
      const h = HC.ATELIER.hypotheses.find(y => y.id === x.hypothese);
      s += ' ' + tp('parent_heli_experience', { hypothese: h ? h.nom.fr.toLowerCase() : '?', n: nbMesures });
    }
    const fr = H.fragiles(etat).map(id => HC.carte(id)).map(k => (k.type === 'partie' ? HC.partie(k.partie).nom.fr : k.q.fr));
    if (fr.length) s += ' ' + tp('parent_heli_fragiles', { liste: fr.slice(0, 4).join(' ; ') });
    return s;
  }

  function resume(etat, maintenant) {
    const Z = racine.Zoom;
    const H = racine.Helico;
    const HC = racine.HeliContenu;
    const j = Z.jour(maintenant);
    const c = H.compte(etat);

    let phrase;
    if (!c.etapes && !(etat.jours || []).length) phrase = deux('res_nouveau');
    else {
      phrase = deux(c.etapes <= 1 ? 'res_heli_etape_un' : 'res_heli_etapes', { e: c.etapes, total: c.totalEtapes });
      if (c.tampons) {
        const tp = deux(c.tampons === 1 ? 'res_heli_tampon' : 'res_heli_tampons', { t: c.tampons });
        phrase = { en: phrase.en + ' · ' + tp.en, fr: phrase.fr + ' · ' + tp.fr };
      }
    }

    const montees = HC.CARTES.filter(k => { const x = H.lire(etat, k.id); return x && (x.justesJours || []).includes(j); }).length;
    const etapesAuj = Object.values(etat.etapes || {}).filter(d => d === j).length;
    let aujourdhui = null;
    if (etapesAuj) aujourdhui = deux(etapesAuj === 1 ? 'res_heli_plus_etape' : 'res_heli_plus_etapes', { n: etapesAuj });
    else if (montees) aujourdhui = deux(montees === 1 ? 'res_heli_plus_carte' : 'res_heli_plus_cartes', { n: montees });

    // Une séance finie aujourd'hui : on calcule pour demain (D-22, point 10).
    const ref = Z.seanceFinieLe(etat, j) ? Z.ajouterJours(j, 1) : j;
    const refDate = new Date(Number(ref.slice(0, 4)), Number(ref.slice(5, 7)) - 1, Number(ref.slice(8, 10)), 12);
    const dues = H.cartesOuvertes(etat).filter(k => { const x = H.lire(etat, k.id); return x && x.vu && x.prochain <= ref; }).length;
    const suite = H.etapeSuivante(etat);
    const neuves = H.seance(etat, refDate, 99).length;
    let du = null;
    if (dues) {
      du = { des: ref, nature: 'revision', phrase: deux(dues === 1 ? 'res_carte_revient' : 'res_cartes_reviennent', { n: dues }), minutes: MINUTES_CARTES };
    } else if (suite) {
      du = { des: ref, nature: 'decouverte', phrase: deux('res_heli_etape'), minutes: MINUTES_ETAPE };
    } else if (neuves) {
      du = { des: ref, nature: 'seance', phrase: deux('res_heli_nouvelles'), minutes: MINUTES_CARTES };
    } else {
      const prochaines = Object.values(etat.cartes || {}).filter(x => x && x.vu && x.prochain > ref).map(x => x.prochain).sort();
      if (prochaines.length) {
        const n = Object.values(etat.cartes).filter(x => x && x.vu && x.prochain === prochaines[0]).length;
        du = { des: prochaines[0], nature: 'revision', phrase: deux(n === 1 ? 'res_carte_revient' : 'res_cartes_reviennent', { n }), minutes: MINUTES_CARTES };
      }
    }

    const depuis = Z.ajouterJours(j, 1 - JOURS_GARDES);
    const f = etat.seanceFinie;
    return {
      progres: {
        // Les étapes et les cartes sues comptent à parts égales ; le kit garde le plus haut publié.
        avancement: (c.etapes / c.totalEtapes + c.sues / c.totalCartes) / 2,
        phrase,
        aujourdhui,
        jour: j,
      },
      du,
      fini: f ? { jour: f.jour, nature: f.nature, minutes: f.nature === 'decouverte' ? MINUTES_ETAPE : MINUTES_CARTES } : null,
      jours: Array.from(new Set(etat.jours || [])).filter(x => x >= depuis && x <= j).sort(),
      parent: phraseParent(etat),
    };
  }

  racine.HeliResume = { resume, phraseParent };
})(typeof window !== 'undefined' ? window : globalThis);
