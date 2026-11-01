'use strict';
/* Les résumés que les tables et le zoom publient pour le portail (D-19, contrat dans docs/ARCHITECTURE.md). */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const racine = path.join(__dirname, '..');
function charger(fichiers) {
  const contexte = { console };
  contexte.globalThis = contexte;
  vm.createContext(contexte);
  fichiers.forEach(f => vm.runInContext(fs.readFileSync(path.join(racine, f), 'utf8'), contexte));
  return contexte;
}
const g = charger([
  'commun/textes.js', 'modules/tables/moteur.js', 'modules/tables/album.js', 'modules/tables/resume.js',
  'modules/zoom/contenu.js', 'modules/zoom/moteur.js', 'modules/zoom/resume.js', 'commun/portail.js',
]);
const T = g.Tables;
const Z = g.Zoom;
const copie = o => JSON.parse(JSON.stringify(o));
const MERCREDI = new Date(2026, 10, 4, 17); // mercredi 4 novembre 2026, 17 h
const INTERDIT = /%|\brang\b|perdu|lost|streak|série/i;

function verifierForme(r) {
  assert.ok(r.progres && r.progres.phrase.en && r.progres.phrase.fr, 'phrase dans les deux langues');
  assert.ok(r.progres.phrase.en.length <= 28 && r.progres.phrase.fr.length <= 28, `phrase de 28 caractères au plus : ${r.progres.phrase.fr}`);
  assert.ok(!INTERDIT.test(r.progres.phrase.en + r.progres.phrase.fr), 'ni pourcentage, ni rang, ni perte');
  if (r.du) {
    assert.ok(['revision', 'seance', 'decouverte'].includes(r.du.nature));
    assert.ok(r.du.minutes >= 2 && r.du.minutes <= 8);
    assert.ok(r.du.phrase.en.length <= 28 && r.du.phrase.fr.length <= 28);
  }
  assert.ok(Array.isArray(r.jours) && r.jours.length <= 14);
  assert.equal(typeof r.parent, 'string');
  // Le portail le lit sans rien perdre.
  const lu = g.Portail.nettoyerResume(Object.assign({ version: 1, ecritLe: '2026-11-04T16:00:00Z' }, copie(r)));
  assert.deepEqual(copie(lu.jours), copie(r.jours));
  assert.equal(!!lu.du, !!r.du);
}

/* ---------- Tables ---------- */
const tables = (etat) => g.TablesResume.resume(etat, MERCREDI);

test('tables : avant le diagnostic, une découverte due aujourd\'hui, rien en tampons', () => {
  const r = tables(T.etatNeuf());
  verifierForme(r);
  assert.equal(r.du.nature, 'decouverte');
  assert.equal(r.du.des, '2026-11-04');
  assert.equal(r.progres.avancement, 0);
  assert.equal(r.progres.phrase.en, 'New!');
  assert.equal(r.progres.aujourdhui, null);
  assert.equal(r.parent, "Les tables n'ont pas encore commencé.");
});

function etatTables() {
  const e = Object.assign(T.etatNeuf(), { diagnostic: true, familles: 3, jours: ['2026-10-01', '2026-10-30', '2026-11-02'] });
  T.faitsDeFamille(0).concat(T.faitsDeFamille(1)).forEach(([a, b]) => {
    e.faits[T.cle(a, b)] = { boite: 2, vu: true, prochain: '2026-11-08', justesJours: [], erreurs: 0, dernierTemps: 2000 };
  });
  e.faits['2x3'] = { boite: 3, vu: true, prochain: '2026-11-03', justesJours: [], erreurs: 0, tampons: ['2026-10-30', '2026-11-02'] };
  e.faits['3x2'] = { boite: 3, vu: true, prochain: '2026-11-04', justesJours: [], erreurs: 1 };
  e.faits['2x5'] = { boite: 2, vu: true, prochain: '2026-11-05', justesJours: [], erreurs: 0, tampons: ['2026-11-04'] };
  e.faits['7x7'] = { boite: 1, vu: true, prochain: '2026-11-01', justesJours: [], erreurs: 0 }; // famille pas encore ouverte
  return e;
}

