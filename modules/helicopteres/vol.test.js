// Tests du modèle de vol du prototype 3D (D-26), sans rendu : node modules/helicopteres/vol.test.js
const assert = require('assert');
const fs = require('fs');
const path = require('path');
globalThis.window = undefined;
require('../../commun/textes.js');
require('../zoom/moteur.js');
require('./contenu.js');
require('./moteur.js');
require('./vol.js');
const V = globalThis.HeliVol;
const H = globalThis.Helico;
const HC = globalThis.HeliContenu;

const DT = 1 / 60;
const voler = (v, cmd, secondes, monde) => { for (let t = 0; t < secondes; t += DT) V.pas(v, cmd, DT, monde); return v; };
const pret = () => { const v = V.creer(); V.demarrer(v); voler(v, { collectif: 0 }, V.DUREE_DEMARRAGE + 0.5); return v; };
const LIEUX = { H: { x: 0, z: 0 }, tour: { x: 10, z: -78 } };

// ---------- Le rotor : il démarre, puis tourne à vitesse constante, quoi qu'on fasse du collectif ----------
{
  const v = V.creer();
  assert.strictEqual(v.rotor.tours, 0);
  voler(v, { collectif: 1 }, 2);
  assert.ok(v.sol && v.pos.y === 0, 'rotor arrêté : on ne décolle pas, même levier en haut');
  V.demarrer(v);
  voler(v, { collectif: 0 }, V.DUREE_DEMARRAGE + 0.2);
  assert.strictEqual(v.rotor.etat, 'marche');
  assert.ok(V.TOURS_ROTOR >= 375 && V.TOURS_ROTOR <= 405, 'entre 375 et 405 tours par minute (EASA.R.008)');
  const releves = new Set();
  for (const c of [0, 0.2, 0.5, 0.8, 1, 0.3]) {
    for (let i = 0; i < 60; i++) { V.pas(v, { collectif: c, mancheY: c - 0.5, pedales: 1 - c }, DT); releves.add(v.rotor.tours); }
  }
  assert.deepStrictEqual([...releves], [V.TOURS_ROTOR], 'le compteur de tours ne bouge jamais en vol');
  // À la coupure, le rotor ralentit jusqu'à l'arrêt.
  V.couper(v);
  voler(v, { collectif: 0 }, 2);
  assert.ok(v.rotor.tours < V.TOURS_ROTOR && v.rotor.tours > 0, 'il ralentit doucement');
  voler(v, { collectif: 0 }, V.DUREE_COUPURE + 1);
  assert.strictEqual(v.rotor.etat, 'arret');
}

// ---------- La poussée : elle monte avec le collectif, égale le poids au milieu, et l'effet de sol ----------
{
  let avant = -Infinity;
  for (let c = 0; c <= 1.0001; c += 0.05) {
    const p = V.poussee(c, 50);
    assert.ok(p >= avant - 1e-9, `la poussée ne baisse pas quand on monte le levier (${c.toFixed(2)})`);
    avant = p;
  }
  assert.strictEqual(V.poussee(0.5, 50), 1, 'levier au milieu, loin du sol : la poussée égale le poids');
  assert.ok(V.poussee(1, 50) > 1.5 && V.poussee(0, 50) < 0.6);
  assert.ok(V.poussee(0.5, 0) > V.poussee(0.5, 3) && V.poussee(0.5, 3) > V.poussee(0.5, 10), 'effet de sol : plus de poussée près du sol');
  assert.strictEqual(V.poussee(0.5, 10), 1);
  assert.strictEqual(V.poussee(1, 10, 0), 0, 'rotor arrêté : aucune poussée');
}

// ---------- Décoller, rester, descendre : l'inertie est douce ----------
{
  const v = pret();
  voler(v, { collectif: 0 }, 1);
  assert.ok(v.sol, 'levier en bas : on reste posé');
  V.pas(v, { collectif: 1 }, DT);
  assert.ok(v.vit.y < 1, 'pas de bond : la vitesse monte progressivement');
  voler(v, { collectif: 1 }, 4);
  assert.ok(!v.sol && v.hauteur > 6, `levier en haut : on monte (${v.hauteur.toFixed(1)} m)`);
  assert.ok(v.vit.y > 2 && v.vit.y < 5, `montée douce (${v.vit.y.toFixed(2)} m/s)`);
  // Levier au milieu : la montée s'arrête et l'hélicoptère reste à la même hauteur.
  voler(v, { collectif: 0.5 }, 6);
  const h = v.hauteur;
  voler(v, { collectif: 0.5 }, 3);
  assert.ok(Math.abs(v.hauteur - h) < 0.3 && Math.abs(v.vit.y) < 0.1, 'vol stationnaire au milieu du levier');
  // Levier au milieu, posé : l'effet de sol suffit à décoller, puis on se stabilise vers 6 m.
  const w = pret();
  voler(w, { collectif: 0.5 }, 12);
  assert.ok(!w.sol && w.hauteur > 3 && w.hauteur < 6.5, `effet de sol : stationnaire près du sol (${w.hauteur.toFixed(1)} m)`);
}

