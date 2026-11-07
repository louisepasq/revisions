// Tests du module des hélicoptères (contenu, moteur, état, carnet, expérience) : node modules/helicopteres/moteur.test.js
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
globalThis.window = undefined;
require('../../commun/textes.js');
require('../zoom/moteur.js');
require('./contenu.js');
require('./dessins.js');
require('./moteur.js');
require('./resume.js');
const H = globalThis.Helico;
const HC = globalThis.HeliContenu;
const D = globalThis.HeliDessins;

const samedi = new Date(2026, 10, 7, 17, 0); // samedi 7 novembre 2026
const plus = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n, 17, 0);
const EM = String.fromCharCode(0x2014);

// ---------- Le contenu : deux langues partout, une vingtaine de cartes, rien de mémoire non listé ----------
{
  const champs = [];
  const visiter = o => {
    if (!o || typeof o !== 'object') return;
    if (Array.isArray(o)) return o.forEach(visiter);
    if ('fr' in o || 'en' in o) champs.push(o);
    Object.keys(o).forEach(k => { if (k !== 'fr' && k !== 'en') visiter(o[k]); });
  };
  visiter([HC.ETAPES, HC.OBJETS, HC.PARTIES, HC.COMMANDES, HC.MISSIONS, HC.COULEURS, HC.HELICO, HC.VOL, HC.COCKPIT,
    HC.ATELIER, HC.RADIO, HC.RECORDS, HC.SORTIE, HC.CARNET, HC.CARTES, HC.COMPTEUR]);
  champs.forEach(c => assert.ok(typeof c.fr === 'string' && c.fr && typeof c.en === 'string' && c.en, `deux langues : ${JSON.stringify(c)}`));
  assert.ok(Object.keys(HC.UI.fr).every(k => HC.UI.en[k]), 'chaque étiquette a son anglais');
  assert.ok(HC.CARTES.length >= 18 && HC.CARTES.length <= 24, `une vingtaine de cartes (${HC.CARTES.length})`);
  assert.strictEqual(new Set(HC.CARTES.map(c => c.id)).size, HC.CARTES.length, 'identifiants uniques');
  HC.CARTES.forEach(c => {
    assert.ok(HC.etape(c.etape), `${c.id} : étape connue`);
    if (c.type === 'commande') assert.ok(HC.commande(c.bon), `${c.id} : la bonne commande existe`);
    else assert.ok(c.choix[c.bon], `${c.id} : la bonne réponse est un des trois choix`);
    assert.ok(c.aide && c.aide.fr && c.aide.en, `${c.id} : une explication pour l'erreur`);
  });
  // Les commandes : deux cartes chacune (l'effet, et Moussi qui demande), pour le tampon du carnet.
  HC.COMMANDES.forEach(c => assert.strictEqual(HC.CARTES.filter(k => k.commande === c.id).length, 2, `deux cartes pour ${c.id}`));
  // L'ordre de D-24 et l'atelier après les trois premières étapes.
  assert.deepStrictEqual(HC.ETAPES.map(e => e.id), ['helico', 'vol', 'cockpit', 'atelier', 'radio', 'records', 'sortie']);
  assert.deepStrictEqual(HC.etape('atelier').apres, ['helico', 'vol', 'cockpit']);
  // Les faits affichés : les chiffres vérifiés à la source (README.md), et aucun autre.
  const tout = JSON.stringify([HC.VOL, HC.RECORDS, HC.RADIO, HC.PARTIES, HC.SORTIE, HC.COMPTEUR, HC.CARTES]);
  ['375', '405', '12 442', '12,442', '8 848', '8,848', '400 km/h', '130 km/h', '252 km/h', '7 200', '7,200', '120 m', '17', '1972', '1986', '2005'].forEach(f => assert.ok(tout.includes(f), `fait attendu : ${f}`));
  const nombres = (tout.match(/\d[\d  ,.]*\d|\d/g) || []).map(n => n.replace(/[  ,]/g, ''));
  const AUTORISES = new Set(['375', '405', '6', '12442', '8848', '400', '130', '252', '7200', '120', '17', '1972', '1986', '2005', '3', '2', '5', '10', '30', '1', '350', '125']); // 125 et 350 : les noms H125 et AS 350 B3
  nombres.forEach(n => assert.ok(AUTORISES.has(n), `nombre non listé dans les faits vérifiés : ${n}`));
  // Ni tiret cadratin, ni rouge dans les peintures.
  const fichiers = ['contenu.js', 'moteur.js', 'dessins.js', 'resume.js', 'helicopteres.js', 'helicopteres.css', 'README.md'];
  fichiers.forEach(f => { const p = path.join(__dirname, f); if (fs.existsSync(p)) assert.ok(!fs.readFileSync(p, 'utf8').includes(EM), `tiret cadratin dans ${f}`); });
  assert.ok(!Object.keys(HC.COULEURS).includes('rouge'));
  // Les phrases dites : toutes les phrases des écrans, dans les deux langues, sans gabarit.
  for (const lg of HC.LANGUES) {
    const l = HC.toutesLesPhrases(lg);
    assert.ok(l.length > 100, `${lg} : ${l.length} phrases`);
    assert.ok(l.includes(HC.champ(HC.COCKPIT.enseigner.collectif.demande, lg)), 'Moussi qui demande');
    assert.ok(l.includes(HC.champ(HC.CARTES[0].q, lg)), 'la question d une carte');
    assert.ok(l.includes(HC.champ(HC.RECORDS.ecrans[0], lg)), 'un écran de records');
    assert.ok(!l.includes(HC.champ(HC.PARTIES[0].nom, lg)), 'les noms seuls ne se disent pas');
    assert.ok(l.every(s => !s.includes('{')));
  }
  // Le gabarit : une feuille A4 en millimètres, trois modèles de 6, 8 et 10 cm.
  const g = D.gabarit();
  assert.ok(g.includes('width="190mm"') && g.includes('height="270mm"'));
  ['6 cm', '8 cm', '10 cm'].forEach(x => assert.ok(g.includes(x), x));
}

