/* Sauvegarde en ligne, côté page : à charger après sync.js et moteur.js.
   Chaque sauvegarde locale part aussi au service ; au chargement, le local et le distant
   se fusionnent, et si le distant apportait des progrès (nouvel appareil, icône refaite),
   la page se recharge une fois pour les montrer, sauf pendant un exercice. */
(function () {
  'use strict';
  const enfant = document.documentElement.dataset.enfant;
  const T = window.Tables;
  const S = window.Sync;
  if (!enfant || !T || !S || location.protocol === 'file:') return;

  const sauverLocal = T.sauver;
  T.sauver = function (e, etat) {
    const ok = sauverLocal(e, etat);
    S.pousser(e, 'tables', etat);
    return ok;
  };

  const local = T.charger(enfant);
  S.synchroniser(enfant, 'tables', local).then(fusion => {
    if (!fusion || JSON.stringify(fusion) === JSON.stringify(local)) return;
    try { localStorage.setItem(enfant + '.tables', JSON.stringify(fusion)); } catch (e) { return; }
    let dejaRecharge = false;
    try { dejaRecharge = sessionStorage.getItem('revisions.recharge') === '1'; sessionStorage.setItem('revisions.recharge', '1'); } catch (e) { dejaRecharge = true; }
    if (!dejaRecharge && !document.querySelector('.exo')) location.reload();
  }).catch(() => {});
  setTimeout(() => { try { sessionStorage.removeItem('revisions.recharge'); } catch (e) { /* rien */ } }, 15000);
})();
