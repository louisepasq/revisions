// Tests du déroulé d'une séance : node modules/tables/seance.test.js
const assert = require('assert');
require('./moteur.js');
require('./seance.js');
const T = globalThis.Tables;
const S = globalThis.Seance;

const jour = new Date(2026, 10, 2, 17, 0);
const etat = T.etatNeuf();
assert.ok(S.creer(T.etatNeuf(), jour).questions.length > 0, 'même sans diagnostic, une séance existe');
const diag = T.questionsDiagnostic().map(x => ({ a: x.a, b: x.b, juste: T.familleDuFait(x.a, x.b) <= 1, ms: 2500 }));
T.appliquerDiagnostic(etat, diag, new Date(2026, 10, 1, 17, 0));
const s = S.creer(etat, jour);
const total = s.questions.length;
assert.ok(total >= 10, 'après le diagnostic, la séance est pleine : ' + total);

const q1 = S.courante(s);
const rang = { gris: 0, bronze: 1, argent: 2, or: 3 };
const avant = T.couleur(etat, q1.a, q1.b);
const r1 = S.repondre(s, etat, q1.reponse, 1500, jour);
assert.strictEqual(r1.juste, true);
assert.strictEqual(r1.rapide, true);
assert.strictEqual(s.montees.length, rang[T.couleur(etat, q1.a, q1.b)] > rang[avant] ? 1 : 0, 'une case qui change de couleur vers le haut est comptée');
S.suivante(s);

const q2 = S.courante(s);
const r2 = S.repondre(s, etat, q2.reponse + 1, 4000, jour);
assert.strictEqual(r2.juste, false);
assert.strictEqual(r2.bonne, q2.a * q2.b);
assert.ok(r2.astuce.length > 0);
assert.strictEqual(s.questions.length, total + 1, 'la question ratée revient');
assert.strictEqual(S.avancement(s).total, total, 'le compteur ne grandit pas avec la question qui revient');
assert.ok(r2.correction.phrase.length > 0);
assert.strictEqual(S.correction({ type: 'multiple', a: 6, b: 8, nombre: 49, reponse: false }).reponse, 'Non');
assert.strictEqual(S.correction({ type: 'manquant', a: 7, b: 8, reponse: 8 }).reponse, '8');
assert.strictEqual(s.questions[s.index + 4].retour, true, 'elle revient trois questions plus loin');
assert.strictEqual(S.suivante(s), q2, 'tant qu elle n est pas retapée, on reste dessus');
assert.strictEqual(S.retaper(s, q2.reponse + 1), false);
assert.strictEqual(S.retaper(s, q2.reponse), true);
assert.notStrictEqual(S.suivante(s), q2);

while (!S.finie(s)) {
  const q = S.courante(s);
  S.repondre(s, etat, q.reponse, 2000, jour);
  S.suivante(s);
}
const b = S.bilan(s, etat, jour);
assert.strictEqual(b.reponses, total + 1);
assert.strictEqual(b.justes, total);
assert.ok(b.montees.length >= 1);
assert.ok(b.semaine.find(x => x.aujourdhui).fait);
assert.strictEqual(b.demain !== null, true, 'des faits reviennent demain');

// Décomposition (point 5) : la réponse est créditée au résultat que l'enfant a réellement donné.
const e2 = T.etatNeuf();
e2.faits['3x8'] = { boite: 2, vu: true, prochain: '2026-11-02', justesJours: [], erreurs: 0, dernierTemps: null };
const s2 = { questions: [{ type: 'decomposition', a: 3, b: 8, produit: 24, reponse: [3, 8] }], index: 0, aRetaper: null, justes: 0, reponses: 0, montees: [], revues: new Set(), multiple: 'un multiple de' };
assert.strictEqual(S.repondre(s2, e2, [4, 6], 1500, jour).juste, true);
assert.ok(e2.faits['4x6'] && e2.faits['4x6'].vu, '4 × 6 est crédité');
assert.strictEqual(e2.faits['3x8'].boite, 2, '3 × 8 ne bouge pas');
assert.strictEqual(s2.montees[0].a, 4);
const s3 = Object.assign({}, s2, { questions: [{ type: 'decomposition', a: 3, b: 8, produit: 24, reponse: [3, 8] }], revues: new Set(), montees: [] });
assert.strictEqual(S.repondre(s3, e2, [1, 24], 1500, jour).juste, false, '1 × 24 n est pas une décomposition des tables');

// Question « multiple » (point 11) : la correction reprend la formulation de l'enfant.
assert.ok(/n'est pas dans la table de 6/.test(S.correction({ type: 'multiple', a: 6, b: 8, nombre: 49, reponse: false }, 'dans la table de').phrase));
assert.ok(/n'est pas un multiple de 6/.test(S.correction({ type: 'multiple', a: 6, b: 8, nombre: 49, reponse: false }).phrase));
assert.strictEqual(S.creer(T.etatNeuf(), jour, undefined, { multiple: 'dans la table de' }).multiple, 'dans la table de');

console.log('séance : tous les tests passent');
