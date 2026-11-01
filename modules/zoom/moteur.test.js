// Tests du moteur du zoom, générique, sur un petit programme inventé : node modules/zoom/moteur.test.js
const assert = require('assert');
require('./moteur.js');
const Z = globalThis.Zoom;

const lundi = new Date(2026, 10, 2, 17, 0);
const plus = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n, 17, 0);
const PROG = {
  etages: [
    { id: 'ciel', lieux: ['a', 'b', 'c', 'd', 'e'] },
    { id: 'mer', lieux: ['f', 'g', 'h'] },
    { id: 'ile', lieux: ['i'] },
  ],
  groupes: { a: 'astre', b: 'astre', c: 'astre', d: 'nuage', e: 'nuage', f: 'mer', g: 'mer', h: 'mer', i: 'ile' },
};

// Une séance neuve : trois lieux nouveaux au plus, chacun montré puis demandé trois questions plus loin.
{
  const etat = Z.etatNeuf();
  const q = Z.seance(etat, PROG, lundi);
  const decouvertes = q.filter(x => x.type === 'decouverte').map(x => x.lieu);
  assert.deepStrictEqual(decouvertes, ['a', 'b', 'c'], 'trois nouveaux, dans l ordre du programme');
  assert.ok(q.every(x => x.etage === 'ciel'), 'seule la première étape est ouverte');
  for (const l of decouvertes) {
    const i = q.findIndex(x => x.type === 'decouverte' && x.lieu === l);
    const j = q.findIndex(x => x.type === 'toucher' && x.lieu === l);
    assert.ok(j > i, `${l} est montré avant d être demandé`);
  }
  assert.ok(!q.some(x => x.type === 'nommer'), 'pas de question « nommer » avant la boîte 2');
}

// La première réponse compte seule ; une erreur ramène en boîte 1 et fait revenir la carte.
{
  const etat = Z.etatNeuf();
  const s = Z.creerSeance(etat, PROG, lundi);
  while (!Z.finie(s)) {
    const q = Z.courante(s);
    const juste = !(q.type === 'toucher' && q.lieu === 'b');
    Z.repondre(s, etat, juste, lundi);
    Z.suivante(s);
  }
  assert.strictEqual(Z.boite(etat, 'a', 'toucher'), 1, 'juste du premier coup : boîte 1');
  assert.strictEqual(Z.boite(etat, 'b', 'toucher'), 1, 'erreur : boîte 1');
  assert.strictEqual(etat.cartes['b|toucher'].erreurs, 1, 'le retour de la carte ratée ne compte pas une seconde fois');
  assert.strictEqual(etat.cartes['b|toucher'].prochain, Z.jour(lundi), 'une erreur est à revoir le jour même');
  assert.strictEqual(etat.cartes['a|toucher'].prochain, Z.jour(plus(lundi, 1)), 'boîte 1 : le lendemain');
  assert.ok(s.questions.some(q => q.retour && q.lieu === 'b'), 'la carte ratée revient dans la séance');
  assert.deepStrictEqual(etat.jours, [Z.jour(lundi)]);
  const b = Z.bilan(s, etat, PROG, lundi);
  assert.ok(b.montees.some(m => m.lieu === 'a' && m.couleur === 'bronze'), 'un lieu découvert monte au bronze');
  assert.strictEqual(b.nouvelEtage, null);
  assert.strictEqual(Z.compte(etat, PROG).decouverts, 3);
  assert.deepStrictEqual(Z.fragiles(etat, PROG), ['b']);
}