// ---------- L'état : neuf, relu sans langue, jamais remis à zéro ----------
{
  const neuf = H.etatNeuf();
  assert.ok(!('langue' in neuf), 'la langue n entre pas dans l état neuf');
  assert.deepStrictEqual(H.normaliser(JSON.parse(JSON.stringify(neuf))), neuf);
  // Un état enregistré sans le champ de langue (et avec un champ inconnu) se relit sans rien perdre.
  const ancien = { version: 1, etapes: { helico: '2026-11-07' }, cartes: { 'p-pales|q': { boite: 2, vu: true, prochain: '2026-11-09', justesJours: ['2026-11-07', '2026-11-08'], erreurs: 0, debut: '2026-11-07' } }, jours: ['2026-11-07'], brevet: {}, objets: { ecusson: '2026-11-07' }, mission: 'feux', couleur: 'orange', futur: { garde: true } };
  const stock = { 'henri.helicopteres': JSON.stringify(ancien) };
  const contexte = { console, localStorage: { getItem: k => (k in stock ? stock[k] : null), setItem: (k, v) => { stock[k] = String(v); } } };
  contexte.globalThis = contexte;
  vm.createContext(contexte);
  ['commun/textes.js', 'modules/zoom/moteur.js', 'modules/helicopteres/contenu.js', 'modules/helicopteres/moteur.js']
    .forEach(f => vm.runInContext(fs.readFileSync(path.join(__dirname, '../..', f), 'utf8'), contexte));
  const e = contexte.Helico.charger('henri');
  assert.strictEqual(e.langue, undefined, 'sans langue : le choix sera proposé, rien n est inventé');
  assert.deepStrictEqual(JSON.parse(JSON.stringify(e.cartes)), ancien.cartes);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(e.etapes)), ancien.etapes);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(e.futur)), { garde: true }, 'un champ inconnu est gardé');
  assert.strictEqual(e.mission, 'feux');
  e.langue = 'fr';
  contexte.Helico.sauver('henri', e);
  const relu = JSON.parse(stock['henri.helicopteres']);
  assert.strictEqual(relu.langue, 'fr');
  assert.deepStrictEqual(relu.cartes, ancien.cartes, 'choisir la langue ne touche pas la progression');
  // Un stockage abîmé ne fait pas tomber le module.
  stock['henri.helicopteres'] = '{pas du json';
  assert.deepStrictEqual(JSON.parse(JSON.stringify(contexte.Helico.charger('henri'))), H.etatNeuf());
}

