// Toutes les phrases que l'app peut dire (tables, zoom, nombre cible, cadre), pour fabriquer leurs voix d'avance : node commun/outils/phrases.js > phrases.json
// Langues (D-21, docs/DECISIONS.md) : l'anglais britannique par défaut ('en') ; le français ('fr') pour les
// énoncés et les astuces des tables, pour le voyage du zoom quand l'enfant le choisit (les deux langues
// sont collectées), et pour le nombre cible quand un parent passe le cadre en français.
const path = require('path');
const racine = path.resolve(__dirname, '../..');
globalThis.window = undefined;
require(path.join(racine, 'modules/tables/moteur.js'));
require(path.join(racine, 'commun/textes.js'));
require(path.join(racine, 'modules/zoom/contenu.js'));
require(path.join(racine, 'modules/cible/moteur.js'));
require(path.join(racine, 'modules/cible/contenu.js'));
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
// Les relances autour d'une décomposition sont des consignes : elles suivent la langue du cadre (anglais).
ajouter('en', X.t('tables_relance_sans1', null, 'en'));
ajouter('en', X.t('tables_relance_jusqua10', null, 'en'));

// Module « De l'univers à Éguilles », dans ses deux langues (l'enfant choisit) : chaque lieu touché, montré,
// nommé, son repère et son information, la question « nommer », le nom de chaque étape, l'astuce des
// planètes et l'adresse dans l'univers.
const ZC = globalThis.ZoomContenu;
for (const lg of ZC.LANGUES) {
  ajouter(lg, ZC.QUESTIONS_NOMMER[lg]);
  ajouter(lg, ZC.ADRESSES[lg]);
  for (const e of ZC.ETAGES) {
    ajouter(lg, ZC.champ(e, 'dit', lg));
    ajouter(lg, ZC.champ(e, 'astuce', lg));
    for (const l of e.lieux) {
      for (const p of Object.values(ZC.PHRASES)) ajouter(lg, p(l, lg));
      ajouter(lg, ZC.champ(l, 'indice', lg));
      ajouter(lg, ZC.champ(l, 'info', lg));
    }
  }
}

// Jeu du nombre cible : la cible annoncée (10 à 99), les consignes, les refus expliqués, l'indice,
// l'impasse, en anglais (défaut) et en français (cadre passé en français par un parent) ; puis les bulles
// du cadre qui nomment la mascotte (défi jusqu'au coup parfait, indice).
const CI = globalThis.Cible;
const CCI = globalThis.CibleContenu;
for (const lg of ['en', 'fr']) {
  for (const d of Object.values(CCI.de(lg).DIT)) {
    if (typeof d === 'function') { for (let n = 10; n <= CI.CIBLE_MAX; n++) ajouter(lg, d(n)); } else ajouter(lg, d);
  }
}
// Le cadre n'a de voix fabriquée qu'en anglais, comme plus bas.
for (const mascotte of ['Moussi', 'Pooh Bear']) {
  ajouter('en', X.t('cible_indice_question', { mascotte }, 'en'));
  for (let n = 2; n <= CI.COUP_PARFAIT; n++) ajouter('en', X.t('cible_defi', { mascotte, n }, 'en'));
}
ajouter('en', X.t('cible_indice_cout', { n: CI.COUT_INDICE }, 'en'));

for (const langue of ['en', 'fr']) {
  X.choisirLangue(langue);
  for (const cle of Object.keys(X.TEXTES)) {
    if (cle.startsWith('res_')) continue; // résumés des modules : écrits sur le portail, jamais dits
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
