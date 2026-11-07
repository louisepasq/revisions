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
    // Album à tampons (D-20) : jours de tampon réunis, premier jour vu le plus ancien.
    ...(x.tampons || y.tampons ? { tampons: unionTriee(x.tampons, y.tampons) } : {}),
    ...(x.debut || y.debut ? { debut: [x.debut, y.debut].filter(Boolean).sort()[0] } : {}),
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

/* Module du zoom : une carte de Leitner par lieu et par type de question, fusionnée comme un fait
   des tables ; étapes ouvertes au maximum, jours réunis, grand voyage vu sur l'un ou l'autre. */
function fusionZoom(a, b) {
  if (vide(a)) return vide(b) ? {} : b;
  if (vide(b)) return a;
  const ca = estObjet(a.cartes) ? a.cartes : {};
  const cb = estObjet(b.cartes) ? b.cartes : {};
  const cartes = {};
  for (const k of new Set([...Object.keys(ca), ...Object.keys(cb)])) cartes[k] = fusionFait(ca[k], cb[k]);
  return {
    ...a,
    ...b,
    version: Math.max(a.version || 1, b.version || 1),
    cartes,
    etages: Math.max(a.etages || 1, b.etages || 1),
    jours: unionTriee(a.jours, b.jours),
    intro: !!(a.intro || b.intro),
  };
}

/* Module des hélicoptères : les cartes comme le zoom ; étapes faites, tampons du carnet et objets
   gagnés réunis (la date la plus ancienne), jours, parties vues et parties trouvées au musée réunis ;
   pour l'expérience, chaque modèle garde la liste de mesures la plus remplie. Le reste (langue,
   mission, couleur, hypothèse) vient du nouvel état s'il l'a, sinon de l'ancien. */
function plusAncien(a, b) {
  const x = estObjet(a) ? a : {};
  const y = estObjet(b) ? b : {};
  const r = {};
  for (const k of new Set([...Object.keys(x), ...Object.keys(y)])) r[k] = [x[k], y[k]].filter(Boolean).sort()[0];
  return r;
}
const ou = (x, y) => (x === null || x === undefined ? (y === undefined ? null : y) : x);
function fusionHelicopteres(a, b) {
  if (vide(a)) return vide(b) ? {} : b;
  if (vide(b)) return a;
  const z = fusionZoom(a, b);
  // fusionZoom pose `etages` et `intro`, qui n'existent pas ici.
  if (!('etages' in a) && !('etages' in b)) delete z.etages;
  if (!('intro' in a) && !('intro' in b)) delete z.intro;
  const xa = estObjet(a.experience) ? a.experience : {};
  const xb = estObjet(b.experience) ? b.experience : {};
  const ma = estObjet(xa.mesures) ? xa.mesures : {};
  const mb = estObjet(xb.mesures) ? xb.mesures : {};
  const compte = l => (Array.isArray(l) ? l.filter(v => typeof v === 'number').length : 0);
  const mesures = {};
  for (const k of new Set([...Object.keys(ma), ...Object.keys(mb)])) mesures[k] = compte(mb[k]) >= compte(ma[k]) ? mb[k] : ma[k];
  const f = {
    ...z,
    etapes: plusAncien(a.etapes, b.etapes),
    brevet: plusAncien(a.brevet, b.brevet),
    objets: plusAncien(a.objets, b.objets),
    tampons: unionTriee(a.tampons, b.tampons),
    parties: unionTriee(a.parties, b.parties),
    trouves: unionTriee(a.trouves, b.trouves),
    mission: ou(b.mission, a.mission),
    couleur: ou(b.couleur, a.couleur),
    conception: ou(b.conception, a.conception),
    experience: { ...xa, ...xb, hypothese: ou(xb.hypothese, xa.hypothese), conclusion: ou(xb.conclusion, xa.conclusion), verifs: unionTriee(xa.verifs, xb.verifs), mesures },
  };
  // Prototype 3D (D-26) : champ facultatif, les tampons des missions de vol réunis (la date la plus ancienne).
  const va = estObjet(a.vol3d) ? a.vol3d : null;
  const vb = estObjet(b.vol3d) ? b.vol3d : null;
  if (va || vb) f.vol3d = { ...(va || {}), ...(vb || {}), missions: plusAncien(va && va.missions, vb && vb.missions) };
  return f;
}

/* Résumé publié pour le portail (D-19), commun à tous les modules : le plus récent (ecritLe)
   l'emporte ; à égalité, celui qui vient d'arriver. Rend null si aucun des deux n'en a. */
function dateResume(r) {
  const t = Date.parse(r && r.ecritLe);
  return Number.isFinite(t) ? t : -1;
}

function fusionResume(a, b) {
  const ra = estObjet(a) && estObjet(a.resume) ? a.resume : null;
  const rb = estObjet(b) && estObjet(b.resume) ? b.resume : null;
  if (!ra) return rb;
  if (!rb) return ra;
  return dateResume(ra) > dateResume(rb) ? ra : rb;
}

function fusionEtat(module, enregistre, recu) {
  if (module === 'tables') return fusionTables(enregistre, recu);
  if (module === 'zoom') return fusionZoom(enregistre, recu);
  if (module === 'helicopteres') return fusionHelicopteres(enregistre, recu);
  if (vide(recu)) return vide(enregistre) ? {} : enregistre;
  return recu;
}

/* enregistre : l'état connu jusqu'ici ; recu : le nouvel état.
   Module sans règle de fusion : le nouvel état remplace l'ancien. Dans tous les cas, le résumé
   le plus récent est gardé. */
function fusionner(module, enregistre, recu) {
  const etat = fusionEtat(module, enregistre, recu);
  const resume = fusionResume(enregistre, recu);
  return resume && !vide(etat) ? { ...etat, resume } : etat;
}

module.exports = { fusionner, fusionTables, fusionZoom, fusionHelicopteres, fusionFait, fusionResume };
