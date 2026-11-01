/* Moteur du module des tables : boîtes de Leitner par résultat, familles débloquées
   dans l'ordre d'Eduscol, questions de quatre types, astuces, diagnostic.
   Script classique (pas de module ES) pour fonctionner aussi ouvert depuis le disque. */
(function (racine) {
  'use strict';

  const FAMILLES = [
    { id: 'faciles', tables: [1, 10, 5], nom: 'Les faciles' },
    { id: 'doubles', tables: [2], nom: 'Les doubles' },
    { id: 'quatre-huit', tables: [4, 8], nom: 'Doubles des doubles' },
    { id: 'trois-six', tables: [3, 6], nom: 'Le double plus un' },
    { id: 'neuf', tables: [9], nom: 'Dix moins un' },
    { id: 'sept', tables: [7], nom: 'Le boss final' },
  ];
  const RANG = {};
  FAMILLES.forEach((f, i) => f.tables.forEach(t => { RANG[t] = i; }));

  const INTERVALLE_JOURS = [0, 1, 2, 4, 7, 21];
  const BOITE_MAX = 5;
  const RAPIDE_MS = 3000;
  const NOUVEAUX_PAR_SEANCE = 4;
  const TAILLE_SEANCE = 20;
  const SEUIL_DEBLOCAGE = 0.8;

  const cle = (a, b) => a + 'x' + b;

  function familleDuFait(a, b) {
    return Math.min(RANG[a], RANG[b]);
  }

  function tableDuFait(a, b) {
    if (RANG[a] !== RANG[b]) return RANG[a] < RANG[b] ? { table: a, autre: b } : { table: b, autre: a };
    return { table: Math.min(a, b), autre: Math.max(a, b) };
  }

  function jour(date) {
    const d = new Date(date);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function ajouterJours(jourIso, n) {
    const [y, m, d] = jourIso.split('-').map(Number);
    return jour(new Date(y, m - 1, d + n));
  }

  function astuce(a, b) {
    const { table: t, autre: n } = tableDuFait(a, b);
    const p = a * b;
    const ecrit = `${a} × ${b}`;
    if (a === b && a > 2) return `${ecrit}, c'est un carré : ${p}. Les carrés servent de repères.`;
    switch (t) {
      case 1: return `Fois 1, le nombre ne change pas : ${ecrit} = ${p}.`;
      case 10: return `${n} × 10, c'est ${n} dizaines : ${p}.`;
      case 5: return `${n} × 5, c'est la moitié de ${n} × 10 = ${n * 10} : ${p}.`;
      case 2: return `${n} × 2, c'est le double de ${n} : ${p}.`;
      case 4: return `${n} × 2 = ${n * 2}, et le double de ${n * 2}, c'est ${p}.`;
      case 8: return `${n} × 4 = ${n * 4}, et le double de ${n * 4}, c'est ${p}.`;
      case 3: return `Le double de ${n}, c'est ${n * 2}, plus ${n} : ${p}.`;
      case 6: return `${n} × 3 = ${n * 3}, et le double de ${n * 3}, c'est ${p}.`;
      case 9: return `${n} × 10 = ${n * 10}, moins ${n} : ${p}.`;
      case 7: return `${n} × 6 = ${n * 6}, plus ${n} : ${p}.`;
      default: return `${ecrit} = ${p}.`;
    }
  }

  function etatNeuf() {
    return { version: 1, faits: {}, familles: 1, diagnostic: false, jours: [], records: [] };
  }

  function fait(etat, a, b) {
    const k = cle(a, b);
    if (!etat.faits[k]) etat.faits[k] = { boite: 0, vu: false, prochain: null, justesJours: [], erreurs: 0, dernierTemps: null };
    return etat.faits[k];
  }

  function couleur(etat, a, b) {
    const f = etat.faits[cle(a, b)];
    if (!f || !f.vu) return 'gris';
    if (f.boite >= 4) return 'or';
    if (f.boite === 3) return 'argent';
    if (f.boite >= 1) return 'bronze';
    return 'gris';
  }

  function tousLesFaits() {
    const l = [];
    for (let a = 1; a <= 10; a++) for (let b = 1; b <= 10; b++) l.push([a, b]);
    return l;
  }

  function faitsDeFamille(i) {
    return tousLesFaits().filter(([a, b]) => familleDuFait(a, b) === i);
  }

  function compteOr(etat) {
    let n = 0;
    for (let a = 2; a <= 9; a++) for (let b = a; b <= 9; b++) {
      if (couleur(etat, a, b) === 'or' && couleur(etat, b, a) === 'or') n++;
    }
    return n;
  }

  function enregistrer(etat, a, b, juste, ms, maintenant) {
    const f = fait(etat, a, b);
    const j = jour(maintenant);
    f.vu = true;
    f.dernierTemps = ms;
    if (!etat.jours.includes(j)) etat.jours.push(j);
    if (!juste) {
      f.erreurs++;
      f.boite = 1;
      f.prochain = j;
      return { monte: false };
    }
    const rapide = ms != null && ms <= RAPIDE_MS;
    const dejaMonteAujourdhui = f.justesJours.includes(j);
    let monte = false;
    if (rapide && !dejaMonteAujourdhui) {
      f.justesJours.push(j);
      if (f.boite < BOITE_MAX) { f.boite++; monte = true; }
    } else if (f.boite < 3 && !dejaMonteAujourdhui) {
      f.boite++;
      monte = true;
      f.justesJours.push(j);
    }
    f.prochain = ajouterJours(j, INTERVALLE_JOURS[f.boite]);
    return { monte, rapide };
  }

  function majFamilles(etat) {
    while (etat.familles < FAMILLES.length) {
      const faits = faitsDeFamille(etat.familles - 1);
      const acquis = faits.filter(([a, b]) => (etat.faits[cle(a, b)] || {}).boite >= 3).length;
      if (acquis / faits.length < SEUIL_DEBLOCAGE) break;
      etat.familles++;
    }
    return etat.familles;
  }

  function typeQuestion(f, index) {
    if (!f || f.boite < 2) return 'produit';
    const cycle = ['produit', 'produit', 'manquant', 'produit', 'decomposition', 'produit', 'multiple'];
    return cycle[index % cycle.length];
  }

  function seance(etat, maintenant, taille) {
    taille = taille || TAILLE_SEANCE;
    const j = jour(maintenant);
    const ouverts = tousLesFaits().filter(([a, b]) => familleDuFait(a, b) < etat.familles);
    const dus = ouverts
      .filter(([a, b]) => { const f = etat.faits[cle(a, b)]; return f && f.vu && f.prochain && f.prochain <= j; })
      .sort((x, y) => etat.faits[cle(...x)].prochain.localeCompare(etat.faits[cle(...y)].prochain) || etat.faits[cle(...x)].boite - etat.faits[cle(...y)].boite);
    const nouveaux = melanger(ouverts.filter(([a, b]) => !(etat.faits[cle(a, b)] || {}).vu), 'n' + j)
      .sort((x, y) => familleDuFait(...x) - familleDuFait(...y))
      .slice(0, NOUVEAUX_PAR_SEANCE);
    const acquis = ouverts.filter(([a, b]) => { const f = etat.faits[cle(a, b)]; return f && f.boite >= 4 && f.prochain > j; });
    const choix = [];
    const prendre = (liste, n) => { for (const x of liste) { if (choix.length >= n) break; if (!choix.some(c => c[0] === x[0] && c[1] === x[1])) choix.push(x); } };
    prendre(nouveaux, Math.min(taille, NOUVEAUX_PAR_SEANCE));
    prendre(dus, taille - 2);
    prendre(acquis.filter((_, i) => i % 3 === 0), taille);
    prendre(ouverts
      .filter(([a, b]) => a !== 1 && b !== 1 && (etat.faits[cle(a, b)] || {}).boite < 4)
      .sort((x, y) => etat.faits[cle(...x)].boite - etat.faits[cle(...y)].boite), taille);
    return melanger(choix, j).map(([a, b], i) => question(etat, a, b, i));
  }

  function melanger(liste, graine) {
    let s = 0;
    for (const c of graine) s = (s * 31 + c.charCodeAt(0)) >>> 0;
    const l = liste.slice();
    for (let i = l.length - 1; i > 0; i--) {
      s = (s * 1103515245 + 12345) >>> 0;
      const k = s % (i + 1);
      [l[i], l[k]] = [l[k], l[i]];
    }
    return l;
  }

  function question(etat, a, b, index) {
    const type = typeQuestion(etat.faits[cle(a, b)], index);
    const p = a * b;
    if (type === 'manquant') return { type, a, b, texte: `${a} × ? = ${p}`, reponse: b };
    if (type === 'decomposition') return { type, a, b, texte: `? × ? = ${p}`, produit: p, reponse: [a, b] };
    if (type === 'multiple') {
      const vrai = index % 2 === 0;
      const n = vrai ? p : p + (b > 1 ? 1 : 2);
      return { type, a, b, texte: `${n} est-il dans la table de ${a} ?`, nombre: n, reponse: n % a === 0 };
    }
    return { type: 'produit', a, b, texte: `${a} × ${b}`, reponse: p };
  }

  function verifier(q, saisie) {
    if (q.type === 'decomposition') {
      if (!Array.isArray(saisie)) return false;
      const [x, y] = saisie;
      return Number.isInteger(x) && Number.isInteger(y) && x > 0 && y > 0 && x * y === q.produit;
    }
    if (q.type === 'multiple') return saisie === q.reponse;
    return Number(saisie) === q.reponse;
  }

  function questionsDiagnostic() {
    const parFamille = FAMILLES.map((_, i) => melanger(faitsDeFamille(i).filter(([a, b]) => a <= b && a > 1), 'diag' + i).slice(0, 5));
    const ordre = [];
    for (let tour = 0; tour < 5; tour++) parFamille.forEach(l => { if (l[tour]) ordre.push(l[tour]); });
    return ordre.map(([a, b], i) => (i % 2 ? { type: 'produit', a: b, b: a, texte: `${b} × ${a}`, reponse: a * b } : { type: 'produit', a, b, texte: `${a} × ${b}`, reponse: a * b }));
  }

  function appliquerDiagnostic(etat, reponses, maintenant) {
    const j = jour(maintenant);
    const parFamille = FAMILLES.map(() => ({ justes: 0, total: 0 }));
    reponses.forEach(r => {
      const i = familleDuFait(r.a, r.b);
      parFamille[i].total++;
      if (r.juste) parFamille[i].justes++;
      [[r.a, r.b], [r.b, r.a]].forEach(([x, y]) => {
        const f = fait(etat, x, y);
        f.vu = true;
        f.boite = r.juste ? (r.ms <= RAPIDE_MS ? 3 : 2) : 1;
        f.prochain = ajouterJours(j, r.juste ? 1 : 0);
        if (r.juste && !f.justesJours.includes(j)) f.justesJours.push(j);
      });
    });
    let familles = 1;
    for (let i = 0; i < FAMILLES.length - 1; i++) {
      const s = parFamille[i];
      if (s.total && s.justes / s.total >= SEUIL_DEBLOCAGE) familles = i + 2; else break;
    }
    etat.familles = Math.max(etat.familles, familles);
    if (etat.familles > 1) {
      faitsDeFamille(0).filter(([a, b]) => a === 1 || b === 1 || a === 10 || b === 10).forEach(([a, b]) => {
        const f = fait(etat, a, b);
        if (f.vu) return;
        f.vu = true;
        f.boite = 3;
        f.prochain = ajouterJours(j, 7);
        f.justesJours.push(j);
      });
    }
    etat.diagnostic = true;
    return { familles: etat.familles, parFamille };
  }

  function joursDeLaSemaine(etat, maintenant) {
    const d = new Date(maintenant);
    const decalage = (d.getDay() + 6) % 7;
    const lundi = new Date(d.getFullYear(), d.getMonth(), d.getDate() - decalage);
    return Array.from({ length: 7 }, (_, i) => {
      const j = jour(new Date(lundi.getFullYear(), lundi.getMonth(), lundi.getDate() + i));
      return { jour: j, fait: etat.jours.includes(j), aujourdhui: i === decalage, avenir: i > decalage };
    });
  }

  function charger(enfant) {
    try {
      const brut = localStorage.getItem(enfant + '.tables');
      return brut ? JSON.parse(brut) : etatNeuf();
    } catch (e) {
      return etatNeuf();
    }
  }

  function sauver(enfant, etat) {
    try { localStorage.setItem(enfant + '.tables', JSON.stringify(etat)); return true; } catch (e) { return false; }
  }

  racine.Tables = {
    FAMILLES, RAPIDE_MS, TAILLE_SEANCE,
    cle, jour, astuce, etatNeuf, couleur, compteOr, enregistrer, majFamilles,
    seance, question, verifier, questionsDiagnostic, appliquerDiagnostic,
    joursDeLaSemaine, familleDuFait, faitsDeFamille, charger, sauver,
  };
})(typeof window !== 'undefined' ? window : globalThis);
