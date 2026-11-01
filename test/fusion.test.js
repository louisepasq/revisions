'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const serveur = require('../lib/fusion');

// La copie du client, chargée comme dans le navigateur.
function chargerClient() {
  const contexte = { setTimeout, clearTimeout, console };
  contexte.globalThis = contexte;
  vm.createContext(contexte);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../commun/sync.js'), 'utf8'), contexte);
  return contexte.Sync;
}
const client = chargerClient();

const fait = (boite, prochain, justesJours = [], extra = {}) =>
  ({ boite, vu: true, prochain, justesJours, erreurs: 0, dernierTemps: 2000, ...extra });

const ipad = {
  version: 1,
  faits: {
    '2x3': fait(3, '2026-11-05', ['2026-11-01']),
    '4x5': fait(1, '2026-11-01', [], { erreurs: 2 }),
    '7x7': fait(2, '2026-11-03', ['2026-10-30']),
  },
  familles: 2,
  diagnostic: true,
  jours: ['2026-10-30', '2026-11-01'],
  records: [{ type: 'serie', valeur: 8 }],
};
const autre = {
  version: 1,
  faits: {
    '2x3': fait(2, '2026-11-03', ['2026-10-31']),
    '4x5': fait(4, '2026-11-08', ['2026-10-31'], { erreurs: 1 }),
    '7x7': fait(3, '2026-11-03', ['2026-11-01']),
    '9x9': fait(1, '2026-11-02'),
  },
  familles: 3,
  diagnostic: false,
  jours: ['2026-10-31', '2026-11-01'],
  records: [{ type: 'serie', valeur: 8 }, { type: 'serie', valeur: 12 }],
};

for (const [nom, impl] of [['serveur', serveur.fusionner], ['client', (m, a, b) => JSON.parse(JSON.stringify(client.fusionner(m, a, b)))]]) {
  test(`${nom} : le fait au prochain le plus récent gagne`, () => {
    const f = impl('tables', ipad, autre);
    assert.equal(f.faits['2x3'].boite, 3);
    assert.equal(f.faits['2x3'].prochain, '2026-11-05');
    assert.equal(f.faits['4x5'].boite, 4);
    assert.equal(f.faits['4x5'].prochain, '2026-11-08');
  });

  test(`${nom} : à prochain égal, la boîte la plus haute gagne`, () => {
    const f = impl('tables', ipad, autre);
    assert.equal(f.faits['7x7'].boite, 3);
  });

  test(`${nom} : justesJours et jours réunis sans doublon, erreurs au maximum`, () => {
    const f = impl('tables', ipad, autre);
    assert.deepEqual(f.faits['2x3'].justesJours, ['2026-10-31', '2026-11-01']);
    assert.deepEqual(f.faits['7x7'].justesJours, ['2026-10-30', '2026-11-01']);
    assert.equal(f.faits['4x5'].erreurs, 2);
    assert.deepEqual(f.jours, ['2026-10-30', '2026-10-31', '2026-11-01']);
  });

  test(`${nom} : familles au maximum, diagnostic en ou, records réunis`, () => {
    const f = impl('tables', ipad, autre);
    assert.equal(f.familles, 3);
    assert.equal(f.diagnostic, true);
    assert.deepEqual(f.records, [{ type: 'serie', valeur: 8 }, { type: 'serie', valeur: 12 }]);
    assert.ok(f.faits['9x9']);
  });

  test(`${nom} : un fait jamais programmé perd contre un fait programmé`, () => {
    const a = { faits: { '3x3': { boite: 0, vu: false, prochain: null, justesJours: [], erreurs: 0 } } };
    const b = { faits: { '3x3': fait(1, '2026-11-01') } };
    assert.equal(impl('tables', a, b).faits['3x3'].boite, 1);
    assert.equal(impl('tables', b, a).faits['3x3'].boite, 1);
  });

  test(`${nom} : fusionner avec soi-même ne change rien, le vide est neutre`, () => {
    assert.deepEqual(impl('tables', ipad, ipad), ipad);
    assert.deepEqual(impl('tables', {}, ipad), ipad);
    assert.deepEqual(impl('tables', ipad, {}), ipad);
    assert.deepEqual(impl('tables', {}, {}), {});
  });

  test(`${nom} : fusion symétrique sur les faits`, () => {
    assert.deepEqual(impl('tables', ipad, autre).faits, impl('tables', autre, ipad).faits);
  });

  test(`${nom} : autre module, le nouvel état remplace l'ancien`, () => {
    assert.deepEqual(impl('carte', { a: 1 }, { b: 2 }), { b: 2 });
    assert.deepEqual(impl('carte', { a: 1 }, {}), { a: 1 });
  });
}