// Une seule montée par jour, pas de seuil de temps, boîte 5 au plus, intervalles 0, 1, 2, 4, 7, 21.
{
  const etat = Z.etatNeuf();
  Z.decouvrir(etat, 'a', lundi);
  Z.enregistrer(etat, 'a', 'toucher', true, lundi);
  Z.enregistrer(etat, 'a', 'toucher', true, lundi);
  assert.strictEqual(Z.boite(etat, 'a', 'toucher'), 1, 'deux justes le même jour : une seule montée');
  let d = lundi;
  for (let k = 0; k < 8; k++) { d = plus(d, 1); Z.enregistrer(etat, 'a', 'toucher', true, d); }
  assert.strictEqual(Z.boite(etat, 'a', 'toucher'), 5);
  assert.strictEqual(etat.cartes['a|toucher'].prochain, Z.jour(plus(d, 21)));
  assert.strictEqual(Z.couleur(etat, 'a'), 'argent', 'sans le nom, pas d or');
  for (let k = 0; k < 3; k++) { d = plus(d, 1); Z.enregistrer(etat, 'a', 'nommer', true, d); }
  assert.strictEqual(Z.couleur(etat, 'a'), 'or', 'toucher en boîte 4 et nommer en boîte 3 : par cœur');
}

// « nommer » naît en boîte 2 ; l'étape suivante s'ouvre à quatre lieux sur cinq en boîte 2.
{
  const etat = Z.etatNeuf();
  ['a', 'b', 'c', 'd'].forEach(l => { Z.decouvrir(etat, l, lundi); Z.enregistrer(etat, l, 'toucher', true, lundi); });
  assert.strictEqual(Z.majEtages(etat, PROG), 1, 'boîte 1 : l étape reste seule');
  ['a', 'b', 'c'].forEach(l => Z.enregistrer(etat, l, 'toucher', true, plus(lundi, 1)));
  assert.strictEqual(Z.majEtages(etat, PROG), 1, 'trois sur cinq ne suffisent pas');
  const q = Z.seance(etat, PROG, plus(lundi, 2));
  assert.ok(q.some(x => x.type === 'nommer' && x.lieu === 'a'), 'nommer a, né en boîte 2');
  assert.ok(!q.some(x => x.type === 'nommer' && x.lieu === 'd'), 'pas encore nommer d');
  Z.enregistrer(etat, 'd', 'toucher', true, plus(lundi, 1));
  assert.strictEqual(Z.majEtages(etat, PROG), 2, 'quatre sur cinq : l étape suivante s ouvre');
  const q2 = Z.seance(etat, PROG, plus(lundi, 2));
  assert.ok(q2.some(x => x.etage === 'mer'), 'les lieux de la nouvelle étape arrivent');
  const rangs = q2.map(x => PROG.etages.findIndex(e => e.id === x.etage));
  assert.deepStrictEqual(rangs, rangs.slice().sort((x, y) => x - y), 'les questions suivent l ordre du zoom');
  assert.ok(q2.filter(x => x.type !== 'decouverte').length <= Z.TAILLE_SEANCE, 'une séance de dix questions au plus');
}

// Un enfant qui sait tout a quand même une séance ; les noms proposés viennent du même groupe.
{
  const etat = Z.etatNeuf();
  PROG.etages.flatMap(e => e.lieux).forEach(l => {
    etat.cartes[l + '|toucher'] = { boite: 5, vu: true, prochain: '2027-01-01', justesJours: [], erreurs: 0 };
    etat.cartes[l + '|nommer'] = { boite: 5, vu: true, prochain: '2027-01-01', justesJours: [], erreurs: 0 };
  });
  etat.etages = 3;
  assert.ok(Z.seance(etat, PROG, lundi).length > 0);
  const c = Z.choix(PROG, 'a', 3, 'x');
  assert.strictEqual(c.length, 3);
  assert.ok(c.includes('a'));
  assert.ok(c.every(l => PROG.groupes[l] === 'astre'), 'des astres pour un astre');
  const c4 = Z.choix(PROG, 'i', 4, 'x');
  assert.deepStrictEqual(c4, ['i'], 'une étape d un seul lieu ne propose que lui');
  assert.strictEqual(Z.compte(etat, PROG).parCoeur, 9);
}

// L'avancement ne compte ni les découvertes ni les retours.
{
  const s = { index: 2, questions: [{ type: 'decouverte' }, { type: 'toucher' }, { type: 'toucher' }, { type: 'toucher', retour: true }, { type: 'nommer' }] };
  assert.deepStrictEqual(Z.avancement(s), { n: 2, total: 3 });
}

console.log('moteur du zoom : ok');
