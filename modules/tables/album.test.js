// Tests de l'album à tampons (D-20) : node modules/tables/album.test.js
// Les règles sont vérifiées sur le moteur (enregistrer, seance, migrer), pas seulement à l'écran.
const assert = require('assert');
require('./moteur.js');
require('./seance.js');
require('./album.js');
const T = globalThis.Tables;
const S = globalThis.Seance;
const A = globalThis.Album;

const lundi = new Date(2026, 10, 2, 17, 0);
const plus = (n, h) => new Date(2026, 10, 2 + n, h || 17, 0);
const j = n => T.jour(plus(n));
const RAPIDE = 1500;
const LENT = 4500;

// ---------- Un tampon entier par jour et par carte, quand un fait de la paire monte ----------
let e = T.etatNeuf();
assert.strictEqual(T.enregistrer(e, 7, 8, true, RAPIDE, plus(0)).tampon, 'tampon', 'premier juste : la carte prend son tampon');
assert.strictEqual(T.enregistrer(e, 8, 7, true, RAPIDE, plus(0)).tampon, null, 'l autre sens le même jour : pas de deuxième tampon');
assert.deepStrictEqual(T.tampons(e, 8, 7), [j(0)], 'un seul tampon, rangé sur la carte 7 × 8');
assert.deepStrictEqual(e.faits['7x8'].tampons, [j(0)]);
assert.strictEqual(T.enregistrer(e, 7, 8, true, RAPIDE, plus(0, 18)).tampon, null, 'rejouer le soir même n apporte rien');
assert.strictEqual(T.enregistrer(e, 7, 8, false, RAPIDE, plus(1)).tampon, null, 'une erreur ne pose rien');
assert.strictEqual(T.tampons(e, 7, 8).length, 1, 'et ne retire rien');
assert.strictEqual(T.enregistrer(e, 2, 1, true, RAPIDE, plus(0)).tampon, null, 'pas de carte pour les tables de 1 et de 10');

// ---------- Le chemin vers l'or : trois tampons, puis le quatrième à une révision prévue, dans les deux sens ----------
e = T.etatNeuf();
const deux = (n, ms) => [T.enregistrer(e, 7, 8, true, ms, plus(n)), T.enregistrer(e, 8, 7, true, ms, plus(n))];
deux(0, RAPIDE); // boîte 1, tampon 1
deux(1, RAPIDE); // boîte 2, tampon 2
deux(3, RAPIDE); // boîte 3, tampon 3
assert.deepStrictEqual(T.tampons(e, 7, 8), [j(0), j(1), j(3)]);
assert.strictEqual(e.faits['7x8'].boite, 3);
assert.strictEqual(e.faits['7x8'].prochain, j(7));
// Hors programme (le jour 5, rien n'est dû) : la boîte 4 ne se gagne pas, et la date prévue ne bouge pas.
const hors = T.enregistrer(e, 7, 8, true, RAPIDE, plus(5));
assert.strictEqual(hors.monte, false, 'la boîte 4 ne se gagne qu à une révision prévue');
assert.strictEqual(e.faits['7x8'].boite, 3);
assert.strictEqual(e.faits['7x8'].prochain, j(7), 'une réponse hors programme ne repousse pas la révision');
assert.strictEqual(hors.tampon, null);
// Jour 7, à sa date : 7 × 8 passe en boîte 4, mais 8 × 7 est encore en boîte 3, donc pas d'or.
assert.strictEqual(T.enregistrer(e, 7, 8, true, RAPIDE, plus(7)).tampon, null, 'l or demande les deux sens');
assert.strictEqual(e.faits['7x8'].boite, 4);
assert.strictEqual(T.estOr(e, 7, 8), false);
// Le même jour, 8 × 7 à sa date, juste et rapide : les deux sens sont en boîte 4, la carte dore.
assert.strictEqual(T.enregistrer(e, 8, 7, true, RAPIDE, plus(7)).tampon, 'or');
assert.strictEqual(T.estOr(e, 7, 8), true);
assert.deepStrictEqual(T.tampons(e, 7, 8), [j(0), j(1), j(3), j(7)]);
assert.strictEqual(T.enregistrer(e, 7, 8, true, RAPIDE, plus(14)).tampon, null, 'une carte dorée ne prend plus de tampon');
assert.strictEqual(T.tampons(e, 7, 8).length, 4);

