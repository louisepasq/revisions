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

  test(`${nom} : album à tampons, jours de tampon réunis et premier jour le plus ancien`, () => {
    const a = { version: 2, faits: { '7x8': fait(4, '2026-11-09', [], { tampons: ['2026-11-02', '2026-11-03'], debut: '2026-11-02' }), '2x2': fait(1, '2026-11-03') } };
    const b = { version: 2, faits: { '7x8': fait(3, '2026-11-05', [], { tampons: ['2026-11-03', '2026-11-05'], debut: '2026-11-01' }), '2x2': fait(2, '2026-11-04', [], { tampons: ['2026-11-03'] }) } };
    const f = impl('tables', a, b);
    assert.deepEqual(f.faits['7x8'].tampons, ['2026-11-02', '2026-11-03', '2026-11-05']);
    assert.equal(f.faits['7x8'].debut, '2026-11-01');
    assert.equal(f.faits['7x8'].boite, 4, 'les boîtes suivent toujours le plus avancé');
    assert.deepEqual(f.faits['2x2'].tampons, ['2026-11-03'], 'un tampon d un seul appareil est gardé');
    assert.equal(f.faits['2x2'].debut, undefined);
    assert.deepEqual(impl('tables', a, b).faits, impl('tables', b, a).faits, 'symétrique');
    assert.deepEqual(impl('tables', a, a).faits, a.faits, 'fusionner avec soi-même ne change rien');
  });

  test(`${nom} : zoom, chaque carte prend sa version la plus avancée`, () => {
    const ipadZ = {
      version: 1,
      cartes: { 'mars|toucher': fait(3, '2026-11-05', ['2026-11-01']), 'gap|toucher': fait(1, '2026-11-01', [], { erreurs: 2 }) },
      etages: 2, jours: ['2026-11-01'], intro: true,
    };
    const autreZ = {
      version: 1,
      cartes: { 'mars|toucher': fait(2, '2026-11-03', ['2026-10-31']), 'gap|toucher': fait(4, '2026-11-08', ['2026-10-31']), 'gap|nommer': fait(1, '2026-11-02') },
      etages: 3, jours: ['2026-10-31'], intro: false,
    };
    const f = impl('zoom', ipadZ, autreZ);
    assert.equal(f.cartes['mars|toucher'].boite, 3);
    assert.deepEqual(f.cartes['mars|toucher'].justesJours, ['2026-10-31', '2026-11-01']);
    assert.equal(f.cartes['gap|toucher'].boite, 4);
    assert.equal(f.cartes['gap|toucher'].erreurs, 2);
    assert.ok(f.cartes['gap|nommer']);
    assert.equal(f.etages, 3);
    assert.equal(f.intro, true);
    assert.deepEqual(f.jours, ['2026-10-31', '2026-11-01']);
    assert.deepEqual(impl('zoom', ipadZ, autreZ).cartes, impl('zoom', autreZ, ipadZ).cartes, 'symétrique');
    assert.deepEqual(impl('zoom', ipadZ, ipadZ), ipadZ);
    assert.deepEqual(impl('zoom', {}, ipadZ), ipadZ);
    assert.deepEqual(impl('zoom', ipadZ, {}), ipadZ);
  });

  test(`${nom} : autre module, le nouvel état remplace l'ancien`, () => {
    assert.deepEqual(impl('carte', { a: 1 }, { b: 2 }), { b: 2 });
    assert.deepEqual(impl('carte', { a: 1 }, {}), { a: 1 });
  });

  // Résumé du portail (D-19) : règle commune à tous les modules, le plus récent ecritLe gagne.
  const resume = (ecritLe, phrase) => ({ version: 1, ecritLe, progres: { avancement: 0.5, phrase: { en: phrase, fr: phrase } }, du: null, jours: [], parent: phrase });
  const vieux = resume('2026-11-01T08:00:00.000Z', 'vieux');
  const recent = resume('2026-11-01T10:00:00+01:00', 'récent'); // 09:00 UTC, autre fuseau

  for (const module of ['tables', 'zoom', 'cible']) {
    test(`${nom} : ${module}, le résumé le plus récent gagne dans les deux sens`, () => {
      const a = { version: 1, jours: ['2026-10-31'], resume: vieux };
      const b = { version: 1, jours: ['2026-11-01'], resume: recent };
      assert.equal(impl(module, a, b).resume.parent, 'récent');
      assert.equal(impl(module, b, a).resume.parent, 'récent');
    });

    test(`${nom} : ${module}, un résumé d'un seul côté est gardé`, () => {
      const a = { version: 1, jours: ['2026-10-31'], resume: vieux };
      const b = { version: 1, jours: ['2026-11-01'] };
      assert.equal(impl(module, a, b).resume.parent, 'vieux');
      assert.equal(impl(module, b, a).resume.parent, 'vieux');
      assert.equal(impl(module, b, b).resume, undefined, 'aucun résumé inventé');
    });
  }

  test(`${nom} : résumé, les tables gardent leur fusion propre`, () => {
    const a = { ...ipad, resume: recent };
    const b = { ...autre, resume: vieux };
    const f = impl('tables', a, b);
    assert.equal(f.faits['4x5'].boite, 4);
    assert.equal(f.familles, 3);
    assert.deepEqual(f.resume, recent);
    assert.deepEqual(impl('tables', a, a), a, 'fusionner avec soi-même ne change rien');
  });

  test(`${nom} : résumé, un ecritLe illisible perd contre une date`, () => {
    const a = { x: 1, resume: { ...vieux, ecritLe: 'hier' } };
    const b = { x: 2, resume: vieux };
    assert.equal(impl('carte', b, a).resume.ecritLe, vieux.ecritLe);
  });
}

