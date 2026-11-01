'use strict';
/* Le portail en cahiers (D-19) : catalogue, choix du « Today », semaine, lecture prudente des résumés. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const racine = path.join(__dirname, '..');
function charger(fichiers) {
  const contexte = { console, Date, JSON, Math, Set, Map, Array, Object, Number, String };
  contexte.globalThis = contexte;
  vm.createContext(contexte);
  fichiers.forEach(f => vm.runInContext(fs.readFileSync(path.join(racine, f), 'utf8'), contexte));
  return contexte;
}
const g = charger(['commun/textes.js', 'commun/modules.js', 'commun/portail.js']);
const P = g.Portail;

const du = (des, nature, minutes = 5) => ({ des, nature, minutes, phrase: { en: 'x', fr: 'x' } });
const mod = (id, matiere, resume, etat = 'actif') => ({ id, matiere, etat, resume: P.nettoyerResume(resume) });
const res = (d, jours = []) => ({ version: 1, ecritLe: '2026-11-01T08:00:00Z', progres: null, du: d, jours, parent: '' });
const JOUR = '2026-11-04';
const ici = x => JSON.parse(JSON.stringify(x)); // tableaux du contexte vm ramenés ici, pour deepEqual
const ids = plan => ici(plan.activites.map(m => m.id));

test('catalogue : chaque module a une matière connue, une icône du sprite, des titres dans les deux langues', () => {
  const sprite = fs.readFileSync(path.join(racine, 'commun/kit.js'), 'utf8');
  const matieres = ici(g.Matieres.map(m => m.id));
  assert.deepEqual(matieres, ['maths', 'francais', 'hg', 'sciences', 'anglais']);
  g.Matieres.forEach(m => {
    assert.ok(sprite.includes(`id="i-${m.icone}"`), `icône ${m.icone}`);
    assert.notEqual(g.Textes.t('mat_' + m.id, null, 'en'), 'mat_' + m.id, `nom de ${m.id}`);
  });
  for (const [id, m] of Object.entries(g.Catalogue)) {
    assert.ok(matieres.includes(m.matiere), `${id} : matière`);
    assert.ok(sprite.includes(`id="i-${m.icone}"`), `${id} : icône ${m.icone}`);
    assert.ok(m.titre.en && m.titre.fr && !/^my /i.test(m.titre.en), `${id} : titres`);
    assert.ok(['actif', 'bientot'].includes(m.etat), `${id} : état`);
    assert.ok(/^[a-z-]+\.html$/.test(m.page), `${id} : page`);
    assert.ok(m.enfants.every(e => ['henri', 'clara'].includes(e)), `${id} : enfants`);
  }
  assert.deepEqual(ici(g.ModulesDe('clara').map(m => m.id)), ['tables', 'cible', 'zoom'], 'le planisphère est à Henri');
  assert.deepEqual(ici(g.ModulesDe('henri').map(m => m.id)), ['tables', 'cible', 'planisphere', 'zoom']);
});

test('Today : les révisions d\'abord, une matière à la fois au premier passage, trois au plus', () => {
  const modules = [
    mod('tables', 'maths', res(du('2026-11-04', 'seance'))),
    mod('calcul', 'maths', res(du('2026-11-02', 'revision', 3))),
    mod('dictee', 'francais', res(du('2026-11-04', 'seance', 6))),
    mod('zoom', 'hg', res(du('2026-11-03', 'decouverte', 4))),
  ];
  // calcul (révision) passe d'abord, puis dictée (seule séance d'une autre matière), puis zoom ; tables attend.
  assert.deepEqual(ids(P.planDuJour(modules, JOUR)), ['calcul', 'dictee', 'zoom']);
  assert.equal(P.planDuJour(modules, JOUR).minutes, 13);
});

test('Today : quinze minutes au plus, le reste attend demain', () => {
  const modules = [
    mod('a', 'maths', res(du('2026-11-04', 'revision', 8))),
    mod('b', 'francais', res(du('2026-11-04', 'revision', 8))),
    mod('c', 'hg', res(du('2026-11-04', 'seance', 6))),
  ];
  assert.deepEqual(ids(P.planDuJour(modules, JOUR)), ['a', 'c']);
});

test('Today : ni ce qui n\'est pas encore dû, ni ce qui est fait aujourd\'hui, ni un module sans résumé ou à venir', () => {
  const modules = [
    mod('demain', 'maths', res(du('2026-11-05', 'revision'))),
    mod('fait', 'francais', res(du('2026-11-04', 'seance'), ['2026-11-04'])),
    mod('sans', 'hg', null),
    mod('bientot', 'sciences', res(du('2026-11-01', 'revision')), 'bientot'),
    mod('libre', 'anglais', res(null)),
  ];
  const plan = P.planDuJour(modules, JOUR);
  assert.deepEqual(ids(plan), []);
  assert.equal(plan.faitAujourdhui, true, 'quelque chose a été fait aujourd\'hui');
  assert.equal(P.planDuJour([modules[0]], JOUR).faitAujourdhui, false);
});

test('semaine : un jour compte dès qu\'un module y a été pratiqué, lundi en tête', () => {
  const modules = [
    mod('tables', 'maths', res(null, ['2026-11-02', '2026-10-30'])),
    mod('zoom', 'hg', res(null, ['2026-11-04'])),
    mod('planisphere', 'hg', null),
  ];
  const s = ici(P.semaine(modules, new Date(2026, 10, 4, 15))); // mercredi 4 novembre 2026
  assert.equal(s.length, 7);
  assert.equal(s[0].jour, '2026-11-02');
  assert.deepEqual(s.map(j => j.fait), [true, false, true, false, false, false, false]);
  assert.deepEqual(s.map(j => j.aujourdhui), [false, false, true, false, false, false, false]);
  assert.equal(s[6].avenir, true);
});

test('résumé : un champ mal formé est ignoré sans faire tomber le reste', () => {
  const r = P.nettoyerResume({
    ecritLe: 'x', progres: { avancement: 3, phrase: { en: 'a', fr: 'a' } },
    du: { des: 'demain', nature: 'revision', minutes: 5 }, jours: ['2026-11-01', 12, 'hier'], parent: 4,
  });
  assert.equal(r.progres.avancement, 1, 'l\'avancement reste entre 0 et 1');
  assert.equal(r.du, null, 'une date illisible : rien n\'est dû');
  assert.deepEqual(ici(r.jours), ['2026-11-01']);
  assert.equal(r.parent, null);
  assert.equal(P.nettoyerResume(null), null);
  assert.equal(P.nettoyerResume([1]), null);
  const d = P.nettoyerResume({ du: { des: '2026-11-01', nature: 'seance', minutes: 40, lien: 'javascript:alert(1)' } }).du;
  assert.equal(d.minutes, 8, 'une durée honnête, de 2 à 8 minutes');
  assert.equal(d.lien, null, 'un lien qui n\'est pas une page du site est ignoré');
});
