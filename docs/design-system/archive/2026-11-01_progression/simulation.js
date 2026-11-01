/* Simulation d'un enfant de CM1 sur 20 séances, avec le vrai moteur (modules/tables/moteur.js).
   Sert à chiffrer ce que voit l'enfant après 1, 5 et 20 séances, aujourd'hui et avec les mécaniques proposées.
   Lancer : node docs/design-system/archive/2026-11-01_progression/simulation.js
   Modèle d'enfant [appréciation] : justesse de base par famille, qui monte avec la boîte ;
   rapidité probable une fois le fait installé. Cinq séances par semaine, du lundi au vendredi. */
'use strict';
const path = require('path');
require(path.join(__dirname, '../../../../modules/tables/moteur.js'));
require(path.join(__dirname, '../../../../modules/tables/seance.js'));
const T = globalThis.Tables;
const S = globalThis.Seance;

let graine = Number(process.env.GRAINE || 5);
const hasard = () => { graine = (graine * 1103515245 + 12345) >>> 0; return (graine % 10000) / 10000; };
const BASE = [0.9, 0.78, 0.55, 0.5, 0.4, 0.35];
function repond(a, b, f) {
  const boite = f ? f.boite : 0;
  const p = Math.min(0.97, BASE[T.familleDuFait(a, b)] + 0.09 * boite);
  const juste = hasard() < p;
  const rapide = hasard() < (boite >= 2 ? 0.45 + 0.12 * boite : 0.25);
  return { juste, ms: rapide ? 2200 : 4800 };
}

const RANG = { gris: 0, bronze: 1, argent: 2, or: 3 };
const etat = T.etatNeuf();
const meilleure = {}; // le plus haut atteint par fait : la couche visuelle qui ne redescend jamais
let jourCourant = new Date(2026, 10, 2, 17, 0); // lundi 2 novembre 2026
const avancer = () => { do { jourCourant = new Date(jourCourant.getTime() + 86400000); } while ([0, 6].includes(jourCourant.getDay())); };

// Diagnostic : une minute, environ six secondes par question.
const diag = T.questionsDiagnostic().slice(0, 10).map(q => { const r = repond(q.a, q.b, null); return { a: q.a, b: q.b, juste: r.juste, ms: r.ms }; });
T.appliquerDiagnostic(etat, diag, jourCourant);
// Seule une réponse juste pose un tampon : une erreur met la boîte à 1 sans rien gagner.
Object.keys(etat.faits).forEach(k => { meilleure[k] = etat.faits[k].dernierJuste ? etat.faits[k].boite : 0; });

function paires() {
  const l = [];
  for (let a = 2; a <= 9; a++) for (let b = a; b <= 9; b++) l.push([a, b]);
  return l;
}
const couleurDeBoite = b => (b >= 4 ? 'or' : b === 3 ? 'argent' : b >= 1 ? 'bronze' : 'gris');
function photo(n, montees, nouveauxOr) {
  const p = paires();
  // Aujourd'hui : la paire prend l'état le plus faible de ses deux ordres, boîte courante (une erreur redescend).
  const auj = { gris: 0, bronze: 0, argent: 0, or: 0 };
  // Proposé : stade le plus haut jamais atteint ; pousse et bouton sur l'ordre le plus avancé, l'or exige les deux ordres.
  const prop = { gris: 0, bronze: 0, argent: 0, or: 0 };
  let marches = 0;
  p.forEach(([a, b]) => {
    const c1 = T.couleur(etat, a, b), c2 = T.couleur(etat, b, a);
    auj[RANG[c1] <= RANG[c2] ? c1 : c2]++;
    const m1 = meilleure[T.cle(a, b)] || 0, m2 = meilleure[T.cle(b, a)] || 0;
    const haut = couleurDeBoite(Math.max(m1, m2));
    const st = haut === 'or' && couleurDeBoite(Math.min(m1, m2)) !== 'or' ? 'argent' : haut;
    prop[st]++;
  });
  // Marches : chaque boîte gagnée, jusqu'à l'or, sur les 72 faits de 2 à 9 (288 au plus).
  Object.keys(meilleure).forEach(k => { const [a, b] = k.split('x').map(Number); if (a >= 2 && a <= 9 && b >= 2 && b <= 9) marches += Math.min(meilleure[k], 4); });
  return { n, montees, nouveauxOr, familles: etat.familles, orAuj: T.compteOr(etat), auj, prop, marches };
}

const lignes = [];
const instantanes = {};
let precedent = null;
const STATIONS = [[5], [2], [4, 8], [3, 6], [9], [7]];
/* Ce que dessinent les maquettes : par paire, les tampons (boîtes atteintes, ordre le plus avancé, 4 au plus)
   et l'or (les deux ordres en boîte 4 au moins) ; par station de la route, ses paires de 2 à 9. */
