/* Interface du module des hélicoptères (D-23, D-24, D-25) : choix de la langue, accueil et sept étapes,
   cockpit, atelier et expérience, scène radio, records, sortie, cartes de Leitner, carnet de pilote.
   Dépend de commun/textes.js, commun/kit.js, modules/zoom/moteur.js, contenu.js, dessins.js, moteur.js
   et resume.js. Langue (D-24, point 5) : le contenu suit le choix de l'enfant (etat.langue), le cadre
   (Back, Listen, Next, la mascotte qui félicite) suit la langue de l'app, l'anglais par défaut. */
(function () {
  'use strict';
  const KR = window.KR;
  const H = window.Helico;
  const HC = window.HeliContenu;
  const D = window.HeliDessins;
  const t = KR.t;
  const enfant = KR.enfant();
  const app = document.getElementById('app');
  const DUREE_SUITE = 1600;
  const SECOURS_VOIX = 12000;
  const COULEUR_CMD = { collectif: 'var(--h-collectif)', manche: 'var(--h-manche)', pedales: 'var(--h-pedales)' };
  const ENCRE_CMD = { collectif: '#1E88E5', manche: '#8E44AD', pedales: '#E67E22' }; // les tampons du carnet

  KR.demarrer();
  let etat = H.charger(enfant);
  let minuteurs = [];
  let jeton = 0;
  const sauver = () => H.sauver(enfant, etat);
  const publier = () => { etat.resume = KR.publierResume(H.MODULE, window.HeliResume.resume(etat, new Date())); };
  const lg = () => (etat.langue === 'en' ? 'en' : 'fr');
  const ch = o => HC.champ(o, lg());
  const ui = cle => HC.UI[lg()][cle];
  const esc = KR.echapper;
  const voixActive = () => KR.reglages().voix;
  const dire = (textes, secours) => (voixActive()
    ? KR.lireSuite(textes.filter(Boolean).map(texte => ({ texte, langue: lg() })), secours || SECOURS_VOIX)
    : Promise.resolve(false));
  const mouvement = () => !KR.mouvementReduit();
  const teinte = () => {
    const m = HC.MISSIONS.find(x => x.id === etat.mission);
    const c = HC.COULEURS[etat.couleur] || HC.COULEURS[m ? m.couleur : 'jaune'];
    return c.teinte;
  };
  const nomCmd = (id, classe) => {
    const c = HC.commande(id);
    const autre = lg() === 'fr' ? 'en' : 'fr';
    return `<span class="h-nom-cmd${classe ? ' ' + classe : ''}"><b lang="${lg()}">${esc(ch(c.nom))}</b><span lang="${autre}">${esc(HC.champ(c.nom, autre))}</span></span>`;
  };

  function plusTard(fn, ms) { minuteurs.push(setTimeout(fn, ms)); }
  function changerEcran(html) {
    minuteurs.forEach(clearTimeout);
    minuteurs = [];
    jeton++;
    KR.taire();
    arreterBoucle();
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
      if (b && actions[b.dataset.a] && !b.disabled && b.getAttribute('aria-disabled') !== 'true') actions[b.dataset.a](b, e);
    };
  }
  const masc = (attitude, classe) => `<div class="retour-masc${attitude === 'fete' ? ' fete' : ''}">${KR.medaillon(attitude)}${KR.mascotte(attitude, classe || '')}<div class="bulles"></div></div>`;

  /* =================== Accueil du module =================== */
  function accueil() {
    etat = H.charger(enfant);
    publier();
    if (!etat.langue) return choisirLangue(accueil);
    const maintenant = new Date();
    const nbCartes = H.nbDues(etat, maintenant);
    const etapes = HC.ETAPES.map((e, i) => {
      const fait = H.faite(etat, e.id);
      const ouvert = H.ouverte(etat, e.id);
      const bas = fait
        ? `<span class="pastille h-fait">${KR.icone('ok')}${esc(ui('fait'))}</span>`
        : ouvert ? '' : `<span class="pastille bientot">${esc(e.id === 'atelier' ? ui('atelier_ferme') : ui('plus_tard'))}</span>`;
      return `<button type="button" class="h-etape${fait ? ' faite' : ''}${ouvert ? '' : ' fermee'}" data-a="etape" data-etape="${e.id}"${ouvert ? '' : ' aria-disabled="true"'}>
        <span class="h-etape-n">${i + 1}</span>
        <span class="h-etape-texte"><b lang="${lg()}">${esc(ch(e.nom))}</b>${bas}</span>
        ${fait ? `<span class="h-etape-objet">${D.svgObjet(e.objet, etat.mission, teinte())}</span>` : ''}</button>`;
    }).join('');
    const suite = H.etapeSuivante(etat);
    changerEcran(`<div class="ecran h-accueil">
      <header class="barre">${nav('', 'retour', 'retour', './')}
        <div class="titre"><h1 class="titre-ecran" lang="${lg()}">${esc(ui('titre'))}</h1></div>
        ${boutonLangue()}</header>
      <div class="h-accueil-grille">
        <div class="h-colonne">
          <div class="h-vitrine">${D.svgHelico({ couleur: teinte(), mission: etat.mission, tourne: mouvement() })}</div>
          ${suite ? `<button type="button" class="btn btn-primaire h-go" data-a="etape" data-etape="${suite}">${KR.icone('jouer')}<span lang="${lg()}">${esc(ch(HC.etape(suite).nom))}</span></button>` : ''}
          <button type="button" class="btn ${suite ? 'btn-secondaire' : 'btn-primaire'} h-cartes-btn" data-a="cartes"${nbCartes ? '' : ' aria-disabled="true"'}>${KR.icone('ok')}<span lang="${lg()}">${esc(nbCartes ? ui('cartes') : ui('rien'))}</span>${nbCartes ? `<span class="h-compte">${nbCartes}</span>` : ''}</button>
          <button type="button" class="h-carnet-btn" data-a="carnet"><span class="h-carnet-masc">${D.moussiPilote()}</span><b lang="${lg()}">${esc(ui('carnet'))}</b><span class="h-carnet-tampons">${HC.COMMANDES.map(c => `<i class="${etat.brevet[c.id] ? 'pose' : ''}" style="--encre:${ENCRE_CMD[c.id]}"></i>`).join('')}</span></button>
        </div>
        <section class="h-etapes" aria-label="${esc(ui('etapes'))}"><h2 lang="${lg()}">${esc(ui('etapes'))}</h2>${etapes}</section>
      </div>
    </div>`);
    brancher({
      etape: b => ouvrirEtape(b.dataset.etape),
      cartes: () => seanceCartes(),
      carnet: () => carnet(accueil),
      langue: () => choisirLangue(accueil),
    });
  }

  function ouvrirEtape(id) {
    const f = { helico: etapeHelico, vol: etapeVol, cockpit: etapeCockpit, atelier: etapeAtelier, radio: etapeRadio, records: etapeRecords, sortie: etapeSortie }[id];
    if (f && H.ouverte(etat, id)) f();
  }

  /* =================== Langue (D-24, point 5) : le français proposé en premier à Henri =================== */
  const NOMS_LANGUE = { en: 'English', fr: 'Français' };
  function boutonLangue() {
    return `<div class="nav h-nav-langue"><button type="button" class="rond h-langue-btn" data-a="langue" aria-label="${t('heli_langue')} : ${NOMS_LANGUE[lg()]}">${KR.drapeau(lg(), 'h-drapeau')}</button><span class="nom" aria-hidden="true" lang="${lg()}">${NOMS_LANGUE[lg()]}</span></div>`;
  }
  function choisirLangue(suite) {
    const deja = etat.langue;
    const carteLangue = l => `<button type="button" class="h-langue-carte" data-a="choix-langue" data-langue="${l}" lang="${l}" aria-pressed="${deja === l}">${KR.drapeau(l, 'h-drapeau')}<span>${NOMS_LANGUE[l]}</span></button>`;
    changerEcran(`<div class="ecran h-langue">
      <header class="barre">${deja ? nav('retour', 'retour', 'retour') : nav('', 'retour', 'retour', './')}
        <div class="titre"><h1 class="titre-ecran">${t('heli_langue_titre')}</h1></div>
        ${nav('ecouter', 'son', 'ecouter')}</header>
      <div class="h-langue-corps">
        <div class="h-langue-masc">${D.moussiPilote()}</div>
        <div class="h-langue-cartes">${carteLangue('fr')}${carteLangue('en')}</div>
      </div>
    </div>`);
    brancher({
      retour: suite,
      ecouter: () => KR.lire(t('heli_langue_titre'), window.Textes.langue),
      'choix-langue': b => { KR.son('touche'); etat.langue = b.dataset.langue; sauver(); suite(); },
    });
  }

  /* =================== Diapo : un dessin, une bulle de Moussi lue, Next =================== */
  /* o : { titre, illu (html), texte, boutons (html, facultatif), suite (fn), retour (fn), apres (fn) } */
  function diapo(o) {
    changerEcran(`<div class="ecran ecran-fixe h-diapo${o.classe ? ' ' + o.classe : ''}">
      <header class="barre">${nav('retour', 'retour', 'retour')}
        <div class="titre"><p class="titre-ecran h-titre-etape" lang="${lg()}">${esc(o.titre)}</p>${o.indice ? `<p class="indice" lang="${lg()}">${esc(o.indice)}</p>` : ''}</div>
        ${nav('ecouter', 'son', 'ecouter')}</header>
      <div class="corps">
        <section class="zone h-illu">${o.illu || ''}</section>
        <section class="action h-texte">
          <div class="retour-masc">${KR.medaillon(o.attitude || 'attend')}${o.pilote ? D.moussiPilote(o.attitude) : KR.mascotte(o.attitude || 'attend')}<div class="bulles"><div class="bulle parle h-bulle" lang="${lg()}">${esc(o.texte)}</div></div></div>
          <div class="h-boutons">${o.boutons || ''}${o.suite ? `<button type="button" class="btn btn-primaire h-suivant" data-a="suite">${t('suite')}${KR.icone('suite')}</button>` : ''}</div>
        </section>
      </div>
    </div>`);
    const dit = o.dit || [o.texte]; // exactement les phrases de contenu.js, une par voix
    const actions = Object.assign({ retour: o.retour || accueil, ecouter: () => dire(dit), suite: () => o.suite && o.suite() }, o.actions || {});
    brancher(actions);
    dire(dit);
    if (o.apres) o.apres();
  }
  const bulle = texte => { const b = app.querySelector('.h-bulle'); if (b) b.textContent = texte; };

  /* Une suite de diapos : liste de fonctions (i, suivant) qui posent chacune un écran. */
  function enchainer(ecrans, fin) {
    const aller = i => (i >= ecrans.length ? fin() : ecrans[i](() => aller(i + 1), i));
    aller(0);
  }

  /* =================== Fin d'étape : l'objet du carnet (D-25) =================== */
  function finEtape(id, texteFin) {
    const objet = H.finirEtape(etat, id, new Date());
    H.finirSeance(etat, new Date()); // la séance du jour est finie (D-22, point 10)
    sauver();
    publier();
    objetGagne(objet || HC.etape(id).objet, texteFin, accueil, !objet);
  }
  function objetGagne(objetId, texte, suite, deja) {
    changerEcran(`<div class="ecran h-objet-ecran">
      <div class="h-objet-corps">
        <div class="h-objet-masc">${D.moussiPilote('fete')}</div>
        <div class="h-objet-texte">
          <div class="bulle parle" lang="${lg()}">${esc(texte)}</div>
          <div class="h-objet-grand${deja ? '' : ' nouveau'}">${D.svgObjet(objetId, etat.mission, teinte())}<b lang="${lg()}">${esc(ch(HC.OBJETS[objetId]))}</b></div>
          <div class="h-boutons"><button type="button" class="btn btn-secondaire" data-a="carnet">${esc(ui('carnet'))}</button>
            <button type="button" class="btn btn-primaire" data-a="suite">${t('suite')}${KR.icone('suite')}</button></div>
        </div>
      </div>
    </div>`);
    KR.son('fete');
    dire([texte]);
    brancher({ suite, carnet: () => carnet(suite) });
  }

  /* =================== a) Mon hélicoptère =================== */
  function etapeHelico() {
    const titre = ch(HC.etape('helico').nom);
    const vues = new Set(etat.parties || []);
    enchainer([
      suite => diapo({ titre, texte: ch(HC.HELICO.intro), illu: D.svgHelico({ couleur: teinte(), tourne: mouvement() }, 'h-grand'), suite }),
      suite => {
        diapo({
          titre, texte: ch(HC.HELICO.parties), indice: '', suite: () => { if (vues.size >= HC.PARTIES.length) suite(); },
          illu: `${D.svgHelico({ couleur: teinte(), parties: true }, 'h-grand h-touchable')}
            <div class="h-puces">${HC.PARTIES.map(p => `<button type="button" class="h-puce${vues.has(p.id) ? ' vue' : ''}" data-a="partie" data-partie="${p.id}" lang="${lg()}">${esc(ch(p.nom))}</button>`).join('')}</div>`,
          actions: { partie: b => montrerPartie(b.dataset.partie) },
        });
        const svg = app.querySelector('.h-touchable');
        svg.addEventListener('click', e => { const g = e.target.closest('[data-partie]'); if (g) montrerPartie(g.dataset.partie); });
        const majSuite = () => app.querySelector('.h-suivant').classList.toggle('inactif', vues.size < HC.PARTIES.length);
        function montrerPartie(id) {
          KR.son('touche');
          vues.add(id);
          etat.parties = Array.from(vues);
          sauver();
          svg.querySelectorAll('[data-partie]').forEach(g => g.classList.toggle('h-surligne', g.dataset.partie === id));
          app.querySelectorAll('.h-puce').forEach(b => { b.classList.toggle('vue', vues.has(b.dataset.partie)); b.setAttribute('aria-pressed', String(b.dataset.partie === id)); });
          const texte = ch(HC.partie(id).dit);
          bulle(texte);
          dire([texte]);
          majSuite();
        }
        majSuite();
      },
      suite => {
        const cartes = HC.MISSIONS.map(m => `<button type="button" class="h-mission${etat.mission === m.id ? ' choisie' : ''}" data-a="mission" data-mission="${m.id}" aria-pressed="${etat.mission === m.id}">${D.svgMission(m.id, HC.COULEURS[m.couleur].teinte)}<b lang="${lg()}">${esc(ch(m.nom))}</b></button>`).join('');
        diapo({
          titre, texte: ch(HC.HELICO.mission), illu: `<div class="h-missions">${cartes}</div>`,
          suite: () => { if (etat.mission) suite(); },
          actions: { mission: b => {
            const m = HC.MISSIONS.find(x => x.id === b.dataset.mission);
            KR.son('touche');
            etat.mission = m.id;
            etat.couleur = m.couleur;
            sauver();
            app.querySelectorAll('.h-mission').forEach(x => { x.classList.toggle('choisie', x === b); x.setAttribute('aria-pressed', String(x === b)); });
            app.querySelector('.h-suivant').classList.remove('inactif');
            bulle(ch(m.dit));
            dire([ch(m.dit)]);
          } },
        });
        if (!etat.mission) app.querySelector('.h-suivant').classList.add('inactif');
      },
      suite => {
        const pastilles = Object.keys(HC.COULEURS).map(id => `<button type="button" class="h-couleur${etat.couleur === id ? ' choisie' : ''}" data-a="couleur" data-couleur="${id}" aria-pressed="${etat.couleur === id}" aria-label="${esc(ch(HC.COULEURS[id].nom))}"><svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="17" fill="${HC.COULEURS[id].teinte}" stroke="${D.TRAIT}" stroke-width="2.5"/></svg><span lang="${lg()}">${esc(ch(HC.COULEURS[id].nom))}</span></button>`).join('');
        diapo({
          titre, texte: ch(HC.HELICO.couleur), suite,
          illu: `<div class="h-apercu">${D.svgHelico({ couleur: teinte(), mission: etat.mission }, 'h-grand')}</div><div class="h-couleurs">${pastilles}</div>`,
          actions: { couleur: b => {
            KR.son('touche');
            etat.couleur = b.dataset.couleur;
            sauver();
            app.querySelector('.h-apercu').innerHTML = D.svgHelico({ couleur: teinte(), mission: etat.mission }, 'h-grand');
            app.querySelectorAll('.h-couleur').forEach(x => { x.classList.toggle('choisie', x === b); x.setAttribute('aria-pressed', String(x === b)); });
          } },
        });
      },
    ], () => finEtape('helico', ch(HC.HELICO.fin)));
  }

  /* =================== b) Comment il vole =================== */
  function illuVol(id) {
    const c = teinte();
    const fleche = (x1, y1, x2, y2, couleur) => `<path class="h-fleche" d="M${x1} ${y1} L${x2} ${y2}" style="stroke:${couleur}" stroke-width="10" stroke-linecap="round" marker-end="url(#h-pointe-mvt)"/>`;
    const defs = `<defs><marker id="h-pointe-mvt" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="3.2" markerHeight="3.2" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 Z" style="fill:var(--h-collectif)"/></marker>
      <marker id="h-pointe-air" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 Z" fill="#8CC3DE"/></marker></defs>`;
    switch (id) {
      case 'air': return `<svg class="h-dessin h-grand" viewBox="0 0 400 300" aria-hidden="true">${defs}<g transform="translate(0 60)">${D.helico({ couleur: c, tourne: mouvement() })}</g>
        <g stroke="#8CC3DE" stroke-width="4" stroke-dasharray="6 7" class="h-air-bas">${[70, 140, 210, 280, 350].map(x => `<path d="M${x} 95 V150" marker-end="url(#h-pointe-air)"/>`).join('')}</g>
        ${fleche(208, 60, 208, 8, 'var(--h-collectif)')}</svg>`;
      case 'tours': return `<div class="h-record"><svg class="h-dessin h-grand" viewBox="0 0 140 84" aria-hidden="true">${D.compteur()}</svg><p class="h-legende-grande" lang="${lg()}">${esc(HC.champ(HC.COMPTEUR, lg()))}</p></div>`;
      case 'pas': return `<div class="h-pales-duo"><svg class="h-dessin" viewBox="0 0 160 84" aria-hidden="true">${D.pale(2)}</svg><span class="h-fleche-texte">${KR.icone('suite')}</span><svg class="h-dessin" viewBox="0 0 160 84" aria-hidden="true">${D.pale(14)}</svg></div>`;
      case 'main': return `<div class="h-pales-duo"><svg class="h-dessin" viewBox="0 0 160 84" aria-hidden="true">${D.pale(0)}</svg><svg class="h-dessin" viewBox="0 0 160 84" aria-hidden="true">${D.pale(18)}</svg></div>`;
      case 'trois': return `<svg class="h-dessin h-grand" viewBox="-60 -60 120 120" aria-hidden="true">${D.vueDessus(c, 0, 0)}</svg>`;
      case 'queue':
      case 'chaise': return `<svg class="h-dessin h-grand" viewBox="-70 -70 140 140" aria-hidden="true">${D.vueDessus(c, 0, 0)}
        <path d="M-58 -10 C-58 -46 -20 -64 10 -60" fill="none" style="stroke:var(--h-pedales)" stroke-width="5" stroke-dasharray="6 5" stroke-linecap="round"/>
        <path d="M30 56 L58 56" style="stroke:var(--h-pedales)" stroke-width="6" stroke-linecap="round"/></svg>`;
      case 'avancer': return `<svg class="h-dessin h-grand" viewBox="0 0 440 230" aria-hidden="true"><defs><marker id="h-pointe-man" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="3.2" markerHeight="3.2" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 Z" style="fill:var(--h-manche)"/></marker></defs>
        <g transform="translate(10 30) rotate(8 208 96)">${D.helico({ couleur: c, tourne: mouvement() })}</g>
        <path d="M330 210 H425" style="stroke:var(--h-manche)" stroke-width="10" stroke-linecap="round" marker-end="url(#h-pointe-man)"/></svg>`;
      default: return D.svgHelico({ couleur: c }, 'h-grand');
    }
  }
  function etapeVol() {
    const titre = ch(HC.etape('vol').nom);
    const ecrans = [
      suite => {
        const choix = HC.VOL.reponses.map(r => `<button type="button" class="btn btn-secondaire h-rep${etat.conception === r.id ? ' choisie' : ''}" data-a="conception" data-rep="${r.id}" lang="${lg()}">${esc(ch(r.nom))}</button>`).join('');
        diapo({
          titre, texte: ch(HC.VOL.question), illu: D.svgHelico({ couleur: teinte(), tourne: mouvement() }, 'h-grand'), boutons: `<div class="h-reps">${choix}</div>`,
          actions: { conception: b => {
            KR.son('touche');
            etat.conception = b.dataset.rep;
            sauver();
            app.querySelectorAll('.h-rep').forEach(x => x.classList.toggle('choisie', x === b));
            bulle(ch(HC.VOL.garde));
            dire([ch(HC.VOL.garde)]).then(() => { if (app.querySelector('.h-reps')) suite(); });
            plusTard(() => { if (app.querySelector('.h-reps')) suite(); }, voixActive() ? SECOURS_VOIX : 1800);
          } },
        });
      },
      ...HC.VOL.ecrans.map(e => suite => diapo({ titre, texte: ch(e), illu: illuVol(e.id), suite })),
      suite => diapo({ titre, texte: ch(HC.VOL.retour[etat.conception] || HC.VOL.retour['sais-pas']), illu: illuVol('tours'), suite, attitude: 'fete' }),
    ];
    enchainer(ecrans, () => finEtape('vol', ch(HC.VOL.fin)));
  }

  /* =================== c) Le cockpit =================== */
  let boucle = null;
  function arreterBoucle() { if (boucle) { cancelAnimationFrame(boucle); boucle = null; } }

  function etapeCockpit() {
    const titre = ch(HC.etape('cockpit').nom);
    const c = teinte();
    const L = { min: 240, max: 420, sol: 300, echelle: 0.6, haut: 140 };
    const st = { x: 300, alt: 0, cap: 0, glisse: 0, pas: 5, tilt: 0 };
    let actif = null; // { cmd, dir, depuis, tenu }
    let phase = 'intro';
    let ordre = ['collectif', 'manche', 'pedales'];
    let rang = 0;
    let solDit = false;

    const bouton = (cmd, dir, ico, libelle) => `<button type="button" class="h-ctl" data-cmd="${cmd}" data-dir="${dir}" aria-label="${esc(libelle)}" style="--c:${COULEUR_CMD[cmd]}">${ico}</button>`;
    const fl = d => `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true" style="transform:rotate(${d}deg)"><path d="M12 4 L20 14 H15 V20 H9 V14 H4 Z" fill="currentColor"/></svg>`;
    changerEcran(`<div class="ecran h-cockpit exo">
      <header class="barre">${nav('retour', 'retour', 'retour')}
        <div class="titre"><p class="titre-ecran h-titre-etape" lang="${lg()}">${esc(titre)}</p></div>
        ${nav('ecouter', 'son', 'ecouter')}</header>
      <div class="h-cp-consigne">${KR.medaillon('attend')}<span class="h-cp-masc">${D.moussiPilote()}</span><div class="bulle parle h-bulle" lang="${lg()}"></div>
        <button type="button" class="btn btn-primaire h-cp-suite" data-a="suite">${t('suite')}${KR.icone('suite')}</button></div>
      <div class="h-cp-grille">
        <div class="h-cmd h-cmd-collectif" data-zone="collectif">
          ${D.svgCommande('collectif', 'var(--h-collectif)')}${nomCmd('collectif')}
          <div class="h-ctl-col">${bouton('collectif', 'haut', fl(0), ui('collectif_haut'))}${bouton('collectif', 'bas', fl(180), ui('collectif_bas'))}</div>
        </div>
        <div class="h-scene-boite"><svg class="h-scene" viewBox="0 0 600 340" role="img" aria-label="${esc(titre)}">
          <defs>${['collectif', 'manche', 'pedales'].map(m => `<marker id="h-pointe-${m}" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="3" markerHeight="3" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 Z" style="fill:${COULEUR_CMD[m]}"/></marker>`).join('')}</defs>
          <rect width="600" height="340" class="h-ciel"/>
          <rect y="300" width="600" height="40" class="h-sol"/>
          <g transform="translate(62 216)"><rect x="-6" y="40" width="12" height="44" fill="#8B5A2B"/><circle cx="0" cy="26" r="30" fill="#5FA35A"/><circle cx="-16" cy="40" r="20" fill="#5FA35A"/><circle cx="16" cy="40" r="20" fill="#5FA35A"/></g>
          <g transform="translate(556 20)"><path d="M-12 280 L-8 210 H8 L12 280 Z" fill="#E2DCCF" stroke="${D.TRAIT}" stroke-width="2"/><path d="M-22 192 H22 L16 210 H-16 Z" fill="#BFE3F5" stroke="${D.TRAIT}" stroke-width="2"/><path d="M-24 190 H24" stroke="${D.TRAIT}" stroke-width="4" stroke-linecap="round"/></g>
          <g class="h-helico-pos"><g class="h-helico-tilt">${D.helico({ couleur: c, tourne: mouvement(), mission: etat.mission })}</g></g>
          <g class="h-fleches"></g>
          <g class="h-encart h-encart-pas" transform="translate(6 6)"><rect width="150" height="96" rx="12" class="h-encart-fond"/><g transform="translate(-5 4)"><g class="h-pale">${D.pale(5)}</g></g><text x="75" y="88" text-anchor="middle" class="h-svg-texte">${esc(ui('inclinaison'))}</text></g>
          <g class="h-encart h-encart-tours" transform="translate(444 6)"><rect width="150" height="110" rx="12" class="h-encart-fond"/><g transform="translate(5 2)">${D.compteur()}</g><text x="75" y="94" text-anchor="middle" class="h-svg-texte h-tours" data-tours="fixe">${esc(ui('tours'))}</text><text x="75" y="104" text-anchor="middle" class="h-svg-petit">${esc(HC.champ(HC.COMPTEUR, lg()))}</text></g>
          <g class="h-encart h-encart-dessus" transform="translate(6 108)"><rect width="110" height="110" rx="55" class="h-encart-fond"/><g class="h-dessus" transform="translate(55 55) scale(.74)"></g></g>
        </svg></div>
        <div class="h-cmd h-cmd-manche" data-zone="manche">
          ${D.svgCommande('manche', 'var(--h-manche)')}${nomCmd('manche')}
          <div class="h-ctl-manche">${bouton('manche', 'avant', fl(0), ui('avant'))}${bouton('manche', 'arriere', fl(180), ui('arriere'))}${bouton('manche', 'gauche', fl(270), ui('gauche'))}${bouton('manche', 'droite', fl(90), ui('droite'))}</div>
        </div>
        <div class="h-cmd h-cmd-pedales" data-zone="pedales">
          ${bouton('pedales', 'gauche', D.svgCommande('pedales', 'var(--h-pedales)', 'h-pedale g'), ui('gauche'))}${nomCmd('pedales')}${bouton('pedales', 'droite', D.svgCommande('pedales', 'var(--h-pedales)', 'h-pedale d'), ui('droite'))}
        </div>
      </div>
    </div>`);
    const ecran = jeton;
    const scene = app.querySelector('.h-scene');
    const pos = scene.querySelector('.h-helico-pos');
    const tilt = scene.querySelector('.h-helico-tilt');
    const fleches = scene.querySelector('.h-fleches');
    const paleG = scene.querySelector('.h-pale');
    const dessus = scene.querySelector('.h-dessus');
    const encartDessus = scene.querySelector('.h-encart-dessus');
    const queue = scene.querySelector('.h-disque-queue');
    const suiteBtn = app.querySelector('.h-cp-suite');

    function dessiner() {
      const hy = L.sol - 158 * L.echelle - st.alt * L.haut;
      pos.setAttribute('transform', `translate(${(st.x - 208 * L.echelle).toFixed(1)} ${hy.toFixed(1)}) scale(${L.echelle})`);
      tilt.setAttribute('transform', `rotate(${st.tilt.toFixed(1)} 208 90)`);
      paleG.innerHTML = D.pale(st.pas);
      dessus.innerHTML = D.vueDessus(c, st.cap, st.glisse);
      encartDessus.classList.toggle('actif', !!actif && (actif.cmd === 'pedales' || (actif.cmd === 'manche' && ['gauche', 'droite'].includes(actif.dir))));
      queue.classList.toggle('actif', !!actif && actif.cmd === 'pedales');
      Object.assign(scene.dataset, { alt: st.alt.toFixed(2), x: st.x.toFixed(0), cap: st.cap.toFixed(0), glisse: st.glisse.toFixed(0), pas: st.pas.toFixed(0) });
      // La flèche du mouvement, de la couleur de la commande touchée (D-24, point 6).
      const a = actif || dernier;
      let f = '';
      if (a) {
        const cx = st.x, cy = hy + 58;
        const coul = COULEUR_CMD[a.cmd];
        const trait = (x1, y1, x2, y2) => `<path d="M${x1} ${y1} L${x2} ${y2}" style="stroke:${coul}" stroke-width="9" stroke-linecap="round" marker-end="url(#h-pointe-${a.cmd})"/>`;
        if (a.cmd === 'collectif') f = a.dir === 'haut' ? trait(cx + 140, cy + 20, cx + 140, cy - 40) : trait(cx + 140, cy - 30, cx + 140, cy + 30);
        if (a.cmd === 'manche' && a.dir === 'avant') f = trait(cx + 50, cy + 52, cx + 120, cy + 52);
        if (a.cmd === 'manche' && a.dir === 'arriere') f = trait(cx - 50, cy + 52, cx - 120, cy + 52);
        if (a.cmd === 'manche' && ['gauche', 'droite'].includes(a.dir)) f = `<g transform="translate(61 163)">${trait(a.dir === 'gauche' ? 10 : -10, 44, a.dir === 'gauche' ? -24 : 24, 44)}</g>`;
        if (a.cmd === 'pedales') f = `<g transform="translate(61 163) scale(.8)"><path d="M${a.dir === 'gauche' ? '20 -50 C-10 -60 -40 -40 -46 -12' : '-20 -50 C10 -60 40 -40 46 -12'}" fill="none" style="stroke:${coul}" stroke-width="7" stroke-linecap="round" marker-end="url(#h-pointe-${a.cmd})"/></g>`;
      }
      fleches.innerHTML = f;
    }
    let dernier = null; // sans animation : la flèche reste affichée jusqu'au geste suivant

    function appliquer(a, dt) {
      const k = dt / 1000;
      if (a.cmd !== 'collectif' && st.alt <= 0.001) {
        if (!solDit) { solDit = true; bulle(ch(HC.COCKPIT.sol)); dire([ch(HC.COCKPIT.sol)]); }
        return false;
      }
      if (a.cmd === 'collectif') {
        st.alt = Math.max(0, Math.min(1, st.alt + (a.dir === 'haut' ? 0.45 : -0.45) * k));
        st.pas = a.dir === 'haut' ? 14 : 2;
      } else if (a.cmd === 'manche') {
        if (a.dir === 'avant') { st.x = Math.min(L.max, st.x + 110 * k); st.tilt = 8; }
        if (a.dir === 'arriere') { st.x = Math.max(L.min, st.x - 110 * k); st.tilt = -8; }
        if (a.dir === 'gauche') st.glisse = Math.max(-14, st.glisse - 30 * k);
        if (a.dir === 'droite') st.glisse = Math.min(14, st.glisse + 30 * k);
      } else {
        st.cap = (st.cap + (a.dir === 'gauche' ? -70 : 70) * k + 360) % 360;
      }
      return true;
    }
    let tPrec = 0;
    function tic(now) {
      if (ecran !== jeton) return;
      if (!actif) { boucle = null; return; }
      const dt = Math.min(64, now - (tPrec || now));
      tPrec = now;
      if (appliquer(actif, dt)) actif.tenu += dt;
      dessiner();
      verifier();
      boucle = requestAnimationFrame(tic);
    }
    function appuyer(cmd, dir) {
      if (ecran !== jeton) return;
      actif = { cmd, dir, tenu: 0 };
      dernier = null;
      KR.son('touche');
      if (!mouvement()) {
        // Sans animation : un pas d'un coup, la flèche reste affichée (relecture, section 3).
        appliquer(actif, 700);
        actif.tenu = 700;
        dernier = actif;
        dessiner();
        verifier();
        actif = null;
        return;
      }
      tPrec = 0;
      arreterBoucle();
      boucle = requestAnimationFrame(tic);
    }
    function lacher() {
      if (!actif) return;
      const fini = actif;
      actif = null;
      st.tilt = 0;
      st.pas = 5;
      dessiner();
      verifierLacher(fini);
    }
    // Garder le doigt : pointerdown lance, pointerup ou la sortie du bouton arrête.
    app.querySelectorAll('.h-ctl').forEach(b => {
      b.addEventListener('pointerdown', e => { e.preventDefault(); try { b.setPointerCapture(e.pointerId); } catch (x) { /* rien */ } b.classList.add('appuye'); appuyer(b.dataset.cmd, b.dataset.dir); });
      ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => b.addEventListener(ev, () => { b.classList.remove('appuye'); lacher(); }));
      b.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); appuyer(b.dataset.cmd, b.dataset.dir); setTimeout(lacher, 500); } });
      b.addEventListener('contextmenu', e => e.preventDefault());
    });

    // Le déroulé guidé : une commande à la fois, puis Henri apprend à Moussi (D-25), puis le vol libre.
    let tenuGuide = 0;
    const SEUIL = 600;
    function briller(cmd) { app.querySelectorAll('.h-cmd').forEach(z => z.classList.toggle('h-brille', z.dataset.zone === cmd)); }
    function direPhase(texte) { bulle(texte); dire([texte]); }
    function verifier() {
      if (!actif) return;
      if (phase === 'guide' && actif.cmd === ordre[rang]) tenuGuide = Math.max(tenuGuide, actif.tenu);
    }
    function verifierLacher(a) {
      if (phase === 'guide') {
        if (a.cmd === ordre[rang] && a.tenu >= SEUIL && (a.cmd !== 'collectif' || a.dir === 'haut')) {
          KR.son('juste');
          const texte = ch(HC.commande(a.cmd).effet);
          bulle(texte);
          const suiteTexte = rang === 0 ? [texte, ch(HC.COCKPIT.lache)] : [texte];
          phase = 'attente';
          briller(null);
          dire(suiteTexte).then(() => { if (ecran === jeton) avancerGuide(); });
          if (!voixActive()) plusTard(avancerGuide, 1500);
        }
      } else if (phase === 'enseigner') {
        const voulu = ordre[rang];
        if (a.cmd === voulu && a.tenu >= 250) {
          KR.son('juste');
          const merci = ch(HC.COCKPIT.enseigner[voulu].merci);
          phase = 'attente';
          briller(null);
          app.querySelector('.h-cp-masc').innerHTML = D.moussiPilote('fete');
          direPhase(merci);
          const go = () => { if (ecran === jeton && phase === 'attente') avancerEnseigner(); };
          dire([merci]).then(go);
          if (!voixActive()) plusTard(go, 1500);
        } else if (a.cmd !== voulu) {
          KR.son('doux');
          briller(voulu);
          direPhase(ch(HC.COCKPIT.encore));
        }
      }
    }
    let avanceGuideFait = -1;
    function avancerGuide() {
      if (avanceGuideFait === rang) return;
      avanceGuideFait = rang;
      rang++;
      if (rang < ordre.length) return lancerGuide();
      phase = 'enseigner';
      rang = 0;
      lancerEnseigner();
    }
    function lancerGuide() {
      phase = 'guide';
      tenuGuide = 0;
      briller(ordre[rang]);
      direPhase(ch(HC.COCKPIT.guide[ordre[rang]]));
      app.dataset.phase = 'guide-' + ordre[rang];
    }
    let avanceEnseignerFait = -1;
    function avancerEnseigner() {
      if (avanceEnseignerFait === rang) return;
      avanceEnseignerFait = rang;
      rang++;
      if (rang < ordre.length) return lancerEnseigner();
      phase = 'libre';
      app.dataset.phase = 'libre';
      app.querySelector('.h-cp-masc').innerHTML = D.moussiPilote();
      briller(null);
      direPhase(ch(HC.COCKPIT.libre));
      suiteBtn.classList.remove('cache');
      suiteBtn.innerHTML = `${esc(ui('terminer'))}${KR.icone('ok')}`;
    }
    function lancerEnseigner() {
      phase = 'enseigner';
      app.dataset.phase = 'enseigner-' + ordre[rang];
      app.querySelector('.h-cp-masc').innerHTML = D.moussiPilote('aide');
      briller(null);
      direPhase(ch(HC.COCKPIT.enseigner[ordre[rang]].demande));
    }

    dessiner();
    app.dataset.phase = 'intro';
    direPhase(ch(HC.COCKPIT.intro));
    let introVue = 0;
    brancher({
      retour: accueil,
      ecouter: () => dire([app.querySelector('.h-bulle').textContent]),
      suite: () => {
        if (phase === 'intro') {
          if (!introVue) { introVue = 1; return direPhase(ch(HC.COCKPIT.tours)); }
          suiteBtn.classList.add('cache');
          rang = 0;
          // Une étape déjà faite se rejoue en vol libre directement.
          if (H.faite(etat, 'cockpit')) { rang = ordre.length; phase = 'enseigner'; avanceEnseignerFait = -1; rang = ordre.length - 1; return avancerEnseigner(); }
          return lancerGuide();
        }
        if (phase === 'libre') {
          phase = 'fin';
          diapo({ titre, texte: ch(HC.COCKPIT.vrai), illu: D.svgHelico({ couleur: c, tourne: mouvement() }, 'h-grand'), pilote: true, suite: () => finEtape('cockpit', ch(HC.COCKPIT.fin)) });
        }
      },
    });
    window.HeliCockpit = { etat: () => Object.assign({ phase }, st) }; // lu par test_parcours.py
  }

  /* =================== d) L'atelier : le manuel, puis l'expérience =================== */
  function imprimer() {
    let hote = document.getElementById('h-impression');
    if (!hote) { hote = document.createElement('div'); hote.id = 'h-impression'; document.body.appendChild(hote); }
    hote.innerHTML = D.gabarit({ couper: ui('couper'), plier: ui('plier'), trombone: ui('trombone'), titre: ui('gabarit') });
    try { window.print(); } catch (e) { /* pas d'impression ici */ }
  }
  function telechargerGabarit() {
    const svg = D.gabarit({ couper: ui('couper'), plier: ui('plier'), trombone: ui('trombone'), titre: ui('gabarit') });
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'helicoptere-papier.svg';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1000);
  }
  const svgManuel = n => `<svg class="h-dessin h-grand" viewBox="0 0 200 140" aria-hidden="true">${D.manuel(n)}</svg>`;
  const fmt = dix => (dix / 10).toFixed(1).replace('.', lg() === 'fr' ? ',' : '.') + ' ' + ui('secondes');

  function etapeAtelier() {
    if (!H.ouverte(etat, 'atelier')) return accueil();
    const titre = ch(HC.etape('atelier').nom);
    const A = HC.ATELIER;
    const x = etat.experience;
    const ecrans = [
      suite => diapo({ titre, texte: ch(A.ouvert), illu: svgManuel(6), suite, pilote: true, attitude: 'fete' }),
      ...A.manuel.map((m, i) => suite => diapo({
        titre, indice: `${ui('manuel')} · ${t('avancement', { n: i + 1, total: A.manuel.length })}`, texte: ch(m), illu: svgManuel(i), suite,
        boutons: i === 0 ? `<button type="button" class="btn btn-secondaire h-imprimer" data-a="imprimer">${KR.icone('sortir')}<span lang="${lg()}">${esc(ui('imprimer'))}</span></button><button type="button" class="btn btn-calme h-fichier" data-a="fichier">${KR.icone('entrer')}<span lang="${lg()}">${esc(ui('fichier'))}</span></button>` : '',
        actions: { imprimer, fichier: telechargerGabarit },
      })),
      suite => {
        const choix = A.hypotheses.map(h => `<button type="button" class="btn btn-secondaire h-rep${x.hypothese === h.id ? ' choisie' : ''}" data-a="hypothese" data-rep="${h.id}" lang="${lg()}">${esc(ch(h.nom))}</button>`).join('');
        diapo({
          titre, indice: ui('experience'), texte: ch(A.question), illu: svgManuel(6), boutons: `<div class="h-reps">${choix}</div>`,
          suite: () => { if (x.hypothese) suite(); },
          actions: { hypothese: b => {
            KR.son('touche');
            x.hypothese = b.dataset.rep;
            sauver();
            app.querySelectorAll('.h-rep').forEach(y => y.classList.toggle('choisie', y === b));
            app.querySelector('.h-suivant').classList.remove('inactif');
            bulle(ch(A.pourquoi));
            dire([ch(A.pourquoi)]);
          } },
        });
        if (!x.hypothese) app.querySelector('.h-suivant').classList.add('inactif');
      },
      suite => {
        const cases = A.verifs.map(v => `<button type="button" class="h-verif${x.verifs.includes(v.id) ? ' cochee' : ''}" data-a="verif" data-verif="${v.id}" aria-pressed="${x.verifs.includes(v.id)}" lang="${lg()}"><span class="h-case">${KR.icone('ok')}</span>${esc(ch(v))}</button>`).join('');
        diapo({
          titre, indice: ui('experience'), texte: ch(A.une_chose), illu: `<div class="h-verifs">${cases}</div>`,
          suite: () => { if (x.verifs.length >= A.verifs.length) suite(); },
          actions: { verif: b => {
            KR.son('touche');
            const id = b.dataset.verif;
            x.verifs = x.verifs.includes(id) ? x.verifs.filter(v => v !== id) : [...x.verifs, id];
            sauver();
            b.classList.toggle('cochee', x.verifs.includes(id));
            b.setAttribute('aria-pressed', String(x.verifs.includes(id)));
            app.querySelector('.h-suivant').classList.toggle('inactif', x.verifs.length < A.verifs.length);
          } },
        });
        app.querySelector('.h-suivant').classList.toggle('inactif', x.verifs.length < A.verifs.length);
      },
      suite => diapo({ titre, indice: ui('experience'), texte: ch(A.essai), illu: svgManuel(6), suite }),
      suite => ecranMesures(suite),
      suite => ecranResultats(suite),
      suite => diapo({ titre, texte: ch(A.autorotation), illu: svgManuel(6), suite, pilote: true, boutons: `<p class="h-note" lang="${lg()}">${esc(ch(A.cahier))}</p>` }),
    ];
    enchainer(ecrans, () => finEtape('atelier', ch(A.fin)));
  }

  /* Les mesures : trois par modèle, au chronomètre de l'app (une personne lâche, l'autre touche)
     ou tapées au pavé, en dixièmes de seconde. Aucune vitesse calculée (relecture, section 1). */
  function ecranMesures(suite) {
    const A = HC.ATELIER;
    const x = etat.experience;
    let modele = A.modeles.find(m => (x.mesures[m.id] || []).filter(v => typeof v === 'number').length < H.MESURES) || A.modeles[0];
    let rangM = 0;
    let depart = 0;
    let saisie = '';
    changerEcran(`<div class="ecran h-mesures">
      <header class="barre">${nav('retour', 'retour', 'retour')}
        <div class="titre"><p class="titre-ecran h-titre-etape" lang="${lg()}">${esc(ui('experience'))}</p></div>
        ${nav('ecouter', 'son', 'ecouter')}</header>
      <div class="retour-masc h-mes-consigne">${KR.medaillon('attend')}${D.moussiPilote()}<div class="bulles"><div class="bulle parle h-bulle" lang="${lg()}">${esc(ch(A.mesurer))}</div></div></div>
      <div class="h-mes-modeles">${A.modeles.map(m => `<button type="button" class="h-modele" data-a="modele" data-modele="${m.id}" lang="${lg()}"><b>${esc(ch(m.nom))}</b><span>${m.cm} cm</span><span class="h-mes-pts"></span></button>`).join('')}</div>
      <div class="h-mes-corps">
        <div class="h-mes-cases"></div>
        <div class="h-mes-outils">
          <button type="button" class="btn btn-primaire h-chrono" data-a="chrono">${KR.icone('chrono')}<span lang="${lg()}">${esc(ui('partez'))}</span></button>
          <button type="button" class="btn btn-calme h-taper" data-a="taper" lang="${lg()}">${esc(ui('taper'))}</button>
          <div class="h-pave-hote cache"><div class="h-saisie" aria-live="polite"></div></div>
        </div>
      </div>
      <div class="h-boutons h-mes-bas"><button type="button" class="btn btn-primaire h-suivant" data-a="suite">${t('suite')}${KR.icone('suite')}</button></div>
    </div>`);
    const ecran = jeton;
    const pave = KR.pave({
      chiffre: d => { if (saisie.length < 3) saisie += d; majSaisie(); },
      effacer: () => { saisie = saisie.slice(0, -1); majSaisie(); },
      valider: () => { if (saisie) { garder(Number(saisie)); saisie = ''; majSaisie(); } },
    });
    app.querySelector('.h-pave-hote').appendChild(pave.el);
    function majSaisie() {
      app.querySelector('.h-saisie').textContent = saisie ? fmt(Number(saisie)) : '';
      pave.etat(saisie ? 'pret' : 'vide');
    }
    function garder(dixiemes) {
      H.noterMesure(etat, modele.id, rangM, dixiemes);
      sauver();
      KR.son('juste');
      const l = x.mesures[modele.id];
      const libre = [0, 1, 2].find(i => typeof l[i] !== 'number');
      if (libre !== undefined) rangM = libre;
      else {
        const autre = A.modeles.find(m => (x.mesures[m.id] || []).filter(v => typeof v === 'number').length < H.MESURES);
        if (autre) { modele = autre; rangM = 0; }
      }
      maj();
    }
    function maj() {
      const l = x.mesures[modele.id] || [];
      app.querySelectorAll('.h-modele').forEach(b => {
        const n = (x.mesures[b.dataset.modele] || []).filter(v => typeof v === 'number').length;
        b.setAttribute('aria-pressed', String(b.dataset.modele === modele.id));
        b.querySelector('.h-mes-pts').innerHTML = [0, 1, 2].map(i => `<i class="${i < n ? 'pris' : ''}"></i>`).join('');
      });
      app.querySelector('.h-mes-cases').innerHTML = [0, 1, 2].map(i => `<button type="button" class="h-mes-case${i === rangM ? ' ici' : ''}${typeof l[i] === 'number' ? ' pleine' : ''}" data-a="case" data-rang="${i}"><span class="h-mes-n" lang="${lg()}">${esc(ui('mesure'))} ${i + 1}</span><b>${typeof l[i] === 'number' ? esc(fmt(l[i])) : '?'}</b></button>`).join('');
      app.querySelector('.h-suivant').classList.toggle('inactif', !H.mesuresCompletes(etat));
    }
    function chrono(b) {
      const span = b.querySelector('span');
      if (!depart) {
        depart = performance.now();
        span.textContent = ui('au_sol');
        b.classList.add('en-cours');
        return;
      }
      const dix = Math.round((performance.now() - depart) / 100);
      depart = 0;
      span.textContent = ui('partez');
      b.classList.remove('en-cours');
      garder(dix);
    }
    maj();
    majSaisie();
    dire([ch(A.mesurer)]);
    brancher({
      retour: accueil,
      ecouter: () => dire([ch(A.mesurer)]),
      modele: b => { modele = A.modeles.find(m => m.id === b.dataset.modele); const l = x.mesures[modele.id] || []; const libre = [0, 1, 2].find(i => typeof l[i] !== 'number'); rangM = libre === undefined ? 0 : libre; maj(); },
      case: b => { rangM = Number(b.dataset.rang); maj(); },
      chrono,
      taper: () => { app.querySelector('.h-pave-hote').classList.toggle('cache'); pave.activer(); },
      suite: () => { if (ecran === jeton && H.mesuresCompletes(etat)) suite(); },
    });
  }

  /* Les résultats : une barre par modèle, la durée du milieu, les trois mesures en points ; puis le
     rappel de l'hypothèse d'Henri. Une hypothèse fausse est une découverte (relecture, section 4). */
  function ecranResultats(suite) {
    const A = HC.ATELIER;
    const x = etat.experience;
    const max = Math.max(10, ...A.modeles.flatMap(m => x.mesures[m.id] || []).filter(v => typeof v === 'number'));
    const barres = A.modeles.map(m => {
      const l = (x.mesures[m.id] || []).filter(v => typeof v === 'number');
      const mi = H.milieu(l);
      return `<div class="h-res-ligne"><span class="h-res-nom" lang="${lg()}"><b>${esc(ch(m.nom))}</b>${m.cm} cm</span>
        <span class="h-res-piste"><span class="h-res-barre" style="width:${(mi / max * 100).toFixed(1)}%"></span>${l.map(v => `<i class="h-res-pt" style="left:${(v / max * 100).toFixed(1)}%"></i>`).join('')}</span>
        <span class="h-res-val">${esc(fmt(mi))}</span></div>`;
    }).join('');
    const rappel = ch(A.rappel[x.hypothese] || A.rappel.lent);
    const choix = A.conclusions.map(c => `<button type="button" class="btn btn-secondaire h-rep${x.conclusion === c.id ? ' choisie' : ''}" data-a="conclusion" data-rep="${c.id}" lang="${lg()}">${esc(ch(c.nom))}</button>`).join('');
    diapo({
      titre: ui('experience'), texte: `${ch(A.varient)} ${rappel}`, dit: [ch(A.varient), rappel], classe: 'h-resultats',
      illu: `<div class="h-res"><p class="h-res-titre" lang="${lg()}">${esc(ui('milieu'))}</p>${barres}</div>`,
      boutons: `<div class="h-reps">${choix}</div>`,
      suite: () => { if (x.conclusion) suite(); },
      actions: { conclusion: b => {
        KR.son('touche');
        x.conclusion = b.dataset.rep;
        sauver();
        app.querySelectorAll('.h-rep').forEach(y => y.classList.toggle('choisie', y === b));
        app.querySelector('.h-suivant').classList.remove('inactif');
        const texte = ch(x.conclusion === 'surpris' ? A.surpris : A.raison);
        bulle(texte);
        dire([texte]);
      } },
    });
    if (!x.conclusion) app.querySelector('.h-suivant').classList.add('inactif');
  }

  /* =================== e) Qui décide où on vole : la scène radio =================== */
  function etapeRadio() {
    const titre = ch(HC.etape('radio').nom);
    const R = HC.RADIO;
    const illus = { tour: D.tour(), champ: D.champ(), brevet: D.licence() };
    const ecrans = [
      suite => diapo({ titre, texte: ch(R.intro), illu: `<svg class="h-dessin h-grand" viewBox="0 0 320 200" aria-hidden="true">${D.tour()}<g transform="translate(20 90) scale(.4)">${D.helico({ couleur: teinte() })}</g></svg>`, suite, pilote: true }),
      ...R.scenes.map(sc => suite => {
        let phase = 'question';
        const boutons = sc.choix.map(c => `<button type="button" class="btn btn-secondaire h-rep h-radio-rep" data-a="radio" data-rep="${c.id}" lang="${lg()}">${esc(ch(c.nom))}</button>`).join('');
        diapo({
          titre, texte: ch(sc.demande), pilote: true,
          illu: `<svg class="h-dessin h-grand" viewBox="0 0 320 200" aria-hidden="true">${illus[sc.id]}<g transform="translate(14 96) scale(.4)">${D.helico({ couleur: teinte() })}</g></svg><div class="h-idee cache" lang="${lg()}"></div>`,
          boutons: `<div class="h-reps">${boutons}</div>`,
          suite: () => { if (phase === 'idee') suite(); },
          actions: { radio: b => {
            if (phase === 'idee') return;
            const c = sc.choix.find(y => y.id === b.dataset.rep);
            if (sc.id === 'tour' && c.id === 'attends' && phase === 'question') {
              KR.son('touche');
              phase = 'attente';
              bulle(ch(sc.reponses.attends));
              b.disabled = true;
              b.classList.add('h-ecarte');
              app.querySelector('[data-rep="oui"]').classList.add('h-a-toucher');
              return dire([ch(sc.reponses.attends)]);
            }
            if (c.bon) {
              KR.son('juste');
              phase = 'idee';
              app.querySelectorAll('.h-radio-rep').forEach(y => { y.disabled = true; y.classList.remove('h-a-toucher'); y.classList.toggle('h-bon', y === b); });
              const rep = ch(sc.reponses[c.id] || sc.reponses.oui);
              bulle(rep);
              const idee = app.querySelector('.h-idee');
              idee.textContent = ch(sc.idee);
              idee.classList.remove('cache');
              app.querySelector('.h-suivant').classList.remove('inactif');
              dire([rep, ch(sc.idee)]);
            } else {
              KR.son('doux');
              phase = 'aide';
              b.classList.add('h-ecarte');
              const bon = sc.choix.find(y => y.bon);
              app.querySelector(`[data-rep="${bon.id}"]`).classList.add('h-a-toucher');
              bulle(ch(sc.reponses.aide));
              dire([ch(sc.reponses.aide)]);
            }
          } },
        });
        app.querySelector('.h-suivant').classList.add('inactif');
      }),
    ];
    enchainer(ecrans, () => finEtape('radio', ch(R.fin)));
  }

  /* =================== f) Records et drones, en comparaisons =================== */
  function illuRecord(id) {
    const c = teinte();
    const nombre = (n, d) => n.toLocaleString(lg() === 'fr' ? 'fr-FR' : 'en-GB', { maximumFractionDigits: d || 0 });
    if (id === 'altitude') {
      return `<div class="h-record"><svg class="h-dessin h-grand" viewBox="0 0 320 220" aria-hidden="true">${D.altitude()}</svg>
        <div class="h-legendes"><span><i class="h-pastille-gris"></i>Everest · ${nombre(8848)} m</span><span><i class="h-pastille-bleu"></i>Record · ${nombre(12442)} m</span></div></div>`;
    }
    if (id === 'everest') return `<svg class="h-dessin h-grand" viewBox="0 0 320 220" aria-hidden="true">${D.everest()}</svg>`;
    if (id === 'vitesse' || id === 'croisiere') {
      const lignes = [
        { v: 130, nom: lg() === 'fr' ? 'Voiture sur l\'autoroute' : 'Car on the motorway', couleur: '#9AA6B8' },
        { v: 252, nom: lg() === 'fr' ? 'Ton Écureuil' : 'Your Écureuil', couleur: c },
        { v: 400.87, nom: 'Lynx, 1986', couleur: '#3C7BD9' },
      ];
      return `<div class="h-vitesses">${lignes.map((l, i) => `<div class="h-vit${id === 'croisiere' && i === 1 ? ' h-vit-fort' : ''}${id === 'vitesse' && i === 2 ? ' h-vit-fort' : ''}"><span class="h-vit-nom" lang="${lg()}">${esc(l.nom)}</span><span class="h-vit-piste"><span class="h-vit-barre" style="width:${(l.v / 400.87 * 100).toFixed(1)}%;--b:${l.couleur}"></span></span><b>${nombre(Math.floor(l.v))} km/h</b></div>`).join('')}</div>`;
    }
    if (id === 'famille') return `<div class="h-record"><svg class="h-dessin h-grand" viewBox="0 0 310 200" aria-hidden="true">${D.famille()}</svg><div class="h-legendes"><span><i class="h-pastille-jaune"></i>${lg() === 'fr' ? '1 rond = 100 hélicoptères' : '1 dot = 100 helicopters'}</span></div></div>`;
    if (id === 'drone') return `<svg class="h-dessin h-grand" viewBox="0 0 320 220" aria-hidden="true">${D.drone()}</svg>`;
    return '';
  }
  function etapeRecords() {
    const titre = ch(HC.etape('records').nom);
    enchainer(HC.RECORDS.ecrans.map(e => suite => diapo({ titre, texte: ch(e), illu: illuRecord(e.id), suite })), () => finEtape('records', ch(HC.RECORDS.fin)));
  }

  /* =================== g) La sortie au musée =================== */
  function etapeSortie() {
    const titre = ch(HC.etape('sortie').nom);
    const S = HC.SORTIE;
    const A_TROUVER = ['pales', 'queue', 'patins', 'cabine'];
    enchainer([
      suite => diapo({ titre, texte: ch(S.intro), illu: `<svg class="h-dessin h-grand" viewBox="0 0 320 200" aria-hidden="true">${D.musee('#F2C230')}</svg>`, suite, boutons: `<p class="h-note" lang="${lg()}">${esc(ch(S.parents))}</p>` }),
      suite => {
        const cases = A_TROUVER.map(id => `<button type="button" class="h-verif${etat.trouves.includes(id) ? ' cochee' : ''}" data-a="trouve" data-partie="${id}" aria-pressed="${etat.trouves.includes(id)}" lang="${lg()}"><span class="h-case">${KR.icone('ok')}</span>${esc(ch(HC.partie(id).nom))}</button>`).join('');
        diapo({
          titre, texte: ch(S.chercher), illu: `<div class="h-verifs">${cases}</div>`,
          boutons: `<button type="button" class="btn btn-primaire h-alle" data-a="alle">${KR.icone('ok')}<span lang="${lg()}">${esc(ui('on_y_est_alle'))}</span></button>`,
          actions: {
            trouve: b => {
              KR.son('touche');
              const id = b.dataset.partie;
              etat.trouves = etat.trouves.includes(id) ? etat.trouves.filter(v => v !== id) : [...etat.trouves, id];
              sauver();
              b.classList.toggle('cochee', etat.trouves.includes(id));
              b.setAttribute('aria-pressed', String(etat.trouves.includes(id)));
            },
            alle: suite,
          },
        });
      },
    ], () => finEtape('sortie', ch(S.fin)));
  }

  /* =================== Les cartes de Leitner =================== */
  function seanceCartes() {
    etat = H.charger(enfant);
    const s = H.creerSeance(etat, new Date());
    if (!s.questions.length) return accueil();
    const resultats = [];
    let q = null;
    let k = null;
    let phase = 'question';
    let numero = 0;
    let bloque = false;
    let debut = 0;
    changerEcran(`<div class="ecran ecran-fixe exo h-seance">
      <header class="barre">${nav('retour', 'retour', 'retour')}
        <div class="avance" role="progressbar" aria-valuemin="0"><div class="points-av"></div><span class="compte"></span></div>
        ${nav('ecouter', 'son', 'ecouter')}</header>
      <div class="corps"><section class="zone h-illu"></section><section class="action h-panneau"></section></div>
    </div>`);
    const zone = app.querySelector('.zone');
    const action = app.querySelector('.action');

    function majAvance() {
      let h = '';
      s.questions.forEach((x, i) => {
        if (x.retour) return;
        if (resultats[i]) h += `<i class="pt ${resultats[i] === 'j' ? 'juste' : 'revu'}"></i>`;
        else if (i === s.index && phase !== 'juste') h += '<i class="pt ici"></i>';
        else h += '<i class="pt"></i>';
      });
      const av = app.querySelector('.avance');
      av.querySelector('.points-av').innerHTML = h;
      const { n, total } = H.avancement(s);
      av.querySelector('.compte').textContent = t('avancement', { n, total });
      av.setAttribute('aria-valuenow', n);
      av.setAttribute('aria-valuemax', total);
    }
    const choixDe = carte => {
      if (carte.type === 'commande') return HC.COMMANDES.map(c => ({ id: c.id, html: `${D.svgCommande(c.id, COULEUR_CMD[c.id])}${nomCmd(c.id)}` }));
      return ['a', 'b', 'c'].map(id => ({ id, html: `<span lang="${lg()}">${esc(ch(carte.choix[id]))}</span>` }));
    };
    function question() {
      q = H.courante(s);
      k = HC.carte(q.carte);
      numero++;
      phase = 'question';
      majAvance();
      Object.assign(zone.dataset, { carte: k.id, bon: k.bon }); // lu par test_parcours.py
      if (k.type === 'partie') zone.innerHTML = D.svgHelico({ couleur: teinte(), surligne: k.partie }, 'h-grand h-q-partie');
      else if (k.type === 'commande') zone.innerHTML = `<div class="h-q-moussi">${D.moussiPilote('aide')}</div>`;
      else zone.innerHTML = `<div class="h-q-dessin">${D.svgHelico({ couleur: teinte(), mission: etat.mission }, 'h-moyen')}</div>`;
      const melange = Array.from(choixDe(k));
      // L'ordre des réponses change d'une séance à l'autre, sans hasard dans les tests.
      const decal = (numero + k.id.length) % melange.length;
      const ordre = melange.slice(decal).concat(melange.slice(0, decal));
      action.innerHTML = `<div class="carte-q h-q" lang="${lg()}"><p class="h-q-texte">${esc(ch(k.q))}</p></div>
        <div class="h-choix${k.type === 'commande' ? ' h-choix-cmd' : ''}">${ordre.map(c => `<button type="button" class="btn btn-secondaire h-choix-btn" data-a="choix" data-rep="${c.id}">${c.html}</button>`).join('')}</div>`;
      dire([ch(k.q)]);
      debut = performance.now();
    }
    function repondre(rep, b) {
      if (bloque) return;
      const bon = rep === k.bon;
      if (phase === 'question') {
        H.repondre(s, etat, bon, new Date());
        sauver();
        resultats[s.index] = bon ? 'j' : 'r';
        if (bon) return montrerJuste(performance.now() - debut < 4000, false);
        return montrerAide(b);
      }
      if (phase === 'aide') {
        if (bon) return montrerJuste(true, true);
        KR.son('doux');
      }
    }
    function montrerJuste(rapide, sansVoix) {
      phase = 'juste';
      majAvance();
      KR.son('juste');
      action.querySelectorAll('.h-choix-btn').forEach(b => { b.disabled = true; if (b.dataset.rep === k.bon) b.classList.add('h-bon'); });
      const texte = k.merci ? ch(k.merci) : '';
      const choix = action.querySelector('.h-choix').outerHTML;
      action.innerHTML = `${choix}<div class="retour-masc fete">${KR.medaillon('fete')}${D.moussiPilote('fete')}<div class="bulles"><div class="bulle parle" lang="${texte ? lg() : window.Textes.langue}">${esc(texte || t('bravo'))}</div></div></div>
        <button type="button" class="btn btn-primaire h-suite-q" data-a="suite" disabled>${t('suite')}${KR.icone('suite')}<span class="h-jauge"><i></i></span></button>`;
      const ici = numero;
      const lancer = () => {
        if (ici !== numero) return;
        const b = action.querySelector('.h-suite-q');
        b.disabled = false;
        const i = b.querySelector('.h-jauge i');
        if (mouvement()) { void i.offsetWidth; i.style.transition = `width ${DUREE_SUITE}ms linear`; }
        i.style.width = '100%';
        plusTard(() => { if (ici === numero && phase === 'juste') suivante(); }, DUREE_SUITE);
      };
      if (texte && voixActive() && !sansVoix) return dire([texte]).then(lancer);
      if (rapide || sansVoix || !voixActive()) return lancer();
      dire([ch(k.aide)]).then(lancer);
    }
    /* Erreur : ni rouge ni croix ; la bonne réponse surlignée, l'explication dite, puis Henri la retouche. */
    function montrerAide(mauvais) {
      phase = 'aide';
      majAvance();
      KR.son('doux');
      action.querySelectorAll('.h-choix-btn').forEach(b => {
        if (b.dataset.rep === k.bon) b.classList.add('h-a-toucher');
        else if (b === mauvais) b.classList.add('h-ecarte');
      });
      const choix = action.querySelector('.h-choix').outerHTML;
      action.innerHTML = `<div class="retour-masc">${KR.medaillon('aide')}${D.moussiPilote('aide')}<div class="bulles"><div class="bulle parle">${t('presque')} ${t('on_regarde')}</div><div class="bulle astuce" lang="${lg()}">${esc(ch(k.aide))}</div></div></div>${choix}`;
      bloque = voixActive();
      const ici = numero;
      dire([ch(k.aide)]).then(() => { if (ici === numero) bloque = false; });
    }
    function suivante() {
      minuteurs.forEach(clearTimeout);
      minuteurs = [];
      H.suivante(s);
      if (H.finie(s)) return finSeance(s);
      question();
    }
    function confirmerArret() {
      if (document.querySelector('.voile')) return;
      const voile = document.createElement('div');
      voile.className = 'voile';
      voile.innerHTML = `<div class="feuille h-feuille-arret" role="dialog" aria-modal="true" aria-labelledby="h-arret-titre">
        <h2 id="h-arret-titre">${t('arreter_question')}</h2>
        <div class="boutons"><button type="button" class="btn btn-secondaire" data-arret="non">${t('continuer')}</button>
        <button type="button" class="btn btn-primaire" data-arret="oui">${t('arreter')}</button></div></div>`;
      document.body.appendChild(voile);
      voile.addEventListener('click', e => {
        if (e.target === voile) return voile.remove();
        const b = e.target.closest('[data-arret]');
        if (!b) return;
        voile.remove();
        if (b.dataset.arret === 'oui') accueil();
      });
    }
    brancher({
      retour: confirmerArret,
      choix: b => repondre(b.dataset.rep, b),
      suite: () => { if (phase === 'juste') suivante(); },
      ecouter: () => dire([phase === 'aide' ? ch(k.aide) : ch(k.q)]),
    });
    question();
  }

  function finSeance(s) {
    const maintenant = new Date();
    const nouveaux = H.majBrevet(etat, maintenant);
    H.finirSeance(etat, maintenant);
    sauver();
    publier();
    KR.son('fete');
    const montees = new Set(s.montees).size;
    const semaine = H.joursDeLaSemaine(etat, maintenant);
    changerEcran(`<div class="ecran h-fin">
      <div class="h-fin-masc">${D.moussiPilote('fete')}</div>
      <div class="h-fin-contenu">
        <h1>${esc(t('bravo_prenom', { prenom: KR.prenom() }))}</h1>
        ${montees ? `<p class="h-fin-ligne">${KR.icone('monte')}<span lang="${lg()}">+${montees} ${esc(ui('cartes_n'))}</span></p>` : ''}
        ${nouveaux.length ? `<p class="h-fin-ligne h-fin-tampon">${KR.icone('etoile')}<span lang="${lg()}">${esc(ch(HC.CARNET.nouveau))}</span></p>` : ''}
        <div class="h-ligne-fin">${KR.semaine(semaine)}<p class="h-jours-n">${KR.joursFaits(semaine)}</p></div>
        <div class="h-boutons">
          <button type="button" class="btn ${nouveaux.length ? 'btn-primaire' : 'btn-secondaire'}" data-a="carnet">${esc(ui('carnet'))}</button>
          <button type="button" class="btn ${nouveaux.length ? 'btn-secondaire' : 'btn-primaire'}" data-a="fini">${t('fini')}</button>
        </div>
      </div>
    </div>`);
    brancher({ carnet: () => carnet(accueil), fini: accueil });
  }

  /* =================== Le carnet de pilote (D-25) =================== */
  function carnet(retour) {
    etat = H.charger(enfant);
    const aMontrer = H.tamponsAMontrer(etat);
    const cases = proprio => HC.COMMANDES.map(c => {
      const pose = etat.brevet[c.id] && !aMontrer.includes(c.id);
      return `<div class="h-tampon-case${pose ? ' pose' : ''}" data-cmd="${c.id}" data-page="${proprio}">
        <span class="h-tampon-fond">${D.svgCommande(c.id, '#B9B3A8')}</span>
        <span class="h-tampon-encre">${D.tampon(c.id, ENCRE_CMD[c.id])}</span>
        ${nomCmd(c.id, 'petit')}</div>`;
    }).join('');
    // Les tampons des missions du vol en 3D (prototype, D-26), s'il y en a : une ligne de plus sur chaque page.
    const vols3d = etat.vol3d && etat.vol3d.missions ? Object.keys(etat.vol3d.missions) : [];
    const vols = () => (vols3d.length ? `<div class="h-vols"><span lang="${lg()}">${esc(ui('vols'))}</span><div>${['decoller', 'stationnaire', 'tour', 'tourner', 'poser']
      .filter(id => vols3d.includes(id)).map(id => `<i>${D.tamponVol(id, D.ENCRE_VOL[id])}</i>`).join('')}</div></div>` : '');
    const objets = Object.keys(HC.OBJETS).map(id => (etat.objets[id]
      ? `<div class="h-objet-case a" title="${esc(ch(HC.OBJETS[id]))}">${D.svgObjet(id, etat.mission, teinte())}<span lang="${lg()}">${esc(ch(HC.OBJETS[id]))}</span></div>`
      : '<div class="h-objet-case"><span class="h-objet-vide">?</span></div>')).join('');
    changerEcran(`<div class="ecran h-carnet">
      <header class="barre">${nav('retour', 'retour', 'retour')}
        <div class="titre"><h1 class="titre-ecran" lang="${lg()}">${esc(ch(HC.CARNET.titre))}</h1></div>
        ${nav('ecouter', 'son', 'ecouter')}</header>
      <p class="h-carnet-ensemble" lang="${lg()}">${esc(ch(HC.CARNET.ensemble))}</p>
      <div class="h-livret">
        <section class="h-page">
          <div class="h-page-tete"><div class="h-photo">${etat.mission ? D.svgObjet('ecusson', etat.mission, teinte()) : D.svgHelico({ couleur: teinte() })}</div>
            <div class="h-nom-case"><span lang="${lg()}">${esc(ui('nom_pilote'))}</span><b>${esc(KR.prenom())}</b></div></div>
          <div class="h-tampons">${cases('enfant')}</div>${vols()}
        </section>
        <section class="h-page">
          <div class="h-page-tete"><div class="h-photo h-photo-moussi">${D.moussiPilote()}</div>
            <div class="h-nom-case"><span lang="${lg()}">${esc(ui('nom_pilote'))}</span><b lang="${lg()}">${esc(ui('pilote_moussi'))}</b></div></div>
          <div class="h-tampons">${cases('moussi')}</div>${vols()}
        </section>
      </div>
      <section class="h-etagere"><h2 lang="${lg()}">${esc(ui('objets'))}</h2><div class="h-objets">${objets}</div></section>
    </div>`);
    const ecran = jeton;
    brancher({ retour: retour || accueil, ecouter: () => dire([ch(HC.CARNET.ensemble)]) });
    if (!aMontrer.length) { dire([ch(HC.CARNET.ensemble)]); return; }
    // Les nouveaux tampons s'abattent, sur la page d'Henri puis sur celle de Moussi (D-25).
    let delai = 500;
    aMontrer.forEach(cmd => {
      ['enfant', 'moussi'].forEach(page => {
        plusTard(() => {
          if (ecran !== jeton) return;
          const el = app.querySelector(`.h-tampon-case[data-cmd="${cmd}"][data-page="${page}"]`);
          if (el) { el.classList.add('pose', 'abat'); KR.son('tampon'); }
        }, delai);
        delai += mouvement() ? 900 : 100;
      });
      H.tamponMontre(etat, cmd);
    });
    sauver();
    plusTard(() => { if (ecran === jeton) dire([ch(HC.CARNET.nouveau)]); }, delai);
  }

  accueil();
})();