// L'or ne tombe pas un jour hors programme, même avec les deux sens en boîte 4.
e = T.etatNeuf();
e.faits['3x4'] = { boite: 4, vu: true, prochain: j(10), justesJours: [], erreurs: 0, tampons: [j(-9), j(-8), j(-6)] };
e.faits['4x3'] = { boite: 4, vu: true, prochain: j(10), justesJours: [], erreurs: 0 };
const r34 = T.enregistrer(e, 4, 3, true, RAPIDE, plus(0));
assert.strictEqual(r34.monte, true, 'la boîte 5 peut se prendre en complément');
assert.strictEqual(r34.tampon, null, 'mais pas l or, hors programme');
// À sa date mais lente : pas d'or non plus (le par cœur demande la rapidité).
e.faits['3x4'].prochain = j(0);
assert.strictEqual(T.enregistrer(e, 3, 4, true, LENT, plus(0)).tampon, null);
// À sa date, juste et rapide, boîte déjà au maximum : l'or tombe quand même (pas d'impasse).
e.faits['3x4'].boite = 5;
e.faits['3x4'].prochain = j(1);
e.faits['3x4'].justesJours = [];
assert.strictEqual(T.enregistrer(e, 3, 4, true, RAPIDE, plus(1)).tampon, 'or');

// ---------- Une carte dorée qui retombe reste dorée, et affiche « Comes back tomorrow » ----------
e = Object.assign(T.etatNeuf(), { familles: 6 });
e.faits['6x7'] = { boite: 4, vu: true, prochain: j(0), justesJours: [], erreurs: 0, dernierJuste: true, tampons: [j(-9), j(-8), j(-6), j(-2)] };
e.faits['7x6'] = { boite: 5, vu: true, prochain: j(9), justesJours: [], erreurs: 0, dernierJuste: true };
assert.strictEqual(T.aRevoir(e, 7, 6), false);
T.enregistrer(e, 6, 7, false, RAPIDE, plus(0));
assert.strictEqual(e.faits['6x7'].boite, 1, 'le moteur, lui, repart de la boîte réelle');
assert.strictEqual(T.estOr(e, 6, 7), true, 'la carte reste dorée');
assert.strictEqual(T.tampons(e, 6, 7).length, 4, 'aucun tampon retiré');
assert.strictEqual(T.aRevoir(e, 6, 7), true);
assert.strictEqual(A.carte(e, 6, 7, j(0)).revient, 'demain', '« Comes back tomorrow » le jour de l erreur');
assert.strictEqual(A.carte(e, 6, 7, j(2)).revient, 'auj', 'puis le fait est dû');
assert.strictEqual(T.compteOr(e), 0, 'le coin parent compte sur les boîtes réelles');
// La séance du lendemain le repose, et la fin dit qu'il est retrouvé.
const sRev = S.creer(e, plus(1));
assert.deepStrictEqual(sRev.aRevoir, [[6, 7]]);
assert.ok(sRev.questions.some(q => q.a === 6 && q.b === 7), 'il revient dans la séance');
T.enregistrer(e, 6, 7, true, RAPIDE, plus(1));
assert.strictEqual(T.aRevoir(e, 6, 7), false, 'retrouvé juste : le signe part');
sRev.index = sRev.questions.length;
assert.deepStrictEqual(S.bilan(sRev, e, plus(1)).retrouvees, [[6, 7]]);