test('tables : les cartes qui reviennent aujourd\'hui, comptées par paire, familles ouvertes seulement', () => {
  const r = tables(etatTables());
  verifierForme(r);
  assert.equal(r.du.nature, 'revision');
  assert.equal(r.du.des, '2026-11-04');
  assert.equal(r.du.phrase.en, '1 card comes back', '2 × 3 et 3 × 2 sont la même carte ; 7 × 7 n\'est pas ouvert');
  assert.equal(r.progres.phrase.en, '3 stamps');
  assert.equal(r.progres.aujourdhui.en, '+1 stamp');
  assert.equal(r.progres.jour, '2026-11-04');
  assert.ok(r.progres.avancement > 0 && r.progres.avancement < 0.05);
  assert.deepEqual(copie(r.jours), ['2026-10-30', '2026-11-02'], 'les 14 derniers jours seulement');
  assert.match(r.parent, /^Les tables : /);
  assert.match(r.parent, /Album : 3 tampons, 0 carte en or\./);
});

test('tables (D-22, point 10) : une réponse seule laisse la séance due ; une séance finie annonce celle de demain', () => {
  const e = etatTables();
  e.jours.push('2026-11-04'); // une réponse donnée aujourd'hui, puis retour à l'accueil
  let r = tables(e);
  assert.equal(r.du.des, '2026-11-04', 'pas encore finie : toujours due aujourd\'hui');
  assert.equal(r.fini, null);
  const lire = res => [{ id: 'tables', matiere: 'maths', etat: 'actif', decouvrable: true, resume: g.Portail.nettoyerResume(Object.assign({ version: 1 }, copie(res))) }];
  assert.equal(g.Portail.planDuJour(lire(r), '2026-11-04').activites.length, 1, 'les tables restent dans le « Today »');
  // L'écran de fin : la nature est celle que le résumé proposait à l'ouverture.
  e.resume = copie(r);
  T.finirSeance(e, MERCREDI);
  assert.deepEqual(copie(e.seanceFinie), { jour: '2026-11-04', nature: 'revision' });
  r = tables(e);
  verifierForme(r);
  assert.equal(r.du.des, '2026-11-05');
  assert.equal(r.du.phrase.en, '2 cards come back', '2 × 3 et 2 × 5 reviennent demain');
  assert.deepEqual(copie(r.fini), { jour: '2026-11-04', nature: 'revision', minutes: 5 });
  const portail = g.Portail.planDuJour(lire(r), '2026-11-04');
  assert.equal(portail.activites.length, 0, 'rien de plus aujourd\'hui');
  assert.equal(portail.finis, 1, 'la séance finie garde sa place dans le plafond');
  assert.equal(portail.faitAujourdhui, true);
  // Une deuxième séance le même jour ne change pas la nature de la première.
  e.resume = copie(r);
  T.finirSeance(e, MERCREDI);
  assert.equal(e.seanceFinie.nature, 'revision');
});

test('tables : le premier jour, la séance finie est la découverte', () => {
  const e = T.etatNeuf();
  e.resume = copie(tables(e)); // publié à l'ouverture : « Let's begin »
  Object.assign(e, { diagnostic: true, jours: ['2026-11-04'] });
  T.finirSeance(e, MERCREDI);
  assert.equal(tables(e).fini.nature, 'decouverte');
});

test('tables : sans carte due, la séance du jour ; toutes dorées, la phrase le dit', () => {
  const e = etatTables();
  Object.values(e.faits).forEach(f => { f.prochain = '2026-12-01'; });
  assert.equal(tables(e).du.nature, 'seance');
  assert.equal(tables(e).du.phrase.en, "Today's practice");
  const or = Object.assign(T.etatNeuf(), { diagnostic: true, familles: 6 });
  g.Album.PAIRES.forEach(([a, b]) => { or.faits[T.cle(a, b)] = { boite: 5, vu: true, prochain: '2026-12-01', justesJours: [], tampons: ['2026-01-01', '2026-01-02', '2026-01-03', '2026-01-04'] }; });
  const r = tables(or);
  verifierForme(r);
  assert.equal(r.progres.phrase.en, 'All 36 gold!');
  assert.equal(r.progres.avancement, 1);
});

