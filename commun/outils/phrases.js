// Toutes les phrases que l'app peut dire (tables, zoom, cadre), pour fabriquer leurs voix d'avance : node commun/outils/phrases.js > phrases.json
const path = require('path');
const racine = path.resolve(__dirname, '../..');
globalThis.window = undefined;
require(path.join(racine, 'modules/tables/moteur.js'));
require(path.join(racine, 'commun/textes.js'));
require(path.join(racine, 'modules/zoom/contenu.js'));
const T = globalThis.Tables;
const X = globalThis.Textes;

const phrases = new Map();
const ajouter = (langue, texte) => { if (texte && !texte.includes('{')) phrases.set(langue + '|' + texte, { langue, texte }); };

const toutOr = T.etatNeuf();
for (let a = 1; a <= 10; a++) for (let b = 1; b <= 10; b++) toutOr.faits[T.cle(a, b)] = { boite: 5, vu: true, justesJours: [] };
const neuf = T.etatNeuf();

for (let a = 1; a <= 10; a++) {
  for (let b = 1; b <= 10; b++) {
    ajouter('fr', T.questionDite({ type: 'produit', a, b }));
    ajouter('fr', T.faitDit(a, b));
    ajouter('fr', T.questionDite({ type: 'manquant', a, b }));
    ajouter('fr', T.questionDite({ type: 'decomposition', a, b, produit: a * b }));
    for (const e of [neuf, toutOr]) ajouter('fr', T.astuce(a, b, e).replace(/×/g, 'fois'));
    const etat = { faits: { [T.cle(a, b)]: { boite: 3 } } };
    for (let i = 0; i < 40; i++) {
      const q = T.question(etat, a, b, i);
      if (q.type !== 'multiple') continue;
      for (const m of ['un multiple de', 'dans la table de']) ajouter('fr', T.questionDite(q, m));
    }
  }
}
ajouter('fr', 'Essaie sans le 1 !');
ajouter('fr', "Essaie avec des nombres jusqu'à 10 !");

// Module « De l'univers à Éguilles » : chaque lieu touché, montré, nommé, son repère et son information,
// la question « nommer », le nom de chaque étape, l'astuce des planètes et l'adresse dans l'univers.
const ZC = globalThis.ZoomContenu;
ajouter('fr', ZC.QUESTION_NOMMER);
ajouter('fr', ZC.ADRESSE);
for (const e of ZC.ETAGES) {
  ajouter('fr', e.dit);
  ajouter('fr', e.astuce);
  for (const l of e.lieux) {
    for (const p of Object.values(ZC.PHRASES)) ajouter('fr', p(l));
    ajouter('fr', l.indice);
    ajouter('fr', l.info);
  }
}

for (const langue of ['en', 'fr']) {
  X.choisirLangue(langue);
  for (const cle of Object.keys(X.TEXTES)) {
    const brut = X.TEXTES[cle][langue];
    if (!brut || langue === 'fr') continue;
    if (!brut.includes('{')) { ajouter(langue, brut); continue; }
    for (const prenom of ['Henri', 'Clara']) {
      for (let n = 0; n <= 20; n++) {
        ajouter(langue, X.t(cle, { prenom, n, total: 20 }));
      }
    }
  }
}

process.stdout.write(JSON.stringify([...phrases.values()], null, 0));
