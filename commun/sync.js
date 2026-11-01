/* Sauvegarde en ligne de la progression (service revisions-api).
   Script classique, sans dépendance : à copier dans le site et à charger avant les modules.
   Hors ligne, rien ne bloque : le local reste la référence et l'envoi est retenté plus tard.

   Usage :
     const etat = await Sync.synchroniser('henri', 'tables', etatLocal); // au chargement
     Sync.pousser('henri', 'tables', etat);           // après chaque séance
     Sync.etat();  // { configure, synchronise, derniereSauvegarde, erreur, enAttente } */
(function (racine) {
  'use strict';

  const URL_API = '/api/progression'; // même site : le cookie d'accès (code parent ou code de l'enfant) suffit
  const CLE_CODE = 'revisions.code';
  const DELAI_MS = 8000;
  const RETENTE_MS = 60000;

  /* ---------- Fusion : copie exacte de lib/fusion.js du service ---------- */
  function unionTriee(a, b) {
    return Array.from(new Set([...(Array.isArray(a) ? a : []), ...(Array.isArray(b) ? b : [])])).sort();
  }

  function unionRecords(a, b) {
    const vus = new Set();
    const l = [];
    for (const r of [...(Array.isArray(a) ? a : []), ...(Array.isArray(b) ? b : [])]) {
      const k = JSON.stringify(r);
      if (vus.has(k)) continue;
      vus.add(k);
      l.push(r);
    }
    return l;
  }

  function plusAvance(x, y) {
    const px = x.prochain || '';
    const py = y.prochain || '';
    if (px !== py) return px > py;
    return (x.boite || 0) >= (y.boite || 0);
  }

  function fusionFait(x, y) {
    if (!x) return y;
    if (!y) return x;
    const gagnant = plusAvance(x, y) ? x : y;
    return {
      ...gagnant,
      vu: !!(x.vu || y.vu),
      justesJours: unionTriee(x.justesJours, y.justesJours),
      erreurs: Math.max(x.erreurs || 0, y.erreurs || 0),
    };
  }

  function estObjet(v) {
    return v !== null && typeof v === 'object' && !Array.isArray(v);
  }

  function vide(v) {
    return !estObjet(v) || Object.keys(v).length === 0;
  }

  function fusionTables(a, b) {
    if (vide(a)) return vide(b) ? {} : b;
    if (vide(b)) return a;
    const fa = estObjet(a.faits) ? a.faits : {};
    const fb = estObjet(b.faits) ? b.faits : {};
    const faits = {};
    for (const k of new Set([...Object.keys(fa), ...Object.keys(fb)])) faits[k] = fusionFait(fa[k], fb[k]);
    return {
      ...a,
      ...b,
      version: Math.max(a.version || 1, b.version || 1),
      faits,
      familles: Math.max(a.familles || 1, b.familles || 1),
      diagnostic: !!(a.diagnostic || b.diagnostic),
      jours: unionTriee(a.jours, b.jours),
      records: unionRecords(a.records, b.records),
    };
  }

  function fusionner(module, enregistre, recu) {
    if (module === 'tables') return fusionTables(enregistre, recu);
    if (vide(recu)) return vide(enregistre) ? {} : enregistre;
    return recu;
  }
  /* ---------- Fin de la copie ---------- */

  const statut = { synchronise: false, derniereSauvegarde: null, erreur: null };
  const enAttente = new Map(); // 'enfant|module' -> dernier état à envoyer
  let minuterie = null;

  function lireCode() {
    try { return localStorage.getItem(CLE_CODE) || ''; } catch (e) { return ''; }
  }

  function configurer(code) {
    try {
      if (code) localStorage.setItem(CLE_CODE, String(code).trim());
      else localStorage.removeItem(CLE_CODE);
      statut.erreur = null;
      return true;
    } catch (e) {
      statut.erreur = 'stockage local indisponible';
      return false;
    }
  }

  class ErreurApi extends Error {
    constructor(message, statutHttp) { super(message); this.statutHttp = statutHttp; }
  }

  async function appeler(methode, enfant, module, corps) {
    const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const delai = ctrl ? setTimeout(() => ctrl.abort(), DELAI_MS) : null;
    try {
      const url = URL_API + '?enfant=' + encodeURIComponent(enfant) + '&module=' + encodeURIComponent(module);
      const options = { method: methode, headers: {}, credentials: 'same-origin', signal: ctrl ? ctrl.signal : undefined };
      if (corps !== undefined) {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(corps);
      }
      let rep;
      try { rep = await fetch(url, options); } catch (e) { throw new ErreurApi('hors ligne ou service injoignable', -1); }
      let json = null;
      try { json = await rep.json(); } catch (e) { json = null; }
      if (!rep.ok) throw new ErreurApi((json && json.erreur) || 'erreur ' + rep.status, rep.status);
      return json || {};
    } finally {
      if (delai) clearTimeout(delai);
    }
  }

  // Un code refusé, un enfant ou un module invalide ne se règlent pas en retentant.
  const definitive = e => [0, 400, 401, 413].includes(e.statutHttp);

  function noterErreur(e) {
    statut.synchronise = false;
    statut.erreur = e.message;
  }

  function planifier() {
    if (minuterie || !enAttente.size) return;
    minuterie = setTimeout(() => { minuterie = null; retenter(); }, RETENTE_MS);
  }

  async function retenter() {
    for (const [cle, etat] of Array.from(enAttente)) {
      const [enfant, module] = cle.split('|');
      await pousser(enfant, module, etat);
    }
  }

  async function tirer(enfant, module) {
    try {
      const distant = await appeler('GET', enfant, module);
      statut.erreur = null;
      return distant;
    } catch (e) {
      noterErreur(e);
      return null;
    }
  }

  /* Rend l'état fusionné par le service ; en cas d'échec, l'état local tel quel. */
  async function pousser(enfant, module, etat) {
    const cle = enfant + '|' + module;
    try {
      const fusion = await appeler('PUT', enfant, module, etat);
      if (enAttente.get(cle) === etat) enAttente.delete(cle);
      statut.synchronise = enAttente.size === 0;
      statut.derniereSauvegarde = new Date().toISOString();
      statut.erreur = null;
      return fusion;
    } catch (e) {
      noterErreur(e);
      if (definitive(e)) enAttente.delete(cle);
      else { enAttente.set(cle, etat); planifier(); }
      return etat;
    }
  }

  /* Au chargement : fusionne le local et le distant, puis renvoie le résultat au service. */
  async function synchroniser(enfant, module, local) {
    const distant = await tirer(enfant, module);
    if (distant === null) return local;
    const fusion = fusionner(module, distant, local);
    return pousser(enfant, module, fusion);
  }

  /* Remise à zéro voulue par un parent : efface aussi l'état en ligne, sinon la fusion le remettrait. */
  async function effacer(enfant, module) {
    enAttente.delete(enfant + '|' + module);
    try { await appeler('DELETE', enfant, module); return true; } catch (e) { noterErreur(e); return false; }
  }

  function etat() {
    return {
      configure: true,
      synchronise: statut.synchronise,
      derniereSauvegarde: statut.derniereSauvegarde,
      erreur: statut.erreur,
      enAttente: enAttente.size,
    };
  }

  if (typeof racine.addEventListener === 'function') {
    racine.addEventListener('online', () => { retenter(); });
  }

  racine.Sync = { configurer, tirer, pousser, synchroniser, effacer, etat, fusionner };
})(typeof window !== 'undefined' ? window : globalThis);