// ---------- Jamais sous le sol, atterrissage en douceur, aucun crash ----------
{
  const v = pret();
  voler(v, { collectif: 1 }, 10);
  let mini = Infinity;
  let vitesseContact = 0;
  for (let t = 0; t < 30; t += DT) {
    const vy = v.vit.y;
    const avant = v.sol;
    V.pas(v, { collectif: 0, mancheY: 1, pedales: -1 }, DT);
    if (!avant && v.sol) vitesseContact = vy;
    mini = Math.min(mini, v.pos.y);
  }
  assert.ok(mini >= 0, 'jamais sous le sol');
  assert.ok(v.sol && v.pos.y === 0);
  assert.ok(vitesseContact > -1.5, `posé en douceur (${vitesseContact.toFixed(2)} m/s)`);
  // Sur un terrain en pente aussi.
  const monde = { sol: (x, z) => 0.2 * x + 3 };
  const w = V.creer({ y: 3 });
  V.demarrer(w);
  voler(w, { collectif: 0.6, mancheX: 1 }, 30, monde);
  for (let t = 0; t < 20; t += DT) { V.pas(w, { collectif: 0, mancheX: -1 }, DT, monde); assert.ok(w.pos.y >= monde.sol(w.pos.x, w.pos.z) - 1e-9); }
  // Un obstacle arrête sans casser : on ne le traverse pas.
  const o = { x: 0, z: -40, r: 3, h: 20 };
  const x = pret();
  voler(x, { collectif: 0.65 }, 3);
  for (let t = 0; t < 20; t += DT) {
    V.pas(x, { collectif: 0.5, mancheY: 1 }, DT, { obstacles: [o] });
    assert.ok(Math.hypot(x.pos.x - o.x, x.pos.z - o.z) >= o.r + 5.4 - 1e-6, 'jamais dans la tour');
  }
}

// ---------- Le manche fait avancer (le disque penche), les pédales font tourner le nez, l'inertie est douce ----------
{
  const v = pret();
  voler(v, { collectif: 0.62 }, 3);
  voler(v, { collectif: 0.5 }, 2);
  voler(v, { collectif: 0.5, mancheY: 1 }, 6);
  assert.ok(v.disque.avant > 0.25, 'le disque penche vers l\'avant');
  assert.ok(v.pos.z < -20 && Math.abs(v.pos.x) < 1, `on avance vers le nez (${v.pos.z.toFixed(1)})`);
  const vitesse = V.vitesseH(v);
  assert.ok(vitesse > 5 && vitesse < 12, `vitesse raisonnable (${vitesse.toFixed(1)} m/s)`);
  voler(v, { collectif: 0.5 }, 1);
  assert.ok(V.vitesseH(v) > 1, 'manche lâché : il glisse encore un peu (inertie)');
  voler(v, { collectif: 0.5 }, 15);
  assert.ok(V.vitesseH(v) < 0.2, 'puis il s\'arrête et reste en l\'air');
  const cap = v.cap;
  voler(v, { collectif: 0.5, pedales: 1 }, 2);
  assert.ok(v.cap < cap - 0.8, 'pédale droite : le nez tourne à droite');
  assert.ok(V.vitesseH(v) < 0.5, 'les pédales ne font pas avancer');
  // Posé, le manche et les pédales ne bougent rien.
  const w = pret();
  voler(w, { collectif: 0, mancheY: 1, pedales: 1 }, 3);
  assert.ok(w.sol && Math.abs(w.pos.z) < 1e-9 && Math.abs(w.cap) < 1e-9);
}

// Un pilote automatique simple : une vitesse voulue vers la cible, convertie en manche (avant, côté).
function piloter(v, cible, collectif, arret) {
  const dx = cible.x - v.pos.x;
  const dz = cible.z - v.pos.z;
  const d = Math.hypot(dx, dz);
  const voulue = d > arret ? Math.min(7, (d - arret) * 0.35) : 0;
  const ex = (d > 1e-6 ? dx / d : 0) * voulue - v.vit.x;
  const ez = (d > 1e-6 ? dz / d : 0) * voulue - v.vit.z;
  const fa = V.avant(v.cap);
  const fd = V.droite(v.cap);
  const b = x => Math.max(-1, Math.min(1, x));
  return { collectif, mancheY: b((ex * fa.x + ez * fa.z) * 0.4), mancheX: b((ex * fd.x + ez * fd.z) * 0.4) };
}

