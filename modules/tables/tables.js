/* Interface du module des tables : accueil, diagnostic, séance, fin, grille.
   Dépend de commun/textes.js, commun/kit.js, moteur.js (Tables) et seance.js (Seance).
   Le contenu scolaire (questions, astuces, consignes) reste en français. */
(function () {
  'use strict';
  const KR = window.KR;
  const T = window.Tables;
  const S = window.Seance;
  const A = window.Album;
  const t = KR.t;
  const enfant = KR.enfant();
  const app = document.getElementById('app');
  const DUREE_DIAGNOSTIC = 60000;
  const DUREE_SUITE = 1600;
  const MAX_CHIFFRES = 3;
  const ETAT_CASE = { gris: 'pas', bronze: 'com', argent: 'pre', or: 'or' };
  const NOM_CASE = { pas: 'etat_gris', com: 'etat_bronze', pre: 'etat_argent', or: 'etat_or', auj: 'etat_or_auj' };
  const RANG_CASE = { pas: 0, com: 1, pre: 2, or: 3, auj: 3 };
  /* « 48 est-il un multiple de 6 ? » en CM2, le vocabulaire d'Eduscol ; « dans la table de »
     en CM1, tant que la maîtresse d'Henri n'emploie pas « multiple » (à lui demander). */
  const MULTIPLE = KR.infos().classe === 'CM2' ? 'un multiple de' : 'dans la table de';
  const RELANCE = { sans1: 'Essaie sans le 1 !', jusqua10: "Essaie avec des nombres jusqu'à 10 !" };
  // Fin de séance : trois cartes dorées en grand, sept petites cartes tamponnées par rangée.
  const DOREES_MAX = 3;
  const PETITES_MAX = 7;

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
  /* Voix (décision de Louis du 01/11/2026) : chaque question est lue dès qu'elle s'affiche,
     chaque réponse juste fait dire le fait complet avant la question suivante. */
  const SECOURS_VOIX = 6000;
  const voixActive = () => KR.reglages().voix;
  const aLire = q => T.questionDite(q, MULTIPLE);
  function direQuestion(q) { if (voixActive()) KR.lire(aLire(q), 'fr'); }
  function direFait(a, b) { return voixActive() ? KR.lire(T.faitDit(a, b), 'fr', SECOURS_VOIX) : Promise.resolve(false); }
  /* La grille montre les mêmes données que l'album (relecture de la progression, proposition 8) :
     une case par carte, selon ses tampons. Les lignes 1 et 10, hors album, gardent leurs boîtes. */
  function etatCase(a, b) {
    return A.etatCase(etat, a, b, T.jour(new Date())) || ETAT_CASE[T.couleur(etat, a, b)];
  }
  function marque(e) {
    if (e === 'or' || e === 'auj') return KR.icone('etoile');
    if (e === 'pre') return '<span class="pts"><i></i><i></i></span>';
    if (e === 'com') return '<span class="pts"><i></i></span>';
    return '';
  }
  /* Le résultat le plus fragile qui revient aujourd'hui, de 2 à 9, ou null. */
  function revientAujourdhui(maintenant) {
    const j = T.jour(maintenant);
    const dus = Object.keys(etat.faits).map(k => k.split('x').map(Number)).filter(([a, b]) => {
      const f = etat.faits[T.cle(a, b)];
      return a >= 2 && a <= 9 && b >= 2 && b <= 9 && f.vu && f.prochain && f.prochain <= j && T.familleDuFait(a, b) < etat.familles;
    }).sort((x, y) => {
      const fx = etat.faits[T.cle(...x)];
      const fy = etat.faits[T.cle(...y)];
      return fx.boite - fy.boite || (fy.erreurs || 0) - (fx.erreurs || 0);
    });
    return dus.length ? `${dus[0][0]} × ${dus[0][1]}` : null;
  }

  /* =================== L'album à tampons (D-20) : la carte d'une multiplication ===================
     Quatre emplacements de tampon ; un tampon gagné aujourd'hui est en or vif ; au quatrième, la
     carte est dorée et montre enfin son résultat. Une carte dorée qui retombe garde son or et dit
     « Comes back tomorrow ». Rien n'annonce qu'une carte peut dorer aujourd'hui. */
  function carteAlbum(c, taille) {
    const j = T.jour(new Date());
    let tps = '';
    for (let i = 0; i < T.TAMPONS_OR; i++) {
      const d = c.jours[i];
      const cl = d ? 'plein' + (d === j ? ' du-jour' : '') : '';
      tps += `<span class="tp ${cl}">${i === T.TAMPONS_OR - 1 ? KR.icone('etoile') : ''}</span>`;
    }
    const etatCarte = c.or ? (c.orAuj ? 'or or-auj' : 'or') : c.n === 0 ? 'neuf' : c.presque ? 'presque' : '';
    const ecrit = `${c.a} × ${c.b}`;
    const aria = c.or ? t('carte_or_aria', { fait: ecrit }) : t(c.n === 1 ? 'carte_aria_un' : 'carte_aria', { fait: ecrit, n: c.n });
    const texteRevient = c.revoir ? t(c.revient === 'auj' ? 'revient_aujourdhui' : 'revient_demain') : '';
    const revient = c.revoir ? `<span class="revient">${texteRevient}</span>` : '';
    return `<span class="cf ${etatCarte}${c.revoir ? ' revoir' : ''} ${taille || ''}" role="img" aria-label="${KR.echapper(aria + (c.revoir ? '. ' + texteRevient : ''))}">
      ${c.or ? `<span class="badge-or">${KR.icone('etoile')}</span>` : ''}
      <span class="op" lang="fr">${ecrit}</span>${c.or ? `<span class="rep" lang="fr">= ${c.a * c.b}</span>` : ''}
      <span class="tps">${tps}</span>${revient}</span>`;
  }
  const nomFamille = p => t('fam_' + p.id);
  const tablesFamille = p => `<span lang="fr">${p.tables.map(n => '×' + n).join(' · ')}</span>`;
  /* « 5 × 6 et 2 × 9 », « 5 × 6, 2 × 9 and 3 × 3 » : liste dans la langue du cadre. */
  function liste(l) {
    if (l.length < 2) return l.join('');
    return `${l.slice(0, -1).join(', ')} ${t('et')} ${l[l.length - 1]}`;
  }

  /* =================== Accueil du module =================== */
  function accueil() {
    etat = T.charger(enfant);
    if (!etat.diagnostic) return introDiagnostic();
    // Ce qui attend l'enfant aujourd'hui : la carte le montre au lieu d'un aplat vide (point 9).
    const maintenant = new Date();
    const j = T.jour(maintenant);
    const nbQuestions = T.seance(etat, maintenant).length;
    const revient = revientAujourdhui(maintenant);
    const infos = `<span class="ce-info">${KR.icone('ok')}<span>${t('questions_auj', { n: nbQuestions })}</span></span>`
      + (revient ? `<span class="ce-info">${KR.icone('cal')}<span>${t('revient_auj', { fait: `<b lang="fr">${revient}</b>` })}</span></span>` : '');
    const total = A.total(etat);
    const or = A.nbOr(etat);
    const proches = A.proches(etat, j, 3);
    const familles = A.pages(etat, j).map(p => `<span class="fam-mini${p.ouverte ? '' : ' ferme'}${p.complet ? ' complet' : ''}">
        <span>${nomFamille(p)}</span><span class="n">${p.ouverte ? `${KR.icone('etoile')}${t('avancement', { n: p.or, total: p.cartes.length })}` : t('pas_ouverte')}</span></span>`).join('');
    changerEcran(`<div class="ecran accueil-tables">
      <header class="barre">${nav('', 'retour', 'retour', './')}
        <div class="titre"><h1 class="titre-ecran">${t('module_tables')}</h1><p class="indice">${t('indice_album')}</p></div>
      </header>
      <div class="accueil-album">
        <button type="button" class="carte-entrainement" data-a="seance">
          <span class="ce-haut"><span class="ce-masc">${KR.mascotte('attend')}</span><span class="ce-infos">${infos}</span></span>
          <span class="ce-semaine">${KR.semaine(T.joursDeLaSemaine(etat, maintenant))}</span>
          <span class="ce-texte"><b>${t('entrainement')}</b><span>${t('entrainement_sous')}</span></span>
          <span class="ce-go">${KR.icone('jouer')}</span>
        </button>
        <button type="button" class="panneau-album" data-a="album">
          <span class="pa-tete"><span class="tuile">${KR.icone('grille')}</span>
            <span><b>${t('mes_cartes')}</b><span class="compteurs">
              <span class="compteur"><span class="tp plein"></span>${t(total === 1 ? 'tampon_un' : 'tampons_n', { n: total })}</span>
              <span class="compteur or">${KR.icone('etoile')}${t('or_n', { n: or })}</span></span></span></span>
          ${proches.length
            ? `<span class="pa-sous">${t('presque_or')}</span><span class="rang-cartes">${proches.map(c => carteAlbum(c, 'grand')).join('')}</span><span class="pa-note">${t('presque_note')}</span>`
            : `<span class="pa-note">${t('album_vide')}</span>`}
          <span class="pa-familles">${familles}</span>
        </button>
      </div>
    </div>`);
    brancher({ seance: demarrerSeance, album: () => album(accueil) });
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
    let premiereTouche = 0;
    let pave = null;
    let fini = false;

    function terminer() {
      if (fini) return;
      fini = true;
      T.appliquerDiagnostic(etat, reponses, new Date());
      sauver();
      KR.son('fete');
      // « Let's go » enchaîne sur la première séance, sans repasser par l'accueil (point 12).
      parole('fete', t('diag_fin'), 'commencer', demarrerSeance, nav('', 'retour', 'retour', './'));
    }
    function majCase() {
      app.querySelector('.ligne-rep').innerHTML = eg + caseRep(saisie, true);
      pave.etat(saisie ? 'pret' : 'vide');
    }
    function suivante(juste) {
      const q = questions[i];
      reponses.push({ a: q.a, b: q.b, juste, ms: juste === null ? null : Math.round((premiereTouche || performance.now()) - debutQ) });
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
      premiereTouche = 0;
      direQuestion(q);
    }

    changerEcran(`<div class="ecran ecran-fixe exo diagnostic">
      <header class="barre">${nav('', 'retour', 'retour', './')}<div class="avance"></div>${nav('ecouter', 'son', 'ecouter')}</header>
      <div class="corps"><section class="zone"></section><section class="action"></section></div>
    </div>`);
    pave = KR.pave({
      chiffre(d) { if (!premiereTouche) premiereTouche = performance.now(); if (saisie.length < MAX_CHIFFRES) { saisie = (saisie + d).replace(/^0+(?=\d)/, ''); majCase(); } },
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
    const s = S.creer(etat, new Date(), undefined, { multiple: MULTIPLE });
    const precharger = l => { if (voixActive()) KR.prechargerVoix(l.filter(Boolean).flatMap(x => [{ texte: aLire(x), langue: 'fr' }, { texte: T.faitDit(x.a, x.b), langue: 'fr' }])); };
    precharger(s.questions.slice(0, 3)); // puis une question d'avance à chaque question (voir question())
    const resultats = [];
    let q = null;
    let saisie = '';
    let duo = ['', ''];
    let champ = 0;
    let phase = 'question';
    let debutQ = 0;
    let premiereTouche = 0;
    let pave = null;
    let revoir = null;
    // Bulle de la mascotte, en anglais : « Nearly! Let's look again » (point 8).
    const bulleRevoir = () => `${t('presque')} ${t('on_regarde')}`;

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
        if (phase === 'question' && !premiereTouche) premiereTouche = performance.now();
        // Retape : la bonne réponse se masque au premier chiffre, l'enfant la rappelle (point 12).
        if (phase === 'revoir') { const rev = zone.querySelector('.carte-rev'); if (rev) rev.classList.add('masque'); }
        if (phase === 'question' && q.type === 'decomposition') {
          if (duo[champ].length < MAX_CHIFFRES) duo[champ] = (duo[champ] + d).replace(/^0+(?=\d)/, '');
          // Le premier nombre est complet dès qu'il ne peut plus commencer un nombre des tables :
          // tout chiffre sauf 1 (qui peut devenir 10), ou deux chiffres. On passe alors à la seconde case.
          if (champ === 0 && duo[0] && (duo[0] !== '1' || duo[0].length > 1)) champ = 1;
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
            if (!duo[0] || !duo[1]) return;
            const deux = [Number(duo[0]), Number(duo[1])];
            const relance = T.relanceDecomposition(q, deux);
            if (relance) return relancer(relance);
            return repondre(deux);
          }
          return repondre(Number(saisie));
        }
        if (phase === 'revoir') return retaper();
      },
    });

    function majAvance() {
      let h = '';
      for (let k = 0; k < s.questions.length; k++) {
        if (s.questions[k].retour) continue;
        if (resultats[k]) h += `<i class="pt ${resultats[k] === 'j' ? 'juste' : 'revu'}"></i>`;
        else if (k === s.index && phase !== 'juste') h += '<i class="pt ici"></i>';
        else h += '<i class="pt"></i>';
      }
      const av = app.querySelector('.avance');
      av.querySelector('.points-av').innerHTML = h;
      const { n, total } = S.avancement(s);
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
      precharger([s.questions[s.index + 3]]);
      numeroQ++;
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
        corps = `<div class="fait ligne-op">${q.nombre}</div><p class="ligne-texte">est-il ${MULTIPLE} ${q.a}&nbsp;?</p>`;
      }
      zone.innerHTML = `<div class="carte-q carte-pleine" lang="fr" data-type="${q.type}" data-a-fait="${q.a}" data-b-fait="${q.b}"${q.type === 'multiple' ? ` data-nombre="${q.nombre}"` : ''}>${corps}</div>`;
      if (q.type === 'multiple') {
        action.innerHTML = `<div class="choix" lang="fr"><button type="button" class="btn btn-secondaire" data-a="choix" data-valeur="oui">Oui</button><button type="button" class="btn btn-secondaire" data-a="choix" data-valeur="non">Non</button></div>`;
      } else {
        montrerPave();
        pave.etat('vide');
      }
      debutQ = performance.now();
      premiereTouche = 0;
      direQuestion(q);
    }

    function majSaisie() {
      const ligne = zone.querySelector('[data-case]');
      if (phase === 'question' && q.type === 'decomposition') {
        ligne.innerHTML = caseRep(duo[0], champ === 0, 0) + x + caseRep(duo[1], champ === 1, 1);
        // Check reste en pointillé tant que les deux cases ne sont pas remplies (point 5).
        pave.etat(duo[0] && duo[1] ? 'pret' : 'vide');
        return;
      }
      if (phase === 'question' && q.type === 'manquant') ligne.innerHTML = `${q.a}${x}${caseRep(saisie, true)}`;
      else if (phase === 'question') ligne.innerHTML = eg + caseRep(saisie, true);
      else ligne.innerHTML = `${q.a}${x}${q.b}${eg}${caseRep(saisie, true)}`;
      pave.etat(saisie ? 'pret' : 'vide');
    }

    /* « 1 × 24 » ou « 2 × 12 » : ni erreur ni crédit, une relance dans la consigne (point 5). */
    function relancer(cle) {
      KR.son('doux');
      duo = ['', ''];
      champ = 0;
      const consigne = zone.querySelector('.consigne');
      if (consigne) { consigne.textContent = RELANCE[cle]; consigne.classList.add('relance'); }
      majSaisie();
      if (voixActive()) KR.lire(RELANCE[cle], 'fr');
    }

    function repondre(valeur) {
      const ms = Math.round((premiereTouche || performance.now()) - debutQ);
      const r = S.repondre(s, etat, valeur, ms, new Date());
      sauver();
      if (r.juste) {
        resultats[s.index] = 'j';
        return montrerJuste(r.rapide, valeur);
      }
      resultats[s.index] = 'r';
      montrerRevoir(r);
    }

    /* Après une réponse juste (décision de Louis et d'Henri du 01/11/2026) : rapide, le fait est su, on
       enchaîne sans le redire ; hésitante, ou après une erreur, la voix dit le fait complet (« sept fois
       sept, quarante-neuf ») et rien ne permet d'avancer avant la fin de la phrase. */
    let numeroQ = 0;
    function enchainer(a, b, redire) {
      const ici = numeroQ;
      const lancerSuite = () => {
        if (ici !== numeroQ || phase !== 'juste') return;
        pave.etat('suite', DUREE_SUITE);
        plusTard(() => { if (ici === numeroQ && phase === 'juste') suivante(); }, DUREE_SUITE);
      };
      if (!redire || !voixActive()) return lancerSuite();
      pave.etat('vide');
      pave.bloquer(true);
      direFait(a, b).then(lancerSuite);
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
      if (q.type === 'decomposition') enchainer(valeur[0], valeur[1], !rapide);
      else enchainer(q.a, q.b, !rapide);
    }

    function montrerRevoir(r) {
      phase = 'revoir';
      saisie = '';
      revoir = r;
      majAvance();
      KR.son('doux');
      zone.innerHTML = `
        <div class="carte-q carte-rev" lang="fr">${q.type === 'produit'
          ? `<div class="fait">${q.a}${x}${q.b}${eg}<span class="surligne">${r.bonne}</span></div>`
          : `<div class="fait"><span class="surligne">${KR.echapper(r.correction.reponse)}</span></div><p class="ligne-texte">${KR.echapper(r.correction.phrase)}</p>`}</div>
        <div class="retour-masc">${KR.medaillon('aide')}${KR.mascotte('aide')}
          <div class="bulles"><div class="bulle parle">${bulleRevoir()}</div>
          <div class="bulle astuce" lang="fr"><div class="etiq">${KR.icone('ampoule')}L'astuce de ${KR.nomMascotte()}</div>${KR.echapper(r.astuce)}</div></div></div>
        <div class="carte-q carte-retape" lang="fr"><p class="consigne">À toi de le retaper</p>
          <div class="fait" data-case>${q.a}${x}${q.b}${eg}${caseRep('', true)}</div></div>`;
      montrerPave();
      pave.etat('vide');
      // Le fait juste se dit en entier, sur un ton neutre, avant que l'enfant puisse le retaper.
      if (voixActive()) {
        pave.bloquer(true);
        const ici = numeroQ;
        direFait(q.a, q.b).then(() => { if (ici === numeroQ && phase === 'revoir') pave.bloquer(false); });
      }
    }

    function retaper() {
      if (!S.retaper(s, Number(saisie))) {
        KR.son('doux');
        saisie = '';
        // Retape fausse : la bonne réponse réapparaît, on ne laisse pas l'enfant sans repère.
        zone.querySelector('.carte-rev').classList.remove('masque');
        return majSaisie();
      }
      phase = 'juste';
      KR.son('juste');
      const carte = zone.querySelector('.carte-retape');
      carte.classList.add('carte-juste');
      carte.querySelector('[data-case]').innerHTML = `${q.a}${x}${q.b}${eg}<span class="rep-verte">${q.a * q.b}</span>`;
      majAvance();
      enchainer(q.a, q.b, false); // le fait vient d'être dit avant la retape
    }

    function suivante() {
      minuteurs.forEach(clearTimeout);
      minuteurs = [];
      S.suivante(s);
      if (S.finie(s)) return fin(s);
      question();
    }

    /* Un Back par erreur ne fait pas perdre la séance : on demande d'abord (point 12). */
    function confirmerArret() {
      if (document.querySelector('.voile')) return;
      const voile = document.createElement('div');
      voile.className = 'voile';
      voile.innerHTML = `<div class="feuille feuille-arret" role="dialog" aria-modal="true" aria-labelledby="arret-titre">
        <h2 id="arret-titre">${t('arreter_question')}</h2>
        <div class="boutons"><button type="button" class="btn btn-secondaire" data-arret="non">${t('continuer')}</button>
        <button type="button" class="btn btn-primaire" data-arret="oui">${t('arreter')}</button></div></div>`;
      document.body.appendChild(voile);
      const fermer = () => voile.remove();
      voile.addEventListener('click', e => {
        if (e.target === voile) return fermer();
        const b = e.target.closest('[data-arret]');
        if (!b) return;
        fermer();
        if (b.dataset.arret === 'oui') accueil();
      });
      voile.querySelector('[data-arret="non"]').focus();
    }

    brancher({
      retour: confirmerArret,
      // Sur l'écran d'erreur, Listen lit la bulle (langue du cadre), le fait juste puis l'astuce en français (point 8).
      ecouter: () => {
        if (phase === 'revoir' && revoir) {
          KR.lireSuite([{ texte: bulleRevoir(), langue: KR.reglages().langue }, { texte: T.faitDit(q.a, q.b), langue: 'fr' }, { texte: revoir.astuce.replace(/×/g, 'fois'), langue: 'fr' }]);
        } else if (phase === 'juste') KR.lire(T.faitDit(q.a, q.b), 'fr');
        else KR.lire(aLire(q), 'fr');
      },
      champ: b => { champ = Number(b.dataset.champ); majSaisie(); },
      choix: b => { if (phase === 'question') repondre(b.dataset.valeur === 'oui'); },
    });
    question();
  }

  /* =================== Fin de séance =================== */
  /* Fin de séance (D-20) : les cartes dorées du jour en grand, les cartes tamponnées aujourd'hui
     (tampon du jour en or vif), et la carte qui revient demain pour un tampon. Les phrases parlent
     du fait retrouvé, pas du butin (relecture de la progression, proposition 4). */
  function fin(s) {
    const maintenant = new Date();
    const j = T.jour(maintenant);
    const b = S.bilan(s, etat, maintenant);
    sauver();
    KR.son('fete');
    const dj = A.duJour(etat, j);
    const total = A.total(etat);
    const nom = c => `<b lang="fr">${c.a} × ${c.b}</b>`;
    const dorees = dj.dorees.slice(0, DOREES_MAX);
    const blocOr = dj.dorees.length ? `<div class="bloc bloc-or">
        <p class="titre">${KR.icone('etoile')}${t(dj.dorees.length === 1 ? 'carte_doree' : 'cartes_dorees', { n: dj.dorees.length })}</p>
        <div class="contenu"><span class="rangee-or">${dorees.map(c => carteAlbum(c, 'grand')).join('')}</span>
          <p class="phrase">${t(dj.dorees.length === 1 ? 'or_phrase_un' : 'or_phrase', { faits: liste(dj.dorees.map(nom)) })}</p></div></div>` : '';
    // Au-delà de la rangée, une pastille « +N » : l'enfant compte autant de cartes que le titre en annonce.
    const n = dj.tamponnees.length;
    const montrees = n > PETITES_MAX ? dj.tamponnees.slice(0, PETITES_MAX - 1) : dj.tamponnees;
    const blocTampons = n ? `<div class="bloc">
        <p class="titre">${KR.icone('monte')}${t(n === 1 ? 'un_pas_un' : 'un_pas', { n })}<span class="total">${t('tampons_total', { n: total })}</span></p>
        <div class="rangee">${montrees.map(c => carteAlbum(c, 'petit')).join('')}${n > montrees.length ? `<span class="cf petit plus-n">+${n - montrees.length}</span>` : ''}</div></div>`
      : dj.dorees.length ? '' : `<div class="bloc"><p class="titre">${KR.icone('ok')}${t('reponses_n', { n: b.reponses })}</p><p class="bloc-note">${t('un_par_jour')}</p></div>`;
    const retrouvees = b.retrouvees.map(([x, y]) => A.carte(etat, x, y, j));
    const lignesRetrouvees = retrouvees.length ? `<p class="demain retrouve">${KR.icone('ok')}<span>${t(retrouvees.length === 1 ? 'retrouve_un' : 'retrouve', { faits: liste(retrouvees.map(nom)) })}</span></p>` : '';
    const prochain = A.prochainTampon(etat, maintenant);
    const demain = prochain ? t('demain_tampon', { fait: `<b lang="fr">${prochain[0]} × ${prochain[1]}</b>` })
      : b.demain ? t('demain_revient', { fait: `<b lang="fr">${b.demain}</b>` }) : t('demain_simple');
    changerEcran(`<div class="ecran fin-seance">
      <div class="fin-masc">${KR.mascotte('fete', 'rebondit')}<p class="fin-nb">${t('questions_n', { n: b.reponses })}</p></div>
      <div class="fin-contenu">
        <h1>${KR.echapper(t('bravo_prenom', { prenom: KR.prenom() }))}</h1>
        ${blocOr}${blocTampons}${lignesRetrouvees}
        <div class="ligne-fin">${KR.semaine(b.semaine)}<p class="jours-n">${KR.joursFaits(b.semaine)}</p></div>
        <p class="demain">${KR.icone('cal')}<span>${demain}</span></p>
        <div class="actions-fin">
          <button type="button" class="btn btn-secondaire" data-a="album">${t('voir_cartes')}</button>
          <a class="btn btn-primaire" href="./">${t('fini')}</a>
        </div>
      </div>
    </div>`);
    brancher({ album: () => album(accueil) });
  }

  /* =================== Mon album : une page par famille, dans l'ordre d'Eduscol ===================
     Onglet médaillé quand toute la page est dorée ; familles pas encore ouvertes en pointillé,
     jamais cadenassées (elles s'ouvrent sur les boîtes réelles). La grille de Pythagore est à un
     geste, en bascule « See as a grid ». */
  function album(retour, pageDemandee) {
    etat = T.charger(enfant);
    const j = T.jour(new Date());
    const pages = A.pages(etat, j);
    const ouvertes = pages.filter(p => p.ouverte).length;
    const ici = pageDemandee != null ? pageDemandee : Math.max(0, ouvertes - 1);
    const p = pages[ici];
    const onglets = pages.map(q => {
      const cl = (q.index === ici ? ' actif' : '') + (q.ouverte ? '' : ' ferme') + (q.complet && q.index !== ici ? ' complet' : '');
      return `<button type="button" class="onglet${cl}" data-a="onglet" data-page="${q.index}" aria-pressed="${q.index === ici}">
        ${q.complet ? `<span class="medaille">${KR.icone('etoile')}</span>` : ''}<b>${nomFamille(q)}</b>
        <span>${q.ouverte ? `${KR.icone('etoile')}${t('avancement', { n: q.or, total: q.cartes.length })}` : t('pas_ouverte')}</span></button>`;
    }).join('');
    const sous = p.ouverte ? t('page_bilan', { or: p.or, presque: p.presque })
      : t('ouvre_quand', { famille: nomFamille(pages[Math.max(0, ici - 1)]) });
    const total = A.total(etat);
    changerEcran(`<div class="ecran album-ecran">
      <header class="barre">${nav('retour', 'retour', 'retour')}
        <div class="titre"><h1 class="titre-ecran">${t('mes_cartes')}</h1><p class="indice">${t('album_indice', { n: total, or: A.nbOr(etat) })}</p></div>
        ${nav('grille', 'grille', 'voir_grille_album')}</header>
      <nav class="onglets" aria-label="${t('mes_cartes')}">${onglets}</nav>
      <section class="page-album${p.ouverte ? '' : ' page-fermee'}">
        <div class="page-tete"><h2>${nomFamille(p)} ${tablesFamille(p)}</h2><p>${sous}</p></div>
        <div class="cartes-page">${p.cartes.map(c => carteAlbum(c)).join('')}</div>
        <div class="legende-tp">
          <div><span class="tp"></span>${t('leg_vide')}</div>
          <div><span class="tp plein"></span>${t('leg_tampon')}</div>
          <div><span class="tp plein du-jour"></span>${t('leg_auj')}</div>
          <div><span class="tp plein or-leg">${KR.icone('etoile')}</span>${t('leg_or')}</div>
        </div>
      </section>
    </div>`);
    brancher({
      retour,
      onglet: b => album(retour, Number(b.dataset.page)),
      grille: () => grille(() => album(retour, ici)),
    });
  }

  /* =================== Ma grille (bascule de l'album) =================== */
  function grille(retour) {
    etat = T.charger(enfant);
    /* Un seul dénominateur partout (point 10) : la légende compte les 36 cartes de l'album, les deux
       cases d'une carte dans le même état (ses tampons). Les lignes et colonnes 1 et 10, faciles,
       restent visibles mais atténuées, hors du compte. */
    const compte = { auj: 0, or: 0, pre: 0, com: 0, pas: 0 };
    for (let a = 2; a <= 9; a++) for (let b = a; b <= 9; b++) {
      const e1 = etatCase(a, b);
      const e2 = etatCase(b, a);
      const faible = RANG_CASE[e1] <= RANG_CASE[e2] ? e1 : e2;
      compte[faible === 'or' && (e1 === 'auj' || e2 === 'auj') ? 'auj' : faible]++;
    }
    const facile = n => n === 1 || n === 10;
    let h = '<div class="ent coin" aria-hidden="true"></div>';
    for (let b = 1; b <= 10; b++) h += `<div class="ent${facile(b) ? ' ent-facile' : ''}" data-col="${b}" role="columnheader">${b}</div>`;
    for (let a = 1; a <= 10; a++) {
      h += `<div class="ent${facile(a) ? ' ent-facile' : ''}" data-ligne="${a}" role="rowheader">${a}</div>`;
      for (let b = 1; b <= 10; b++) {
        const e = etatCase(a, b);
        h += `<button type="button" class="cell m-${e}${facile(a) || facile(b) ? ' facile' : ''}" data-a="case" data-x="${a}" data-y="${b}" data-etat="${e}" role="gridcell" aria-label="${a} × ${b}, ${KR.echapper(t(NOM_CASE[e]))}">${marque(e)}</button>`;
      }
    }
    const parCoeur = compte.auj + compte.or;
    const legende = `<p class="legende-titre">${KR.icone('etoile')}${t('tables_par_coeur', { n: parCoeur, total: 36 })}</p>`
      + ['auj', 'or', 'pre', 'com', 'pas'].map(e =>
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
        const revoir = T.estCarte(a, c) && T.aRevoir(etat, a, c);
        app.querySelector('.detail').innerHTML = `
          <div class="fait" lang="fr">${a}${x}${c}${eg}${a * c}</div>
          <span class="pastille m-${e}">${marque(e)}${t(NOM_CASE[e])}</span>${revoir ? `<span class="pastille revient-pastille">${KR.icone('cal')}${t('revient_demain')}</span>` : ''}
          <div class="bulle astuce" lang="fr"><div class="etiq">${KR.icone('ampoule')}L'astuce de ${KR.nomMascotte()}</div>${KR.echapper(T.astuce(a, c, etat))}</div>`;
      },
    });
  }

  accueil();
})();
