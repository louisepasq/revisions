/* Sauvegarde en ligne, côté page : à charger après sync.js, commun/modules.js et les moteurs des
   modules de la page.

   Les modules suivis se lisent dans le catalogue (commun/modules.js) : tous ceux de l'enfant sur
   le portail, le seul module de la page ailleurs (<html data-module="tables">) ; un module marqué
   `synchro: false` (le planisphère de Louise, qui range son état sous plusieurs clés) est ignoré.
   - Un module dont l'objet global (champ `objet` du catalogue) porte charger(enfant) et
     sauver(enfant, etat) : chaque sauvegarde locale part aussi au service.
   - Tout module : son état local, `localStorage['<enfant>.<module>']`, part aussi quand il publie
     son résumé (KR.publierResume, événement kr:resume).
   Au chargement, le local et le distant se fusionnent (règle du module dans sync.js, résumé le
   plus récent gardé) ; si le distant apportait du progrès ou un résumé plus récent (nouvel
   appareil, icône refaite), la page se recharge une fois pour le montrer, sauf pendant un
   exercice. Un nouveau module n'a rien à faire ici : sa ligne au catalogue suffit. */
(function () {
  'use strict';
  const enfant = document.documentElement.dataset.enfant;
  const page = document.documentElement.dataset.module;
  const CAT = window.Catalogue || {};
  const MODULES = Object.keys(CAT).filter(id => {
    const m = CAT[id];
    if (m.synchro === false || !(m.enfants || []).includes(enfant)) return false;
    return !page || id === page;
  });
  // Un module de page absent du catalogue reste suivi (catalogue pas encore chargé, essai local).
  if (page && !MODULES.length && !(CAT[page] && CAT[page].synchro === false)) MODULES.push(page);
  window.SynchroPage = { MODULES };
  const S = window.Sync;
  if (!enfant || !S || location.protocol === 'file:') return;

  function lireLocal(module) {
    try {
      const v = JSON.parse(localStorage.getItem(enfant + '.' + module));
      return v && typeof v === 'object' && !Array.isArray(v) ? v : {};
    } catch (e) { return {}; }
  }

  // Mesure simple du progrès, commune aux modules à boîtes : éléments vus, montées de boîte et jours joués.
  const progres = e => {
    const l = Object.values((e && (e.faits || e.cartes)) || {});
    return l.filter(f => f && f.vu).length * 1000 + l.reduce((n, f) => n + ((f && f.boite) || 0), 0) * 10 + (((e && e.jours) || []).length);
  };
  const dateResume = e => { const t = Date.parse(e && e.resume && e.resume.ecritLe); return Number.isFinite(t) ? t : -1; };
  const apporte = (fusion, local) => progres(fusion) > progres(local) || dateResume(fusion) > dateResume(local);

  const attentes = MODULES.map(module => {
    // Sans catalogue chargé, l'objet porte le nom du module avec une majuscule (Tables, Zoom).
    const nomObjet = CAT[module] ? CAT[module].objet : module.charAt(0).toUpperCase() + module.slice(1);
    const M = nomObjet ? window[nomObjet] : null;
    const branche = M && typeof M.charger === 'function' && typeof M.sauver === 'function';
    if (branche) {
      const sauverLocal = M.sauver;
      M.sauver = function (e, etat) {
        const ok = sauverLocal(e, etat);
        S.pousser(e, module, etat);
        return ok;
      };
    }
    const local = branche ? M.charger(enfant) : lireLocal(module);
    return S.synchroniser(enfant, module, local).then(fusion => {
      if (!fusion || !apporte(fusion, local)) return false;
      try { localStorage.setItem(enfant + '.' + module, JSON.stringify(fusion)); return true; } catch (e) { return false; }
    }).catch(() => false);
  });

  // Un résumé publié part avec l'état local du module.
  document.addEventListener('kr:resume', e => {
    const module = e.detail && e.detail.module;
    if (MODULES.includes(module)) S.pousser(enfant, module, lireLocal(module));
  });

  // Seul un progrès venu d'ailleurs recharge la page, et une seule fois.
  Promise.all(attentes).then(r => {
    if (!r.some(Boolean)) return;
    let dejaRecharge = false;
    try { dejaRecharge = sessionStorage.getItem('revisions.recharge') === '1'; sessionStorage.setItem('revisions.recharge', '1'); } catch (e) { dejaRecharge = true; }
    if (!dejaRecharge && !document.querySelector('.exo')) location.reload();
  });
  setTimeout(() => { try { sessionStorage.removeItem('revisions.recharge'); } catch (e) { /* rien */ } }, 15000);
})();