// ---------- Les familles s'ouvrent selon les boîtes réelles, jamais selon les tampons ----------
e = T.etatNeuf();
T.faitsDeFamille(0).forEach(([a, b]) => { e.faits[T.cle(a, b)] = { boite: 1, vu: true, justesJours: [], erreurs: 1 }; });
A.PAIRES.filter(([a, b]) => T.familleDuFait(a, b) === 0).forEach(([a, b]) => { e.faits[T.cle(a, b)].tampons = [j(-9), j(-8), j(-7), j(-6)]; });
assert.ok(A.pages(e, j(0))[0].complet, 'la page des faciles est toute dorée');
assert.strictEqual(T.majFamilles(e), 1, 'mais la famille suivante reste fermée : les boîtes réelles sont en 1');
T.faitsDeFamille(0).forEach(([a, b]) => { e.faits[T.cle(a, b)].boite = 3; });
assert.strictEqual(T.majFamilles(e), 2);

// ---------- Au plus quatre faits nouveaux par jour, et non par séance ----------
e = T.etatNeuf();
const nouveaux = (etat, quand) => T.seance(etat, quand).filter(q => !(etat.faits[T.cle(q.a, q.b)] || {}).vu);
const s1 = nouveaux(e, plus(0));
assert.strictEqual(s1.length, T.NOUVEAUX_PAR_JOUR, 'quatre faits nouveaux à la première séance');
T.enregistrer(e, s1[0].a, s1[0].b, true, RAPIDE, plus(0));
T.enregistrer(e, s1[1].a, s1[1].b, false, RAPIDE, plus(0));
assert.strictEqual(T.nouveauxDuJour(e, j(0)), 2, 'deux faits vus pour la première fois, juste ou faux');
assert.strictEqual(nouveaux(e, plus(0, 18)).length, 2, 'une séance interrompue laisse le reste du quota');
s1.slice(2).forEach(q => T.enregistrer(e, q.a, q.b, true, RAPIDE, plus(0)));
assert.strictEqual(nouveaux(e, plus(0, 19)).length, 0, 'une deuxième séance le même jour ne révise que des faits déjà vus');
assert.ok(T.seance(e, plus(0, 19)).length > 0, 'elle existe quand même');
assert.strictEqual(nouveaux(e, plus(1)).length, T.NOUVEAUX_PAR_JOUR, 'le lendemain, quatre nouveaux');
// Le diagnostic n'entame pas le quota du jour.
e = T.etatNeuf();
T.appliquerDiagnostic(e, T.questionsDiagnostic().map(x => ({ a: x.a, b: x.b, juste: true, ms: RAPIDE })), plus(0));
assert.strictEqual(T.nouveauxDuJour(e, j(0)), 0);

// ---------- Le diagnostic : un tampon pour chaque paire juste ----------
e = T.etatNeuf();
T.appliquerDiagnostic(e, [{ a: 7, b: 8, juste: true, ms: RAPIDE }, { a: 3, b: 6, juste: false, ms: null }, { a: 9, b: 4, juste: true, ms: LENT }], plus(0));
assert.deepStrictEqual(T.tampons(e, 8, 7), [j(0)]);
assert.deepStrictEqual(T.tampons(e, 3, 6), []);
assert.deepStrictEqual(T.tampons(e, 4, 9), [j(0)]);

