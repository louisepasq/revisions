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
  // Au plus quatre faits nouveaux par jour, et non par séance (D-20) : une deuxième séance le
  // même jour ne révise que des faits déjà vus.
  const NOUVEAUX_PAR_JOUR = 4;
  const TAILLE_SEANCE = 20;
  const SEUIL_DEBLOCAGE = 0.8;
  const TAMPONS_OR = 4;
  // Version 2 : l'album à tampons (D-20). Les jours de tampon d'une carte (paire de 2 à 9) sont
  // rangés dans le fait écrit petit facteur d'abord : faits['7x8'].tampons pour 7 × 8 et 8 × 7.
  const VERSION = 2;

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

  /* Astuce après une erreur (relecture du 01/11/2026, point 6) : jamais un détour plus dur
     que le résultat. Le facteur de la table qui sert reste à sa place dans la question
     (pour 6 × 7, « 3 × 7 » et non « 7 × 3 ») : l'enfant y retrouve sa question.
     Avec l'état, n × (n + 1) passe par le carré n × n quand celui-ci est su par cœur.
     À faire valider par les maîtresses avant de figer les formules. */
  function astuce(a, b, etat) {
    const p = a * b;
    const ecrit = `${a} × ${b}`;
    // Remplace le facteur f de la question par v, en gardant l'autre à sa place.
    const avec = (f, v) => (a === f ? `${v} × ${b}` : `${a} × ${v}`);
    const autre = f => (a === f ? b : a);
    if (a === 1 || b === 1) return `Fois 1, le nombre ne change pas : ${ecrit} = ${p}.`;
    if (a === 10 || b === 10) return `${ecrit}, c'est ${autre(10)} dizaines : ${p}.`;
    if (a === b) {
      const carre = `${ecrit}, c'est un carré. `;
      if (a === 6) return carre + `6 × 5 = 30, plus 6 : 36.`;
      if (a === 7) return carre + `7 × 5 = 35, plus 7 × 2 = 14 : 49.`;
      if (a === 8) return carre + `8 × 4 = 32, et le double de 32, c'est 64.`;
    }
    if ((a === 9 || b === 9) && autre(9) >= 3) {
      const n = autre(9);
      return `${avec(9, 10)} = ${n * 10}, moins ${n} : ${p}.`;
    }
    const petit = Math.min(a, b);
    if (etat && Math.abs(a - b) === 1 && petit >= 6 && couleur(etat, petit, petit) === 'or') {
      return `${petit} × ${petit} = ${petit * petit}, plus ${petit} : ${p}.`;
    }
    const { table: t, autre: n } = tableDuFait(a, b);
    switch (t) {
      case 5: return `${avec(5, 10)} = ${n * 10}, et la moitié de ${n * 10}, c'est ${p}.`;
      case 2: return `${ecrit}, c'est le double de ${n} : ${p}.`;
      case 4: return `${avec(4, 2)} = ${n * 2}, et le double de ${n * 2}, c'est ${p}.`;
      case 8: return `${avec(8, 4)} = ${n * 4}, et le double de ${n * 4}, c'est ${p}.`;
      case 3: return `Le double de ${n}, c'est ${n * 2}, plus ${n} : ${p}.`;
      case 6: return `${avec(6, 3)} = ${n * 3}, et le double de ${n * 3}, c'est ${p}.`;
      default: return `${ecrit} = ${p}.`;
    }
  }

  /* ---------- Phrases lues par la voix fr-FR (décision de Louis du 01/11/2026) ----------
     Toujours en toutes lettres, jamais le signe × : « neuf fois cinq, quarante-cinq ». */
  const UNITES = ['zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix',
    'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
  const DIZAINES = { 2: 'vingt', 3: 'trente', 4: 'quarante', 5: 'cinquante', 6: 'soixante' };
  function enLettres(n) {
    if (!Number.isInteger(n) || n < 0 || n > 100) return String(n);
    if (n < 20) return UNITES[n];
    if (n === 100) return 'cent';
    if (n < 70) {
      const d = Math.floor(n / 10);
      const u = n % 10;
      return DIZAINES[d] + (u === 0 ? '' : u === 1 ? ' et un' : '-' + UNITES[u]);
    }
    if (n < 80) return n === 71 ? 'soixante et onze' : 'soixante-' + UNITES[n - 60];
    if (n === 80) return 'quatre-vingts';
    return 'quatre-vingt-' + UNITES[n - 80];
  }
  function faitDit(a, b) {
    return `${enLettres(a)} fois ${enLettres(b)}, ${enLettres(a * b)}`;
  }
  /* multiple : « un multiple de » ou « dans la table de », comme à l'écran. */
  function questionDite(q, multiple) {
    if (q.type === 'manquant') return `${enLettres(q.a)} fois combien font ${enLettres(q.a * q.b)} ?`;
    if (q.type === 'decomposition') return `${enLettres(q.produit)}, c'est quel produit ?`;
    if (q.type === 'multiple') return `${enLettres(q.nombre)} est-il ${multiple || 'un multiple de'} ${enLettres(q.a)} ?`;
    return `${enLettres(q.a)} fois ${enLettres(q.b)}`;
  }

  function etatNeuf() {
    return { version: VERSION, faits: {}, familles: 1, diagnostic: false, jours: [], records: [] };
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

  /* Les 36 paires de 2 à 9, chacune dans l'état le plus faible de ses deux ordres :
     la grille, l'accueil et le coin parent comptent ainsi sur le même dénominateur (point 10). */
  const RANG_ETAT = { gris: 0, bronze: 1, argent: 2, or: 3 };
  function etatsDesPaires(etat) {
    const l = [];
    for (let a = 2; a <= 9; a++) for (let b = a; b <= 9; b++) {
      const c1 = couleur(etat, a, b);
      const c2 = couleur(etat, b, a);
      l.push({ a, b, couleur: RANG_ETAT[c1] <= RANG_ETAT[c2] ? c1 : c2 });
    }
    return l;
  }

  /* Pour le coin parent : les paires de 2 à 9 ratées (en séance ou au diagnostic) et pas
     encore remontées, et celles justes mais encore lentes. */
  function fragiles(etat) {
    const rates = [];
    const lents = [];
    for (let a = 2; a <= 9; a++) for (let b = a; b <= 9; b++) {
      const deux = [etat.faits[cle(a, b)], etat.faits[cle(b, a)]].filter(f => f && f.vu);
      if (!deux.length) continue;
      const ecrit = `${a} × ${b}`;
      const erreurs = deux.reduce((s, f) => s + (f.erreurs || 0), 0);
      if (deux.some(f => f.erreurs > 0 && f.boite <= 2)) rates.push({ ecrit, erreurs });
      else if (deux.some(f => f.dernierJuste && f.dernierTemps != null && f.dernierTemps > RAPIDE_MS && f.boite < 4)) lents.push({ ecrit });
    }
    rates.sort((x, y) => y.erreurs - x.erreurs);
    return { rates: rates.map(x => x.ecrit), lents: lents.map(x => x.ecrit) };
  }

  /* ---------- L'album à tampons (D-20) ----------
     Une carte par paire de 2 à 9 (7 × 8 et 8 × 7 sur la même carte), quatre tampons, un par jour.
     - Tampons 1 à 3 : un jour où un fait de la paire sort juste et monte de boîte.
     - Tampon 4, l'or : un autre jour, à une révision prévue (le fait était dû), réponse juste et
       rapide, et les deux sens en boîte 4 ou plus.
     - Un tampon ne redescend jamais ; une carte dorée reste dorée. Seul le coin parent montre
       l'état réel (boîtes). Les familles s'ouvrent sur les boîtes réelles (majFamilles), jamais
       sur les tampons. */
  const estCarte = (a, b) => a >= 2 && a <= 9 && b >= 2 && b <= 9;
  const cleCarte = (a, b) => cle(Math.min(a, b), Math.max(a, b));

  function tampons(etat, a, b) {
    const f = etat.faits[cleCarte(a, b)];
    return f && Array.isArray(f.tampons) ? f.tampons.slice().sort().slice(0, TAMPONS_OR) : [];
  }

  function estOr(etat, a, b) {
    return tampons(etat, a, b).length >= TAMPONS_OR;
  }

  function deuxSens(etat, a, b, boite) {
    return [cle(a, b), cle(b, a)].every(k => ((etat.faits[k] || {}).boite || 0) >= boite);
  }

  /* Une carte dorée qui retombe (erreur) reste dorée et affiche « Comes back tomorrow » ;
     le signe part dès que le fait est de nouveau retrouvé juste. */
  function aRevoir(etat, a, b) {
    if (!estOr(etat, a, b)) return false;
    return [cle(a, b), cle(b, a)].some(k => { const f = etat.faits[k]; return f && f.vu && f.dernierJuste === false; });
  }

  /* o : { monte, du, rapide }. Rend 'tampon', 'or' ou null. */
  function tamponner(etat, a, b, j, o) {
    if (!estCarte(a, b)) return null;
    const actuels = tampons(etat, a, b);
    if (actuels.length >= TAMPONS_OR || actuels.includes(j)) return null;
    let gain = null;
    if (actuels.length < TAMPONS_OR - 1) gain = o.monte ? 'tampon' : null;
    else if (o.du && o.rapide && deuxSens(etat, a, b, 4)) gain = 'or';
    if (!gain) return null;
    const c = fait(etat, Math.min(a, b), Math.max(a, b));
    c.tampons = actuels.concat(j);
    return gain;
  }

  /* Progression enregistrée avant l'album : les tampons se déduisent des jours justes
     (justesJours) des deux sens, trois au plus, et le quatrième seulement si les deux sens sont
     aujourd'hui en boîte 4 ou plus. Rien n'est perdu : boîtes et jours restent tels quels. */
  function migrer(etat) {
    if (!etat || typeof etat !== 'object') return etat;
    if (!etat.faits || typeof etat.faits !== 'object') etat.faits = {};
    if ((etat.version || 1) >= VERSION) return etat;
    for (let a = 2; a <= 9; a++) for (let b = a; b <= 9; b++) {
      const jours = new Set();
      [cle(a, b), cle(b, a)].forEach(k => ((etat.faits[k] || {}).justesJours || []).forEach(x => jours.add(x)));
      const deja = (etat.faits[cle(a, b)] || {}).tampons || [];
      deja.forEach(x => jours.add(x));
      const l = [...jours].sort();
      if (!l.length) continue;
      const t = l.slice(0, TAMPONS_OR - 1);
      if (l.length >= TAMPONS_OR && deuxSens(etat, a, b, 4)) t.push(l[TAMPONS_OR - 1]);
      fait(etat, a, b).tampons = t;
    }
    etat.version = VERSION;
    return etat;
  }

  /* Rend { monte, rapide, tampon } ; tampon vaut 'tampon', 'or' ou null (D-20). */
  function enregistrer(etat, a, b, juste, ms, maintenant) {
    const f = fait(etat, a, b);
    const j = jour(maintenant);
    // Révision prévue : le fait était déjà vu et dû ce jour-là.
    const du = !!(f.vu && f.prochain && f.prochain <= j);
    if (!f.vu) f.debut = j;
    f.vu = true;
    f.dernierTemps = ms;
    f.dernierJuste = !!juste;
    if (!etat.jours.includes(j)) etat.jours.push(j);
    if (!juste) {
      f.erreurs++;
      f.boite = 1;
      f.prochain = j;
      return { monte: false, rapide: false, tampon: null };
    }
    const rapide = ms != null && ms <= RAPIDE_MS;
    const dejaMonteAujourdhui = f.justesJours.includes(j);
    let monte = false;
    if (rapide && !dejaMonteAujourdhui) {
      f.justesJours.push(j);
      // La boîte 4 (par cœur) ne se gagne qu'à une révision prévue (D-20, D-09) : jamais un jour
      // hors programme, où la séance complète avec des faits non dus.
      if (f.boite < BOITE_MAX && (f.boite !== 3 || du)) { f.boite++; monte = true; }
    } else if (f.boite < 3 && !dejaMonteAujourdhui) {
      f.boite++;
      monte = true;
      f.justesJours.push(j);
    }
    // Une réponse hors programme qui ne fait rien monter ne repousse pas la révision prévue.
    if (monte || du || !f.prochain) f.prochain = ajouterJours(j, INTERVALLE_JOURS[f.boite]);
    const tampon = tamponner(etat, a, b, j, { monte, du, rapide });
    return { monte, rapide, tampon };
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

  function nouveauxDuJour(etat, j) {
    return Object.values(etat.faits).filter(f => f && f.debut === j).length;
  }

  function seance(etat, maintenant, taille) {
    taille = taille || TAILLE_SEANCE;
    const j = jour(maintenant);
    const ouverts = tousLesFaits().filter(([a, b]) => familleDuFait(a, b) < etat.familles);
    const dus = ouverts
      .filter(([a, b]) => { const f = etat.faits[cle(a, b)]; return f && f.vu && f.prochain && f.prochain <= j; })
      .sort((x, y) => etat.faits[cle(...x)].prochain.localeCompare(etat.faits[cle(...y)].prochain) || etat.faits[cle(...x)].boite - etat.faits[cle(...y)].boite);
    // Quatre faits nouveaux par jour, toutes séances du jour comprises (D-20).
    const quota = Math.max(0, NOUVEAUX_PAR_JOUR - nouveauxDuJour(etat, j));
    const nouveaux = melanger(ouverts.filter(([a, b]) => !(etat.faits[cle(a, b)] || {}).vu), 'n' + j)
      .sort((x, y) => familleDuFait(...x) - familleDuFait(...y))
      .slice(0, quota);
    const acquis = ouverts.filter(([a, b]) => { const f = etat.faits[cle(a, b)]; return f && f.boite >= 4 && f.prochain > j; });
    const choix = [];
    const prendre = (liste, n) => { for (const x of liste) { if (choix.length >= n) break; if (!choix.some(c => c[0] === x[0] && c[1] === x[1])) choix.push(x); } };
    prendre(nouveaux, Math.min(taille, quota));
    prendre(dus, taille - 2);
    prendre(acquis.filter((_, i) => i % 3 === 0), taille);
    prendre(ouverts
      .filter(([a, b]) => { const f = etat.faits[cle(a, b)]; return a !== 1 && b !== 1 && f && f.vu && f.boite < 4; })
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

  /* Faux candidat d'une question « multiple » (point 11) : pas toujours le produit plus 1,
     qu'un enfant repère sans réfléchir. Un produit d'une table voisine (48 pour la table de 7),
     un nombre proche, pair quand c'est possible. */
  function leurre(a, b, index) {
    const p = a * b;
    const candidats = [(a - 1) * b, (a + 1) * b, p + 2, p - 2, p + 1, p - 1]
      .filter(n => n > 1 && n <= 100 && n % a !== 0);
    return candidats.length ? candidats[(a + b + index) % candidats.length] : p + 1;
  }

  function question(etat, a, b, index) {
    let type = typeQuestion(etat.faits[cle(a, b)], index);
    // Un facteur 1 ne donne ni décomposition (seul 1 × p) ni question « multiple » (tout est multiple de 1).
    if (a === 1 || b === 1) type = 'produit';
    const p = a * b;
    if (type === 'manquant') return { type, a, b, texte: `${a} × ? = ${p}`, reponse: b };
    if (type === 'decomposition') return { type, a, b, texte: `? × ? = ${p}`, produit: p, reponse: [a, b] };
    if (type === 'multiple') {
      const vrai = index % 2 === 0;
      const n = vrai ? p : leurre(a, b, index);
      return { type, a, b, texte: `${n} est-il un multiple de ${a} ?`, nombre: n, reponse: n % a === 0 };
    }
    return { type: 'produit', a, b, texte: `${a} × ${b}`, reponse: p };
  }

  /* Décomposition (point 5) : deux nombres des tables, de 2 à 10. Un facteur 1 ou plus grand
     que 10 n'est pas une erreur mais une relance : « Essaie sans le 1 », sans rien enregistrer. */
  function relanceDecomposition(q, saisie) {
    if (q.type !== 'decomposition' || !Array.isArray(saisie)) return null;
    const [x, y] = saisie;
    if (!Number.isInteger(x) || !Number.isInteger(y) || x * y !== q.produit) return null;
    if (x === 1 || y === 1) return 'sans1';
    if (x > 10 || y > 10) return 'jusqua10';
    return null;
  }

  function verifier(q, saisie) {
    if (q.type === 'decomposition') {
      if (!Array.isArray(saisie)) return false;
      const [x, y] = saisie;
      return Number.isInteger(x) && Number.isInteger(y) && x >= 2 && y >= 2 && x <= 10 && y <= 10 && x * y === q.produit;
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
        // Un échec au diagnostic compte comme une erreur : le coin parent le liste (point 10).
        if (!r.juste) f.erreurs = (f.erreurs || 0) + 1;
        f.dernierJuste = !!r.juste;
        if (r.ms != null) f.dernierTemps = r.ms;
        f.boite = r.juste ? (r.ms <= RAPIDE_MS ? 3 : 2) : 1;
        f.prochain = ajouterJours(j, r.juste ? 1 : 0);
        if (r.juste && !f.justesJours.includes(j)) f.justesJours.push(j);
      });
      // Juste au diagnostic : les deux sens montent de boîte, la carte prend son tampon du jour.
      if (r.juste) tamponner(etat, r.a, r.b, j, { monte: true, du: false, rapide: false });
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
      return brut ? migrer(JSON.parse(brut)) : etatNeuf();
    } catch (e) {
      return etatNeuf();
    }
  }

  function sauver(enfant, etat) {
    try { localStorage.setItem(enfant + '.tables', JSON.stringify(etat)); return true; } catch (e) { return false; }
  }

  racine.Tables = {
    FAMILLES, RAPIDE_MS, TAILLE_SEANCE, NOUVEAUX_PAR_JOUR, TAMPONS_OR, VERSION,
    tampons, estOr, aRevoir, estCarte, cleCarte, migrer, nouveauxDuJour, ajouterJours,
    cle, jour, astuce, enLettres, faitDit, questionDite, etatNeuf, couleur, compteOr, etatsDesPaires, fragiles, enregistrer, majFamilles,
    seance, question, verifier, relanceDecomposition, questionsDiagnostic, appliquerDiagnostic,
    joursDeLaSemaine, familleDuFait, faitsDeFamille, charger, sauver,
  };
})(typeof window !== 'undefined' ? window : globalThis);
