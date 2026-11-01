'use strict';
/* Aucune version ne fait perdre une progression (règle du CLAUDE.md du dépôt).
   test/fixtures/2026-11-01_progression-henri.json est l'état qu'enregistrait la version d'avant D-21
   (fabriqué avec le code du commit d'avant, par de vraies séances : diagnostic et tampons des tables,
   boîtes et étapes du voyage, parties du nombre cible). Le code d'aujourd'hui doit le relire tel quel,
   sous les mêmes clés, et le choix de langue du voyage (champ facultatif) ne doit rien effacer. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const serveur = require('../lib/fusion');

const racine = path.join(__dirname, '..');
const ENREGISTRE = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/2026-11-01_progression-henri.json'), 'utf8'));
const lu = cle => JSON.parse(ENREGISTRE[cle]);

/* Les modules chargés comme dans le navigateur, sur un stockage qui contient l'état enregistré. */
function navigateur() {
  const stock = Object.assign({}, ENREGISTRE);
  const localStorage = { getItem: k => (k in stock ? stock[k] : null), setItem: (k, v) => { stock[k] = String(v); } };
  const contexte = { console, localStorage, setTimeout, clearTimeout };
  contexte.globalThis = contexte;
  vm.createContext(contexte);
  ['commun/textes.js', 'modules/tables/moteur.js', 'modules/zoom/contenu.js', 'modules/zoom/moteur.js',
    'modules/cible/moteur.js', 'modules/cible/etat.js', 'commun/sync.js']
    .forEach(f => vm.runInContext(fs.readFileSync(path.join(racine, f), 'utf8'), contexte));
  return { g: contexte, stock };
}
const copie = o => JSON.parse(JSON.stringify(o));

test('les clés de stockage ne changent pas', () => {
  assert.deepEqual(Object.keys(ENREGISTRE).sort(), ['henri.cible', 'henri.tables', 'henri.zoom']);
  const { g } = navigateur();
  assert.equal(g.Zoom.MODULE, 'zoom');
});

test('tables : boîtes, tampons, jours et diagnostic relus intacts', () => {
  const { g } = navigateur();
  const avant = lu('henri.tables');
  const apres = copie(g.Tables.charger('henri'));
  assert.deepEqual(apres, avant);
  assert.ok(Object.values(apres.faits).some(f => (f.tampons || []).length >= 3), 'la fixture porte des tampons');
});

test('voyage : boîtes, jours et étapes relus intacts ; sans langue, le choix sera proposé', () => {
  const { g, stock } = navigateur();
  const avant = lu('henri.zoom');
  const etat = g.Zoom.charger('henri');
  assert.deepEqual(copie(etat), avant);
  assert.equal(etat.langue, undefined, 'un état sans langue se charge sans en inventer une');
  // L'enfant choisit le français : seul le champ langue s'ajoute.
  etat.langue = 'fr';
  g.Zoom.sauver('henri', etat);
  const relu = JSON.parse(stock['henri.zoom']);
  assert.equal(relu.langue, 'fr');
  delete relu.langue;
  assert.deepEqual(relu, avant);
});

test('nombre cible : compteurs, jours et parties relus intacts', () => {
  const { g } = navigateur();
  assert.deepEqual(copie(g.CibleEtat.charger('henri')), lu('henri.cible'));
});

test('sauvegarde en ligne : un état d avant la langue et un état d après se fusionnent sans perte', () => {
  const { g } = navigateur();
  const ancien = lu('henri.zoom');
  const nouveau = Object.assign(copie(ancien), { langue: 'en' });
  for (const fusion of [serveur.fusionner, g.Sync.fusionner]) {
    for (const [a, b] of [[ancien, nouveau], [nouveau, ancien]]) {
      const f = copie(fusion('zoom', copie(a), copie(b)));
      assert.equal(f.langue, 'en', 'le choix de langue survit à la fusion');
      assert.deepEqual(f.cartes, ancien.cartes);
      assert.deepEqual(f.jours, ancien.jours);
      assert.equal(f.etages, ancien.etages);
      assert.equal(f.intro, true);
    }
    const t = copie(fusion('tables', lu('henri.tables'), lu('henri.tables')));
    assert.deepEqual(t.faits, lu('henri.tables').faits);
  }
});
