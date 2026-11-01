/* Interface du jeu du nombre cible (façon Mathador, règles d'Henri : D-18).
   Trois écrans : l'accueil du jeu (barème, choix du chrono), la partie, la fin de partie.
   Dépend de commun/textes.js, commun/kit.js, moteur.js, contenu.js et etat.js.
   Tout suit la langue du cadre de l'enfant, anglais britannique par défaut (D-21) : consignes,
   explications des coups refusés, idée de la mascotte et voix ; contenu.js garde le français. */
(function () {
  'use strict';
  const KR = window.KR;
  const C = window.Cible;
  const langue = () => (KR.reglages().langue === 'fr' ? 'fr' : 'en');
  const CC = window.CibleContenu.de(langue());
  const refus = window.CibleContenu.refus;
  const E = window.CibleEtat;
  const t = KR.t;
  const enfant = KR.enfant();
  const app = document.getElementById('app');
  // Clara (CM2) : une cible qui admet le coup parfait ; Henri (CM1) : toute cible atteignable.
  const SCORE_MIN = KR.infos().classe === 'CM2' ? C.COUP_PARFAIT : 1;
  const CHRONOS = [0, 3, 5]; // minutes ; 0 = sans chrono, le défaut (D-18)
  const OPS = ['+', '−', '×', '÷'];
  const SECOURS_VOIX = 8000;
  const DELAI_FETE = 1300;
  const ICONE_ANNULER = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 14L4 9l5-5" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 9h10a6 6 0 010 12h-3" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"/></svg>';
  const ICONE_RECOMMENCER = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12a8 8 0 11-2.6-5.9" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"/><path d="M19.5 3v4.5H15" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  KR.demarrer();
  let etat = E.charger(enfant);
  let minuteurs = [];
  let intervalles = [];
  let jeton = 0; // change à chaque écran : une suite (voix, minuterie) d'un écran quitté s'arrête

  const sauver = () => window.CibleEtat.sauver(enfant, etat); // relu à chaque appel : la synchro l'enveloppe
  const voixActive = () => KR.reglages().voix;
  const dire = textes => (voixActive() ? KR.lireSuite(textes.filter(Boolean).map(texte => ({ texte, langue: langue() })), SECOURS_VOIX) : Promise.resolve(false));
  const lireCadre = cle => KR.lire(t(cle, { mascotte: KR.nomMascotte(), n: C.COUT_INDICE }), langue());
  const pts = n => (n === 1 ? t('cible_pt_un') : t('cible_pts', { n }));
  const points = n => (n === 1 ? t('cible_score_un') : t('cible_score', { n }));

  /* Le résumé du portail (D-19) : le kit le range dans l'état local ; on le garde aussi en mémoire,
     sinon le prochain sauver l'effacerait. À appeler après sauver. */
  function publier() {
    try {
      if (!KR.publierResume) return;
      const r = KR.publierResume('cible', E.resume(etat, new Date()));
      if (r) etat.resume = r;
    } catch (e) { /* le portail lira plus tard */ }
  }
  function plusTard(fn, ms) { minuteurs.push(setTimeout(fn, ms)); }
  function changerEcran(html) {
    minuteurs.forEach(clearTimeout);
    intervalles.forEach(clearInterval);
    minuteurs = [];
    intervalles = [];
    jeton++;
    KR.taire();
    const voile = document.querySelector('.voile');
    if (voile) voile.remove();
    app.innerHTML = html;
    window.scrollTo(0, 0);
    return jeton;
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
  /* Une feuille posée sur l'écran : deux boutons, le principal à droite. */
  function feuille(titre, texte, boutons, quand, attitude) {
    if (document.querySelector('.voile')) return;
    const voile = document.createElement('div');
    voile.className = 'voile';
    voile.innerHTML = `<div class="feuille feuille-arret c-feuille" role="dialog" aria-modal="true" aria-labelledby="c-feuille-titre">
      <div class="c-feuille-masc">${KR.mascotte(attitude || 'attend')}</div>
      <h2 id="c-feuille-titre">${KR.echapper(titre)}</h2>${texte ? `<p class="c-feuille-texte">${KR.echapper(texte)}</p>` : ''}
      <div class="boutons">${boutons.map(b => `<button type="button" class="btn ${b.classe}" data-f="${b.id}">${KR.echapper(b.texte)}</button>`).join('')}</div></div>`;
    document.body.appendChild(voile);
    voile.addEventListener('click', e => {
      const b = e.target.closest('[data-f]');
      if (!b) return;
      voile.remove();
      quand(b.dataset.f);
    });
    voile.querySelector('[data-f]').focus();
  }
  const etapeHtml = (e, avecPoints) => `<li><span class="c-calc">${e.a} ${e.op} ${e.b} = <b>${e.r}</b></span>${avecPoints ? `<span class="c-pt">+${C.POINTS[e.op]}</span>` : ''}</li>`;

  /* =================== Accueil du jeu : barème et chrono =================== */
  function accueil() {
    etat = E.charger(enfant);
    const maintenant = new Date();
    const semaine = E.joursDeLaSemaine(etat, maintenant);
    const r = E.resume(etat, maintenant);
    const bareme = OPS.map(op => `<li><span class="c-op-sym" aria-label="${CC.MOTS_OP[op]}">${op}</span><span class="c-op-pts">${pts(C.POINTS[op])}</span></li>`).join('');
    const chronos = CHRONOS.map(m => `<button type="button" class="c-chrono-choix" data-a="chrono" data-min="${m}" aria-pressed="${m === 0}">
      ${m ? KR.icone('chrono') : ''}<span>${m ? t('cible_minutes', { n: m }) : t('cible_sans_chrono')}</span></button>`).join('');
    changerEcran(`<div class="ecran c-accueil">
      <header class="barre">${nav('', 'retour', 'retour', './')}
        <div class="titre"><h1 class="titre-ecran">${t('module_cible')}</h1><p class="indice">${KR.echapper(r.progres.phrase[langue()])}</p></div>
        ${nav('ecouter', 'son', 'ecouter')}</header>
      <div class="c-accueil-corps">
        <section class="c-presente">
          <div class="c-intro">${KR.mascotte('attend')}<div class="bulle parle">${KR.echapper(t('cible_intro_bulle'))}</div></div>
          <div class="c-bareme"><h2>${t('cible_bareme')}</h2><ul>${bareme}</ul>
            <p class="c-parfait">${KR.icone('etoile')}<span>${t('cible_parfait')}</span><b>${pts(C.COUP_PARFAIT)}</b></p></div>
          <div class="c-semaine">${KR.semaine(semaine)}<p class="jours-n">${KR.joursFaits(semaine)}</p></div>
        </section>
        <section class="c-depart">
          <h2>${KR.icone('chrono')}${t('cible_chrono')}</h2>
          <div class="c-chronos" role="group" aria-label="${t('cible_chrono')}">${chronos}</div>
          <p class="c-note">${t('cible_chrono_note')}</p>
          <button type="button" class="btn btn-primaire c-go" data-a="go">${t('commencer')}${KR.icone('suite')}</button>
        </section>
      </div>
    </div>`);
    let minutes = 0;
    brancher({
      chrono: b => {
        minutes = Number(b.dataset.min);
        app.querySelectorAll('.c-chrono-choix').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
        KR.son('touche');
      },
      go: () => nouvelleCible(minutes),
      ecouter: () => lireCadre('cible_intro_bulle'),
    });
    publier();
  }

  /* Une nouvelle cible : la graine change à chaque partie, le tirage se rejoue à l'identique. */
  function nouvelleCible(minutes) {
    E.commencer(etat);
    sauver();
    const graine = `${enfant}-${E.jour(new Date())}-${etat.parties}`;
    const tirage = C.tirer(graine, SCORE_MIN) || C.tirer(graine + '-bis');
    jeu(tirage, minutes);
  }

  /* =================== La partie =================== */
  function jeu(tirage, minutes) {
    let partie = C.nouvellePartie(tirage);
    let selA = null;
    let selOp = null;
    let message = null; // { genre: 'refus' | 'indice' | 'impasse', texte, dit, ids }
    let nouvelle = null; // la tuile qui vient de naître
    let fini = false;
    let jourMarque = false;
    let finChrono = minutes ? Date.now() + minutes * 60000 : 0;

    changerEcran(`<div class="ecran ecran-fixe exo c-jeu">
      <header class="barre">${nav('retour', 'retour', 'retour')}
        <div class="titre c-statut" aria-live="off"></div>
        ${nav('ecouter', 'son', 'ecouter')}</header>
      <div class="corps">
        <section class="zone c-zone">
          <div class="c-haut">
            <div class="c-cible" role="img" aria-label="${t('cible_mot')} ${tirage.cible}"><span class="c-cible-mot">${t('cible_mot')}</span><span class="c-cible-n">${tirage.cible}</span></div>
            <div class="c-calcul" aria-live="polite"></div>
          </div>
          <div class="c-tuiles" role="group" aria-label="${t('cible_nombres')}"></div>
          <div class="c-retour" aria-live="polite"></div>
          <ol class="c-etapes"></ol>
        </section>
        <section class="action c-action">
          <div class="c-ops" role="group" aria-label="${t('cible_operations')}"></div>
          <p class="c-parfait c-parfait-jeu">${KR.icone('etoile')}<span>${t('cible_parfait')}</span><b>${pts(C.COUP_PARFAIT)}</b></p>
          <div class="c-outils">
            <button type="button" class="btn btn-secondaire" data-a="annuler">${ICONE_ANNULER}${t('cible_annuler')}</button>
            <button type="button" class="btn btn-secondaire" data-a="recommencer">${ICONE_RECOMMENCER}${t('cible_recommencer')}</button>
            <button type="button" class="btn btn-calme c-btn-indice" data-a="indice">${KR.icone('ampoule')}${t('cible_indice')}</button>
          </div>
        </section>
      </div>
    </div>`);
    const ecran = jeton;
    const el = s => app.querySelector(s);
    const valeur = id => partie.dispo.find(x => x.id === id).v;
    const rang = id => (id[0] === 'd' ? 0 : 10) + Number(id.slice(1));

    function consigne() {
      if (!selA) return CC.DIT.consigneNombre;
      if (!selOp) return CC.DIT.consigneOperation;
      return CC.DIT.consigneSecond;
    }

    function rendreStatut() {
      const brut = partie.etapes.reduce((s, e) => s + C.POINTS[e.op], 0);
      let h = `<span class="c-pastille c-points">${KR.icone('etoile')}${pts(brut)}</span>`;
      if (partie.indices) h += `<span class="c-pastille c-moins">${KR.icone('ampoule')}${t('cible_indices_pris', { n: C.COUT_INDICE * partie.indices })}</span>`;
      if (finChrono) {
        const reste = Math.max(0, Math.ceil((finChrono - Date.now()) / 1000));
        h += `<span class="c-pastille c-chrono" role="timer">${KR.icone('chrono')}${Math.floor(reste / 60)}:${String(reste % 60).padStart(2, '0')}</span>`;
      }
      el('.c-statut').innerHTML = h;
    }

    function rendre() {
      rendreStatut();
      // Le calcul en cours, ou le dernier calcul fait, ou la consigne
      const calc = el('.c-calcul');
      const der = partie.etapes[partie.etapes.length - 1];
      if (selA) {
        calc.innerHTML = `<p class="c-expr"><span class="c-terme">${valeur(selA)}</span><span class="c-op-choisie${selOp ? '' : ' vide'}">${selOp || '?'}</span><span class="c-terme vide">?</span></p><p class="c-consigne">${KR.echapper(consigne())}</p>`;
      } else if (der && !message) {
        calc.innerHTML = `<p class="c-expr c-fait">${der.a} ${der.op} ${der.b} = <span class="c-res${fini ? ' c-res-gagne' : ''}">${der.r}</span></p><p class="c-consigne">${KR.echapper(fini ? '' : consigne())}</p>`;
      } else {
        calc.innerHTML = `<p class="c-consigne c-consigne-seule">${KR.echapper(consigne())}</p>`;
      }
      // Les tuiles, dans un ordre stable : les cinq nombres de départ, puis les résultats
      const indices = message && message.ids ? message.ids : [];
      el('.c-tuiles').innerHTML = partie.dispo.slice().sort((a, b) => rang(a.id) - rang(b.id)).map(x => {
        const cl = ['c-tuile'];
        if (x.id[0] === 'r') cl.push('c-resultat');
        if (x.id === selA) cl.push('c-choisie');
        if (x.id === nouvelle) cl.push('c-nouvelle');
        if (indices.includes(x.id)) cl.push('c-montree');
        if (fini && x.v === partie.cible) cl.push('c-gagne');
        return `<button type="button" class="${cl.join(' ')}" data-a="tuile" data-id="${x.id}" aria-pressed="${x.id === selA}"${fini ? ' disabled' : ''}>${x.v}</button>`;
      }).join('');
      // Les opérations, avec leurs points
      el('.c-ops').innerHTML = OPS.map(op => `<button type="button" class="c-op${selA ? '' : ' inactif'}" data-a="op" data-op="${op}" aria-pressed="${op === selOp}" aria-label="${CC.MOTS_OP[op]}, ${pts(C.POINTS[op])}"${fini ? ' disabled' : ''}>
        <span class="c-op-sym">${op}</span><span class="c-op-pts">${pts(C.POINTS[op])}</span></button>`).join('');
      // Le retour de la mascotte : refus expliqué, indice, impasse
      const retour = el('.c-retour');
      if (message) {
        const etiq = message.genre === 'indice' ? `<div class="etiq">${KR.icone('ampoule')}${KR.echapper(CC.ETIQUETTE_INDICE(KR.nomMascotte()))}</div>` : '';
        retour.innerHTML = `<div class="retour-masc">${KR.medaillon('aide')}${KR.mascotte('aide')}<div class="bulles"><div class="bulle astuce">${etiq}${KR.echapper(message.texte)}</div></div></div>`;
      } else retour.innerHTML = '';
      el('.c-etapes').innerHTML = partie.etapes.map(e => etapeHtml(e, true)).join('');
      const vide = !partie.etapes.length || fini;
      app.querySelectorAll('[data-a="annuler"], [data-a="recommencer"]').forEach(b => { b.disabled = vide; b.classList.toggle('inactif', vide); });
      const ind = el('[data-a="indice"]');
      ind.disabled = fini;
      ind.classList.toggle('inactif', fini);
      nouvelle = null;
    }

    function choisirTuile(id) {
      if (fini) return;
      KR.son('touche');
      if (selA && selOp && id !== selA) return essayer(selA, selOp, id);
      if (id === selA) { selA = null; selOp = null; } else { selA = id; selOp = null; }
      if (message && message.genre !== 'indice') message = null;
      rendre();
    }

    function choisirOp(op) {
      if (fini) return;
      if (!selA) { KR.son('doux'); dire([CC.DIT.consigneNombre]); return; }
      KR.son('touche');
      selOp = selOp === op ? null : op;
      if (message && message.genre === 'refus') message = null;
      rendre();
    }

    function essayer(idA, op, idB) {
      const a = valeur(idA);
      const b = valeur(idB);
      const res = C.jouer(partie, idA, op, idB);
      if (!res.ok) {
        const raison = refus(a, op, b);
        message = { genre: 'refus', texte: CC.AFFICHE[raison](a, b), dit: CC.DIT[raison] };
        selOp = null; // le premier nombre reste choisi
        KR.son('doux');
        rendre();
        dire([message.dit]);
        return;
      }
      selA = null;
      selOp = null;
      message = null;
      nouvelle = partie.dispo[partie.dispo.length - 1].id;
      if (!jourMarque) { E.marquerJour(etat, new Date()); sauver(); jourMarque = true; }
      if (res.gagnee) return victoire();
      KR.son('juste');
      if (partie.dispo.length === 1) message = { genre: 'impasse', texte: CC.DIT.dernier, dit: CC.DIT.dernier };
      rendre();
      if (message) dire([message.dit]);
    }

    function annuler() {
      if (fini || !C.annuler(partie)) return;
      KR.son('touche');
      selA = null;
      selOp = null;
      message = null;
      rendre();
    }

    function recommencer() {
      if (fini || !partie.etapes.length) return;
      const indicesPris = partie.indices; // un indice vu reste compté
      partie = C.nouvellePartie(tirage);
      partie.indices = indicesPris;
      selA = null;
      selOp = null;
      message = null;
      KR.son('touche');
      rendre();
    }

    function demanderIndice() {
      if (fini) return;
      const r = C.resoudre(partie.cible, partie.dispo.map(x => x.v));
      if (!r.possible) { // une impasse se dit gratuitement
        message = { genre: 'impasse', texte: CC.DIT.impasse, dit: CC.DIT.impasse };
        rendre();
        dire([message.dit]);
        return;
      }
      const question = t('cible_indice_question', { mascotte: KR.nomMascotte() });
      const cout = t('cible_indice_cout', { n: C.COUT_INDICE });
      if (voixActive()) KR.lireSuite([question, cout].map(texte => ({ texte, langue: langue() })), SECOURS_VOIX);
      feuille(question, cout, [
        { id: 'non', classe: 'btn-secondaire', texte: t('cible_indice_non') },
        { id: 'oui', classe: 'btn-primaire', texte: t('cible_indice_oui') },
      ], choix => {
        if (choix !== 'oui' || ecran !== jeton) return;
        const e = C.indice(partie);
        if (!e) return;
        const idA = partie.dispo.find(x => x.v === e.a).id;
        const idB = partie.dispo.find(x => x.v === e.b && x.id !== idA).id;
        selA = null;
        selOp = null;
        message = { genre: 'indice', texte: CC.AFFICHE.indice(e), dit: CC.DIT.indice, ids: [idA, idB] };
        rendre();
        dire([message.dit]);
      }, 'aide');
    }

    function victoire() {
      fini = true;
      finChrono = 0;
      intervalles.forEach(clearInterval);
      KR.son('fete');
      rendre();
      const score = C.scorePartie(partie);
      const brut = C.score(partie.etapes, partie.depart.length);
      const parfait = brut === C.COUP_PARFAIT;
      E.gagner(etat, { cible: tirage.cible, nombres: tirage.nombres, score, meilleur: tirage.meilleur, indices: partie.indices, chrono: minutes, parfait }, new Date());
      sauver();
      publier();
      const etapes = partie.etapes.slice();
      plusTard(() => fin(tirage, minutes, { score, brut, parfait, etapes, indices: partie.indices }), KR.mouvementReduit() ? 600 : DELAI_FETE);
    }

    function tempsFini() {
      finChrono = 0;
      intervalles.forEach(clearInterval);
      rendreStatut();
      KR.son('doux');
      feuille(t('cible_temps_fini'), '', [
        { id: 'nouvelle', classe: 'btn-secondaire', texte: t('cible_nouvelle') },
        { id: 'continuer', classe: 'btn-primaire', texte: t('continuer') },
      ], choix => { if (choix === 'nouvelle' && ecran === jeton) accueil(); });
    }

    function confirmerArret() {
      feuille(t('arreter_question'), '', [
        { id: 'non', classe: 'btn-secondaire', texte: t('continuer') },
        { id: 'oui', classe: 'btn-primaire', texte: t('arreter') },
      ], choix => { if (choix === 'oui' && ecran === jeton) accueil(); });
    }

    if (finChrono) {
      intervalles.push(setInterval(() => {
        if (ecran !== jeton || !finChrono) return;
        if (Date.now() >= finChrono) tempsFini(); else rendreStatut();
      }, 1000));
    }

    brancher({
      retour: () => (partie.etapes.length && !fini ? confirmerArret() : accueil()),
      tuile: b => choisirTuile(b.dataset.id),
      op: b => choisirOp(b.dataset.op),
      annuler,
      recommencer,
      indice: demanderIndice,
      ecouter: () => dire([CC.DIT.cible(partie.cible), message ? message.dit : consigne()]),
    });
    window.CibleJeu = { partie: () => partie, tirage: () => tirage }; // lu par test_parcours.py
    rendre();
    dire([CC.DIT.cible(tirage.cible)]);
  }

  /* =================== Fin de partie : le score, et le meilleur chemin en défi =================== */
  function fin(tirage, minutes, r) {
    const nom = KR.nomMascotte();
    const moins = r.brut - r.score;
    const semaine = E.joursDeLaSemaine(etat, new Date());
    const defi = r.score < tirage.meilleur;
    const bulle = defi ? t('cible_defi', { mascotte: nom, n: tirage.meilleur }) : t('cible_meilleur');
    const chemin = (tirage.solution || []).map(e => etapeHtml(e, false)).join('');
    changerEcran(`<div class="ecran fin-seance c-fin">
      <div class="fin-masc">${KR.mascotte('fete', 'rebondit')}<p class="fin-nb">${t('cible_mot')} ${tirage.cible}</p></div>
      <div class="fin-contenu">
        <h1>${KR.echapper(t('bravo_prenom', { prenom: KR.prenom() }))}</h1>
        <div class="montee c-score">
          <p class="titre">${KR.icone('ok')}${t('cible_gagne')}</p>
          <div class="c-score-ligne"><span class="c-score-n">${points(r.score)}</span>
            ${r.parfait ? `<span class="c-badge-parfait">${KR.icone('etoile')}${t('cible_coup_parfait')}</span>` : ''}
            ${moins ? `<span class="c-score-moins">${t(r.indices > 1 ? 'cible_moins_indices' : 'cible_moins_indice', { n: moins })}</span>` : ''}</div>
          <p class="c-chemin-titre">${t('cible_ton_chemin')}</p>
          <ol class="c-etapes c-etapes-fin">${r.etapes.map(e => etapeHtml(e, true)).join('')}</ol>
        </div>
        <div class="retour-masc c-defi">${KR.medaillon(defi ? 'attend' : 'fete')}<div class="bulles">
          <div class="bulle parle">${KR.echapper(bulle)}</div>
          ${defi ? `<button type="button" class="btn btn-calme c-montre" data-a="montre">${t('cible_montre')}</button>
          <div class="bulle astuce c-solution cache"><div class="etiq">${KR.icone('ampoule')}${KR.echapper(CC.ETIQUETTE_CHEMIN(nom))}</div><ol class="c-etapes">${chemin}</ol></div>` : ''}
        </div></div>
        <div class="ligne-fin">${KR.semaine(semaine)}<p class="jours-n">${KR.joursFaits(semaine)}</p></div>
        <div class="actions-fin">
          <a class="btn btn-calme" href="./">${t('fini')}</a>
          <button type="button" class="btn ${defi ? 'btn-primaire' : 'btn-secondaire'}" data-a="meme">${t('cible_meme')}</button>
          <button type="button" class="btn ${defi ? 'btn-secondaire' : 'btn-primaire'}" data-a="nouvelle">${t('cible_nouvelle')}</button>
        </div>
      </div>
    </div>`);
    // Droitier : le bouton principal finit la ligne, à droite.
    const actions = app.querySelector('.actions-fin');
    actions.appendChild(actions.querySelector('.btn-primaire'));
    if (voixActive()) plusTard(() => KR.lire(bulle, langue(), SECOURS_VOIX), 900);
    brancher({
      meme: () => jeu(tirage, minutes),
      nouvelle: accueil,
      montre: b => {
        b.classList.add('cache');
        app.querySelector('.c-solution').classList.remove('cache');
      },
    });
  }

  accueil();
})();