// ---------- Les étapes : l'ordre, l'atelier ouvert par l'exploration, jamais par un score ----------
{
  const e = H.etatNeuf();
  assert.ok(H.ouverte(e, 'helico') && !H.ouverte(e, 'vol') && !H.ouverte(e, 'atelier'));
  assert.strictEqual(H.etapeSuivante(e), 'helico');
  assert.strictEqual(H.finirEtape(e, 'helico', samedi), 'ecusson', 'l étape donne son objet');
  assert.strictEqual(H.finirEtape(e, 'helico', plus(samedi, 1)), null, 'un objet ne se gagne qu une fois');
  assert.strictEqual(e.etapes.helico, '2026-11-07', 'la première date est gardée');
  H.finirEtape(e, 'vol', samedi);
  assert.ok(!H.ouverte(e, 'atelier'), 'pas d atelier avant le cockpit');
  assert.strictEqual(H.etapeSuivante(e), 'cockpit');
  H.finirEtape(e, 'cockpit', samedi);
  assert.ok(H.ouverte(e, 'atelier'), 'l atelier s ouvre après les trois premières étapes, sans aucune carte réussie');
  assert.strictEqual(Object.keys(e.cartes).length, 0);
  assert.strictEqual(H.etapeSuivante(e), 'radio', 'l atelier et la sortie se font hors de l écran : jamais proposés d office');
  H.finirEtape(e, 'radio', samedi);
  H.finirEtape(e, 'records', samedi);
  assert.strictEqual(H.etapeSuivante(e), null);
  assert.ok(H.ouverte(e, 'sortie'));
  assert.deepStrictEqual(Object.keys(e.objets).sort(), ['ailes', 'autocollant', 'casque', 'ecusson', 'medaille']);
}

// ---------- Les cartes : celles des étapes faites, quatre nouvelles par jour, Leitner du zoom ----------
{
  const e = H.etatNeuf();
  assert.deepStrictEqual(H.seance(e, samedi), [], 'aucune carte avant la première étape');
  H.finirEtape(e, 'helico', samedi);
  H.finirEtape(e, 'vol', samedi);
  let s = H.creerSeance(e, samedi);
  assert.strictEqual(s.questions.length, H.NOUVELLES_PAR_JOUR, 'quatre cartes nouvelles par jour au plus');
  assert.ok(s.questions.every(q => HC.carte(q.carte).etape === 'helico'), 'dans l ordre des étapes');
  // Juste, juste, faux, juste : la carte fausse revient trois questions plus loin, seule la première réponse compte.
  H.repondre(s, e, true, samedi); H.suivante(s);
  H.repondre(s, e, true, samedi); H.suivante(s);
  const fausse = H.courante(s).carte;
  H.repondre(s, e, false, samedi);
  assert.strictEqual(s.questions.length, 5);
  assert.strictEqual(s.questions[4].carte, fausse);
  assert.ok(s.questions[4].retour);
  H.suivante(s);
  H.repondre(s, e, true, samedi); H.suivante(s);
  H.repondre(s, e, true, samedi); // le retour de la fausse : ne compte pas
  assert.strictEqual(H.boite(e, fausse), 1, 'une erreur : boîte 1, sans punition');
  assert.strictEqual(H.lire(e, fausse).prochain, '2026-11-07', 'revue le jour même');
  assert.strictEqual(H.boite(e, s.questions[0].carte), 1);
  assert.strictEqual(H.lire(e, s.questions[0].carte).debut, '2026-11-07');
  assert.deepStrictEqual(H.avancement(s), { n: 4, total: 4 });
  // Le même jour : plus de carte nouvelle, seulement celle à revoir.
  s = H.creerSeance(e, samedi);
  assert.deepStrictEqual(s.questions.map(q => q.carte), [fausse]);
  // Le lendemain : les cartes de la veille reviennent, et quatre nouvelles au plus.
  s = H.creerSeance(e, plus(samedi, 1));
  const dues = s.questions.filter(q => H.lire(e, q.carte));
  assert.strictEqual(dues.length, 4);
  assert.ok(s.questions.length <= H.TAILLE_SEANCE);
  assert.ok(s.questions.length - dues.length <= H.NOUVELLES_PAR_JOUR);
}

