// Tests du moteur des tables : node modules/tables/moteur.test.js
const assert = require('assert');
require('./moteur.js');
const T = globalThis.Tables;

const lundi = new Date(2026, 10, 2, 17, 0);
const plus = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n, 17, 0);

assert.strictEqual(T.astuce(7, 8), '7 × 4 = 28, et le double de 28, c\'est 56.');
assert.strictEqual(T.astuce(8, 7), '7 × 4 = 28, et le double de 28, c\'est 56.');
assert.strictEqual(T.astuce(4, 9), '9 × 2 = 18, et le double de 18, c\'est 36.', '4 × 9 relève de la famille 4-8');
assert.strictEqual(T.astuce(9, 7), '7 × 10 = 70, moins 7 : 63.');
assert.strictEqual(T.astuce(6, 7), '7 × 3 = 21, et le double de 21, c\'est 42.');
assert.strictEqual(T.astuce(7, 7), '7 × 7, c\'est un carré : 49. Les carrés servent de repères.');
assert.strictEqual(T.astuce(3, 5), '3 × 5, c\'est la moitié de 3 × 10 = 30 : 15.');

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
assert.ok(T.verifier(d, [4, 12]) && T.verifier(d, [6, 8]) && !T.verifier(d, [5, 9]));
const m = T.question({ faits: { '6x8': { boite: 3 } } }, 6, 8, 6);
assert.strictEqual(m.type, 'multiple');
assert.strictEqual(m.reponse, m.nombre % 6 === 0);

e = T.etatNeuf();
const diag = T.questionsDiagnostic();
assert.ok(diag.length >= 20);
const rep = diag.map(x => ({ a: x.a, b: x.b, juste: T.familleDuFait(x.a, x.b) <= 2, ms: 2500 }));
const r = T.appliquerDiagnostic(e, rep, lundi);
assert.strictEqual(r.familles, 4, 'faciles, doubles et 4-8 réussis : la famille 3-6 s ouvre');
assert.strictEqual(T.couleur(e, diag[0].a, diag[0].b), 'argent');

const sem = T.joursDeLaSemaine({ jours: ['2026-11-02', '2026-11-04'] }, plus(lundi, 4));
assert.deepStrictEqual(sem.map(x => x.fait), [true, false, true, false, false, false, false]);
assert.strictEqual(sem[4].aujourdhui, true);

e = T.etatNeuf();
T.faitsDeFamille(0).forEach(([a, b]) => { e.faits[T.cle(a, b)] = { boite: 3, vu: true }; });
assert.strictEqual(T.majFamilles(e), 2);

console.log('moteur des tables : tous les tests passent');
