// Tests de la géométrie et de la cohérence contenu / cartes : node modules/zoom/geometrie.test.js
const assert = require('assert');
const fs = require('fs');
const path = require('path');
require('./geometrie.js');
require('./contenu.js');
require('./cartes.js');
const G = globalThis.ZoomGeo;
const C = globalThis.ZoomContenu;
const K = globalThis.ZoomCartes;

// Une petite carte inventée : une île carrée avec un lac, une mer, un fleuve, deux villes proches.
const carre = (x, y, l) => [x, y, x + l, y, x + l, y + l, x, y + l];
const etage = {
  fond: [['z', 'terre', [carre(100, 100, 400), carre(250, 250, 100)]]],
  terre: [0],
  formes: {
    ile: { f: 'z', g: [carre(100, 100, 400), carre(250, 250, 100)], a: 150000 },
    mer: { f: 'z', g: [carre(0, 0, 1000)], ht: 1, a: 1e6 },
    fleuve: { f: 'l', g: [[100, 600, 900, 600]] },
    ville: { f: 'p', g: [200, 200] },
    village: { f: 'p', g: [220, 200] },
    planete: { f: 'p', g: [700, 300], r: 40 },
  },
};
const ids = Object.keys(etage.formes);

assert.strictEqual(G.dZone([[0, 0, 10, 0, 10, 10]]), 'M0 0L10 0L10 10Z');
assert.strictEqual(G.dLigne([[0, 0, 10, 0]]), 'M0 0L10 0');
assert.ok(G.dedans(etage.formes.ile.g, 150, 150));
assert.ok(!G.dedans(etage.formes.ile.g, 300, 300), 'le lac est un trou');
assert.ok(G.touche(etage, etage.formes.mer, 50, 50, 1), 'en pleine mer');
assert.ok(!G.touche(etage, etage.formes.mer, 150, 150, 1), 'une mer ne se touche pas sur la terre');
assert.ok(G.touche(etage, etage.formes.ile, 495, 150, 1));
assert.ok(G.touche(etage, etage.formes.ile, 505, 150, 1), 'dix pixels de marge au bord d une zone');
assert.ok(!G.touche(etage, etage.formes.ile, 530, 150, 1));
assert.ok(G.touche(etage, etage.formes.fleuve, 400, 620, 1), 'vingt pixels de part et d autre d un fleuve');
assert.ok(!G.touche(etage, etage.formes.fleuve, 400, 640, 1));
assert.ok(G.touche(etage, etage.formes.planete, 755, 300, 1), 'un gros point se touche sur son dessin, plus une marge');

// Les marges sont en pixels d'écran : sur un petit écran (échelle 0,4), la même marge couvre plus de carte.
assert.ok(!G.touche(etage, etage.formes.ville, 200, 240, 1));
assert.ok(G.touche(etage, etage.formes.ville, 200, 240, 0.4));

// Deux villes proches : toucher pile sur l'autre, c'est la désigner ; toucher entre les deux, c'est bon.
assert.ok(G.toucheJuste(etage, 'ville', ids, 205, 200, 1));
assert.ok(!G.toucheJuste(etage, 'ville', ids, 220, 200, 1), 'pile sur le village');
assert.ok(G.toucheJuste(etage, 'ile', ids, 220, 200, 1), 'une ville dans l île : l île est bien touchée');
assert.strictEqual(G.lieuSous(etage, ids, 219, 201, 1), 'village');
assert.strictEqual(G.lieuSous(etage, ids, 400, 150, 1), 'ile', 'la plus petite zone sous le doigt');
assert.strictEqual(G.lieuSous(etage, ids, 50, 50, 1), 'mer');
assert.deepStrictEqual(G.boite(etage.formes.planete), [660, 260, 80, 80]);

// Contenu et cartes : chaque lieu a son tracé dans son étape, et chaque tracé a son lieu.
assert.deepStrictEqual(C.ETAGES.map(e => e.id), Object.keys(K));
for (const e of C.ETAGES) {
  const carte = K[e.id];
  for (const l of e.lieux) assert.ok(carte.formes[l.id], `${e.id} : pas de tracé pour ${l.id}`);
  for (const id of Object.keys(carte.formes)) assert.ok(e.lieux.some(l => l.id === id), `${e.id} : tracé sans lieu ${id}`);
  for (const id of Object.keys(carte.formes)) {
    const f = carte.formes[id];
    assert.ok(f.f === 'p' ? f.g.length === 2 : f.g.length > 0, `${e.id} : tracé vide pour ${id}`);
    const [x, y] = f.e;
    assert.ok(x >= 0 && x <= carte.l && y >= 0 && y <= carte.h, `${e.id} : étiquette de ${id} hors de la carte`);
  }
  assert.ok(carte.foyer || e.id === 'bdr', `${e.id} : pas de foyer pour zoomer`);
}
// Le village est bien dans son département, à l'ouest d'Aix ; Marseille et Aix sont des repères.
const bdr = K.bdr;
const eg = bdr.formes.eguilles.g;
const aix = bdr.reperes.find(r => r[0] === 'Aix-en-Provence');
assert.ok(aix && eg[0] < aix[1] && Math.abs(eg[1] - aix[2]) < 40, 'Éguilles est juste à l ouest d Aix');
assert.ok(bdr.fond.some(f => f[1].includes('terre-region') && G.dedans(f[2], eg[0], eg[1])), 'Éguilles est dans les Bouches-du-Rhône');
assert.ok(G.dedans(K.paca.formes['bouches-du-rhone'].g, ...K.paca.formes['marseille-prefecture'].g), 'Marseille est dans le 13');
assert.ok(G.touche(K.paca, K.paca.formes.var, ...K.paca.formes.toulon.g, 1), 'Toulon, sur le port, est dans le 83');
assert.ok(G.dedans(K.paca.formes.vaucluse.g, ...K.paca.formes.ventoux.g), 'le Ventoux est dans le 84');
assert.ok(G.dedans(K.france.formes.paca.g, ...K.france.formes.marseille.g), 'Marseille est en PACA');
assert.ok(G.dedans(K.europe.formes.france.g, ...[K.europe.formes.monaco.g[0] - 8, K.europe.formes.monaco.g[1]]), 'Monaco touche la France');
assert.ok(G.toucheJuste(K.terre, 'atlantique', Object.keys(K.terre.formes), ...K.terre.formes.atlantique.e, 1), 'l étiquette de l Atlantique est dans l Atlantique');
assert.ok(!G.touche(K.terre, K.terre.formes.atlantique, ...K.terre.formes.afrique.e, 1), 'l Afrique n est pas l Atlantique');

// Le poids des cartes embarquées (consigne : 1,5 Mo au plus).
const taille = fs.statSync(path.join(__dirname, 'cartes.js')).size;
assert.ok(taille < 1.5 * 1024 * 1024, `cartes.js pèse ${taille} octets`);

console.log('géométrie et cartes du zoom : ok');
