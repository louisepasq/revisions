// Tests du moteur des tables : node modules/tables/moteur.test.js
const assert = require('assert');
require('./moteur.js');
const T = globalThis.Tables;

const lundi = new Date(2026, 10, 2, 17, 0);
const plus = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n, 17, 0);

// Astuces (relecture du 01/11/2026, point 6) : ×9 par ×10 dès 3, carrés avec une méthode,
// ×5 dans la même forme que les autres, facteurs dans l'ordre de la question.
assert.strictEqual(T.astuce(7, 8), '7 × 4 = 28, et le double de 28, c\'est 56.');
assert.strictEqual(T.astuce(8, 7), '4 × 7 = 28, et le double de 28, c\'est 56.');
assert.strictEqual(T.astuce(4, 9), '4 × 10 = 40, moins 4 : 36.', 'le ×9 passe par le ×10, comme Eduscol');
assert.strictEqual(T.astuce(6, 9), '6 × 10 = 60, moins 6 : 54.');
assert.strictEqual(T.astuce(9, 8), '10 × 8 = 80, moins 8 : 72.');
assert.strictEqual(T.astuce(9, 2), '9 × 2, c\'est le double de 9 : 18.');
assert.strictEqual(T.astuce(6, 7), '3 × 7 = 21, et le double de 21, c\'est 42.', 'l enfant retrouve le 7 de sa question');
assert.strictEqual(T.astuce(7, 7), '7 × 7, c\'est un carré. 7 × 5 = 35, plus 7 × 2 = 14 : 49.');
assert.strictEqual(T.astuce(6, 6), '6 × 6, c\'est un carré. 6 × 5 = 30, plus 6 : 36.');
assert.strictEqual(T.astuce(8, 8), '8 × 8, c\'est un carré. 8 × 4 = 32, et le double de 32, c\'est 64.');
assert.strictEqual(T.astuce(10, 5), '10 × 5, c\'est 5 dizaines : 50.');
assert.strictEqual(T.astuce(3, 5), '3 × 10 = 30, et la moitié de 30, c\'est 15.');
for (let a = 1; a <= 10; a++) for (let b = 1; b <= 10; b++) {
  assert.ok(!/repères/.test(T.astuce(a, b)), 'plus de « repères » : ' + a + 'x' + b);
}
const avecCarre = T.etatNeuf();
avecCarre.faits['7x7'] = { boite: 4, vu: true, justesJours: [] };
assert.strictEqual(T.astuce(8, 7, avecCarre), '7 × 7 = 49, plus 7 : 56.', 'quand 7 × 7 est su, 7 × 8 passe par lui');
assert.strictEqual(T.astuce(8, 7, T.etatNeuf()), '4 × 7 = 28, et le double de 28, c\'est 56.');

