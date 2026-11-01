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

  // Mesure simple du progrès : faits vus, montées de boîte et jours joués. Seul un progrès venu d'ailleurs recharge la page.
  const progres = e => {
    const faits = Object.values((e && e.faits) || {});
    return faits.filter(f => f && f.vu).length * 1000 + faits.reduce((n, f) => n + ((f && f.boite) || 0), 0) * 10 + (((e && e.jours) || []).length);
  };
  const local = T.charger(enfant);
  S.synchroniser(enfant, 'tables', local).then(fusion => {
    if (!fusion || progres(fusion) <= progres(local)) return;
    try { localStorage.setItem(enfant + '.tables', JSON.stringify(fusion)); } catch (e) { return; }
    let dejaRecharge = false;
    try { dejaRecharge = sessionStorage.getItem('revisions.recharge') === '1'; sessionStorage.setItem('revisions.recharge', '1'); } catch (e) { dejaRecharge = true; }
    if (!dejaRecharge && !document.querySelector('.exo')) location.reload();
  }).catch(() => {});
  setTimeout(() => { try { sessionStorage.removeItem('revisions.recharge'); } catch (e) { /* rien */ } }, 15000);
})();
