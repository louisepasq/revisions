/* Interface du module « De l'univers à Éguilles » : accueil et étapes, grand voyage du premier
   lancement, exploration (toucher un lieu pour entendre son nom), séance, fin.
   Dépend de commun/textes.js, commun/kit.js, contenu.js, cartes.js, geometrie.js et moteur.js.
   Le contenu (noms, consignes, repères) reste en français ; le cadre suit la langue de l'enfant. */
(function () {
  'use strict';
  const KR = window.KR;
  const Z = window.Zoom;
  const C = window.ZoomContenu;
  const K = window.ZoomCartes;
  const G = window.ZoomGeo;
  const t = KR.t;
  const enfant = KR.enfant();
  const app = document.getElementById('app');
  const PROG = C.programme(enfant);
  const NB_CHOIX = KR.infos().classe === 'CM2' ? 4 : 3; // relecture du 01/11/2026, section 4.1
  const DUREE_SUITE = 1600;
  const SECOURS_VOIX = 8000;
  const NS = 'http://www.w3.org/2000/svg';
  // Le lieu de chaque étape dans lequel on zoome pour passer à la suivante.
  const FOYER = { univers: 'systeme-solaire', solaire: 'terre-planete', terre: 'europe', europe: 'france', france: 'paca', paca: 'bouches-du-rhone', bdr: 'eguilles' };
  const CREDITS = 'Cartes : Natural Earth (domaine public) ; IGN, ADMIN EXPRESS COG, édition 2018, Licence Ouverte Etalab (tracés de france-geojson) ; geo.api.gouv.fr. Voie lactée et système solaire dessinés à la main.';

  KR.demarrer();
  let etat = Z.charger(enfant);
  let minuteurs = [];
  let jeton = 0; // change à chaque écran : une suite (voix, animation) d'un écran quitté s'arrête
  const sauver = () => Z.sauver(enfant, etat);
  // Le résumé du portail (D-19), à l'ouverture et en fin de séance ; gardé dans l'état en mémoire
  // pour que le prochain sauver ne l'efface pas.
  const publier = () => { etat.resume = KR.publierResume('zoom', window.ZoomResume.resume(etat, enfant, new Date())); };
  const fr = s => `<span lang="fr">${KR.echapper(s)}</span>`;
  const voixActive = () => KR.reglages().voix;
  const dire = (textes, secours) => (voixActive() ? KR.lireSuite(textes.filter(Boolean).map(texte => ({ texte, langue: 'fr' })), secours || SECOURS_VOIX) : Promise.resolve(false));
  const mouvement = () => !KR.mouvementReduit();

  function plusTard(fn, ms) { minuteurs.push(setTimeout(fn, ms)); }
  function changerEcran(html) {
    minuteurs.forEach(clearTimeout);
    minuteurs = [];
    jeton++;
    KR.taire();
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
  function svgEl(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach(k => { if (attrs[k] !== null && attrs[k] !== undefined) e.setAttribute(k, attrs[k]); });
    if (parent) parent.appendChild(e);
    return e;
  }
  const lieuxDe = etageId => C.ETAGES.find(e => e.id === etageId).lieux;
  const etageNom = etageId => C.ETAGES.find(e => e.id === etageId).nom;
  const rangEtage = etageId => C.ETAGES.findIndex(e => e.id === etageId);

  /* Motifs communs à toutes les cartes de la page (hachures des massifs, lueurs de l'espace). */
  function definitions() {
    if (document.getElementById('z-defs')) return;
    const s = svgEl('svg', { id: 'z-defs', width: 0, height: 0, 'aria-hidden': 'true', style: 'position:absolute' });
    s.innerHTML = `<defs>
      <pattern id="z-hachures" patternUnits="userSpaceOnUse" width="10" height="10" patternTransform="rotate(45)"><rect width="10" height="10" class="hachure-fond"/><path d="M0 0V10" class="hachure-trait"/></pattern>
      <radialGradient id="z-lueur"><stop offset="0" stop-color="#FFF6D8"/><stop offset=".45" stop-color="#F7C66A" stop-opacity=".85"/><stop offset="1" stop-color="#F7C66A" stop-opacity="0"/></radialGradient>
      <radialGradient id="z-soleil" cx=".62" cy=".5"><stop offset="0" stop-color="#FFF3B0"/><stop offset=".6" stop-color="#FFC93C"/><stop offset="1" stop-color="#F29A2E"/></radialGradient>
      <filter id="z-flou" filterUnits="userSpaceOnUse" x="-500" y="-500" width="2000" height="1700"><feGaussianBlur stdDeviation="9"/></filter>
    </defs>`;
    document.body.appendChild(s);
  }

  /* =================== La carte d'une étape =================== */
  function creerCarte(etageId, options) {
    definitions();
    const opts = options || {};
    const etage = K[etageId];
    const ids = lieuxDe(etageId).map(l => l.id);
    const hote = document.createElement('div');
    hote.className = 'carte-zoom e-' + etageId + (opts.classe ? ' ' + opts.classe : '');
    const vbInitial = [0, 0, etage.l, etage.h];
    let vb = vbInitial.slice();
    const svg = svgEl('svg', { viewBox: vb.join(' '), preserveAspectRatio: 'xMidYMid meet', class: 'carte-svg', role: 'img', 'aria-label': etageNom(etageId), lang: 'fr' });
    hote.appendChild(svg);
    const gFond = svgEl('g', { class: 'c-fond' }, svg);
    let gSous = null;
    etage.fond.forEach((f, i) => {
      const [type, classe, geo] = f;
      const c = 'f ' + classe;
      if (type === 'z') svgEl('path', { d: G.dZone(geo), class: c, 'fill-rule': 'evenodd' }, gFond);
      else if (type === 'l') svgEl('path', { d: G.dLigne(geo), class: c }, gFond);
      else if (type === 'c') svgEl('circle', { cx: geo[0], cy: geo[1], r: geo[2], class: c }, gFond);
      else if (type === 'd') svgEl('path', { d: geo, class: c }, gFond);
      else if (type === 'e') svgEl('ellipse', { cx: geo[0], cy: geo[1], rx: geo[2], ry: geo[3], transform: `rotate(${geo[4]} ${geo[0]} ${geo[1]})`, class: c }, gFond);
      if (i === 0) gSous = svgEl('g', { class: 'c-sous' }, gFond); // sous les terres : la surbrillance d'une mer
    });
    if (opts.vignette) return { el: hote };
    const gLieux = svgEl('g', { class: 'c-lieux' }, svg);
    const gReperes = svgEl('g', { class: 'c-reperes' }, svg);
    const gMarques = svgEl('g', { class: 'c-marques' }, svg);
    const points = [];
    const lieuxEl = {};
    // Ordre de dessin : zones, puis lignes, puis points, pour que les petits lieux restent visibles.
    ['z', 'l', 'p'].forEach(type => ids.forEach(id => {
      const f = etage.formes[id];
      if (!f || f.f !== type) return;
      const L = C.lieu(id);
      const dessin = f.d || (type === 'l' && ['fleuve', 'cours'].includes(L.groupe) ? 'fleuve' : '');
      const g = svgEl('g', { class: `lieu f-${type}${dessin ? ' d-' + dessin : ''}`, 'data-lieu': id }, gLieux);
      if (type === 'z') svgEl('path', { d: G.dZone(f.g), 'fill-rule': 'evenodd' }, g);
      else if (type === 'l') svgEl('path', { d: G.dLigne(f.g) }, g);
      else {
        const c = svgEl('circle', { cx: f.g[0], cy: f.g[1], r: f.r || 1 }, g);
        points.push({ c, px: f.r ? 5 : dessin === 'village' ? 10 : 7, r: f.r || 0 }); // une planète reste visible sur iPhone
      }
      lieuxEl[id] = g;
    }));
    const reperes = (etage.reperes || []).map(([nom, x, y]) => {
      const g = svgEl('g', { class: 'repere' }, gReperes);
      const c = svgEl('rect', { x, y }, g);
      const tx = svgEl('text', { x, y }, g);
      tx.textContent = nom;
      return { c, tx, x, y };
    });

    const echelle = () => { const m = svg.getScreenCTM(); return m && m.a ? m.a : 1; };
    function majTailles() {
      const e = echelle();
      points.forEach(p => p.c.setAttribute('r', Math.max(p.r, p.px / e).toFixed(2)));
      reperes.forEach(r => {
        const s = 8 / e;
        r.c.setAttribute('x', r.x - s / 2); r.c.setAttribute('y', r.y - s / 2);
        r.c.setAttribute('width', s); r.c.setAttribute('height', s);
        r.tx.setAttribute('x', r.x + 7 / e); r.tx.setAttribute('y', r.y - 7 / e);
        r.tx.style.fontSize = (15 / e) + 'px';
      });
      gMarques.querySelectorAll('[data-px]').forEach(m => {
        const [x, y] = m.dataset.px.split(',').map(Number);
        m.setAttribute('transform', `translate(${x} ${y}) scale(${1 / e})`);
      });
    }
    if (window.ResizeObserver) new ResizeObserver(majTailles).observe(svg);

    function coords(ev) {
      const m = svg.getScreenCTM();
      if (!m) return null;
      const p = svg.createSVGPoint();
      p.x = ev.clientX;
      p.y = ev.clientY;
      const q = p.matrixTransform(m.inverse());
      return { x: q.x, y: q.y, echelle: m.a };
    }

    /* mode : question, aide, juste, explore. Une mer ou un océan se surligne sous les terres. */
    function surbrillance(id, mode) {
      const f = etage.formes[id];
      if (!f) return;
      const cl = 'hl hl-' + mode;
      if (f.f === 'z') svgEl('path', { d: G.dZone(f.g), class: cl + ' hl-z', 'fill-rule': 'evenodd' }, f.ht ? gSous : gMarques);
      else if (f.f === 'l') {
        svgEl('path', { d: G.dLigne(f.g), class: cl + ' hl-l-fond' }, gMarques);
        svgEl('path', { d: G.dLigne(f.g), class: cl + ' hl-l' }, gMarques);
      } else {
        const g = svgEl('g', { class: cl + ' hl-p', 'data-px': f.g.join(',') }, gMarques);
        const rpx = f.r ? f.r * echelle() : 0;
        svgEl('circle', { r: Math.max(16, rpx + 8) }, g);
      }
      majTailles();
    }
    function epingle(id) {
      const f = etage.formes[id];
      if (!f) return;
      const [x, y] = f.f === 'p' ? f.g : f.e;
      const rpx = f.f === 'p' && f.r ? f.r * echelle() : 0;
      const g = svgEl('g', { class: 'epingle', 'data-px': `${x},${y}` }, gMarques);
      const h = rpx > 20 ? -rpx : -4;
      svgEl('path', { d: `M0 ${h}c-8-12-15-19-15-28a15 15 0 1 1 30 0c0 9-7 16-15 28z`, transform: `translate(0 ${-0})` }, g);
      svgEl('circle', { cy: h - 28, r: 5.5 }, g);
      majTailles();
    }
    function etiquette(id, texte) {
      const f = etage.formes[id];
      if (!f) return;
      const [x, y] = f.e;
      const g = svgEl('g', { class: 'etiq-carte', 'data-px': `${x},${y}` }, gMarques);
      const decale = f.f === 'p' ? (f.r ? f.r * echelle() + 22 : 24) : 0;
      const tx = svgEl('text', { x: 0, y: decale, 'text-anchor': 'middle', 'dominant-baseline': 'middle' }, g);
      tx.textContent = texte;
      majTailles();
      // Une étiquette ne sort pas du cadre de la carte (Neptune au bord, l'Océanie en bas à droite).
      const r = tx.getBBox();
      const e = echelle();
      const minX = vb[0] + 8 / e, maxX = vb[0] + vb[2] - 8 / e;
      const gauche = x + r.x / e, droite = x + (r.x + r.width) / e;
      let dx = 0;
      if (gauche < minX) dx = (minX - gauche) * e;
      if (droite > maxX) dx = (maxX - droite) * e;
      let dy = 0;
      const haut = y + r.y / e, bas = y + (r.y + r.height) / e;
      if (bas > vb[1] + vb[3] - 6 / e) dy = (vb[1] + vb[3] - 6 / e - bas) * e;
      if (haut < vb[1] + 6 / e) dy = (vb[1] + 6 / e - haut) * e;
      tx.setAttribute('x', dx);
      tx.setAttribute('y', decale + dy);
    }
    function effacer() { gMarques.innerHTML = ''; if (gSous) gSous.innerHTML = ''; }
    function couleurs(e) {
      ids.forEach(id => {
        const g = lieuxEl[id];
        if (!g) return;
        g.classList.remove('m-bronze', 'm-argent', 'm-or');
        const c = Z.couleur(e, id);
        if (c !== 'gris') g.classList.add('m-' + c);
      });
    }
    function poserVb(v) { vb = v; svg.setAttribute('viewBox', v.map(n => n.toFixed(1)).join(' ')); majTailles(); }
    /* Zoome vers un rectangle de la carte (le foyer de l'étape suivante), ou en sort. */
    function zoomVers(rect, ms, depuis) {
      const de = depuis || vb.slice();
      const r = rect || vbInitial;
      const min = etage.l * 0.06;
      const vers = r[2] < min ? [r[0] + r[2] / 2 - min / 2, r[1] + r[3] / 2 - (min * r[3] / Math.max(1, r[2])) / 2, min, min * r[3] / Math.max(1, r[2])] : r;
      if (!mouvement() || !ms) { poserVb(vers); return Promise.resolve(); }
      return new Promise(fin => {
        const t0 = performance.now();
        const pas = now => {
          const k = Math.min(1, (now - t0) / ms);
          const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
          // interpolation géométrique de la taille : le zoom paraît régulier
          const w = de[2] * Math.pow(vers[2] / de[2], e);
          const h = de[3] * Math.pow(vers[3] / de[3], e);
          const cx = de[0] + de[2] / 2 + (vers[0] + vers[2] / 2 - de[0] - de[2] / 2) * e;
          const cy = de[1] + de[3] / 2 + (vers[1] + vers[3] / 2 - de[1] - de[3] / 2) * e;
          poserVb([cx - w / 2, cy - h / 2, w, h]);
          if (k < 1) requestAnimationFrame(pas); else fin();
        };
        requestAnimationFrame(pas);
      });
    }
    const api = {
      el: hote, svg, etage, etageId, ids, coords, surbrillance, epingle, etiquette, effacer, couleurs, majTailles, zoomVers,
      foyer: () => etage.foyer,
      surToucher(fn) { svg.addEventListener('click', ev => { const p = coords(ev); if (p) fn(p, ev); }); },
    };
    requestAnimationFrame(majTailles);
    return api;
  }

  /* =================== Accueil du module =================== */
  function accueil() {
    etat = Z.charger(enfant);
    publier();
    if (!etat.intro) return introVoyage();
    Z.majEtages(etat, PROG);
    const maintenant = new Date();
    const cpt = Z.compte(etat, PROG);
    const nb = Z.seance(etat, PROG, maintenant).filter(q => q.type !== 'decouverte').length;
    const etapes = C.ETAGES.map((e, i) => {
      const ouvert = i < etat.etages;
      const lieux = PROG.etages[i].lieux;
      const faits = lieux.filter(l => Z.couleur(etat, l) !== 'gris').length;
      const bas = ouvert
        ? `<span class="mini-piste"><i style="width:${(lieux.length ? faits / lieux.length * 100 : 0).toFixed(0)}%"></i></span><span class="z-etape-n">${t('avancement', { n: faits, total: lieux.length })}</span>`
        : `<span class="pastille bientot">${t('zoom_plus_tard')}</span>`;
      return `<button type="button" class="z-etape${ouvert ? '' : ' fermee'}" data-a="explorer" data-etage="${e.id}">
        <span class="z-vignette" data-vignette="${e.id}"></span>
        <span class="z-etape-texte"><b lang="fr">${KR.echapper(e.nom)}</b>${bas}</span></button>`;
    }).join('');
    changerEcran(`<div class="ecran z-accueil">
      <header class="barre">${nav('', 'retour', 'retour', './')}
        <div class="titre"><h1 class="titre-ecran">${t('module_zoom')}</h1><p class="indice">${t('zoom_lieux', { n: cpt.decouverts, total: cpt.total })}</p></div>
      </header>
      <div class="z-accueil-grille">
        <div class="z-colonne">
          <button type="button" class="z-entrainement" data-a="seance">
            <span class="ce-haut"><span class="ce-masc">${KR.mascotte('attend')}</span>
              <span class="ce-infos"><span class="ce-info">${KR.icone('ok')}<span>${t('questions_auj', { n: nb })}</span></span></span></span>
            <span class="ce-semaine">${KR.semaine(Z.joursDeLaSemaine(etat, maintenant))}</span>
            <span class="ce-texte"><b>${t('entrainement')}</b><span>${t('entrainement_sous')}</span></span>
            <span class="ce-go">${KR.icone('jouer')}</span>
          </button>
          <button type="button" class="btn btn-secondaire z-revoir" data-a="voyage">${KR.icone('planete')}${t('zoom_revoir_voyage')}</button>
        </div>
        <section class="z-etapes" aria-label="${t('zoom_etapes')}"><h2>${t('zoom_etapes')}</h2>${etapes}</section>
      </div>
    </div>`);
    app.querySelectorAll('[data-vignette]').forEach(v => v.appendChild(creerCarte(v.dataset.vignette, { vignette: true, classe: 'vignette' }).el));
    brancher({
      seance: demarrerSeance,
      explorer: b => explorer(b.dataset.etage),
      voyage: () => voyage(accueil),
    });
  }

  /* =================== Le grand voyage : de la Voie lactée à Éguilles =================== */
  function introVoyage() {
    changerEcran(`<div class="ecran parole z-parole">
      <header class="barre">${nav('', 'retour', 'retour', './')}<div class="avance"></div>${nav('ecouter', 'son', 'ecouter')}</header>
      <div class="parole-corps">
        <div class="parole-masc">${KR.mascotte('attend')}</div>
        <div class="parole-texte"><div class="bulle parle">${KR.echapper(t('zoom_intro_bulle'))}</div>
          <button type="button" class="btn btn-primaire" data-a="go">${t('commencer')}${KR.icone('suite')}</button></div>
      </div>
    </div>`);
    brancher({
      go: () => voyage(() => { etat.intro = true; sauver(); demarrerSeance(); }, true),
      ecouter: () => KR.lire(t('zoom_intro_bulle'), KR.reglages().langue),
    });
  }

  function voyage(suite, premier) {
    changerEcran(`<div class="ecran ecran-fixe z-voyage">
      <header class="barre">${nav('retour', 'retour', 'retour')}
        <div class="titre"><p class="titre-ecran z-voyage-titre" lang="fr"></p></div>
        ${nav('passer', 'suite', 'je_passe')}</header>
      <div class="corps"><section class="zone z-voyage-zone"></section></div>
    </div>`);
    const ecran = jeton;
    let deroule = 0; // Skip arrête le déroulé en cours sans quitter l'écran
    const vivant = d => ecran === jeton && d === deroule;
    const zone = app.querySelector('.z-voyage-zone');
    const titre = app.querySelector('.z-voyage-titre');
    let carte = null;
    const attendre = ms => new Promise(r => plusTard(r, ms));

    function montrer(etageId) {
      carte = creerCarte(etageId);
      zone.innerHTML = '';
      zone.appendChild(carte.el);
      titre.textContent = etageNom(etageId);
      return carte;
    }
    /* La fin : Éguilles épinglée, et l'adresse dans l'univers, lue en entier. */
    function montrerFin() {
      deroule++;
      minuteurs.forEach(clearTimeout);
      minuteurs = [];
      KR.taire();
      if (!carte || carte.etageId !== 'bdr') montrer('bdr');
      carte.effacer();
      carte.surbrillance('eguilles', 'juste');
      carte.epingle('eguilles');
      carte.etiquette('eguilles', 'Éguilles');
      titre.textContent = 'Éguilles';
      const fin = document.createElement('div');
      fin.className = 'z-voyage-fin';
      fin.innerHTML = `${'<div class="retour-masc">' + KR.medaillon('fete') + KR.mascotte('fete', 'rebondit')}<div class="bulles">
        <div class="bulle parle">${KR.echapper(t('zoom_voyage_fin'))}</div><div class="bulle astuce z-adresse" lang="fr">${KR.echapper(C.ADRESSE)}</div></div></div>
        <button type="button" class="btn btn-primaire" data-a="suite">${t(premier ? 'commencer' : 'zoom_mon_voyage')}${KR.icone('suite')}</button>`;
      zone.appendChild(fin);
      const passer = app.querySelector('[data-a="passer"]');
      if (passer) passer.closest('.nav').classList.add('cache');
      KR.son('fete');
      dire([C.ADRESSE], 15000);
    }
    async function derouler() {
      const d = deroule;
      for (let i = 0; i < C.ETAGES.length; i++) {
        if (!vivant(d)) return;
        const e = C.ETAGES[i];
        const c = montrer(e.id);
        if (i > 0 && mouvement()) c.el.classList.add('z-arrive');
        await dire([e.dit], 6000);
        if (!vivant(d)) return;
        if (i === C.ETAGES.length - 1) return montrerFin();
        const foyer = FOYER[e.id];
        c.surbrillance(foyer, 'question');
        c.etiquette(foyer, C.lieu(foyer).nom);
        await attendre(900);
        if (!vivant(d)) return;
        await c.zoomVers(K[e.id].foyer, 1100);
      }
    }
    brancher({ retour: accueilOuPortail, passer: montrerFin, suite: () => suite() });
    derouler();
  }
  function accueilOuPortail() {
    if (etat.intro) accueil(); else location.href = './';
  }

  /* =================== Explorer une étape : toucher un lieu pour entendre son nom =================== */
  function explorer(etageId, depuisFoyer) {
    etat = Z.charger(enfant);
    const rang = rangEtage(etageId);
    const e = C.ETAGES[rang];
    changerEcran(`<div class="ecran ecran-fixe z-explorer">
      <header class="barre">${nav('retour', 'retour', 'retour')}
        <div class="titre"><h1 class="titre-ecran" lang="fr">${KR.echapper(e.nom)}</h1><p class="indice">${t('zoom_touche_lieu')}</p></div>
        ${nav('ecouter', 'son', 'ecouter')}</header>
      <div class="corps">
        <section class="zone"></section>
        <section class="action z-panneau">
          <div class="z-zooms">
            <button type="button" class="btn btn-secondaire" data-a="eloigner"${rang === 0 ? ' disabled' : ''}>${KR.icone('moins')}${t('zoom_eloigner')}</button>
            <button type="button" class="btn btn-secondaire" data-a="rapprocher"${rang === C.ETAGES.length - 1 ? ' disabled' : ''}>${KR.icone('plus')}${t('zoom_rapprocher')}</button>
          </div>
          <div class="z-choisi" aria-live="polite"><p class="z-vide">${t('zoom_touche_lieu')}</p></div>
          <div class="z-puces" lang="fr"></div>
          <p class="z-credits" lang="fr">${KR.echapper(CREDITS)}</p>
        </section>
      </div>
    </div>`);
    const carte = creerCarte(etageId);
    app.querySelector('.zone').appendChild(carte.el);
    carte.couleurs(etat);
    if (depuisFoyer) carte.zoomVers(null, 900, depuisFoyer);
    const lieux = e.lieux;
    const puces = lieux.map(l => {
      const plus = l.niveaux[enfant] !== 'o';
      const c = Z.couleur(etat, l.id);
      return `<button type="button" class="z-puce m-${c}${plus ? ' en-plus' : ''}" data-a="lieu" data-lieu="${l.id}">${KR.echapper(C.affiche(l))}${plus ? `<span class="z-tag" lang="${KR.reglages().langue}">${t('zoom_en_plus')}</span>` : ''}</button>`;
    }).join('');
    app.querySelector('.z-puces').innerHTML = puces;
    let choisi = null;
    function choisir(id) {
      if (!id) return;
      choisi = id;
      const L = C.lieu(id);
      carte.effacer();
      carte.surbrillance(id, 'explore');
      carte.etiquette(id, C.affiche(L));
      app.querySelectorAll('.z-puce').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lieu === id)));
      app.querySelector('.z-choisi').innerHTML = `<div class="bulle astuce" lang="fr"><b class="z-nom">${KR.echapper(C.majuscule(C.affiche(L)))}</b>${KR.echapper(L.info || L.indice)}</div>`;
      dire([C.PHRASES.cest(L), L.info || L.indice]);
    }
    carte.surToucher(p => choisir(G.lieuSous(carte.etage, carte.ids, p.x, p.y, p.echelle)));
    async function rapprocher() {
      if (rang >= C.ETAGES.length - 1) return;
      const foyer = carte.foyer();
      await carte.zoomVers(foyer, 800);
      explorer(C.ETAGES[rang + 1].id);
    }
    function eloigner() {
      if (rang <= 0) return;
      const avant = C.ETAGES[rang - 1].id;
      explorer(avant, K[avant].foyer);
    }
    brancher({
      retour: accueil,
      lieu: b => choisir(b.dataset.lieu),
      rapprocher,
      eloigner,
      ecouter: () => (choisi ? dire([C.PHRASES.cest(C.lieu(choisi)), C.lieu(choisi).info || C.lieu(choisi).indice]) : dire([e.dit, e.astuce])),
    });
  }

  /* =================== Séance =================== */
  const CONSIGNE_DECOUVERTE = 'Touche ce lieu sur la carte.';
  const CONSIGNE_RETOUCHE = 'À toi : touche ce lieu sur la carte.';
  const CONSIGNE_BON_NOM = 'À toi : touche le bon nom.';

  function demarrerSeance() {
    etat = Z.charger(enfant);
    Z.majEtages(etat, PROG);
    const s = Z.creerSeance(etat, PROG, new Date());
    const resultats = [];
    let q = null;
    let carte = null;
    let phase = 'question';
    let debutQ = 0;
    let numero = 0;
    let bloque = false;
    let choixCourant = [];
    const repere = () => `Le repère de ${KR.nomMascotte()}`;
    const precharger = l => { if (voixActive()) KR.prechargerVoix(l.filter(Boolean).flatMap(x => { const L = C.lieu(x.lieu); return [{ texte: C.PHRASES.toucher(L), langue: 'fr' }, { texte: C.PHRASES.cest(L), langue: 'fr' }]; })); };
    precharger(s.questions.slice(0, 3));

    changerEcran(`<div class="ecran ecran-fixe exo z-seance">
      <header class="barre">${nav('retour', 'retour', 'retour')}
        <div class="avance" role="progressbar" aria-valuemin="0"><div class="points-av"></div><span class="compte"></span></div>
        ${nav('ecouter', 'son', 'ecouter')}</header>
      <div class="corps"><section class="zone"></section><section class="action z-panneau"></section></div>
    </div>`);
    const zone = app.querySelector('.zone');
    const action = app.querySelector('.action');

    function majAvance() {
      let h = '';
      for (let k = 0; k < s.questions.length; k++) {
        const x = s.questions[k];
        if (x.retour || x.type === 'decouverte') continue;
        if (resultats[k]) h += `<i class="pt ${resultats[k] === 'j' ? 'juste' : 'revu'}"></i>`;
        else if (k === s.index && phase !== 'juste') h += '<i class="pt ici"></i>';
        else h += '<i class="pt"></i>';
      }
      const av = app.querySelector('.avance');
      av.querySelector('.points-av').innerHTML = h;
      const { n, total } = Z.avancement(s);
      av.querySelector('.compte').textContent = t('avancement', { n, total });
      av.setAttribute('aria-valuenow', n);
      av.setAttribute('aria-valuemax', total);
      av.setAttribute('aria-label', t('avancement', { n, total }));
    }

    async function poserCarte(etageId) {
      if (carte && carte.etageId === etageId) { carte.effacer(); return; }
      if (carte && mouvement() && rangEtage(etageId) === rangEtage(carte.etageId) + 1) {
        const ici = numero;
        bloque = true;
        await carte.zoomVers(carte.foyer(), 700);
        bloque = false;
        if (ici !== numero) return;
      }
      carte = creerCarte(etageId);
      carte.el.insertAdjacentHTML('beforeend', `<span class="z-tag-etape" lang="fr">${KR.echapper(etageNom(etageId))}</span>`);
      zone.innerHTML = '';
      zone.appendChild(carte.el);
      carte.surToucher(touche);
    }

    async function question() {
      q = Z.courante(s);
      numero++;
      const ici = numero;
      phase = q.type === 'decouverte' ? 'decouverte' : 'question';
      precharger([s.questions[s.index + 3]]);
      majAvance();
      action.innerHTML = '';
      ['lieu', 'type', 'etage'].forEach(k => zone.removeAttribute('data-' + k));
      await poserCarte(q.etage);
      if (ici !== numero) return;
      const L = C.lieu(q.lieu);
      Object.assign(zone.dataset, { lieu: q.lieu, type: q.type, etage: q.etage }); // lu par test_parcours.py
      if (q.type === 'decouverte') {
        carte.surbrillance(q.lieu, 'aide');
        carte.epingle(q.lieu);
        carte.etiquette(q.lieu, C.affiche(L));
        action.innerHTML = `<div class="carte-q z-consigne" lang="fr"><span class="pastille z-nouveau" lang="${KR.reglages().langue}">${KR.icone('etoile')}${t('zoom_nouveau')}</span>
          <p class="z-petit">Voici</p><p class="z-grand">${KR.echapper(C.affiche(L))}</p><p class="consigne">${CONSIGNE_DECOUVERTE}</p></div>`;
        dire([C.PHRASES.voici(L), C.PHRASES.toucher(L)]);
      } else if (q.type === 'toucher') {
        action.innerHTML = `<div class="carte-q z-consigne" lang="fr"><p class="z-petit">Touche</p><p class="z-grand">${KR.echapper(C.affiche(L))}</p></div>
          <button type="button" class="btn btn-calme z-montre" data-a="montre">${t('zoom_montre')}</button>`;
        dire([C.PHRASES.toucher(L)]);
      } else {
        carte.surbrillance(q.lieu, 'question');
        choixCourant = Z.choix(PROG, q.lieu, NB_CHOIX, Z.jour(new Date()) + q.lieu + s.index);
        action.innerHTML = `<div class="carte-q z-consigne" lang="fr"><p class="z-moyen">${KR.echapper(C.QUESTION_NOMMER)}</p></div>
          <div class="z-choix" lang="fr">${choixCourant.map(id => `<button type="button" class="btn btn-secondaire" data-a="nom" data-lieu="${id}">${KR.echapper(C.affiche(C.lieu(id)))}</button>`).join('')}</div>`;
        dire([C.QUESTION_NOMMER]);
      }
      debutQ = performance.now();
    }

    function touche(p) {
      if (bloque || !q) return;
      const ok = G.toucheJuste(carte.etage, q.lieu, carte.ids, p.x, p.y, p.echelle);
      if (phase === 'decouverte') {
        if (!ok) { KR.son('doux'); return; }
        Z.repondre(s, etat, true, new Date());
        sauver();
        return montrerJuste(true, true);
      }
      if (q.type !== 'toucher') return;
      if (phase === 'question') return ok ? repondre(true) : repondre(false);
      if (phase === 'aide') {
        if (!ok) { KR.son('doux'); return; }
        return montrerJuste(true, true);
      }
    }

    function repondre(juste) {
      const ms = performance.now() - debutQ;
      Z.repondre(s, etat, juste, new Date());
      sauver();
      resultats[s.index] = juste ? 'j' : 'r';
      if (juste) return montrerJuste(ms <= Z.RAPIDE_MS, false);
      montrerAide();
    }

    function retourMascotte(attitude, bulles) {
      return `<div class="retour-masc${attitude === 'fete' ? ' fete' : ''}">${KR.medaillon(attitude)}${KR.mascotte(attitude, attitude === 'fete' ? 'rebondit' : '')}<div class="bulles">${bulles}</div></div>`;
    }

    /* Juste (D-11 bis) : rapide, on enchaîne ; hésitant, la voix dit le nom avant de laisser avancer.
       Après une aide, la retouche ne redit rien : le nom vient d'être dit. */
    function montrerJuste(rapide, sansVoix) {
      phase = 'juste';
      majAvance();
      KR.son('juste');
      const L = C.lieu(q.lieu);
      carte.effacer();
      carte.surbrillance(q.lieu, 'juste');
      carte.etiquette(q.lieu, C.affiche(L));
      const choix = action.querySelector('.z-choix');
      if (choix) choix.querySelectorAll('button').forEach(b => { b.disabled = true; if (b.dataset.lieu === q.lieu) b.classList.add('z-bon'); });
      const garde = choix ? choix.outerHTML : '';
      action.innerHTML = `${garde}${retourMascotte('fete', `<div class="bulle parle">${t('bravo')}</div>`)}
        <button type="button" class="btn btn-primaire z-suite" data-a="suite" disabled>${t('suite')}${KR.icone('suite')}<span class="z-jauge"><i></i></span></button>`;
      const ici = numero;
      const lancer = () => {
        if (ici !== numero) return;
        const b = action.querySelector('.z-suite');
        b.disabled = false;
        const i = b.querySelector('.z-jauge i');
        if (mouvement()) { void i.offsetWidth; i.style.transition = `width ${DUREE_SUITE}ms linear`; }
        i.style.width = '100%';
        plusTard(() => { if (ici === numero && phase === 'juste') suivante(); }, DUREE_SUITE);
      };
      if (rapide || sansVoix || !voixActive()) return lancer();
      dire([C.PHRASES.cest(L)]).then(lancer);
    }

    /* Erreur : ni rouge ni croix ; le bon lieu surligné, une épingle et le repère, la voix dit le
       nom en entier, puis l'enfant retouche le lieu (ou le bon nom). */
    function montrerAide(mauvais) {
      phase = 'aide';
      majAvance();
      KR.son('doux');
      const L = C.lieu(q.lieu);
      carte.effacer();
      carte.surbrillance(q.lieu, 'aide');
      carte.epingle(q.lieu);
      carte.etiquette(q.lieu, C.affiche(L));
      const bulles = `<div class="bulle parle">${t('presque')} ${t('on_regarde')}</div>
        <div class="bulle astuce" lang="fr"><div class="etiq">${KR.icone('ampoule')}${KR.echapper(repere())}</div>${KR.echapper(L.indice)}</div>`;
      if (q.type === 'nommer') {
        const choix = action.querySelector('.z-choix');
        choix.querySelectorAll('button').forEach(b => {
          if (b.dataset.lieu === q.lieu) b.classList.add('z-a-toucher');
          else if (b.dataset.lieu === mauvais) b.classList.add('z-ecarte');
        });
        action.innerHTML = `${retourMascotte('aide', bulles)}<p class="consigne" lang="fr">${CONSIGNE_BON_NOM}</p>${choix.outerHTML}`;
      } else {
        action.innerHTML = `${retourMascotte('aide', bulles)}<p class="consigne" lang="fr">${CONSIGNE_RETOUCHE}</p>`;
      }
      bloque = voixActive();
      const ici = numero;
      dire([C.PHRASES.voici(L), L.indice]).then(() => { if (ici === numero) bloque = false; });
    }

    function suivante() {
      minuteurs.forEach(clearTimeout);
      minuteurs = [];
      Z.suivante(s);
      if (Z.finie(s)) return fin(s);
      question();
    }

    function confirmerArret() {
      if (document.querySelector('.voile')) return;
      const voile = document.createElement('div');
      voile.className = 'voile';
      voile.innerHTML = `<div class="feuille feuille-arret" role="dialog" aria-modal="true" aria-labelledby="arret-titre">
        <h2 id="arret-titre">${t('arreter_question')}</h2>
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
      voile.querySelector('[data-arret="non"]').focus();
    }

    brancher({
      retour: confirmerArret,
      montre: () => { if (phase === 'question' && !bloque) repondre(false); },
      nom: b => {
        if (bloque) return;
        const bon = b.dataset.lieu === q.lieu;
        if (phase === 'question') {
          if (bon) return repondre(true);
          Z.repondre(s, etat, false, new Date());
          sauver();
          resultats[s.index] = 'r';
          return montrerAide(b.dataset.lieu);
        }
        if (phase === 'aide') {
          if (bon) return montrerJuste(true, true);
          KR.son('doux');
        }
      },
      suite: () => { if (phase === 'juste') suivante(); },
      ecouter: () => {
        const L = C.lieu(q.lieu);
        if (phase === 'aide') dire([C.PHRASES.voici(L), L.indice]);
        else if (phase === 'juste') dire([C.PHRASES.cest(L)]);
        else if (phase === 'decouverte') dire([C.PHRASES.voici(L), C.PHRASES.toucher(L)]);
        else if (q.type === 'nommer') dire([C.QUESTION_NOMMER]);
        else dire([C.PHRASES.toucher(L)]);
      },
    });
    question();
  }

  /* =================== Fin de séance =================== */
  function fin(s) {
    const b = Z.bilan(s, etat, PROG, new Date());
    sauver();
    publier();
    KR.son('fete');
    const vus = new Set();
    const montees = b.montees.filter(m => { if (vus.has(m.lieu)) return false; vus.add(m.lieu); return true; });
    const montrees = montees.length > 4 ? montees.slice(0, 3) : montees;
    const NOM = { bronze: 'etat_bronze', argent: 'etat_argent', or: 'etat_or_court' };
    const jetons = montrees.map(m => `<div class="jeton z-jeton m-${m.couleur}"><b lang="fr">${KR.echapper(C.majuscule(C.lieu(m.lieu).nom))}</b><span>${t(NOM[m.couleur])}</span></div>`).join('')
      + (montees.length > montrees.length ? `<div class="jeton z-jeton jeton-plus"><b>+${montees.length - montrees.length}</b></div>` : '');
    const titre = montees.length === 1 ? t('zoom_lieu_monte') : t('zoom_lieux_montent', { n: montees.length });
    const demain = b.demain ? t('zoom_demain', { lieu: `<b lang="fr">${KR.echapper(C.lieu(b.demain).nom)}</b>` }) : t('demain_simple');
    const etape = b.nouvelEtage ? `<p class="z-nouvelle-etape">${KR.icone('etoile')}<span>${t('zoom_etape_ouverte')} <b lang="fr">${KR.echapper(etageNom(b.nouvelEtage))}</b></span></p>` : '';
    changerEcran(`<div class="ecran fin-seance z-fin">
      <div class="fin-masc">${KR.mascotte('fete', 'rebondit')}<p class="fin-nb">${t('questions_n', { n: b.reponses })}</p></div>
      <div class="fin-contenu">
        <h1>${KR.echapper(t('bravo_prenom', { prenom: KR.prenom() }))}</h1>
        ${etape}
        ${montees.length ? `<div class="montee"><p class="titre">${KR.icone('monte')}${titre}</p><div class="jetons">${jetons}</div></div>`
          : `<div class="montee"><p class="titre">${KR.icone('ok')}${t('reponses_n', { n: b.reponses })}</p></div>`}
        <div class="ligne-fin">${KR.semaine(b.semaine)}<p class="jours-n">${KR.joursFaits(b.semaine)}</p></div>
        <p class="demain">${KR.icone('cal')}<span>${demain}</span></p>
        <div class="actions-fin">
          <button type="button" class="btn btn-secondaire" data-a="voyage">${t('zoom_mon_voyage')}</button>
          <a class="btn btn-primaire" href="./">${t('fini')}</a>
        </div>
      </div>
    </div>`);
    brancher({ voyage: accueil });
  }

  accueil();
})();