/* Module des hélicoptères (D-23 à D-25) : rien de ce qui est gagné ne se perd d'un appareil à l'autre. */
for (const [nom, impl] of [['serveur', serveur.fusionner], ['client', (m, a, b) => JSON.parse(JSON.stringify(client.fusionner(m, a, b)))]]) {
  const ipadH = {
    version: 1, langue: 'fr', mission: 'feux', couleur: 'orange', conception: 'oui',
    etapes: { helico: '2026-11-07', vol: '2026-11-08' }, objets: { ecusson: '2026-11-07', autocollant: '2026-11-08' },
    brevet: { collectif: '2026-11-20' }, tampons: ['collectif'], parties: ['pales', 'queue'], trouves: [],
    cartes: { 'p-pales|q': fait(3, '2026-11-12', ['2026-11-07', '2026-11-08']) }, jours: ['2026-11-07', '2026-11-08'],
    experience: { hypothese: 'lent', verifs: ['papier', 'hauteur'], mesures: { court: [12, 13, 11] }, conclusion: null },
  };
  const iphoneH = {
    version: 1, mission: null, etapes: { helico: '2026-11-09', cockpit: '2026-11-09' }, objets: { ecusson: '2026-11-09', ailes: '2026-11-09' },
    brevet: {}, tampons: [], parties: ['patins'], trouves: ['pales'],
    cartes: { 'p-pales|q': fait(1, '2026-11-09', [], { erreurs: 1 }), 'c-monter|q': fait(1, '2026-11-10', ['2026-11-09']) }, jours: ['2026-11-09'],
    experience: { hypothese: null, verifs: ['trombone'], mesures: { court: [12], long: [20, 21, 19] }, conclusion: 'surpris' },
  };
  test(`${nom} : hélicoptères, deux appareils se réunissent sans rien perdre`, () => {
    for (const [a, b] of [[ipadH, iphoneH], [iphoneH, ipadH]]) {
      const f = impl('helicopteres', JSON.parse(JSON.stringify(a)), JSON.parse(JSON.stringify(b)));
      assert.deepEqual(f.etapes, { helico: '2026-11-07', vol: '2026-11-08', cockpit: '2026-11-09' }, 'étapes réunies, première date gardée');
      assert.deepEqual(Object.keys(f.objets).sort(), ['ailes', 'autocollant', 'ecusson']);
      assert.deepEqual(f.brevet, { collectif: '2026-11-20' }, 'un tampon ne se perd jamais');
      assert.deepEqual(f.tampons, ['collectif']);
      assert.deepEqual(f.parties, ['pales', 'patins', 'queue']);
      assert.equal(f.cartes['p-pales|q'].boite, 3, 'la carte la plus avancée');
      assert.ok(f.cartes['c-monter|q']);
      assert.deepEqual(f.jours, ['2026-11-07', '2026-11-08', '2026-11-09']);
      assert.equal(f.mission, 'feux', 'une mission choisie ne s efface pas');
      assert.equal(f.langue, 'fr', 'le choix de langue survit');
      assert.equal(f.experience.hypothese, 'lent');
      assert.equal(f.experience.conclusion, 'surpris');
      assert.deepEqual(f.experience.mesures.court, [12, 13, 11], 'la liste de mesures la plus remplie');
      assert.deepEqual(f.experience.mesures.long, [20, 21, 19]);
      assert.deepEqual(f.experience.verifs, ['hauteur', 'papier', 'trombone']);
      assert.ok(!('etages' in f) && !('intro' in f), 'rien du zoom ne s ajoute');
    }
    assert.deepEqual(impl('helicopteres', ipadH, {}), ipadH);
  });
  test(`${nom} : hélicoptères, les tampons du vol en 3D (champ facultatif) se réunissent`, () => {
    const a = { ...JSON.parse(JSON.stringify(ipadH)), vol3d: { missions: { decoller: '2026-11-08', tour: '2026-11-08' } } };
    const b = { ...JSON.parse(JSON.stringify(iphoneH)), vol3d: { missions: { decoller: '2026-11-07', poser: '2026-11-09' } } };
    for (const [x, y] of [[a, b], [b, a]]) {
      const f = impl('helicopteres', JSON.parse(JSON.stringify(x)), JSON.parse(JSON.stringify(y)));
      assert.deepEqual(f.vol3d.missions, { decoller: '2026-11-07', poser: '2026-11-09', tour: '2026-11-08' });
    }
    const f = impl('helicopteres', JSON.parse(JSON.stringify(ipadH)), JSON.parse(JSON.stringify(b)));
    assert.deepEqual(f.vol3d.missions, b.vol3d.missions, 'un appareil sans vol 3D ne fait rien perdre');
    assert.ok(!('vol3d' in impl('helicopteres', JSON.parse(JSON.stringify(ipadH)), JSON.parse(JSON.stringify(iphoneH)))), 'sans vol 3D, le champ n apparaît pas');
  });
}
