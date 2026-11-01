/* Portail d'un enfant, en cahiers par matière (D-19) : le bandeau (mascotte, prénom, semaine),
   la carte « Today » avec son seul bouton Start, un cahier par matière qui ouvre la page de la
   matière, la vue « My week » (touchée depuis la semaine du bandeau) et le coin parent (appui long).

   Le portail ne connaît l'intérieur d'aucun module et n'en charge aucun moteur : il lit le
   catalogue (commun/modules.js) et le résumé que chaque module publie dans son état,
   localStorage['<enfant>.<module>'].resume (KR.publierResume). Ajouter un module ne change pas ce
   fichier. Rendu de référence : docs/design-system/archive/2026-11-01_accueil/2-cahiers.html.

   Vues, dans l'adresse : rien (accueil), #matiere-<id>, #semaine. */
(function (racine) {
  'use strict';

  /* ===================== Logique pure, testée par test/portail.test.js ===================== */
  const RANG = { revision: 0, seance: 1, decouverte: 2 };
  const MAX_ACTIVITES = 3;
  const MAX_MINUTES = 15;
  const MAX_DECOUVERTES = 1; // au plus une découverte par jour (D-22, point 3)
  const MINUTES_DECOUVERTE = 5;
  // Un jeu libre jamais ouvert est proposé ces jours-là seulement, au plus deux fois par semaine
  // (D-22, point 6) : lundi et jeudi (getDay).
  const JOURS_JEU_LIBRE = [1, 4];

  function jourIso(date) {
    const d = new Date(date);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  const estObjet = v => v !== null && typeof v === 'object' && !Array.isArray(v);
  const estJour = v => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);

  /* Le résumé tel que le portail peut s'en servir, ou null. Un champ mal formé est ignoré, sans
     faire tomber le reste : un module en cours d'écriture ne casse pas l'accueil. */
  function nettoyerResume(r) {
    if (!estObjet(r)) return null;
    const p = estObjet(r.progres) ? r.progres : null;
    const d = estObjet(r.du) && estJour(r.du.des) && RANG[r.du.nature] !== undefined ? r.du : null;
    // `fini` (D-22) : la dernière séance finie. Absent d'un résumé publié avant D-22 : le portail
    // retombe alors sur `jours` (undefined), alors qu'un `null` dit « aucune séance finie ».
    const f = r.fini;
    const fini = !('fini' in r) ? undefined
      : estObjet(f) && estJour(f.jour) ? {
        jour: f.jour,
        nature: RANG[f.nature] !== undefined ? f.nature : 'seance',
        minutes: Math.max(2, Math.min(8, Math.round(Number(f.minutes) || MINUTES_DECOUVERTE))),
      } : null;
    return {
      ecritLe: r.ecritLe || null,
      progres: p ? {
        avancement: typeof p.avancement === 'number' && isFinite(p.avancement) ? Math.max(0, Math.min(1, p.avancement)) : null,
        phrase: p.phrase || null,
        aujourdhui: p.aujourdhui && p.jour ? p.aujourdhui : null,
        jour: estJour(p.jour) ? p.jour : null,
      } : null,
      du: d ? {
        des: d.des,
        nature: d.nature,
        phrase: d.phrase || null,
        minutes: Math.max(2, Math.min(8, Math.round(Number(d.minutes) || 5))),
        lien: typeof d.lien === 'string' && /^[\w.\-#?=&]+$/.test(d.lien) ? d.lien : null,
      } : null,
      fini,
      jours: Array.isArray(r.jours) ? r.jours.filter(estJour) : [],
      parent: typeof r.parent === 'string' ? r.parent : null,
    };
  }

  /* Le module a été pratiqué ce jour-là (une réponse suffit) : pour la semaine, jamais pour le « Today ». */
  const faitLe = (m, jour) => !!(m.resume && m.resume.jours.includes(jour));

  /* La séance du jour est finie (D-22, point 10) : le module le publie dans `fini`. Un résumé publié
     avant D-22 (sans `fini`) retombe sur l'ancienne règle, un jour pratiqué. */
  function finiLe(m, jour) {
    const r = m.resume;
    if (!r) return false;
    if (r.fini === undefined) return r.jours.includes(jour);
    return !!(r.fini && r.fini.jour === jour);
  }

  const jourDeSemaine = jour => { const [a, m, j] = jour.split('-').map(Number); return new Date(a, m - 1, j).getDay(); };

  /* Ce que le module propose pour le « Today » ce jour-là, ou null : { du, nouveau }.
     - Un module du catalogue qui sait publier un résumé (`objet`) et ne l'a pas encore fait est une
       découverte de cinq minutes, marquée « New! » (D-22, point 2) ; le planisphère (sans `objet`)
       reste dehors.
     - Un jeu libre (`libre`, le nombre cible) reste hors du « Today » une fois découvert ; tant qu'il
       ne l'est pas, il n'est proposé que lundi et jeudi, au plus deux fois par semaine (point 6). */
  function proposition(m, jour) {
    if (m.etat !== 'actif') return null;
    const r = m.resume;
    const nouveau = !r || (!!m.libre && !!r.du && r.du.nature === 'decouverte');
    if (m.libre && (!nouveau || !JOURS_JEU_LIBRE.includes(jourDeSemaine(jour)))) return null;
    if (!r) {
      if (!m.decouvrable) return null;
      return { du: { des: jour, nature: 'decouverte', phrase: null, minutes: MINUTES_DECOUVERTE, lien: null }, nouveau: true };
    }
    if (!r.du || r.du.des > jour || finiLe(m, jour)) return null;
    return { du: r.du, nouveau };
  }

  /* « Today » : trois choses au plus, quinze minutes au plus, sur la journée entière (maquette,
     fonction planDuJour, README de 2026-11-01_accueil, et D-22).
     1. ce qui est fini aujourd'hui garde sa place et ses minutes dans le plafond (point 1), sa matière
        compte comme vue, une découverte finie compte comme la découverte du jour ; un jeu libre joué
        librement ne prend pas de place (il ne publie pas de `fini`) ;
     2. ce qui est proposé (fonction proposition) : `du.des` <= aujourd'hui, séance pas finie aujourd'hui ;
     3. tri : révisions d'abord, puis séances, puis découvertes (un jeu libre après les autres) ; à
        égalité, la plus ancienne date due, puis l'ordre du catalogue ;
     4. premier passage : une seule activité par matière ; second passage, s'il reste de la place ;
     5. au plus une découverte par jour (point 3) ; on s'arrête à trois activités ou quinze minutes.
        Le reste attend demain, sans rien perdre ; plafond atteint : « All done ».
     modules : [{ id, matiere, etat, resume, decouvrable, libre }] dans l'ordre du catalogue.
     Rend { activites: [module + { du, nouveau }], minutes (celles qui restent), faitAujourdhui,
     finis (séances finies aujourd'hui qui comptent) }. */
  function planDuJour(modules, jour) {
    let places = 0;
    let minutes = 0;
    let decouvertes = 0;
    const vues = new Set();
    modules.filter(m => m.etat === 'actif' && finiLe(m, jour)).forEach(m => {
      const f = m.resume.fini;
      const duree = f ? f.minutes : m.resume.du ? m.resume.du.minutes : 0;
      if (!f && !m.resume.du) return; // ancien résumé d'un jeu libre : pas de place
      places++;
      minutes += duree;
      vues.add(m.matiere);
      if (f && f.nature === 'decouverte') decouvertes++;
    });
    const finis = places;
    const dus = modules
      .map((m, i) => ({ m, i, p: proposition(m, jour) }))
      .filter(x => x.p)
      .sort((a, b) => RANG[a.p.du.nature] - RANG[b.p.du.nature] || (!!a.m.libre - !!b.m.libre)
        || a.p.du.des.localeCompare(b.p.du.des) || a.i - b.i)
      .map(x => Object.assign({}, x.m, x.p));
    const choix = [];
    let prevues = 0;
    const tenter = m => {
      if (places >= MAX_ACTIVITES || choix.includes(m)) return;
      if (m.du.nature === 'decouverte' && decouvertes >= MAX_DECOUVERTES) return;
      if (places && minutes + m.du.minutes > MAX_MINUTES) return;
      choix.push(m);
      places++;
      minutes += m.du.minutes;
      prevues += m.du.minutes;
      if (m.du.nature === 'decouverte') decouvertes++;
    };
    dus.forEach(m => { if (!vues.has(m.matiere)) { vues.add(m.matiere); tenter(m); } });
    dus.forEach(tenter);
    return { activites: choix, minutes: prevues, finis, faitAujourdhui: finis > 0 || modules.some(m => faitLe(m, jour)) };
  }

  /* La semaine (lundi à dimanche), un jour fait dès qu'un module y a été pratiqué : jamais une
     série qui retombe à zéro (D-10). */
  function semaine(modules, maintenant) {
    const joues = new Set();
    modules.forEach(m => { if (m.resume) m.resume.jours.forEach(j => joues.add(j)); });
    const d = new Date(maintenant);
    const decalage = (d.getDay() + 6) % 7;
    return Array.from({ length: 7 }, (_, i) => {
      const j = jourIso(new Date(d.getFullYear(), d.getMonth(), d.getDate() - decalage + i));
      return { jour: j, fait: joues.has(j), aujourdhui: i === decalage, avenir: i > decalage };
    });
  }

  racine.Portail = { planDuJour, proposition, semaine, jourIso, nettoyerResume, faitLe, finiLe, MAX_ACTIVITES, MAX_MINUTES, JOURS_JEU_LIBRE };

  /* ===================== Interface ===================== */
  if (typeof document === 'undefined' || !document.getElementById('portail')) return;

  const KR = racine.KR;
  const t = KR.t;
  const tp = (cle, valeurs) => t(cle, valeurs, 'fr'); // le coin parent est toujours en français
  const enfant = KR.enfant();
  const main = document.getElementById('portail');
  const MATIERES = racine.Matieres || [];

  KR.demarrer();

  /* Le texte d'un champ { en, fr } dans la langue du cadre. */
  const texte = o => (!o ? '' : typeof o === 'string' ? o : (o[racine.Textes.langue] || o.fr || o.en || ''));
  const nomMatiere = mt => t('mat_' + mt.id);
  const nomCourt = mt => (racine.Textes.TEXTES['mat_' + mt.id + '_court'] ? t('mat_' + mt.id + '_court') : nomMatiere(mt));

  function lireModules() {
    return (racine.ModulesDe ? racine.ModulesDe(enfant) : []).map(m => {
      let brut = null;
      try { brut = JSON.parse(localStorage.getItem(enfant + '.' + m.id)); } catch (e) { brut = null; }
      // decouvrable : le module sait publier un résumé (il a un `objet`) ; libre : un jeu (D-22).
      return Object.assign({}, m, { resume: nettoyerResume(brut && brut.resume), decouvrable: !!m.objet, libre: !!m.libre });
    });
  }

  let modules = [];
  let plan = { activites: [], minutes: 0, finis: 0, faitAujourdhui: false };
  let aujourdhui = jourIso(new Date());
  const dansLePlan = m => plan.activites.some(x => x.id === m.id);
  const modulesDe = id => modules.filter(m => m.matiere === id);
  const lienDe = m => (m.du && m.du.lien) || m.page;

  /* ---------- Petits rendus ---------- */
  function jauge(m, classe) {
    const a = m.resume && m.resume.progres ? m.resume.progres.avancement : null;
    if (a == null) return '';
    return `<span class="jauge-m${a >= 1 ? ' complet' : ''}${classe ? ' ' + classe : ''}"><i style="width:${(Math.max(a, 0.04) * 100).toFixed(1)}%"></i></span>`;
  }
  /* Une jauge par activité, jamais une moyenne : pointillé pour une activité à venir, piste vide
     pour une activité sans résumé. */
  const barres = mods => mods.map(m => (m.etat === 'bientot' ? '<span class="vide"></span>' : (jauge(m) || '<span class="jauge-m"><i style="width:0"></i></span>'))).join('');

  function phraseProgres(m) {
    if (m.etat === 'bientot') return `<span class="pastille bientot">${t('bientot')}</span>`;
    const p = m.resume && m.resume.progres;
    if (!p || !p.phrase) return '';
    const auj = p.aujourdhui && p.jour === aujourdhui ? `<span class="gain-auj l1">${KR.icone('monte')}${KR.echapper(texte(p.aujourdhui))}</span>` : '';
    const or = p.avancement != null && p.avancement >= 1 ? KR.icone('etoile', 'or') : '';
    return `<span class="phrase-p">${or}<span class="l1">${KR.echapper(texte(p.phrase))}</span></span>${auj}`;
  }
  const badge = () => `<span class="badge-auj l1">${KR.icone('etoile')}${t('accueil_aujourdhui')}</span>`;
  const coinParent = () => `<button type="button" class="coin-parent coin-p" aria-label="${KR.echapper(tp('coin_parent') + ', ' + tp('parent_aide'))}">${KR.icone('cadenas')}<span>${tp('coin_parent')}</span></button>`;
  const retour = () => `<div class="nav"><a class="rond" href="#" aria-label="${t('retour')}">${KR.icone('retour')}</a><span class="nom" aria-hidden="true">${t('retour')}</span></div>`;

  function bulleDuJour() {
    const n = plan.activites.length;
    if (!n) return t(plan.faitAujourdhui ? 'accueil_bulle_fini' : 'accueil_bulle_libre');
    return n === 1 ? t('accueil_bulle_un') : t('accueil_bulle_n', { n });
  }
  function resumePlan() {
    const n = plan.activites.length;
    return `${n === 1 ? t('accueil_chose_un') : t('accueil_choses', { n })} · ${t('accueil_minutes', { n: plan.minutes })}`;
  }

  /* La carte « Today » : la première activité est le seul bouton plein de l'écran, à droite (droitiers). */
  function carteDuJour() {
    const [premiere, ...suite] = plan.activites;
    if (!premiere) {
      const fini = plan.faitAujourdhui;
      return `<section class="jour-c horiz vide-c"><div class="jour-t"><b class="l1">${t('accueil_aujourdhui')}</b></div>
        <p class="jour-fini${fini ? '' : ' libre'}">${KR.icone(fini ? 'ok' : 'etoile')}<span>${t(fini ? 'accueil_bulle_fini' : 'accueil_libre')}</span></p></section>`;
    }
    // Un module découvert pour la première fois porte la pastille « New! » à la place de sa phrase (D-22, point 2).
    const phraseDu = m => (m.nouveau ? `<span class="pastille nouveau">${KR.icone('etoile')}${t('accueil_nouveau')}</span>` : KR.echapper(texte(m.du.phrase)));
    const item = m => `<li><a class="jour-n" href="${KR.echapper(lienDe(m))}">
        <span class="tuile mini">${KR.icone(m.icone)}</span>
        <span class="t"><b class="l1">${KR.echapper(texte(m.titre))}</b><span class="l1">${phraseDu(m)}</span></span>
        <span class="min l1">${t('accueil_minutes', { n: m.du.minutes })}</span></a></li>`;
    return `<section class="jour-c horiz">
      <div class="jour-t"><b class="l1">${t('accueil_aujourdhui')}</b><span class="l1">${resumePlan()}</span></div>
      <a class="jour-1" href="${KR.echapper(lienDe(premiere))}">
        <span class="tuile">${KR.icone(premiere.icone)}</span>
        <span class="t"><b class="l1">${KR.echapper(texte(premiere.titre))}</b><span class="l1">${phraseDu(premiere)} · ${t('accueil_minutes', { n: premiere.du.minutes })}</span></span>
        <span class="btn btn-primaire go">${KR.icone('jouer')}<span>${t('accueil_start')}</span></span>
      </a>
      ${suite.length ? `<div class="jour-ensuite l1">${t('accueil_ensuite')}</div><ol class="jour-suite">${suite.map(item).join('')}</ol>` : ''}
    </section>`;
  }

  /* Un cahier par matière ; une matière sans activité est un cahier « Coming soon », qu'on ne touche pas. */
  function cahier(mt) {
    const mods = modulesDe(mt.id);
    const actifs = mods.filter(m => m.etat === 'actif');
    const etiq = `<span class="etiq-c">${KR.icone(mt.icone)}<b class="deux-lignes-max">${KR.echapper(nomMatiere(mt))}</b></span>`;
    if (!actifs.length) {
      return `<div class="cahier bientot" data-matiere="${mt.id}" aria-disabled="true"><span class="couv" data-motif="${mt.motif}">${etiq}</span>
        <span class="pied"><span class="pastille bientot">${t('bientot')}</span></span></div>`;
    }
    const n = actifs.length === 1 ? t('accueil_activite_un') : t('accueil_activites', { n: actifs.length });
    return `<a class="cahier" href="#matiere-${mt.id}" data-matiere="${mt.id}">${mods.some(dansLePlan) ? badge() : ''}<span class="couv" data-motif="${mt.motif}">${etiq}</span>
      <span class="pied"><span class="n l1">${n}</span><span class="barres">${barres(mods)}</span></span></a>`;
  }

  /* ---------- Les trois vues ---------- */
  /* « 1 day this week », jamais « 0 days » : une semaine encore vide s'appelle « My week ». */
  const compteSemaine = jours => (jours.some(j => j.fait) ? KR.joursFaits(jours) : t('ma_semaine'));

  function accueil() {
    const jours = semaine(modules, new Date());
    const fini = !plan.activites.length && plan.faitAujourdhui;
    return `<div class="d2">
      <header class="d2-haut">
        <button type="button" class="d2-masc" data-a="ecouter" aria-label="${KR.echapper(t('ecouter') + ' : ' + bulleDuJour())}">${KR.mascotte(fini ? 'repos' : 'attend')}<span class="bulle parle">${KR.echapper(bulleDuJour())}</span></button>
        <h1 class="d2-titre l1">${KR.echapper(t('accueil_bonjour', { prenom: KR.prenom() }))}</h1>
        ${coinParent()}
        <a class="d2-sem" href="#semaine" aria-label="${KR.echapper(t('accueil_voir_semaine') + ', ' + compteSemaine(jours))}">${KR.semaine(jours)}<span class="sem-pied"><span class="t l1">${compteSemaine(jours)}</span>${KR.icone('suite', 'fleche')}</span></a>
      </header>
      <div class="d2-corps">
        ${carteDuJour()}
        <nav class="cahiers" aria-label="${t('accueil_mes_matieres')}">${MATIERES.map(cahier).join('')}</nav>
      </div></div>`;
  }

  function carteModule(m) {
    if (m.etat === 'bientot') {
      return `<div class="mod bientot" aria-disabled="true"><span class="tuile">${KR.icone(m.icone)}</span><b class="l1">${KR.echapper(texte(m.titre))}</b>
        <span class="bas">${phraseProgres(m)}</span></div>`;
    }
    return `<a class="mod" href="${KR.echapper(m.page)}" data-module="${m.id}">${dansLePlan(m) ? badge() : ''}<span class="tuile">${KR.icone(m.icone)}</span><b class="l1">${KR.echapper(texte(m.titre))}</b>
      <span class="bas"><span class="ligne-p">${phraseProgres(m)}</span>${jauge(m)}</span></a>`;
  }

  function pageMatiere(mt) {
    return `<div class="d2 page-matiere">
      <header class="d2-mat-haut" data-motif="${mt.motif}">
        ${retour()}
        <h1 class="l1">${KR.icone(mt.icone)}<span class="nom-long">${KR.echapper(nomMatiere(mt))}</span><span class="nom-court">${KR.echapper(nomCourt(mt))}</span></h1>
        ${coinParent()}
      </header>
      <div class="mods">${modulesDe(mt.id).map(carteModule).join('')}</div></div>`;
  }

  /* « My week » (greffe de la direction 3) : la semaine en grand, puis une rangée de jauges par
     matière ; chaque rangée ouvre son cahier. */
  function pageSemaine() {
    const jours = semaine(modules, new Date());
    const lignes = MATIERES.map(mt => {
      const mods = modulesDe(mt.id);
      if (!mods.some(m => m.etat === 'actif')) return '';
      return `<a class="p-ligne" href="#matiere-${mt.id}"><span class="tuile">${KR.icone(mt.icone)}</span><b class="l1">${KR.echapper(nomCourt(mt))}</b><span class="p-barres">${barres(mods)}</span>${KR.icone('suite', 'fleche')}</a>`;
    }).join('');
    return `<div class="d2 page-semaine">
      <header class="d2-mat-haut sem-haut">
        ${retour()}
        <h1 class="l1">${KR.icone('cal')}<span>${t('ma_semaine')}</span></h1>
        ${coinParent()}
      </header>
      <div class="sem-corps">
        <section class="sem-c"><p class="sem-t">${compteSemaine(jours)}</p>${KR.semaine(jours)}</section>
        <section class="sem-mat"><h2>${t('accueil_mes_matieres')}</h2>${lignes}</section>
      </div></div>`;
  }

  function vue() {
    const h = location.hash.replace(/^#/, '');
    if (h === 'semaine') return { nom: 'semaine' };
    const m = /^matiere-(\w+)$/.exec(h);
    const mt = m && MATIERES.find(x => x.id === m[1]);
    if (mt && modulesDe(mt.id).some(x => x.etat === 'actif')) return { nom: 'matiere', matiere: mt };
    return { nom: 'accueil' };
  }

  let vueAffichee = null;
  function rendre() {
    aujourdhui = jourIso(new Date());
    modules = lireModules();
    plan = planDuJour(modules, aujourdhui);
    const v = vue();
    document.title = KR.prenom();
    main.innerHTML = v.nom === 'matiere' ? pageMatiere(v.matiere) : v.nom === 'semaine' ? pageSemaine() : accueil();
    main.dataset.vue = v.nom;
    main.querySelectorAll('.coin-parent').forEach(b => KR.appuiLong(b, ouvrirCoinParent));
    const masc = main.querySelector('[data-a="ecouter"]');
    if (masc) masc.addEventListener('click', () => KR.lire(bulleDuJour(), KR.reglages().langue));
    const cle = v.nom + (v.matiere ? v.matiere.id : '');
    if (vueAffichee !== null && vueAffichee !== cle) window.scrollTo(0, 0);
    vueAffichee = cle;
  }
  window.addEventListener('hashchange', rendre);
  // Retour d'un module par le bouton de l'app ou le cache de la page : les résumés ont pu changer.
  window.addEventListener('pageshow', e => { if (e.persisted) rendre(); });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && !document.querySelector('.voile')) rendre(); });

  /* ===================== Coin parent : toujours en français ===================== */
  function segment(cle, options, valeur) {
    return '<div class="segment">' + options.map(([v, libelle]) =>
      `<button type="button" data-reglage="${cle}" data-valeur="${v}" aria-pressed="${String(v) === String(valeur)}">${libelle}</button>`).join('') + '</div>';
  }

  function etatSauvegarde() {
    if (!racine.Sync) return 'Sauvegarde en ligne indisponible sur cette page.';
    const s = racine.Sync.etat();
    if (s.derniereSauvegarde) {
      const h = new Date(s.derniereSauvegarde).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      return `Sauvegardé en ligne à ${h}. La progression suit l'enfant sur tous les appareils.`;
    }
    if (s.erreur) return `Pas encore sauvegardé en ligne (${KR.echapper(s.erreur)}). La progression reste sur cet appareil et repartira dès que possible.`;
    return 'Sauvegarde en ligne en cours…';
  }

  /* Une phrase par activité, écrite par le module dans son résumé (resume.parent). */
  function bilans() {
    return modules.map(m => {
      const note = m.noteParent ? `<p class="note">${KR.echapper(tp(m.noteParent))}</p>` : '';
      if (m.etat === 'bientot') return `<div class="cp-module"><p><b>${KR.echapper(m.titre.fr)}</b> : ${tp('accueil_parent_bientot')}</p></div>`;
      const phrase = m.resume && m.resume.parent
        ? `<p>${KR.echapper(m.resume.parent)}</p>`
        : `<p><b>${KR.echapper(m.titre.fr)}</b> : ${KR.echapper(tp('accueil_parent_sans_resume'))}</p>`;
      return `<div class="cp-module">${phrase}${note}</div>`;
    }).join('');
  }

  function ouvrirCoinParent() {
    fermerCoinParent();
    const r = KR.reglages();
    const voile = document.createElement('div');
    voile.className = 'voile';
    voile.lang = 'fr';
    voile.innerHTML = `<div class="feuille" role="dialog" aria-modal="true" aria-labelledby="cp-titre">
      <div class="feuille-tete"><h2 id="cp-titre">${tp('parent_titre')}</h2><button type="button" class="btn btn-calme" data-a="fermer">${tp('fermer')}</button></div>
      <section class="reglage cp-bilans"><h3>${tp('accueil_parent_activites')}</h3>${bilans()}</section>
      <section class="reglage"><h3>${tp('parent_langue')}</h3>${segment('langue', [['en', 'English'], ['fr', 'Français']], r.langue)}<p class="note">${tp('parent_langue_note')}</p></section>
      <section class="reglage">
        <div class="ligne-reglage"><span>${tp('parent_voix')}</span>${segment('voix', [[true, tp('active')], [false, tp('coupee')]], r.voix)}</div>
        <div class="ligne-reglage" style="margin-top:12px"><span>${tp('parent_sons')}</span>${segment('sons', [[true, tp('active')], [false, tp('coupee')]], r.sons)}</div>
      </section>
      <section class="reglage"><h3>${tp('parent_sauvegarde')}</h3>
        <p class="note">${etatSauvegarde()}</p>
        <div class="boutons">
          <button type="button" class="btn btn-secondaire" data-a="exporter">${KR.icone('sortir')}${tp('parent_export')}</button>
          <label class="btn btn-secondaire">${KR.icone('entrer')}${tp('parent_import')}<input type="file" class="lecteur" accept="application/json,.json" data-a="importer"></label>
        </div>
        <p class="note">${tp('parent_sauvegarde_note')}</p>
        <p class="message" aria-live="polite"></p>
      </section>
      <section class="reglage">
        <div class="boutons" data-zone="raz"><button type="button" class="btn btn-calme" data-a="raz">${tp('parent_raz')}</button></div>
        <div class="cache" data-zone="confirmer"><p>${KR.echapper(tp('parent_raz_question', { prenom: KR.prenom() }))}</p>
          <div class="boutons"><button type="button" class="btn btn-secondaire" data-a="annuler">${tp('annuler')}</button><button type="button" class="btn btn-primaire" data-a="raz-oui">${tp('parent_raz_oui')}</button></div></div>
      </section>
    </div>`;
    document.body.appendChild(voile);
    const message = voile.querySelector('.message');

    voile.addEventListener('click', e => {
      if (e.target === voile) return fermerCoinParent();
      const b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.reglage) {
        let v = b.dataset.valeur;
        if (v === 'true' || v === 'false') v = v === 'true';
        KR.regler(b.dataset.reglage, v);
        if (b.dataset.reglage === 'langue') { rendre(); ouvrirCoinParent(); return; }
        b.parentNode.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
        return;
      }
      const a = b.dataset.a;
      if (a === 'fermer') fermerCoinParent();
      else if (a === 'exporter') KR.telecharger(`${jourIso(new Date())}_revisions-${enfant}.json`, KR.exporter());
      else if (a === 'raz') {
        voile.querySelector('[data-zone="raz"]').classList.add('cache');
        voile.querySelector('[data-zone="confirmer"]').classList.remove('cache');
      } else if (a === 'annuler') {
        voile.querySelector('[data-zone="raz"]').classList.remove('cache');
        voile.querySelector('[data-zone="confirmer"]').classList.add('cache');
      } else if (a === 'raz-oui') {
        const suivis = (racine.SynchroPage && racine.SynchroPage.MODULES) || [];
        if (racine.Sync) suivis.forEach(m => racine.Sync.effacer(enfant, m));
        KR.effacerTout();
        rendre();
        ouvrirCoinParent();
      }
    });
    voile.querySelector('input[type="file"]').addEventListener('change', e => {
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      const lecteur = new FileReader();
      lecteur.onload = () => {
        const ok = KR.importer(String(lecteur.result));
        if (ok) { rendre(); ouvrirCoinParent(); document.querySelector('.voile .message').textContent = tp('parent_import_ok'); }
        else message.textContent = tp('parent_import_ko', { prenom: KR.prenom() });
      };
      lecteur.readAsText(f);
    });
    voile.querySelector('[data-a="fermer"]').focus();
  }

  function fermerCoinParent() {
    const v = document.querySelector('.voile');
    if (v) v.remove();
  }
  document.addEventListener('keydown', e => { if (e.key === 'Escape') fermerCoinParent(); });

  rendre();
})(typeof window !== 'undefined' ? window : globalThis);
