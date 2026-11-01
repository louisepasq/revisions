// Tests du moteur du nombre cible : node modules/cible/moteur.test.js
const assert = require('assert');
require('./moteur.js');
const C = globalThis.Cible;

assert.strictEqual(C.calculer(7, '−', 9), null, 'pas de nombre négatif');
assert.strictEqual(C.calculer(9, '÷', 2), null, 'division exacte seulement');
assert.strictEqual(C.calculer(9, '÷', 1), null, 'pas de division par 1, trop facile pour 3 points');
assert.strictEqual(C.calculer(12, '÷', 3), 4);

// L'exemple d'Henri : cible 10, « 5 × 2 = 10 » vaut 1 point.
assert.strictEqual(C.score([{ a: 5, op: '×', b: 2, r: 10 }], 5), 1);
// Coup parfait : les cinq nombres et les quatre opérations, 13 points.
const parfait = [{ op: '+' }, { op: '×' }, { op: '−' }, { op: '÷' }];
assert.strictEqual(C.score(parfait, 5), 13);
assert.strictEqual(C.score([{ op: '−' }, { op: '÷' }], 5), 5);

// Résolution : 2, 3, 4, 6, 12 vers 24 a un coup parfait ? On vérifie au moins la cohérence.
const r = C.resoudre(24, [2, 3, 4, 6, 12]);
assert.ok(r.possible);
let v = null;
for (const e of r.solution) { assert.strictEqual(C.calculer(e.a, e.op, e.b), e.r); v = e.r; }
assert.strictEqual(v, 24, 'la meilleure solution finit sur la cible');
assert.strictEqual(r.meilleur, C.score(r.solution, 5));
assert.ok(r.plusCourte.length >= 1 && r.plusCourte.length <= r.solution.length);

// Coup parfait existant : 1, 2, 3, 4, 5 vers 6 ? ((5 − 3) × 4 ÷ 2) + 1 = 5… on cherche par le solveur.
const p = C.resoudre(9, [1, 2, 3, 4, 8]);
assert.ok(p.possible);
assert.ok(p.meilleur <= 13);

// Tirage reproductible, jouable, cible entre 10 et 99, absente des petits nombres.
const t1 = C.tirer('henri-2026-11-02-1');
const t2 = C.tirer('henri-2026-11-02-1');
assert.deepStrictEqual(t1, t2, 'le même tirage se rejoue');
assert.ok(t1.cible >= 10 && t1.cible <= 99 && !t1.nombres.includes(t1.cible));
assert.strictEqual(t1.nombres.length, 5);
assert.ok(C.resoudre(t1.cible, t1.nombres).possible);
const exigeant = C.tirer('clara-2026-11-02-1', 13);
assert.ok(exigeant && exigeant.meilleur === 13, 'on sait tirer une cible qui admet un coup parfait');

// Une partie : jouer, se tromper de chemin, annuler, prendre un indice, gagner.
const partie = C.nouvellePartie({ cible: 10, nombres: [5, 2, 1, 3, 7], meilleur: 13 });
assert.strictEqual(C.jouer(partie, 'd1', '−', 'd0').ok, false, '2 − 5 est refusé');
assert.ok(C.jouer(partie, 'd0', '+', 'd1').ok, '5 + 2');
assert.ok(C.annuler(partie));
assert.strictEqual(partie.dispo.length, 5, 'les deux nombres reviennent');
const conseil = C.indice(partie);
assert.ok(conseil && C.calculer(conseil.a, conseil.op, conseil.b) === conseil.r);
assert.strictEqual(partie.indices, 1);
const j = C.jouer(partie, 'd0', '×', 'd1');
assert.ok(j.gagnee, '5 × 2 = 10');
assert.strictEqual(C.scorePartie(partie), 1, 'avec un indice, le score ne descend pas sous 1');
const sansIndice = C.nouvellePartie({ cible: 10, nombres: [5, 2, 1, 3, 7], meilleur: 13 });
C.jouer(sansIndice, 'd4', '+', 'd3'); // 7 + 3 = 10
assert.strictEqual(C.scorePartie(sansIndice), 1);

console.log('moteur du nombre cible : tous les tests passent');
