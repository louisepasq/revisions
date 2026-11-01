/* Fusion de deux états d'un module de révisions (celui enregistré et celui reçu).
   Le même code est recopié dans client/sync.js ; test/fusion.test.js vérifie
   que les deux versions rendent les mêmes résultats. */
'use strict';

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

// Vrai si x est au moins aussi avancé que y : prochain le plus récent, sinon boîte la plus haute.
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

/* enregistre : l'état connu jusqu'ici ; recu : le nouvel état.
   Module sans règle de fusion : le nouvel état remplace l'ancien. */
function fusionner(module, enregistre, recu) {
  if (module === 'tables') return fusionTables(enregistre, recu);
  if (vide(recu)) return vide(enregistre) ? {} : enregistre;
  return recu;
}

module.exports = { fusionner, fusionTables, fusionFait };