// ---------- Le carnet : un tampon par commande maîtrisée, jamais retiré (D-25) ----------
{
  const e = H.etatNeuf();
  ['helico', 'vol', 'cockpit'].forEach(id => H.finirEtape(e, id, samedi));
  const jours = [0, 1, 2].map(n => plus(samedi, n * 3));
  jours.forEach(d => ['c-collectif', 'c-monter'].forEach(id => {
    const s = { questions: [{ carte: id }], index: 0, vues: new Set(), montees: [] };
    H.repondre(s, e, true, d);
  }));
  assert.strictEqual(H.boite(e, 'c-collectif'), 3);
  assert.ok(H.maitrisee(e, 'collectif') && !H.maitrisee(e, 'manche'));
  assert.deepStrictEqual(H.majBrevet(e, plus(samedi, 6)), ['collectif']);
  assert.deepStrictEqual(H.majBrevet(e, plus(samedi, 7)), [], 'un tampon ne se gagne qu une fois');
  assert.deepStrictEqual(H.tamponsAMontrer(e), ['collectif'], 'l animation se joue une fois');
  H.tamponMontre(e, 'collectif');
  assert.deepStrictEqual(H.tamponsAMontrer(e), []);
  // Une erreur plus tard : la carte redescend, le tampon reste (aucune perte).
  const s = { questions: [{ carte: 'c-monter' }], index: 0, vues: new Set(), montees: [] };
  H.repondre(s, e, false, plus(samedi, 20));
  assert.strictEqual(H.boite(e, 'c-monter'), 1);
  H.majBrevet(e, plus(samedi, 20));
  assert.ok(e.brevet.collectif, 'le tampon reste');
  assert.strictEqual(H.ouverte(e, 'atelier'), true, 'le carnet n ouvre ni ne ferme rien');
}

// ---------- L'expérience : trois mesures par modèle, la durée du milieu, aucune vitesse ----------
{
  const e = H.etatNeuf();
  assert.ok(!H.mesuresCompletes(e));
  HC.ATELIER.modeles.forEach((m, i) => [0, 1, 2].forEach(r => H.noterMesure(e, m.id, r, 10 + i * 3 + r)));
  assert.ok(H.mesuresCompletes(e));
  assert.deepStrictEqual(e.experience.mesures.court, [10, 11, 12]);
  assert.strictEqual(H.milieu([14, 9, 11]), 11);
  assert.strictEqual(H.milieu([12, 14]), 13);
  assert.strictEqual(H.milieu([]), null);
  assert.strictEqual(H.noterMesure(e, 'long', 1, 0)[1], 1, 'une durée nulle devient un dixième');
  assert.strictEqual(H.noterMesure(e, 'long', 1, 5000)[1], 999);
}

// ---------- Le résumé du portail (contrat de l'architecture, section 8) ----------
{
  const R = globalThis.HeliResume;
  const e = H.etatNeuf();
  let r = R.resume(e, samedi);
  assert.deepStrictEqual(r.progres.phrase, { en: 'New!', fr: 'Nouveau !' });
  assert.strictEqual(r.du.nature, 'decouverte');
  assert.strictEqual(r.fini, null);
  assert.ok(/pas encore commencé/.test(r.parent));
  // Une étape finie aujourd'hui : la séance du jour est faite, la suite est pour demain (D-22, point 10).
  H.finirEtape(e, 'helico', samedi);
  H.finirSeance(e, samedi);
  r = R.resume(e, samedi);
  assert.deepStrictEqual(r.fini, { jour: '2026-11-07', nature: 'seance', minutes: 5 });
  assert.strictEqual(r.du.des, '2026-11-08');
  assert.strictEqual(r.du.nature, 'decouverte', 'la prochaine étape');
  assert.deepStrictEqual(r.progres.aujourdhui, { en: '+1 step', fr: '+1 étape' });
  assert.deepStrictEqual(r.progres.phrase, { en: '1 of 7 steps', fr: '1 étape sur 7' });
  e.brevet = { collectif: '2026-11-20', manche: '2026-11-21', pedales: '2026-11-22' };
  ['vol', 'cockpit', 'atelier', 'radio', 'records', 'sortie'].forEach(id => H.finirEtape(e, id, samedi));
  r = R.resume(e, plus(samedi, 30));
  assert.deepStrictEqual(r.progres.phrase, { en: '7 of 7 steps · 3 stamps', fr: '7 étapes sur 7 · 3 tampons' });
  assert.ok(r.progres.avancement > 0 && r.progres.avancement < 1);
  assert.ok(r.progres.phrase.fr.length <= 28 && r.progres.phrase.en.length <= 28);
}

console.log('helicopteres : moteur, état, carnet, expérience et résumé OK');
