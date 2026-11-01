/* Socle commun aux trois directions de l'accueil : données d'exemple, contrat `resume`,
   choix du « Today », planche de présentation.

   Une page de direction a deux usages :
   - sans paramètre, la planche : chaque écran est la même page chargée dans un cadre aux
     dimensions réelles (iPad paysage, iPad portrait, iPhone), pour que les media queries
     du kit s'appliquent pour de vrai ;
   - avec ?vue=ecran&enfant=henri&quand=maintenant|six-mois[&page=matiere&m=maths], un seul écran,
     plein cadre, qui se touche comme l'app. */
(function () {
  'use strict';
  const p = new URLSearchParams(location.search);
  const ETAT = {
    vue: p.get('vue') || 'planche',
    enfant: p.get('enfant') === 'clara' ? 'clara' : 'henri',
    quand: p.get('quand') === 'six-mois' ? 'six-mois' : 'maintenant',
    page: p.get('page') || 'accueil',
    matiere: p.get('m') || 'maths',
  };
  document.documentElement.dataset.enfant = ETAT.enfant;

  /* ---------- Icônes ajoutées pour la maquette (à verser dans le sprite de kit.js) ---------- */
  const S = 'fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"';
  const ICONES = {
    'm-maths': `<path d="M7.5 3.5v9M3 8h9" ${S}/><path d="M14.5 14.5l6 6M20.5 14.5l-6 6" ${S}/><path d="M14 6h7M14 9.5h7" ${S}/>`,
    'm-livre': `<path d="M12 6.5C9.5 4.8 6.5 4.4 3 5v13.5c3.5-.5 6.5-.1 9 1.5 2.5-1.6 5.5-2 9-1.5V5c-3.5-.6-6.5-.2-9 1.5z" ${S}/><path d="M12 6.5V20" ${S}/>`,
    'm-fiole': `<path d="M9.5 3.5h5M10.5 3.5v6L5 18.6A1.6 1.6 0 006.4 21h11.2a1.6 1.6 0 001.4-2.4L13.5 9.5v-6" ${S}/><path d="M7.6 15h8.8" ${S}/>`,
    'm-bulle': `<path d="M4 4.5h16A1.5 1.5 0 0121.5 6v9.5A1.5 1.5 0 0120 17h-9.5L6 20.5V17H4a1.5 1.5 0 01-1.5-1.5V6A1.5 1.5 0 014 4.5z" ${S}/><path d="M7 9h10M7 12.5h6" ${S}/>`,
    'm-fraction': `<circle cx="12" cy="12" r="8.5" ${S}/><path d="M12 12V3.5A8.5 8.5 0 0120.5 12z" fill="currentColor"/><path d="M12 12v8.5M3.5 12H12" ${S}/>`,
    'm-cubes': `<rect x="3" y="4" width="4.5" height="16" rx="1.2" ${S}/><rect x="9.8" y="10" width="4.5" height="10" rx="1.2" ${S}/><rect x="16.5" y="15.5" width="4.5" height="4.5" rx="1.2" ${S}/>`,
    'm-regle': `<rect x="2.5" y="8" width="19" height="8.5" rx="1.6" ${S}/><path d="M6.2 8v3.6M9.8 8v2.2M13.4 8v3.6M17 8v2.2" ${S}/>`,
    'm-temps': `<path d="M3 12h16.5M16 8.5l3.5 3.5-3.5 3.5" ${S}/><circle cx="5.5" cy="12" r="2.1" fill="currentColor"/><circle cx="11" cy="12" r="2.1" fill="currentColor"/>`,
    'm-frise': `<path d="M2.5 18h19" ${S}/><path d="M6 18V6.5l5 2.3-5 2.3M14.5 18v-7l5 2.3-5 2.3" ${S}/>`,
    'm-cible': `<circle cx="12" cy="12" r="8.8" ${S}/><circle cx="12" cy="12" r="5" ${S}/><circle cx="12" cy="12" r="1.9" fill="currentColor"/>`,
    'm-planete': `<circle cx="12" cy="12" r="5.6" ${S}/><ellipse cx="12" cy="12" rx="10.2" ry="3.4" transform="rotate(-22 12 12)" ${S}/>`,
    'm-goutte': `<path d="M12 3.2c3.6 4.6 6.2 8 6.2 10.9a6.2 6.2 0 01-12.4 0c0-2.9 2.6-6.3 6.2-10.9z" ${S}/>`,
    'm-carte': `<path d="M3 6.2l6-2.4 6 2.4 6-2.4v14l-6 2.4-6-2.4-6 2.4z" ${S}/><path d="M9 3.8v14M15 6.2v14" ${S}/>`,
    'm-maison': `<path d="M4 11l8-6.5 8 6.5M6.5 9.5V20h11V9.5" ${S}/><path d="M10 20v-5h4v5" ${S}/>`,
  };
  function injecterIcones() {
    const hote = document.createElement('div');
    hote.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute" aria-hidden="true"><defs>${
      Object.entries(ICONES).map(([id, d]) => `<symbol id="i-${id}" viewBox="0 0 24 24">${d}</symbol>`).join('')}</defs></svg>`;
    document.body.appendChild(hote);
  }

  /* ---------- Les cinq matières, dans l'ordre de l'emploi du temps ---------- */
  const MATIERES = [
    { id: 'maths', nom: 'Maths', icone: 'm-maths', motif: 'carreaux' },
    { id: 'francais', nom: 'French', icone: 'm-livre', motif: 'seyes' },
    { id: 'hg', nom: 'History & geography', court: 'History & geo', icone: 'globe', motif: 'courbes' },
    { id: 'sciences', nom: 'Science', icone: 'm-fiole', motif: 'points' },
    { id: 'anglais', nom: 'English', icone: 'm-bulle', motif: 'rayures' },
  ];

  /* ---------- Catalogue : la partie fixe de chaque module (commun/modules.js à terme) ----------
     Les modules marqués « exemple » ne sont pas prévus : ils complètent l'échelle de quinze. */
  const CATALOGUE = {
    tables: { titre: 'Times tables', matiere: 'maths', icone: 'grille' },
    calcul: { titre: 'Mental maths', matiere: 'maths', icone: 'eclair' },
    fractions: { titre: 'Fractions', matiere: 'maths', icone: 'm-fraction' },
    nombres: { titre: 'Big numbers', matiere: 'maths', icone: 'm-cubes', exemple: true },
    mesures: { titre: 'Measures', matiere: 'maths', icone: 'm-regle', exemple: true },
    dictee: { titre: 'Dictée', matiere: 'francais', icone: 'crayon' },
    conjugaison: { titre: 'Conjugation', matiere: 'francais', icone: 'm-temps' },
    vocabulaire: { titre: 'Vocabulary', matiere: 'francais', icone: 'cle' },
    planisphere: { titre: 'World map', matiere: 'hg', icone: 'm-carte' },
    zoom: { titre: 'Space to Éguilles', matiere: 'hg', icone: 'm-cible' },
    frise: { titre: 'Timeline', matiere: 'hg', icone: 'm-frise' },
    soleil: { titre: 'Solar system', matiere: 'sciences', icone: 'm-planete' },
    eau: { titre: 'Water cycle', matiere: 'sciences', icone: 'm-goutte', exemple: true },
    spelling: { titre: 'Spelling', matiere: 'anglais', icone: 'm-bulle' },
    phonics: { titre: 'Phonics', matiere: 'anglais', icone: 'son', exemple: true },
  };

  /* ---------- Résumés d'exemple : ce que chaque module publie pour le portail ----------
     Format complet et règles : README.md, section « Le contrat resume ». Ici, seuls les champs
     qui servent au rendu ; `du.des` est la date à partir de laquelle quelque chose est dû. */
  const R = (id, o) => Object.assign({ id, version: 1 }, CATALOGUE[id], o);
  const SCENARIOS = {
    maintenant: {
      jour: '2026-11-01', // dimanche
      henri: {
        jours: [0, 0, 0, 0, 0, 1, 0],
        modules: [
          R('planisphere', { etat: 'actif', resume: null }), // module de Louise, pas encore branché : aucune ligne de progrès
          R('tables', { etat: 'actif', progres: { phrase: '22 stamps', avancement: 0.08, aujourdhui: null },
            du: { des: '2026-11-01', nature: 'seance', phrase: "Today's practice", minutes: 5 } }),
          R('dictee', { etat: 'bientot' }),
        ],
      },
      clara: {
        jours: [0, 0, 0, 0, 0, 1, 0],
        modules: [
          R('tables', { etat: 'actif', progres: { phrase: '34 stamps · 1 gold', avancement: 0.12, aujourdhui: null },
            du: { des: '2026-11-01', nature: 'seance', phrase: "Today's practice", minutes: 5 } }),
          R('dictee', { etat: 'bientot' }),
        ],
      },
    },
    'six-mois': {
      jour: '2027-05-04', // mardi
      henri: {
        jours: [1, 0, 0, 0, 0, 0, 0],
        modules: [
          R('tables', { etat: 'actif', progres: { phrase: '211 stamps · 15 gold', avancement: 0.73 },
            du: { des: '2027-05-03', nature: 'revision', phrase: '12 cards come back', minutes: 5 } }),
          R('calcul', { etat: 'actif', progres: { phrase: 'Level 4 of 8', avancement: 0.45 },
            du: { des: '2027-05-04', nature: 'seance', phrase: 'Quick warm-up', minutes: 3 } }),
          R('fractions', { etat: 'actif', progres: { phrase: '6 of 12 steps', avancement: 0.5, aujourdhui: '+1 step' } }),
          R('nombres', { etat: 'actif', progres: { phrase: 'New!', avancement: 0 } }),
          R('mesures', { etat: 'bientot' }),
          R('dictee', { etat: 'actif', progres: { phrase: '48 of 60 words', avancement: 0.8 },
            du: { des: '2027-05-04', nature: 'seance', phrase: "This week's words", minutes: 6 } }),
          R('conjugaison', { etat: 'actif', progres: { phrase: '18 verbs', avancement: 0.4 } }),
          R('vocabulaire', { etat: 'actif', progres: { phrase: '31 words', avancement: 0.35 } }),
          R('planisphere', { etat: 'actif', progres: { phrase: '18 of 24 countries', avancement: 0.75 } }),
          R('zoom', { etat: 'actif', progres: { phrase: '5 of 9 zooms', avancement: 0.55 } }),
          R('frise', { etat: 'actif', progres: { phrase: '12 dates', avancement: 0.3 } }),
          R('soleil', { etat: 'actif', progres: { phrase: 'All 8 planets!', avancement: 1 } }),
          R('eau', { etat: 'bientot' }),
          R('spelling', { etat: 'actif', progres: { phrase: '40 words', avancement: 0.5 },
            du: { des: '2027-05-04', nature: 'revision', phrase: '8 words come back', minutes: 4 } }),
          R('phonics', { etat: 'actif', progres: { phrase: '14 sounds', avancement: 0.4 } }),
        ],
      },
      clara: {
        jours: [1, 0, 0, 0, 0, 0, 0],
        modules: [
          R('tables', { etat: 'actif', progres: { phrase: 'All 36 gold!', avancement: 1 },
            du: { des: '2027-05-02', nature: 'revision', phrase: '6 cards come back', minutes: 3 } }),
          R('calcul', { etat: 'actif', progres: { phrase: 'Level 6 of 8', avancement: 0.7 } }),
          R('fractions', { etat: 'actif', progres: { phrase: '9 of 12 steps', avancement: 0.75 },
            du: { des: '2027-05-04', nature: 'revision', phrase: '5 cards come back', minutes: 4 } }),
          R('nombres', { etat: 'actif', progres: { phrase: '4 of 10 steps', avancement: 0.4 } }),
          R('dictee', { etat: 'actif', progres: { phrase: '52 of 60 words', avancement: 0.86, aujourdhui: '+3 words' },
            du: { des: '2027-05-04', nature: 'seance', phrase: "This week's words", minutes: 6 } }),
          R('conjugaison', { etat: 'actif', progres: { phrase: '26 verbs', avancement: 0.6 } }),
          R('vocabulaire', { etat: 'actif', progres: { phrase: '44 words', avancement: 0.5 } }),
          R('zoom', { etat: 'actif', progres: { phrase: '9 of 9 zooms!', avancement: 1 } }),
          R('frise', { etat: 'actif', progres: { phrase: '20 dates', avancement: 0.5 },
            du: { des: '2027-05-04', nature: 'seance', phrase: 'The Middle Ages', minutes: 4 } }),
          R('soleil', { etat: 'actif', progres: { phrase: '6 of 8 planets', avancement: 0.75 } }),
          R('spelling', { etat: 'actif', progres: { phrase: '72 words', avancement: 0.65 } }),
          R('phonics', { etat: 'bientot' }),
        ],
      },
    },
  };

  /* ---------- « Today » : trois choses au plus, quinze minutes au plus, une matière à la fois ----------
     1. ce qui est dû : `du.des` <= aujourd'hui, et pas déjà fait aujourd'hui ;
     2. tri : révisions d'abord (la mémoire n'attend pas), puis séances, puis découvertes ; à égalité,
        la plus ancienne date due, puis l'ordre du catalogue ;
     3. premier passage : une seule activité par matière ; second passage, s'il reste de la place ;
     4. on s'arrête à trois activités ou quinze minutes. Le reste attend demain, sans rien perdre. */
  const RANG = { revision: 0, seance: 1, decouverte: 2 };
  function planDuJour(modules, jour) {
    const dus = modules.filter(m => m.etat === 'actif' && m.du && m.du.des <= jour && !m.faitAujourdhui)
      .map((m, i) => ({ m, i }))
      .sort((a, b) => RANG[a.m.du.nature] - RANG[b.m.du.nature] || a.m.du.des.localeCompare(b.m.du.des) || a.i - b.i)
      .map(x => x.m);
    const choix = [];
    let minutes = 0;
    const tenter = m => {
      if (choix.length >= 3 || choix.includes(m)) return;
      if (choix.length && minutes + m.du.minutes > 15) return;
      choix.push(m);
      minutes += m.du.minutes;
    };
    const vues = new Set();
    dus.forEach(m => { if (!vues.has(m.matiere)) { vues.add(m.matiere); tenter(m); } });
    dus.forEach(tenter);
    return { activites: choix, minutes };
  }

  /* ---------- Petits rendus communs ---------- */
  const sc = SCENARIOS[ETAT.quand];
  const donnees = sc[ETAT.enfant];
  const plan = planDuJour(donnees.modules, sc.jour);
  const matieresPresentes = MATIERES.filter(mt => donnees.modules.some(m => m.matiere === mt.id));
  const modulesDe = id => donnees.modules.filter(m => m.matiere === id);
  const matiere = id => MATIERES.find(m => m.id === id);
  const dansLePlan = m => plan.activites.includes(m);

  function semaine() {
    const jours = donnees.jours.map((f, i) => ({ fait: !!f }));
    const auj = (new Date(sc.jour + 'T12:00:00').getDay() + 6) % 7;
    jours.forEach((j, i) => { j.aujourdhui = i === auj; j.avenir = i > auj; });
    return { html: KR.semaine(jours), compte: KR.joursFaits(jours) };
  }
  /* Une jauge d'avancement : jamais de pourcentage écrit, l'or quand c'est complet. */
  function jauge(m, classe) {
    if (!m.progres || m.progres.avancement == null) return '';
    const a = m.progres.avancement;
    return `<span class="jauge-m${a >= 1 ? ' complet' : ''}${classe ? ' ' + classe : ''}"><i style="width:${Math.max(a, 0.04) * 100}%"></i></span>`;
  }
  function phraseProgres(m) {
    if (m.etat === 'bientot') return `<span class="pastille bientot">${KR.t('bientot')}</span>`;
    if (!m.progres) return '';
    const auj = m.progres.aujourdhui ? `<span class="gain-auj">${KR.icone('monte')}${KR.echapper(m.progres.aujourdhui)}</span>` : '';
    const or = m.progres.avancement >= 1 ? KR.icone('etoile', 'or') : '';
    return `<span class="phrase-p l1">${or}${KR.echapper(m.progres.phrase)}</span>${auj}`;
  }
  function lien(params) {
    const q = new URLSearchParams({ vue: 'ecran', enfant: ETAT.enfant, quand: ETAT.quand, ...params });
    return '?' + q.toString();
  }
  const bulleDuJour = () => {
    const n = plan.activites.length;
    if (!n) return 'All done for today!';
    return n === 1 ? 'One thing today. Ready?' : `${n} short things today!`;
  };
  const resumePlan = () => {
    const n = plan.activites.length;
    return `${n === 1 ? '1 thing' : n + ' things'} · ${plan.minutes} min`;
  };
  /* La carte « Today » : la première activité est le seul bouton plein de l'écran. */
  function carteDuJour(opts) {
    opts = opts || {};
    const [premiere, ...suite] = plan.activites;
    if (!premiere) {
      return `<section class="jour-c fini"><div class="jour-t"><b class="l1">Today</b></div>
        <p class="jour-fini">${KR.icone('ok')}All done. See you tomorrow!</p></section>`;
    }
    const item = (m, i) => `<li><a class="jour-n" href="#">
        <span class="tuile mini">${KR.icone(m.icone)}</span>
        <span class="t"><b class="l1">${KR.echapper(m.titre)}</b><span class="l1">${KR.echapper(m.du.phrase)}</span></span>
        <span class="min l1">${m.du.minutes} min</span></a></li>`;
    return `<section class="jour-c${opts.classe ? ' ' + opts.classe : ''}">
      <div class="jour-t"><b class="l1">Today</b><span class="l1">${resumePlan()}</span></div>
      <a class="jour-1" href="#">
        <span class="tuile">${KR.icone(premiere.icone)}</span>
        <span class="t"><b class="l1">${KR.echapper(premiere.titre)}</b><span class="l1">${KR.echapper(premiere.du.phrase)} · ${premiere.du.minutes} min</span></span>
        <span class="btn btn-primaire go">${KR.icone('jouer')}<span>Start</span></span>
      </a>
      ${suite.length ? `<div class="jour-ensuite l1">Then</div><ol class="jour-suite">${suite.map(item).join('')}</ol>` : ''}
    </section>`;
  }
  const coinParent = () => `<button type="button" class="coin-p" aria-label="Coin parent, appui long pour ouvrir">${KR.icone('cadenas')}<span>Coin parent</span></button>`;

  /* ---------- La planche : chaque écran dans un cadre aux dimensions réelles ---------- */
  const FORMATS = [
    { id: 'ipad-paysage', nom: 'iPad paysage', l: 1080, h: 810 },
    { id: 'ipad-portrait', nom: 'iPad portrait', l: 810, h: 1080 },
    { id: 'iphone', nom: 'iPhone', l: 402, h: 874 },
  ];
  function planche(cfg) {
    const ech = 0.5;
    const style = document.createElement('style');
    style.textContent = `
      html,body{background:var(--trait)}
      body{padding:24px 0 80px;overflow-x:auto}
      .pl{width:1240px;margin:0 auto}
      .pl-tete{background:var(--carte);border:3px solid var(--trait-fort);border-radius:var(--r-l);padding:24px 30px}
      .pl-tete .num{font-family:var(--f-jeu);font-weight:700;font-size:18px;color:var(--e-700)}
      .pl-tete h1{font-family:var(--f-jeu);font-weight:700;font-size:40px;line-height:1.1;margin:2px 0 10px}
      .pl-tete p{font-size:19px;line-height:1.45;max-width:1100px}
      .pl-tete ul{margin:10px 0 0;padding-left:22px;font-size:18px;line-height:1.45}
      .pl h2{font-family:var(--f-jeu);font-weight:700;font-size:26px;margin:40px 0 4px}
      .pl h2 + p{font-size:17px;color:var(--encre-douce);margin-bottom:14px}
      .rang{display:flex;gap:24px;align-items:flex-start}
      .cadre{flex:none}
      .cadre .lg{font-weight:700;font-size:16px;color:var(--encre-douce);margin-bottom:6px}
      .cadre .vitre{overflow:hidden;border-radius:16px;box-shadow:0 0 0 3px var(--trait-fort),0 8px 24px rgba(30,33,71,.12);background:var(--toile)}
      .cadre iframe{border:0;transform:scale(${ech});transform-origin:0 0;display:block}
      .cadre a{font-size:15px;color:var(--e-700)}`;
    document.head.appendChild(style);
    const lignes = cfg.lignes.map(l => `
      <h2>${l.titre}</h2><p>${l.note || ''}</p>
      <div class="rang">${FORMATS.map(f => {
        const q = new URLSearchParams({ vue: 'ecran', enfant: l.enfant, quand: l.quand, ...(l.params || {}) });
        return `<div class="cadre"><div class="lg">${f.nom} · ${f.l} × ${f.h}</div>
          <div class="vitre" style="width:${f.l * ech}px;height:${f.h * ech}px">
          <iframe src="?${q}" width="${f.l}" height="${f.h}" title="${l.titre}, ${f.nom}"></iframe></div>
          <a href="?${q}" target="_blank">Ouvrir seul</a></div>`;
      }).join('')}</div>`).join('');
    document.body.innerHTML = `<div class="pl"><header class="pl-tete"><div class="num">${cfg.numero}</div><h1>${cfg.titre}</h1>${cfg.intro}</header>${lignes}</div>`;
  }

  /* ---------- Démarrage ---------- */
  function lancer(cfg) {
    KR.demarrer();
    injecterIcones();
    if (ETAT.vue === 'planche') {
      document.title = cfg.titre;
      const nom = { henri: 'Henri', clara: 'Clara' };
      const lignes = [];
      ['henri', 'clara'].forEach(e => {
        lignes.push({ titre: `${nom[e]}, aujourd'hui : ${e === 'henri' ? 'deux modules et la dictée à venir' : 'un module et la dictée à venir'}`, enfant: e, quand: 'maintenant' });
        lignes.push({ titre: `${nom[e]}, dans six mois : ${SCENARIOS['six-mois'][e].modules.length} modules`, enfant: e, quand: 'six-mois',
          note: 'Ce qu\'on voit en arrivant ; chaque cadre défile et se touche comme l\'app.' });
        (cfg.lignesEnPlus || []).forEach(x => lignes.push(Object.assign({ enfant: e }, x(e, nom[e]))));
      });
      planche({ numero: cfg.numero, titre: cfg.titre, intro: cfg.intro, lignes });
      return;
    }
    document.title = KR.prenom();
    document.body.classList.add('ecran-app');
    cfg.rendre();
  }

  window.Maquette = {
    ETAT, MATIERES, CATALOGUE, SCENARIOS, sc, donnees, plan, planDuJour, matieresPresentes, modulesDe, matiere,
    dansLePlan, semaine, jauge, phraseProgres, lien, bulleDuJour, resumePlan, coinParent, carteDuJour, lancer,
  };
})();