// ---------- Une progression d'avant l'album se convertit sans rien perdre ----------
const v1 = {
  version: 1, familles: 3, diagnostic: true, jours: [j(0), j(1)], records: [],
  faits: {
    '7x8': { boite: 4, vu: true, prochain: j(9), justesJours: [j(0), j(2), j(5)], erreurs: 0 },
    '8x7': { boite: 4, vu: true, prochain: j(9), justesJours: [j(1), j(5), j(8)], erreurs: 0 },
    '3x6': { boite: 3, vu: true, prochain: j(9), justesJours: [j(0), j(1), j(3), j(6), j(8)], erreurs: 0 },
    '9x2': { boite: 2, vu: true, prochain: j(3), justesJours: [j(1)], erreurs: 1 },
    '2x9': { boite: 1, vu: true, prochain: j(1), justesJours: [], erreurs: 2 },
    '1x5': { boite: 3, vu: true, prochain: j(9), justesJours: [j(0)], erreurs: 0 },
  },
};
const copie = JSON.parse(JSON.stringify(v1));
const m = T.migrer(JSON.parse(JSON.stringify(v1)));
assert.strictEqual(m.version, T.VERSION);
assert.deepStrictEqual(T.tampons(m, 7, 8), [j(0), j(1), j(2), j(5)], 'jours justes des deux sens réunis, deux sens en boîte 4 : dorée');
assert.deepStrictEqual(T.tampons(m, 3, 6), [j(0), j(1), j(3)], 'un seul sens en boîte 3 : trois tampons, pas d or');
assert.deepStrictEqual(T.tampons(m, 2, 9), [j(1)]);
assert.strictEqual(m.faits['1x5'].tampons, undefined, 'pas de carte pour les tables de 1');
for (const k of Object.keys(copie.faits)) {
  const { tampons: _t, ...reste } = m.faits[k];
  assert.deepStrictEqual(reste, copie.faits[k], 'rien d autre ne change : ' + k);
}
assert.deepStrictEqual(m.jours, copie.jours);
assert.strictEqual(m.familles, 3);
assert.deepStrictEqual(T.migrer(JSON.parse(JSON.stringify(m))), m, 'migrer deux fois ne change rien');
assert.deepStrictEqual(T.migrer(T.etatNeuf()), T.etatNeuf(), 'un état neuf est déjà à jour');

// ---------- La vue de l'album ----------
assert.deepStrictEqual(A.pages(T.etatNeuf(), j(0)).map(p => p.cartes.length), [8, 7, 11, 7, 2, 1], '36 cartes, une page par famille');
assert.deepStrictEqual(A.ecrit(2, 5), [5, 2], 'la table de la famille d abord');
assert.deepStrictEqual(A.ecrit(3, 4), [4, 3]);
assert.deepStrictEqual(A.ecrit(7, 8), [8, 7]);
assert.deepStrictEqual(A.ecrit(3, 6), [3, 6]);
assert.deepStrictEqual(A.pages(T.etatNeuf(), j(0)).map(p => p.ouverte), [true, false, false, false, false, false]);

e = T.etatNeuf();
e.familles = 2;
e.faits['2x5'] = { boite: 3, vu: true, prochain: j(1), justesJours: [], tampons: [j(-3), j(-1), j(0)] };
e.faits['5x6'] = { boite: 2, vu: true, prochain: j(5), justesJours: [], tampons: [j(-1)] };
e.faits['2x6'] = { boite: 2, vu: true, prochain: j(1), justesJours: [], tampons: [j(-2), j(0)] };
e.faits['5x5'] = { boite: 5, vu: true, prochain: j(9), justesJours: [], tampons: [j(-9), j(-5), j(-2), j(0)] };
assert.strictEqual(A.total(e), 10);
assert.strictEqual(A.nbOr(e), 1);
assert.deepStrictEqual(A.proches(e, j(0)).map(c => c.cle), ['2x5', '2x6', '5x6'], 'les plus proches de l or, sans la dorée');
const dj = A.duJour(e, j(0));
assert.deepStrictEqual(dj.dorees.map(c => c.cle), ['5x5']);
assert.deepStrictEqual(dj.tamponnees.map(c => c.cle).sort(), ['2x5', '2x6']);
assert.strictEqual(dj.gagnes, 3);
assert.deepStrictEqual(A.prochainTampon(e, plus(0)), [2, 5], 'demain, la carte la plus proche de l or qui revient');
assert.strictEqual(A.etatCase(e, 5, 5, j(0)), 'auj');
assert.strictEqual(A.etatCase(e, 5, 5, j(1)), 'or');
assert.strictEqual(A.etatCase(e, 5, 2, j(0)), 'pre');
assert.strictEqual(A.etatCase(e, 6, 2, j(0)), 'com');
assert.strictEqual(A.etatCase(e, 7, 7, j(0)), 'pas');
assert.strictEqual(A.etatCase(e, 1, 7, j(0)), null);
assert.strictEqual(A.pages(e, j(0))[0].or, 1);

console.log('album à tampons : tous les tests passent');
