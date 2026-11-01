// Tests de l'état et du résumé du nombre cible : node modules/cible/etat.test.js
const assert = require('assert');
globalThis.window = undefined;
require('../../commun/textes.js');
require('./moteur.js');
require('./contenu.js');
require('./etat.js');
const E = globalThis.CibleEtat;
const CC = globalThis.CibleContenu;
const C = globalThis.Cible;

const lundi = new Date(2026, 10, 2, 17, 0); // lundi 2 novembre 2026
const jeudi = new Date(2026, 10, 5, 17, 0);

// Un enfant qui n'a jamais joué : rien de dû, une invitation, aucun jour.
const neuf = E.etatNeuf();
let r = E.resume(neuf, lundi);
assert.strictEqual(r.progres.avancement, null);
assert.strictEqual(r.progres.jour, '2026-11-02');
assert.strictEqual(r.progres.aujourdhui, null);
assert.strictEqual(r.du, null);
assert.deepStrictEqual(r.jours, []);
assert.ok(r.progres.phrase.en && r.progres.phrase.fr);
assert.ok(/pas encore commencé/.test(r.parent));

// Deux parties gagnées le lundi, une le jeudi (coup parfait, un indice).
const e = E.etatNeuf();
E.commencer(e);
E.gagner(e, { cible: 10, nombres: [5, 2, 1, 3, 7], score: 1, meilleur: 13, indices: 0 }, lundi);
E.commencer(e);
E.gagner(e, { cible: 24, nombres: [2, 3, 4, 6, 12], score: 13, meilleur: 13, indices: 0, parfait: true }, lundi);
E.commencer(e);
E.gagner(e, { cible: 47, nombres: [1, 2, 3, 4, 5], score: 5, meilleur: 8, indices: 1 }, jeudi);
assert.deepStrictEqual(e.jours, ['2026-11-02', '2026-11-05'], 'un jour joué ne compte qu\'une fois');
assert.strictEqual(e.gagnees, 3);
assert.strictEqual(e.parfaits, 1);
assert.strictEqual(e.meilleurs, 1, 'le meilleur score sans indice');
assert.strictEqual(e.indices, 1);

r = E.resume(e, jeudi);
assert.deepStrictEqual(r.progres.phrase, { en: '3 targets hit', fr: '3 cibles atteintes' });
assert.deepStrictEqual(r.progres.aujourdhui, { en: '1 target today', fr: "1 cible aujourd'hui" });
assert.deepStrictEqual(r.jours, ['2026-11-02', '2026-11-05']);
for (const l of ['en', 'fr']) assert.ok(r.progres.phrase[l].length <= 28 && r.progres.aujourdhui[l].length <= 28, 'phrases du portail courtes');
assert.ok(/3 cibles atteintes en 2 jours, dont 1 coup parfait\. 1 indice pris\. Dernière partie : 5 points sur 8 possibles\./.test(r.parent), r.parent);
assert.ok(!/Henri|Clara/.test(r.parent), 'aucune comparaison entre enfants');

// Les jours du résumé : les quatorze derniers, pas plus.
e.jours = ['2026-10-01', '2026-10-22', '2026-10-23', '2026-11-05'];
assert.deepStrictEqual(E.resume(e, jeudi).jours, ['2026-10-23', '2026-11-05']);

// La semaine : lundi fait, jeudi aujourd'hui, vendredi à venir.
const s = E.joursDeLaSemaine(e, jeudi);
assert.strictEqual(s.length, 7);
assert.ok(s[3].aujourdhui && s[3].fait && s[4].avenir && !s[0].fait);

// On garde au plus trente parties.
for (let i = 0; i < 40; i++) E.gagner(e, { cible: 20, nombres: [1, 2, 3, 4, 5], score: 2, meilleur: 13, indices: 0 }, jeudi);
assert.strictEqual(e.dernieres.length, 30);

// Un état abîmé se relit en état neuf.
assert.deepStrictEqual(E.normaliser(null), E.etatNeuf());
assert.deepStrictEqual(E.normaliser({ jours: 'x' }).jours, []);

// Contenu (D-21) : chaque refus a sa phrase dite et son affichage, en anglais et en français, sans
// accolade ni tiret cadratin ; l'anglais est la langue par défaut.
assert.strictEqual(CC.de('xx'), CC.LANGUES.en);
assert.strictEqual(CC.DIT, CC.LANGUES.en.DIT);
for (const [a, op, b] of [[3, '−', 8], [5, '−', 5], [17, '÷', 5], [3, '÷', 8], [9, '÷', 1]]) {
  assert.strictEqual(C.calculer(a, op, b), null, `${a} ${op} ${b} est refusé par le moteur`);
  const raison = CC.refus(a, op, b);
  for (const l of ['en', 'fr']) assert.ok(CC.de(l).DIT[raison] && CC.de(l).AFFICHE[raison](a, b), l + ' ' + raison);
}
for (const l of ['en', 'fr']) {
  assert.deepStrictEqual(Object.keys(CC.LANGUES[l].DIT).sort(), Object.keys(CC.LANGUES.en.DIT).sort(), l + ' : mêmes phrases');
  const toutes = JSON.stringify(Object.values(CC.LANGUES[l].DIT).map(d => (typeof d === 'function' ? d(47) : d)));
  assert.ok(!toutes.includes('{') && !toutes.includes(String.fromCharCode(0x2014)), l);
}
assert.strictEqual(CC.refus(3, '−', 8), 'negatif');
assert.strictEqual(CC.refus(5, '−', 5), 'zero');
assert.strictEqual(CC.refus(9, '÷', 1), 'parUn');
assert.strictEqual(CC.refus(3, '÷', 8), 'divisionPlusGrand');
assert.strictEqual(CC.refus(17, '÷', 5), 'division');
const tout = JSON.stringify(Object.values(CC.DIT).map(d => (typeof d === 'function' ? d(47) : d)));
assert.ok(!tout.includes('{') && !tout.includes(String.fromCharCode(0x2014)));

console.log('état du nombre cible : tous les tests passent');
