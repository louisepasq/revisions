/* Interface du module des tables : accueil, diagnostic, séance, fin, grille.
   Dépend de commun/textes.js, commun/kit.js, moteur.js (Tables) et seance.js (Seance).
   Le contenu scolaire (questions, astuces, consignes) reste en français. */
(function () {
  'use strict';
  const KR = window.KR;
  const T = window.Tables;
  const S = window.Seance;
  const t = KR.t;
  const enfant = KR.enfant();
  const app = document.getElementById('app');
  const DUREE_DIAGNOSTIC = 60000;
  const DUREE_SUITE = 1600;
  const MAX_CHIFFRES = 3;
  const ETAT_CASE = { gris: 'pas', bronze: 'com', argent: 'pre', or: 'or' };
  const NOM_CASE = { pas: 'etat_gris', com: 'etat_bronze', pre: 'etat_argent', or: 'etat_or', auj: 'etat_auj' };

  KR.demarrer();
  let etat = T.charger(enfant);
  let minuteurs = [];
  const fr = s => `<span lang="fr">${s}</span>`;
  const x = '<span class="x">×</span>';
  const eg = '<span class="eg">=</span>';
  const sauver = () => T.sauver(enfant, etat);

  function plusTard(fn, ms) { minuteurs.push(setTimeout(fn, ms)); }
  function changerEcran(html) {
    minuteurs.forEach(clearTimeout);
    minuteurs = [];
    KR.taire();
    app.innerHTML = html;
    window.scrollTo(0, 0);
  }
  function nav(action, icone, cle, href) {
    const libelle = t(cle);
    const bouton = href
      ? `<a class="rond" href="${href}" aria-label="${libelle}">${KR.icone(icone)}</a>`
      : `<button type="button" class="rond" data-a="${action}" aria-label="${libelle}">${KR.icone(icone)}</button>`;
    return `<div class="nav">${bouton}<span class="nom" aria-hidden="true">${libelle}</span></div>`;
  }
  function brancher(actions) {
    app.onclick = e => {
      const b = e.target.closest('[data-a]');
      if (b && actions[b.dataset.a] && !b.disabled) actions[b.dataset.a](b, e);
    };
  }
  function caseRep(valeur, active, champ) {
    const contenu = KR.echapper(valeur) + '<span class="curseur"></span>';
    const attr = `aria-label="${t('case_reponse')}"`;
    if (champ === undefined) return `<span class="case-rep${active ? ' active' : ''}${valeur ? '' : ' case-vide'}" ${attr} aria-live="polite">${contenu}</span>`;
    return `<button type="button" class="case-rep${active ? ' active' : ''}${valeur ? '' : ' case-vide'}" data-a="champ" data-champ="${champ}" ${attr}>${contenu}</button>`;
  }
  function aLire(q) {
    if (q.type === 'manquant') return `${q.a} fois combien égale ${q.a * q.b} ?`;
    if (q.type === 'decomposition') return `Combien fois combien égale ${q.produit} ?`;
    if (q.type === 'multiple') return `${q.nombre} est-il dans la table de ${q.a} ?`;
    return `${q.a} fois ${q.b}`;
  }
  function etatCase(a, b) {
    const f = etat.faits[T.cle(a, b)];
    const c = T.couleur(etat, a, b);
    if (c === 'or' && f && f.boite === 4 && (f.justesJours || []).indexOf(T.jour(new Date())) >= 0) return 'auj';
    return ETAT_CASE[c];
  }
  function marque(e) {
    if (e === 'or' || e === 'auj') return KR.icone('etoile');
    if (e === 'pre') return '<span class="pts"><i></i><i></i></span>';
    if (e === 'com') return '<span class="pts"><i></i></span>';
    return '';
  }

  /* =================== Accueil du module =================== */
  function accueil() {
    etat = T.charger(enfant);
    if (!etat.diagnostic) return introDiagnostic();
    const or = T.compteOr(etat);
    changerEcran(`<div class="ecran accueil-tables">
      <header class="barre">${nav('', 'retour', 'retour', './')}
        <div class="titre"><h1 class="titre-ecran">${t('module_tables')}</h1><p class="indice">${t('tables_par_coeur', { n: or, total: 36 })}</p></div>
      </header>
      <div class="accueil-grille">
        <button type="button" class="carte-entrainement" data-a="seance">
          <span class="ce-masc">${KR.mascotte('attend')}</span>
          <span class="ce-texte"><b>${t('entrainement')}</b><span>${t('entrainement_sous')}</span></span>
          <span class="ce-go">${KR.icone('jouer')}</span>
        </button>
        <button type="button" class="carte-grille" data-a="grille">
          <span class="tuile">${KR.icone('grille')}</span>
          <span class="cg-texte"><b>${t('ma_grille')}</b>
            <span class="mini-piste"><i style="width:${(or / 36 * 100).toFixed(1)}%"></i></span>
            <span class="cg-n">${KR.icone('etoile')}${t('tables_par_coeur', { n: or, total: 36 })}</span></span>
        </button>
        <div class="bientots">
          <div class="carte-bientot" aria-disabled="true"><span class="tuile bientot">${KR.icone('chrono')}</span><span><b>${t('defi')}</b><span class="pastille bientot">${t('bientot')}</span></span></div>
          <div class="carte-bientot" aria-disabled="true"><span class="tuile bientot">${KR.icone('cle')}</span><span><b>${t('decouvrir')}</b><span class="pastille bientot">${t('bientot')}</span></span></div>
        </div>
      </div>
    </div>`);
    brancher({ seance: demarrerSeance, grille: () => grille(accueil) });
  }

  /* =================== Écran de parole : la mascotte annonce =================== */
  function parole(attitude, texte, boutonCle, action, retour) {
    changerEcran(`<div class="ecran parole">
      <header class="barre">${retour}<div class="avance"></div>${nav('ecouter', 'son', 'ecouter')}</header>
      <div class="parole-corps">
        <div class="parole-masc">${KR.mascotte(attitude, attitude === 'fete' ? 'rebondit' : '')}</div>
        <div class="parole-texte"><div class="bulle parle">${KR.echapper(texte)}</div>
          <button type="button" class="btn btn-primaire" data-a="go">${t(boutonCle)}${KR.icone('suite')}</button></div>
      </div>
    </div>`);
    brancher({ go: action, retour: accueil, ecouter: () => KR.lire(texte, KR.reglages().langue) });
  }

  /* =================== Diagnostic : une minute au plus, sans chrono visible =================== */
  function introDiagnostic() {
    parole('attend', t('diag_bulle'), 'commencer', lancerDiagnostic, nav('', 'retour', 'retour', './'));
  }

  function lancerDiagnostic() {
    const questions = T.questionsDiagnostic();
    const reponses = [];
    const debut = performance.now();
    let i = 0;
    let saisie = '';
    let debutQ = 0;
    let pave = null;
    let fini = false;

    function terminer() {
      if (fini) return;
      fini = true;
      T.appliquerDiagnostic(etat, reponses, new Date());
      sauver();
      KR.son('fete');
      parole('fete', t('diag_fin'), 'commencer', accueil, nav('', 'retour', 'retour', './'));
    }
    function majCase() {
      app.querySelector('.ligne-rep').innerHTML = eg + caseRep(saisie, true);
      pave.etat(saisie ? 'pret' : 'vide');
    }
    function suivante(juste) {
      const q = questions[i];
      reponses.push({ a: q.a, b: q.b, juste, ms: juste === null ? null : Math.round(performance.now() - debutQ) });
      if (juste === null) reponses[reponses.length - 1].juste = false;
      i++;
      if (i >= questions.length || performance.now() - debut >= DUREE_DIAGNOSTIC) return terminer();
      afficher();
    }
    function afficher() {
      const q = questions[i];
      saisie = '';
      app.querySelector('.zone').innerHTML = `
        <div class="carte-q carte-pleine" data-a-fait="${q.a}" data-b-fait="${q.b}" data-type="produit" lang="fr">
          <div class="fait ligne-op">${q.a}${x}${q.b}</div>
          <div class="fait ligne-rep">${eg}${caseRep('', true)}</div>
        </div>
        <div class="sous-carte"><button type="button" class="btn btn-secondaire" data-a="passer">${t('je_passe')}${KR.icone('suite')}</button></div>`;
      pave.etat('vide');
      debutQ = performance.now();
      if (KR.reglages().voix) KR.lire(aLire(q), 'fr');
    }

    changerEcran(`<div class="ecran ecran-fixe exo diagnostic">
      <header class="barre">${nav('', 'retour', 'retour', './')}<div class="avance"></div>${nav('ecouter', 'son', 'ecouter')}</header>
      <div class="corps"><section class="zone"></section><section class="action"></section></div>
    </div>`);
    pave = KR.pave({
      chiffre(d) { if (saisie.length < MAX_CHIFFRES) { saisie = (saisie + d).replace(/^0+(?=\d)/, ''); majCase(); } },
      effacer() { saisie = saisie.slice(0, -1); majCase(); },
      valider() { const q = questions[i]; suivante(T.verifier(q, Number(saisie))); },
    });
    app.querySelector('.action').appendChild(pave.el);
    brancher({ passer: () => suivante(null), ecouter: () => KR.lire(aLire(questions[i]), 'fr') });
    plusTard(terminer, DUREE_DIAGNOSTIC);
    afficher();
  }

  /* =================== Séance d'entraînement =================== */
  function demarrerSeance() {
    etat = T.charger(enfant);
    const s = S.creer(etat, new Date());
    const resultats = [];
    let q = null;
    let saisie = '';
    let duo = ['', ''];
    let champ = 0;
    let phase = 'question';
    let debutQ = 0;
    let pave = null;

    changerEcran(`<div class="ecran ecran-fixe exo">
      <header class="barre">${nav('retour', 'retour', 'retour')}
        <div class="avance" role="progressbar" aria-valuemin="0"><div class="points-av"></div><span class="compte"></span></div>
        ${nav('ecouter', 'son', 'ecouter')}</header>
      <div class="corps"><section class="zone"></section><section class="action"></section></div>
    </div>`);
    const zone = app.querySelector('.zone');
    const action = app.querySelector('.action');

    pave = KR.pave({
      chiffre(d) {
        if (phase === 'question' && q.type === 'decomposition') {
          if (duo[champ].length < MAX_CHIFFRES) duo[champ] = (duo[champ] + d).replace(/^0+(?=\d)/, '');
        } else if (saisie.length < MAX_CHIFFRES) saisie = (saisie + d).replace(/^0+(?=\d)/, '');
        majSaisie();
      },
      effacer() {
        if (phase === 'question' && q.type === 'decomposition') {
          if (!duo[champ] && champ === 1) champ = 0;
          duo[champ] = duo[champ].slice(0, -1);
        } else saisie = saisie.slice(0, -1);
        majSaisie();
      },
      valider(etatPave) {
        if (etatPave === 'suite') return suivante();
        if (phase === 'question') {
          if (q.type === 'decomposition') {
            if (!duo[1]) { champ = 1; return majSaisie(); }
            return repondre([Number(duo[0]), Number(duo[1])]);
          }
          return repondre(Number(saisie));
        }
        if (phase === 'revoir') return retaper();
      },
    });

    function majAvance() {
      const total = s.questions.length;
      let h = '';
      for (let k = 0; k < total; k++) {
        if (resultats[k]) h += `<i class="pt ${resultats[k] === 'j' ? 'juste' : 'revu'}"></i>`;
        else if (k === s.index && phase !== 'juste') h += '<i class="pt ici"></i>';
        else h += '<i class="pt"></i>';
      }
      const av = app.querySelector('.avance');
      av.querySelector('.points-av').innerHTML = h;
      const n = Math.min(s.index + 1, total);
      av.querySelector('.compte').textContent = t('avancement', { n, total });
      av.setAttribute('aria-valuenow', n);
      av.setAttribute('aria-valuemax', total);
      av.setAttribute('aria-label', t('avancement', { n, total }));
    }

    function montrerPave() {
      if (pave.el.parentNode !== action) { action.innerHTML = ''; action.appendChild(pave.el); pave.activer(); }
    }

    function question() {
      q = S.courante(s);
      phase = 'question';
      saisie = '';
      duo = ['', ''];
      champ = 0;
      majAvance();
      const p = q.a * q.b;
      let corps = '';
      if (q.type === 'produit') {
        corps = `<div class="fait ligne-op">${q.a}${x}${q.b}</div><div class="fait ligne-rep" data-case>${eg}${caseRep('', true)}</div>`;
      } else if (q.type === 'manquant') {
        corps = `<div class="fait ligne-op" data-case>${q.a}${x}${caseRep('', true)}</div><div class="fait ligne-rep">${eg}${p}</div>`;
      } else if (q.type === 'decomposition') {
        corps = `<p class="consigne">Trouve deux nombres</p><div class="fait ligne-op" data-case>${caseRep('', true, 0)}${x}${caseRep('', false, 1)}</div><div class="fait ligne-rep">${eg}${p}</div>`;
      } else {
        corps = `<div class="fait ligne-op">${q.nombre}</div><p class="ligne-texte">est-il dans la table de ${q.a}&nbsp;?</p>`;
      }
      zone.innerHTML = `<div class="carte-q carte-pleine" lang="fr" data-type="${q.type}" data-a-fait="${q.a}" data-b-fait="${q.b}"${q.type === 'multiple' ? ` data-nombre="${q.nombre}"` : ''}>${corps}</div>`;
      if (q.type === 'multiple') {
        action.innerHTML = `<div class="choix" lang="fr"><button type="button" class="btn btn-secondaire" data-a="choix" data-valeur="oui">Oui</button><button type="button" class="btn btn-secondaire" data-a="choix" data-valeur="non">Non</button></div>`;
      } else {
        montrerPave();
        pave.etat('vide');
      }
      debutQ = performance.now();
      if (KR.reglages().voix) KR.lire(aLire(q), 'fr');
    }

    function majSaisie() {
      const ligne = zone.querySelector('[data-case]');
      if (phase === 'question' && q.type === 'decomposition') {
        ligne.innerHTML = caseRep(duo[0], champ === 0, 0) + x + caseRep(duo[1], champ === 1, 1);
        pave.etat(duo[0] ? 'pret' : 'vide');
        return;
      }
      if (phase === 'question' && q.type === 'manquant') ligne.innerHTML = `${q.a}${x}${caseRep(saisie, true)}`;
      else if (phase === 'question') ligne.innerHTML = eg + caseRep(saisie, true);
      else ligne.innerHTML = `${q.a}${x}${q.b}${eg}${caseRep(saisie, true)}`;
      pave.etat(saisie ? 'pret' : 'vide');
    }

    function repondre(valeur) {
      const ms = Math.round(performance.now() - debutQ);
      const r = S.repondre(s, etat, valeur, ms, new Date());
      sauver();
      if (r.juste) {
        resultats[s.index] = 'j';
        return montrerJuste(r.rapide, valeur);
      }
      resultats[s.index] = 'r';
      montrerRevoir(r);
    }

    function montrerJuste(rapide, valeur) {
      phase = 'juste';
      majAvance();
      KR.son('juste');
      const p = q.a * q.b;
      let lignes;
      if (q.type === 'decomposition') lignes = `<div class="fait ligne-op"><span class="rep-verte">${valeur[0]}</span>${x}<span class="rep-verte">${valeur[1]}</span></div><div class="fait ligne-rep">${eg}${q.produit}</div>`;
      else if (q.type === 'manquant') lignes = `<div class="fait ligne-op">${q.a}${x}<span class="rep-verte">${q.b}</span></div><div class="fait ligne-rep">${eg}${p}</div>`;
      else if (q.type === 'multiple') lignes = `<div class="fait ligne-op">${q.nombre}</div><div class="fait ligne-rep"><span class="rep-verte">${q.reponse ? 'Oui' : 'Non'}</span></div><p class="ligne-texte">${q.a} × ${q.b} = ${p}</p>`;
      else lignes = `<div class="fait ligne-op">${q.a}${x}${q.b}</div><div class="fait ligne-rep">${eg}<span class="rep-verte">${p}</span></div>`;
      zone.innerHTML = `
        <div class="carte-q carte-pleine carte-juste" lang="fr">
          ${rapide ? `<span class="rapide" lang="${KR.reglages().langue}">${KR.icone('eclair')}${t('rapide')}</span>` : ''}
          <div class="badge-ok" role="img" aria-label="${t('juste_aria')}">${KR.icone('ok')}</div>${lignes}
        </div>
        <div class="retour-masc fete">${KR.medaillon('fete')}${KR.mascotte('fete', 'rebondit')}<div class="bulles"><div class="bulle parle">${t('bravo')}</div></div></div>`;
      montrerPave();
      pave.etat('suite', DUREE_SUITE);
      plusTard(suivante, DUREE_SUITE);
    }

    function montrerRevoir(r) {
      phase = 'revoir';
      saisie = '';
      majAvance();
      KR.son('doux');
      zone.innerHTML = `
        <div class="carte-q carte-rev" lang="fr"><div class="fait">${q.a}${x}${q.b}${eg}<span class="surligne">${r.bonne}</span></div></div>
        <div class="retour-masc">${KR.medaillon('aide')}${KR.mascotte('aide')}
          <div class="bulles"><div class="bulle parle">${t('on_regarde')}</div>
          <div class="bulle astuce" lang="fr"><div class="etiq">${KR.icone('ampoule')}L'astuce de ${KR.nomMascotte()}</div>${KR.echapper(r.astuce)}</div></div></div>
        <div class="carte-q carte-retape" lang="fr"><p class="consigne">À toi de le retaper</p>
          <div class="fait" data-case>${q.a}${x}${q.b}${eg}${caseRep('', true)}</div></div>`;
      montrerPave();
      pave.etat('vide');
    }

    function retaper() {
      if (!S.retaper(s, Number(saisie))) {
        KR.son('doux');
        saisie = '';
        return majSaisie();
      }
      phase = 'juste';
      KR.son('juste');
      const carte = zone.querySelector('.carte-retape');
      carte.classList.add('carte-juste');
      carte.querySelector('[data-case]').innerHTML = `${q.a}${x}${q.b}${eg}<span class="rep-verte">${q.a * q.b}</span>`;
      majAvance();
      pave.etat('suite', DUREE_SUITE);
      plusTard(suivante, DUREE_SUITE);
    }

    function suivante() {
      minuteurs.forEach(clearTimeout);
      minuteurs = [];
      S.suivante(s);
      if (S.finie(s)) return fin(s);
      question();
    }

    brancher({
      retour: accueil,
      ecouter: () => KR.lire(phase === 'revoir' ? `${q.a} fois ${q.b} égale ${q.a * q.b}` : aLire(q), 'fr'),
      champ: b => { champ = Number(b.dataset.champ); majSaisie(); },
      choix: b => { if (phase === 'question') repondre(b.dataset.valeur === 'oui'); },
    });
    question();
  }

  /* =================== Fin de séance =================== */
  function fin(s) {
    const b = S.bilan(s, etat, new Date());
    sauver();
    KR.son('fete');
    const vues = new Set();
    const montees = b.montees.filter(m => { const k = T.cle(m.a, m.b); if (vues.has(k)) return false; vues.add(k); return true; });
    const jetons = montees.slice(0, 4).map(m => {
      const e = m.couleur === 'or' ? 'auj' : ETAT_CASE[m.couleur];
      const cle = m.couleur === 'or' ? 'etat_or_court' : NOM_CASE[e];
      return `<div class="jeton m-${e}"><b lang="fr">${m.a} × ${m.b}</b><span>${marque(e)}${t(cle)}</span></div>`;
    }).join('');
    const titreMontee = montees.length === 1 ? t('case_monte') : t('cases_montent', { n: montees.length });
    const demain = b.demain ? t('demain_revient', { fait: `<b lang="fr">${b.demain}</b>` }) : t('demain_simple');
    changerEcran(`<div class="ecran fin-seance">
      <div class="fin-masc">${KR.mascotte('fete', 'rebondit')}<p class="fin-nb">${t('questions_n', { n: b.reponses })}</p></div>
      <div class="fin-contenu">
        <h1>${KR.echapper(t('bravo_prenom', { prenom: KR.prenom() }))}</h1>
        ${montees.length ? `<div class="montee"><p class="titre">${KR.icone('monte')}${titreMontee}</p><div class="jetons">${jetons}</div></div>`
          : `<div class="montee"><p class="titre">${KR.icone('ok')}${t('reponses_n', { n: b.reponses })}</p></div>`}
        <div class="ligne-fin">${KR.semaine(b.semaine)}<p class="jours-n">${KR.joursFaits(b.semaine)}</p></div>
        <p class="demain">${KR.icone('cal')}<span>${demain}</span></p>
        <div class="actions-fin">
          <button type="button" class="btn btn-secondaire" data-a="grille">${t('voir_grille')}</button>
          <a class="btn btn-primaire" href="./">${t('fini')}</a>
        </div>
      </div>
    </div>`);
    brancher({ grille: () => grille(accueil) });
  }

  /* =================== Ma grille =================== */
  function grille(retour) {
    etat = T.charger(enfant);
    const compte = { auj: 0, or: 0, pre: 0, com: 0, pas: 0 };
    let h = '<div class="ent coin" aria-hidden="true"></div>';
    for (let b = 1; b <= 10; b++) h += `<div class="ent" data-col="${b}" role="columnheader">${b}</div>`;
    for (let a = 1; a <= 10; a++) {
      h += `<div class="ent" data-ligne="${a}" role="rowheader">${a}</div>`;
      for (let b = 1; b <= 10; b++) {
        const e = etatCase(a, b);
        compte[e]++;
        h += `<button type="button" class="cell m-${e}" data-a="case" data-x="${a}" data-y="${b}" data-etat="${e}" role="gridcell" aria-label="${a} × ${b}, ${KR.echapper(t(NOM_CASE[e]))}">${marque(e)}</button>`;
      }
    }
    const legende = ['auj', 'or', 'pre', 'com', 'pas'].map(e =>
      `<div><span class="ech m-${e}">${marque(e)}</span><span class="lib">${t(NOM_CASE[e])}</span><span class="n">${compte[e]}</span></div>`).join('');
    changerEcran(`<div class="ecran grille-ecran">
      <header class="barre">${nav('retour', 'retour', 'retour')}
        <div class="titre"><h1 class="titre-ecran">${t('ma_grille')}</h1><p class="indice">${t('touche_case')}</p></div></header>
      <div class="grille-corps">
        <div class="grille" role="grid" aria-label="${t('ma_grille')}">${h}</div>
        <div class="panneau"><div class="detail" aria-live="polite"><p class="detail-vide">${t('touche_case')}</p></div><div class="legende-m">${legende}</div></div>
      </div>
    </div>`);
    let touchee = null;
    brancher({
      retour,
      case: b => {
        const a = Number(b.dataset.x);
        const c = Number(b.dataset.y);
        const e = b.dataset.etat;
        if (touchee) { touchee.classList.remove('touchee'); touchee.innerHTML = marque(touchee.dataset.etat); }
        app.querySelectorAll('.ent.actif').forEach(n => n.classList.remove('actif'));
        app.querySelector(`[data-ligne="${a}"]`).classList.add('actif');
        app.querySelector(`[data-col="${c}"]`).classList.add('actif');
        b.classList.add('touchee');
        b.innerHTML = `<b>${a * c}</b>${marque(e)}`;
        touchee = b;
        app.querySelector('.detail').innerHTML = `
          <div class="fait" lang="fr">${a}${x}${c}${eg}${a * c}</div>
          <span class="pastille m-${e}">${marque(e)}${t(NOM_CASE[e])}</span>
          <div class="bulle astuce" lang="fr"><div class="etiq">${KR.icone('ampoule')}L'astuce de ${KR.nomMascotte()}</div>${KR.echapper(T.astuce(a, c))}</div>`;
      },
    });
  }

  accueil();
})();
