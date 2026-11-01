/* Sauvegarde en ligne, côté page : à charger après sync.js et après les moteurs des modules de la page.
   Chaque module se branche par son objet global, qui porte charger(enfant) et sauver(enfant, etat)
   et range son état sous <enfant>.<module> : chaque sauvegarde locale part aussi au service ; au
   chargement, le local et le distant se fusionnent (règle du module dans sync.js), et si le distant
   apportait des progrès (nouvel appareil, icône refaite), la page se recharge une fois pour les
   montrer, sauf pendant un exercice. Un nouveau module s'ajoute dans MODULES. */
(function () {
  'use strict';
  const MODULES = { tables: 'Tables', zoom: 'Zoom' };
  window.SynchroPage = { MODULES: Object.keys(MODULES) };
  const enfant = document.documentElement.dataset.enfant;
  const S = window.Sync;
  if (!enfant || !S || location.protocol === 'file:') return;

  // Mesure simple du progrès, commune aux modules à boîtes : éléments vus, montées de boîte et jours joués.
  const progres = e => {
    const l = Object.values((e && (e.faits || e.cartes)) || {});
    return l.filter(f => f && f.vu).length * 1000 + l.reduce((n, f) => n + ((f && f.boite) || 0), 0) * 10 + (((e && e.jours) || []).length);
  };

  const attentes = Object.keys(MODULES).map(module => {
    const M = window[MODULES[module]];
    if (!M || typeof M.charger !== 'function' || typeof M.sauver !== 'function') return Promise.resolve(false);
    const sauverLocal = M.sauver;
    M.sauver = function (e, etat) {
      const ok = sauverLocal(e, etat);
      S.pousser(e, module, etat);
      return ok;
    };
    const local = M.charger(enfant);
    return S.synchroniser(enfant, module, local).then(fusion => {
      if (!fusion || progres(fusion) <= progres(local)) return false;
      try { localStorage.setItem(enfant + '.' + module, JSON.stringify(fusion)); return true; } catch (e) { return false; }
    }).catch(() => false);
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
