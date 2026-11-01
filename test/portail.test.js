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

/* ---------- D-22 : plafond sur la journée, découvertes, jeu libre, séance finie ---------- */
const fini = (jour, nature = 'seance', minutes = 5) => ({ jour, nature, minutes });
// Un résumé publié depuis D-22 : il porte `fini` (null tant qu'aucune séance n'est finie).
const res2 = (d, f = null, jours = []) => Object.assign(res(d, jours), { fini: f });
const modD = (id, matiere, resume, extra = {}) => Object.assign(mod(id, matiere, resume), { decouvrable: true }, extra);

test('Today (D-22, point 1) : plus de trois modules dus, ce qui est fini aujourd\'hui garde sa place, puis « All done »', () => {
  const dus = [
    modD('a', 'maths', res2(du('2026-11-04', 'revision'))),
    modD('b', 'francais', res2(du('2026-11-04', 'revision'))),
    modD('c', 'hg', res2(du('2026-11-04', 'seance'))),
    modD('d', 'sciences', res2(du('2026-11-04', 'seance'))),
    modD('e', 'anglais', res2(du('2026-11-03', 'seance'))),
  ];
  // Le matin : trois au plus, le reste attend demain.
  assert.deepEqual(ids(P.planDuJour(dus, JOUR)), ['a', 'b', 'e']);
  // a et b finis aujourd'hui : leur séance de demain est publiée, et ils gardent leur place.
  const apres2 = dus.map(m => (['a', 'b'].includes(m.id) ? modD(m.id, m.matiere, res2(du('2026-11-05', 'revision'), fini(JOUR), [JOUR])) : m));
  const plan2 = P.planDuJour(apres2, JOUR);
  assert.deepEqual(ids(plan2), ['e'], 'une seule place reste, pas trois nouvelles');
  assert.equal(plan2.finis, 2);
  // e fini aussi : le plafond de la journée est atteint, c et d attendent demain.
  const apres3 = apres2.map(m => (m.id === 'e' ? modD('e', 'anglais', res2(du('2026-11-05', 'seance'), fini(JOUR), [JOUR])) : m));
  const plan3 = P.planDuJour(apres3, JOUR);
  assert.deepEqual(ids(plan3), [], '« All done. See you tomorrow! »');
  assert.equal(plan3.faitAujourdhui, true);
  // Les minutes aussi se comptent sur la journée : 8 + 5 déjà faites, une séance de 5 ne rentre plus.
  const minutes = [
    modD('x', 'maths', res2(du('2026-11-05', 'revision'), fini(JOUR, 'revision', 8), [JOUR])),
    modD('y', 'francais', res2(du('2026-11-05', 'seance'), fini(JOUR, 'seance', 5), [JOUR])),
    modD('z', 'hg', res2(du('2026-11-04', 'seance', 5))),
  ];
  assert.deepEqual(ids(P.planDuJour(minutes, JOUR)), []);
});

test('Today (D-22, point 10) : une réponse sans séance finie ne fait pas sortir le module', () => {
  // Le module a été pratiqué (jours) mais sa séance n'est pas finie (fini d'hier) : il reste dû.
  const m = modD('tables', 'maths', res2(du('2026-11-04', 'seance'), fini('2026-11-03'), ['2026-11-03', JOUR]));
  const plan = P.planDuJour([m], JOUR);
  assert.deepEqual(ids(plan), ['tables']);
  assert.equal(plan.finis, 0);
  // Un résumé d'avant D-22 (sans `fini`) retombe sur l'ancienne règle : pratiqué aujourd'hui, il est fait.
  assert.deepEqual(ids(P.planDuJour([modD('tables', 'maths', res(du('2026-11-04', 'seance'), [JOUR]))], JOUR)), []);
});