function instantane(n, ligne) {
  const cartes = paires().map(([a, b]) => {
    const m1 = meilleure[T.cle(a, b)] || 0, m2 = meilleure[T.cle(b, a)] || 0;
    const or = m1 >= 4 && m2 >= 4;
    // h1, h2 : tampons de chaque sens (a × b, puis b × a), 4 au plus ; un carré n'a qu'un sens, compté deux fois.
    return { a, b, famille: T.familleDuFait(a, b), tampons: or ? 4 : Math.min(3, Math.max(m1, m2)), or, h1: Math.min(m1, 4), h2: Math.min(m2, 4) };
  });
  const stations = STATIONS.map((tables, i) => {
    const l = cartes.filter(c => tables.includes(c.a) || tables.includes(c.b));
    const faits = T.faitsDeFamille(i);
    const pret = faits.filter(([a, b]) => (meilleure[T.cle(a, b)] || 0) >= 3).length / faits.length;
    return { tables, paires: l.length, or: l.filter(c => c.or).length, tampons: l.reduce((x, c) => x + c.tampons, 0), versLaSuivante: Math.min(1, pret / 0.8) };
  });
  return { seance: n, familles: etat.familles, cartes, stations, ligne };
}
precedent = instantane(0, {}); // l'état laissé par le diagnostic
instantanes[0] = precedent;
let orAvant = 0;
for (let n = 1; n <= 20; n++) {
  const s = S.creer(etat, jourCourant);
  let garde = 0;
  let etoiles = 0; // étoiles : un fait prévu aujourd'hui (dû ou nouveau), réussi du premier coup
  let rappels = 0; // rappels réussis : un fait dû aujourd'hui, retrouvé juste du premier coup
  const vusIci = new Set();
  const jIso = T.jour(jourCourant);
  while (!S.finie(s) && garde++ < 60) {
    const q = S.courante(s);
    const f = etat.faits[T.cle(q.a, q.b)];
    const r = repond(q.a, q.b, f);
    let saisie;
    if (q.type === 'decomposition') saisie = r.juste ? [q.a, q.b] : [0, 0];
    else if (q.type === 'multiple') saisie = r.juste ? q.reponse : !q.reponse;
    else if (q.type === 'manquant') saisie = r.juste ? q.b : -1;
    else saisie = r.juste ? q.a * q.b : -1;
    const etaitDu = f && f.vu && f.prochain && f.prochain <= jIso && !(f.justesJours || []).includes(jIso);
    const premier = !vusIci.has(T.cle(q.a, q.b));
    vusIci.add(T.cle(q.a, q.b));
    const res = S.repondre(s, etat, saisie, r.ms, jourCourant);
    if (res.juste && etaitDu && premier) rappels++;
    if (res.juste && premier && (etaitDu || !f || !f.vu)) etoiles++;
    if (!res.juste) S.retaper(s, q.a * q.b);
    S.suivante(s);
  }
  const b = S.bilan(s, etat, jourCourant);
  let pas = 0;
  Object.keys(etat.faits).forEach(k => {
    const [x, y] = k.split('x').map(Number);
    const avant = Math.min(meilleure[k] || 0, 4);
    meilleure[k] = meilleure[k] || 0;
    if (etat.faits[k].dernierJuste) meilleure[k] = Math.max(meilleure[k] || 0, etat.faits[k].boite);
    if (x >= 2 && x <= 9 && y >= 2 && y <= 9) pas += Math.min(meilleure[k], 4) - avant;
  });
  const or = T.compteOr(etat);
  const p = photo(n, new Set(b.montees.map(m => T.cle(m.a, m.b))).size, Math.max(0, or - orAvant));
  p.pas = pas;
  p.rappels = rappels;
  p.etoiles = etoiles;
  p.jour = T.jour(jourCourant);
  const ici = instantane(n, p);
  // Les cartes qui ont pris un tampon (ou l'or) pendant cette séance, pour l'écran de fin.
  if (precedent) p.tamponnees = ici.cartes.filter((c, i) => c.h1 + c.h2 > precedent.cartes[i].h1 + precedent.cartes[i].h2).map(c => `${c.a}x${c.b}:${c.h1}${c.h2}`);
  p.tampons = ici.cartes.reduce((x, c) => x + c.h1 + c.h2, 0);
  precedent = ici;
  if ([1, 5, 6, 20].includes(n)) instantanes[n] = ici;
  lignes.push(p);
  orAvant = or;
  avancer();
}

const semaines = [];
lignes.forEach((l, i) => { const w = Math.floor(i / 5); semaines[w] = semaines[w] || { jours: 0, etoiles: 0, nouveauxOr: 0 }; semaines[w].jours++; semaines[w].etoiles += l.etoiles; semaines[w].nouveauxOr += l.nouveauxOr; });
require('fs').writeFileSync(path.join(__dirname, 'simulation.json'), JSON.stringify({ instantanes, semaines, lignes: lignes.map(l => ({ n: l.n, jour: l.jour, etoiles: l.etoiles, pas: l.pas, rappels: l.rappels, orAuj: l.orAuj, montees: l.montees, tampons: l.tampons, tamponnees: l.tamponnees })) }, null, 1));
console.log('séance | cases montées (écran actuel) | marches gagnées | rappels réussis | étoiles | familles | or (compté aujourd\'hui) | aujourd\'hui g/b/a/o | proposé g/b/a/o | marches');
lignes.forEach(l => console.log([l.n, l.montees, l.pas, l.rappels, l.etoiles, l.familles, l.orAuj,
  `${l.auj.gris}/${l.auj.bronze}/${l.auj.argent}/${l.auj.or}`,
  `${l.prop.gris}/${l.prop.bronze}/${l.prop.argent}/${l.prop.or}`, l.marches].join(' | ')));