// Les cent astuces restent arithmétiquement exactes : chaque calcul cité est recalculé.
function verifierAstuce(a, b, texte) {
  const p = a * b;
  assert.ok(texte.endsWith(p + '.'), `${a} × ${b} : l'astuce finit par ${p} (${texte})`);
  for (const m of texte.matchAll(/(\d+) × (\d+) = (\d+)/g)) assert.strictEqual(+m[1] * +m[2], +m[3], texte);
  for (const m of texte.matchAll(/le double de (\d+), c'est (\d+)/gi)) assert.strictEqual(+m[1] * 2, +m[2], texte);
  for (const m of texte.matchAll(/la moitié de (\d+), c'est (\d+)/g)) assert.strictEqual(+m[1] / 2, +m[2], texte);
  for (const m of texte.matchAll(/= (\d+), moins (\d+) : (\d+)/g)) assert.strictEqual(+m[1] - +m[2], +m[3], texte);
  for (const m of texte.matchAll(/= (\d+), plus (\d+) : (\d+)/g)) assert.strictEqual(+m[1] + +m[2], +m[3], texte);
  for (const m of texte.matchAll(/= (\d+), plus \d+ × \d+ = (\d+) : (\d+)/g)) assert.strictEqual(+m[1] + +m[2], +m[3], texte);
  for (const m of texte.matchAll(/c'est (\d+), plus (\d+) : (\d+)/g)) assert.strictEqual(+m[1] + +m[2], +m[3], texte);
  for (const m of texte.matchAll(/c'est (\d+) dizaines : (\d+)/g)) assert.strictEqual(+m[1] * 10, +m[2], texte);
}
for (let a = 1; a <= 10; a++) for (let b = 1; b <= 10; b++) {
  verifierAstuce(a, b, T.astuce(a, b));
  verifierAstuce(a, b, T.astuce(a, b, avecCarre));
}

assert.strictEqual(T.familleDuFait(7, 8), 2);
assert.strictEqual(T.familleDuFait(7, 7), 5);
assert.strictEqual(T.familleDuFait(9, 2), 1);

let e = T.etatNeuf();
assert.strictEqual(T.couleur(e, 7, 8), 'gris');
T.enregistrer(e, 7, 8, false, 5000, lundi);
assert.strictEqual(e.faits['7x8'].boite, 1);
assert.strictEqual(T.couleur(e, 7, 8), 'bronze');
T.enregistrer(e, 7, 8, true, 2000, lundi);
assert.strictEqual(e.faits['7x8'].boite, 2, 'une bonne réponse rapide monte d une boîte');
T.enregistrer(e, 7, 8, true, 2000, lundi);
assert.strictEqual(e.faits['7x8'].boite, 2, 'pas deux montées le même jour');
T.enregistrer(e, 7, 8, true, 2000, plus(lundi, 2));
T.enregistrer(e, 7, 8, true, 2000, plus(lundi, 6));
assert.strictEqual(e.faits['7x8'].boite, 4);
assert.strictEqual(T.couleur(e, 7, 8), 'or');
T.enregistrer(e, 7, 8, true, 6000, plus(lundi, 13));
assert.strictEqual(e.faits['7x8'].boite, 4, 'une réponse lente ne fait pas monter au-delà de 2');
T.enregistrer(e, 7, 8, false, 1500, plus(lundi, 34));
assert.strictEqual(e.faits['7x8'].boite, 1, 'une erreur redescend en boîte 1');

e = T.etatNeuf();
const s = T.seance(e, lundi);
assert.ok(s.length > 0 && s.length <= T.TAILLE_SEANCE);
assert.ok(s.every(q => T.familleDuFait(q.a, q.b) === 0), 'au départ, seule la famille des faciles est ouverte');
assert.ok(s.every(q => q.type === 'produit'), 'les nouveaux faits sont posés en produit');

const q = T.question({ faits: { '6x8': { boite: 3 } } }, 6, 8, 2);
assert.strictEqual(q.type, 'manquant');
assert.ok(T.verifier(q, 8));
const d = T.question({ faits: { '6x8': { boite: 3 } } }, 6, 8, 4);
assert.strictEqual(d.type, 'decomposition');
assert.ok(T.verifier(d, [6, 8]) && T.verifier(d, [8, 6]) && !T.verifier(d, [5, 9]));
// Décomposition (point 5) : « 1 × 48 » et « 4 × 12 » ne passent pas, ils relancent sans erreur.
assert.ok(!T.verifier(d, [1, 48]) && !T.verifier(d, [48, 1]) && !T.verifier(d, [4, 12]));
assert.strictEqual(T.relanceDecomposition(d, [1, 48]), 'sans1');
assert.strictEqual(T.relanceDecomposition(d, [48, 1]), 'sans1');
assert.strictEqual(T.relanceDecomposition(d, [4, 12]), 'jusqua10');
assert.strictEqual(T.relanceDecomposition(d, [6, 8]), null);
assert.strictEqual(T.relanceDecomposition(d, [5, 9]), null, 'un produit faux est une erreur, pas une relance');
const m = T.question({ faits: { '6x8': { boite: 3 } } }, 6, 8, 6);
assert.strictEqual(m.type, 'multiple');
assert.strictEqual(m.reponse, m.nombre % 6 === 0);
assert.ok(/un multiple de 6/.test(m.texte), 'formulation d Eduscol');
// Question « multiple » (point 11) : le leurre n'est pas toujours le produit plus 1, et n'est jamais un multiple.
const leurres = new Set();
for (let a = 2; a <= 9; a++) for (let b = 2; b <= 9; b++) for (let k = 0; k < 6; k++) {
  const qm = T.question({ faits: { [T.cle(a, b)]: { boite: 3 } } }, a, b, 14 * k + 13);
  if (qm.type !== 'multiple') continue;
  if (qm.reponse === false) { assert.ok(qm.nombre % a !== 0 && qm.nombre > 1 && qm.nombre <= 100); leurres.add(qm.nombre - a * b); }
}
assert.ok(leurres.size >= 3, 'des leurres variés : ' + [...leurres].join(', '));
// Un facteur 1 ne donne jamais de décomposition ni de question « multiple ».
for (let i = 0; i < 7; i++) assert.strictEqual(T.question({ faits: { '1x7': { boite: 3 } } }, 1, 7, i).type, 'produit');

e = T.etatNeuf();
T.enregistrer(e, 6, 7, true, 4500, lundi);
T.enregistrer(e, 6, 7, true, 4500, plus(lundi, 1));
T.enregistrer(e, 6, 7, true, 4500, plus(lundi, 3));
assert.strictEqual(e.faits['6x7'].boite, 3, 'juste mais lent : on monte jusqu à Presque');
T.enregistrer(e, 6, 7, true, 4500, plus(lundi, 7));
assert.strictEqual(e.faits['6x7'].boite, 3, 'l or demande la rapidité');

const premiers = T.questionsDiagnostic().slice(0, 6).map(x => T.familleDuFait(x.a, x.b));
assert.deepStrictEqual(premiers, [0, 1, 2, 3, 4, 5], 'le diagnostic visite toutes les familles dès le premier tour');

e = T.etatNeuf();
const diag = T.questionsDiagnostic();
assert.ok(diag.length >= 20);
const rep = diag.map(x => ({ a: x.a, b: x.b, juste: T.familleDuFait(x.a, x.b) <= 2, ms: 2500 }));
const r = T.appliquerDiagnostic(e, rep, lundi);
assert.strictEqual(r.familles, 4, 'faciles, doubles et 4-8 réussis : la famille 3-6 s ouvre');
assert.strictEqual(T.couleur(e, diag[0].a, diag[0].b), 'argent');
T.enregistrer(e, diag[0].a, diag[0].b, true, 1000, lundi);
assert.strictEqual(T.couleur(e, diag[0].a, diag[0].b), 'argent', 'pas de passage en or le jour même du diagnostic');
assert.strictEqual(T.couleur(e, 1, 7), 'argent', 'les tables de 1 et de 10 sont posées comme acquises');
assert.ok(T.seance(e, lundi).every(q => q.a !== 1 && q.b !== 1), 'pas de 1 × n présenté comme nouveau après le diagnostic');

// Coin parent (point 10) : paires de 2 à 9 seulement, échecs du diagnostic compris, puis les justes mais lents.
e = T.etatNeuf();
T.appliquerDiagnostic(e, [{ a: 7, b: 8, juste: false, ms: null }, { a: 6, b: 7, juste: true, ms: 4500 }, { a: 5, b: 5, juste: true, ms: 1500 }], lundi);
T.enregistrer(e, 1, 4, false, 3000, lundi);
T.enregistrer(e, 9, 6, false, 3000, lundi);
T.enregistrer(e, 9, 6, false, 3000, plus(lundi, 1));
const fr = T.fragiles(e);
assert.deepStrictEqual(fr.rates, ['6 × 9', '7 × 8'], 'ratés de 2 à 9, le plus raté en tête, sans 1 × 4');
assert.deepStrictEqual(fr.lents, ['6 × 7'], 'juste mais lent');
assert.strictEqual(e.faits['7x8'].erreurs, 1, 'un échec au diagnostic compte comme une erreur');
// Grille et accueil comptent sur les mêmes 36 paires.
assert.strictEqual(T.etatsDesPaires(e).length, 36);
e.faits['7x8'] = { boite: 4, vu: true }; e.faits['8x7'] = { boite: 4, vu: true }; e.faits['3x4'] = { boite: 4, vu: true };
assert.strictEqual(T.etatsDesPaires(e).filter(p => p.couleur === 'or').length, T.compteOr(e));

// Voix (décision de Louis du 01/11/2026) : phrases en toutes lettres, jamais le signe ×.
assert.strictEqual(T.enLettres(45), 'quarante-cinq');
assert.strictEqual(T.enLettres(21), 'vingt et un');
assert.strictEqual(T.enLettres(70), 'soixante-dix');
assert.strictEqual(T.enLettres(72), 'soixante-douze');
assert.strictEqual(T.enLettres(81), 'quatre-vingt-un');
assert.strictEqual(T.enLettres(80), 'quatre-vingts');
assert.strictEqual(T.enLettres(90), 'quatre-vingt-dix');
assert.strictEqual(T.enLettres(100), 'cent');
assert.strictEqual(T.faitDit(9, 5), 'neuf fois cinq, quarante-cinq');
assert.strictEqual(T.faitDit(7, 8), 'sept fois huit, cinquante-six');
assert.strictEqual(T.questionDite({ type: 'produit', a: 9, b: 5 }), 'neuf fois cinq');
assert.strictEqual(T.questionDite({ type: 'manquant', a: 7, b: 8 }), 'sept fois combien font cinquante-six ?');
assert.strictEqual(T.questionDite({ type: 'decomposition', a: 6, b: 8, produit: 48 }), 'quarante-huit, c\'est quel produit ?');
assert.strictEqual(T.questionDite({ type: 'multiple', a: 6, b: 8, nombre: 48 }, 'dans la table de'), 'quarante-huit est-il dans la table de six ?');
for (let a = 1; a <= 10; a++) for (let b = 1; b <= 10; b++) assert.ok(!/[×\d]/.test(T.faitDit(a, b)), T.faitDit(a, b));

const sem = T.joursDeLaSemaine({ jours: ['2026-11-02', '2026-11-04'] }, plus(lundi, 4));
assert.deepStrictEqual(sem.map(x => x.fait), [true, false, true, false, false, false, false]);
assert.strictEqual(sem[4].aujourdhui, true);

e = T.etatNeuf();
T.faitsDeFamille(0).forEach(([a, b]) => { e.faits[T.cle(a, b)] = { boite: 3, vu: true }; });
assert.strictEqual(T.majFamilles(e), 2);

console.log('moteur des tables : tous les tests passent');