// ---------- Les cinq missions se jouent dans l'ordre ----------
{
  assert.deepStrictEqual(V.MISSIONS, ['decoller', 'stationnaire', 'tour', 'tourner', 'poser']);
  const v = pret();
  const faire = (id, cmd, max, avantChaque) => {
    const s = V.creerSuivi(v, LIEUX);
    for (let t = 0; t < max; t += DT) {
      const c = typeof cmd === 'function' ? cmd(v) : cmd;
      V.pas(v, c, DT);
      if (avantChaque) avantChaque(s);
      if (V.progres(id, v, s, DT, LIEUX).fait) return t;
    }
    assert.fail(`mission ${id} non réussie`);
    return 0;
  };
  faire('decoller', { collectif: 0.7 }, 10);
  faire('stationnaire', { collectif: 0.5 }, 15);
  faire('tour', w => piloter(w, LIEUX.tour, 0.5, 30), 40,
    s => { if (s.presTour) V.appelerTour(s); });
  faire('tourner', { collectif: 0.5, pedales: 1 }, 20);
  faire('poser', w => {
    const c = piloter(w, LIEUX.H, 0.5, 0);
    if (V.distance(w, LIEUX.H) < 3 && V.vitesseH(w) < 1.5) c.collectif = 0;
    return c;
  }, 60);
  // La radio ne marche que près de la tour.
  const loin = V.creerSuivi(v, LIEUX);
  assert.strictEqual(V.appelerTour(loin), false);
}

// ---------- Le carnet : un champ facultatif, un tampon par mission, jamais retiré, rien perdu ----------
{
  const samedi = new Date(2026, 10, 7, 17, 0);
  // Un état du module 2D, sans le champ nouveau, avec un champ inconnu.
  const ancien = H.normaliser({ version: 1, etapes: { helico: '2026-11-07' }, brevet: { collectif: '2026-11-07' }, tampons: ['collectif'], mission: 'feux', langue: 'fr', inconnu: 42 });
  const avantJSON = JSON.parse(JSON.stringify(ancien));
  assert.deepStrictEqual(V.missionsFaites(ancien), {}, 'un état sans vol3d se lit');
  assert.strictEqual(V.noterMission(ancien, 'decoller', samedi), true);
  assert.strictEqual(V.noterMission(ancien, 'decoller', new Date(2026, 10, 9)), false, 'un tampon ne se pose qu\'une fois');
  assert.strictEqual(V.noterMission(ancien, 'inconnue', samedi), false);
  assert.deepStrictEqual(ancien.vol3d, { missions: { decoller: '2026-11-07' } });
  Object.keys(avantJSON).forEach(k => assert.deepStrictEqual(ancien[k], avantJSON[k], `champ ${k} gardé`));
  // Relu par le moteur du module 2D : le champ nouveau survit.
  const relu = H.normaliser(JSON.parse(JSON.stringify(ancien)));
  assert.deepStrictEqual(relu.vol3d, ancien.vol3d);
  assert.strictEqual(relu.inconnu, 42);
}

// ---------- Le contenu du prototype : deux langues, aucun chiffre, pas de tiret cadratin ----------
{
  const T = HC.VOL3D;
  assert.ok(T, 'HeliContenu.VOL3D existe');
  V.MISSIONS.forEach(id => {
    const m = T.missions[id];
    ['nom', 'consigne', 'aide', 'bravo'].forEach(k => assert.ok(m[k].fr && m[k].en, `${id}.${k} en deux langues`));
  });
  const tout = JSON.stringify(T);
  assert.ok(!/\d/.test(tout), 'aucun chiffre dans les phrases du prototype');
  for (const lg of HC.LANGUES) {
    const l = HC.toutesLesPhrases(lg);
    assert.ok(l.includes(HC.champ(T.missions.decoller.bravo, lg)), 'les phrases du prototype sont collectées pour les voix');
    assert.ok(!l.includes(HC.champ(T.missions.decoller.nom, lg)), 'les titres ne se disent pas');
  }
  const EM = String.fromCharCode(0x2014);
  ['vol.js', 'vol3d.js', 'vol3d.css', '../../henri/helicopteres-3d.html'].forEach(f => {
    const p = path.join(__dirname, f);
    if (fs.existsSync(p)) assert.ok(!fs.readFileSync(p, 'utf8').includes(EM), `tiret cadratin dans ${f}`);
  });
}

console.log('vol.test.js : tout est vert');