test('Today (D-22, points 2 et 3) : un module jamais ouvert est une découverte « New! », une seule par jour, pas le planisphère', () => {
  const premierJour = [
    modD('tables', 'maths', null),
    modD('zoom', 'hg', null),
    mod('planisphere', 'hg', null), // pas d'`objet` : il ne sait pas publier de résumé
  ];
  const plan = P.planDuJour(premierJour, JOUR);
  assert.deepEqual(ids(plan), ['tables'], 'une seule découverte, dans l\'ordre du catalogue');
  assert.equal(plan.activites[0].nouveau, true);
  assert.equal(plan.activites[0].du.nature, 'decouverte');
  assert.equal(plan.activites[0].du.minutes, 5);
  assert.equal(plan.minutes, 5);
  // Le lendemain, les tables sont découvertes : le voyage arrive à son tour.
  const deuxieme = [modD('tables', 'maths', res2(du('2026-11-05', 'seance'), fini('2026-11-04', 'decouverte'))), premierJour[1], premierJour[2]];
  assert.deepEqual(ids(P.planDuJour(deuxieme, '2026-11-05')), ['tables', 'zoom']);
  // La découverte du jour est déjà faite : aucune autre ne s'ajoute, même s'il reste de la place.
  assert.deepEqual(ids(P.planDuJour(deuxieme, '2026-11-04')), []);
  // Une découverte publiée par le module (le grand voyage) compte aussi comme découverte.
  const deux = [modD('a', 'maths', res2(du('2026-11-04', 'decouverte'))), modD('b', 'hg', res2(du('2026-11-04', 'decouverte')))];
  assert.deepEqual(ids(P.planDuJour(deux, JOUR)), ['a']);
  assert.equal(P.planDuJour(deux, JOUR).activites[0].nouveau, false, 'un module qui a déjà un résumé n\'est pas « New! »');
});

test('Today (D-22, point 6) : un jeu libre jamais ouvert, au plus deux fois par semaine ; découvert, hors du « Today »', () => {
  const LUNDI = '2026-11-02';
  const MERCREDI = '2026-11-04';
  const JEUDI = '2026-11-05';
  const cible = r => modD('cible', 'maths', r, { libre: true });
  // Jamais ouvert : proposé le lundi et le jeudi seulement.
  const semaine = ['2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06', '2026-11-07', '2026-11-08'];
  const jours = semaine.filter(j => ids(P.planDuJour([cible(null)], j)).length);
  assert.deepEqual(jours, [LUNDI, JEUDI], 'au plus deux fois par semaine');
  assert.equal(P.planDuJour([cible(null)], LUNDI).activites[0].nouveau, true);
  // Ouvert sans cible atteinte : encore une découverte, toujours deux jours par semaine.
  const ouvert = cible(res2(du(MERCREDI, 'decouverte')));
  assert.deepEqual(ids(P.planDuJour([ouvert], MERCREDI)), []);
  assert.deepEqual(ids(P.planDuJour([cible(res2(du(JEUDI, 'decouverte')))], JEUDI)), ['cible']);
  // Un jeu libre passe après les autres découvertes : les tables d'abord.
  assert.deepEqual(ids(P.planDuJour([cible(null), modD('tables', 'maths', null)], LUNDI)), ['tables']);
  // Découvert (une cible atteinte) : du à null, plus jamais dans le « Today ».
  const decouvert = cible(res2(null, fini('2026-10-20', 'decouverte'), ['2026-10-20']));
  semaine.forEach(j => assert.deepEqual(ids(P.planDuJour([decouvert], j)), []));
  // Joué librement aujourd'hui : il ne prend pas de place dans le plafond.
  const joue = cible(res2(null, fini('2026-10-20', 'decouverte'), ['2026-10-20', MERCREDI]));
  const autres = [
    modD('a', 'maths', res2(du(MERCREDI, 'revision'))),
    modD('b', 'francais', res2(du(MERCREDI, 'revision'))),
    modD('c', 'hg', res2(du(MERCREDI, 'revision'))),
  ];
  assert.deepEqual(ids(P.planDuJour([joue, ...autres], MERCREDI)), ['a', 'b', 'c']);
  // Le jour de sa découverte, la partie gagnée garde sa place : rien de nouveau n'apparaît après.
  const decouvreAuj = cible(res2(null, fini(JEUDI, 'decouverte'), [JEUDI]));
  const plan = P.planDuJour([decouvreAuj, ...autres.slice(0, 2), modD('zoom', 'hg', null)].map(m => (m.resume && m.resume.du ? modD(m.id, m.matiere, res2(du(JEUDI, 'revision'))) : m)), JEUDI);
  // Les maths sont déjà vues (la cible) : le français passe d'abord au premier passage.
  assert.deepEqual(ids(plan), ['b', 'a'], 'la découverte du jour est faite : le voyage attend demain');
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
  // `fini` (D-22) : absent d'un ancien résumé (undefined), null s'il n'y a rien, ignoré s'il est mal formé.
  assert.equal(P.nettoyerResume({ jours: [] }).fini, undefined);
  assert.equal(P.nettoyerResume({ fini: null }).fini, null);
  assert.equal(P.nettoyerResume({ fini: { jour: 'hier' } }).fini, null);
  assert.deepEqual(ici(P.nettoyerResume({ fini: { jour: '2026-11-04', nature: 'x', minutes: 50 } }).fini), { jour: '2026-11-04', nature: 'seance', minutes: 8 });
});