test('tables (D-22, point 9) : tout l\'album en or et rien de dû, la prochaine révision prévue, pas une séance chaque jour', () => {
  const or = Object.assign(T.etatNeuf(), { diagnostic: true, familles: 6 });
  g.Album.PAIRES.forEach(([a, b]) => {
    const f = { boite: 5, vu: true, prochain: '2026-12-01', justesJours: [], tampons: ['2026-01-01', '2026-01-02', '2026-01-03', '2026-01-04'] };
    or.faits[T.cle(a, b)] = f;
    or.faits[T.cle(b, a)] = Object.assign({}, f);
  });
  or.faits['6x7'].prochain = '2026-11-20';
  or.faits['7x6'].prochain = '2026-11-20';
  let r = tables(or);
  verifierForme(r);
  assert.equal(r.du.nature, 'revision');
  assert.equal(r.du.des, '2026-11-20');
  assert.equal(r.du.phrase.en, '1 card comes back', '6 × 7 et 7 × 6 sont la même carte');
  assert.equal(g.Portail.planDuJour([{ id: 'tables', matiere: 'maths', etat: 'actif', decouvrable: true, resume: g.Portail.nettoyerResume(Object.assign({ version: 1 }, copie(r))) }], '2026-11-04').activites.length, 0);
  // Le jour venu, la révision est due ; une carte qui revient aujourd'hui l'est tout de suite.
  or.faits['3x4'].prochain = '2026-11-04';
  r = tables(or);
  assert.equal(r.du.des, '2026-11-04');
  assert.equal(r.du.phrase.en, '1 card comes back');
});

/* ---------- Zoom ---------- */
const zoom = (etat, enfant = 'clara') => g.ZoomResume.resume(etat, enfant, MERCREDI);

test('zoom : avant le grand voyage, le voyage est la découverte du jour', () => {
  const r = zoom(Z.etatNeuf());
  verifierForme(r);
  assert.equal(r.du.nature, 'decouverte');
  assert.equal(r.du.phrase.en, 'The big journey');
  assert.equal(r.progres.avancement, 0);
  assert.equal(r.parent, "Le voyage n'a pas encore commencé.");
});

test('zoom : les lieux qui reviennent, les lieux montés aujourd\'hui, l\'avancement sur le programme de l\'enfant', () => {
  const prog = g.ZoomContenu.programme('clara');
  const lieux = prog.etages[0].lieux;
  const e = Object.assign(Z.etatNeuf(), { intro: true, jours: ['2026-11-03'] });
  e.cartes[lieux[0] + '|toucher'] = { boite: 1, vu: true, prochain: '2026-11-04', justesJours: ['2026-11-03'], erreurs: 0 };
  e.cartes[lieux[1] + '|toucher'] = { boite: 3, vu: true, prochain: '2026-11-08', justesJours: ['2026-11-04'], erreurs: 0 };
  e.cartes[lieux[1] + '|nommer'] = { boite: 1, vu: true, prochain: '2026-11-04', justesJours: [], erreurs: 0 };
  const r = zoom(e);
  verifierForme(r);
  assert.equal(r.du.nature, 'revision');
  assert.equal(r.du.phrase.en, '2 places come back');
  assert.equal(r.progres.aujourdhui.en, '+1 place');
  const total = prog.etages.reduce((n, x) => n + x.lieux.length, 0);
  assert.equal(r.progres.phrase.en, `2 of ${total} places`);
  assert.ok(Math.abs(r.progres.avancement - 2 / total) < 1e-9);
  assert.match(r.parent, /^Le voyage : 2 lieux découverts sur \d+/);
});

test('zoom (D-22, point 10) : le voyage ne sort du « Today » qu\'une séance finie', () => {
  const e = Object.assign(Z.etatNeuf(), { intro: false, jours: ['2026-11-04'] }); // une réponse, pas finie
  assert.equal(zoom(e).du.des, '2026-11-04');
  e.resume = copie(zoom(e));
  e.intro = true;
  Z.finirSeance(e, MERCREDI);
  const r = zoom(e);
  verifierForme(r);
  assert.deepEqual(copie(r.fini), { jour: '2026-11-04', nature: 'decouverte', minutes: 5 }, 'le grand voyage est la découverte du jour');
  assert.ok(r.du.des > '2026-11-04', 'la suite est pour demain');
});

test('zoom : rien de dû ni de nouveau, la prochaine révision est annoncée à sa date', () => {
  const prog = g.ZoomContenu.programme('henri');
  const e = Object.assign(Z.etatNeuf(), { intro: true, etages: 1, jours: ['2026-11-01'] });
  prog.etages[0].lieux.forEach((l, i) => {
    e.cartes[l + '|toucher'] = { boite: 4, vu: true, prochain: i ? '2026-11-20' : '2026-11-11', justesJours: [], erreurs: 0 };
    e.cartes[l + '|nommer'] = { boite: 3, vu: true, prochain: '2026-11-20', justesJours: [], erreurs: 0 };
  });
  const r = zoom(e, 'henri');
  verifierForme(r);
  assert.equal(r.du.des, '2026-11-11');
  assert.equal(r.du.phrase.en, '1 place comes back');
});
