/* Prototype 3D du module des hélicoptères (D-26) : un vol d'Écureuil qu'Henri pilote, en cinq missions.
   Page henri/helicopteres-3d.html, hors du catalogue ; la version 2D reste le module en service.
   Rendu par Three.js 0.170.0 (commun/vendor/three/, licence MIT), sans post-traitement : une seule lumière
   à ombre, résolution plafonnée et abaissée si l'appareil peine. Le modèle de vol, les missions et le
   carnet sont dans vol.js (logique pure, testée) ; les phrases dans contenu.js (VOL3D), les dessins des
   tampons dans dessins.js. L'état reste celui du module : <enfant>.helicopteres, champ facultatif vol3d. */
import * as THREE from 'three';

const KR = window.KR;
const H = window.Helico;
const HC = window.HeliContenu;
const V = window.HeliVol;
const D = window.HeliDessins;
const T = HC.VOL3D;

KR.demarrer();
const enfant = KR.enfant();
let etat = H.charger(enfant);
const app = document.getElementById('app');
const esc = KR.echapper;
const lg = () => (etat.langue === 'en' ? 'en' : 'fr');
const ch = o => HC.champ(o, lg());
const ui = cle => HC.UI[lg()][cle];
const sauver = () => H.sauver(enfant, etat);
const params = new URLSearchParams(location.search);
const MOUVEMENT = !KR.mouvementReduit();
const COUL = { collectif: '#1E73C8', manche: '#8340A8', pedales: '#C4600F' };
const LIEUX = { H: { x: 0, z: 0 }, tour: { x: 12, z: -80 } };
const TOUR = { x: LIEUX.tour.x + 9, z: LIEUX.tour.z - 6 }; // la tour elle-même, un peu à côté de sa zone d'appel

const teinteMission = () => {
  const m = HC.MISSIONS.find(x => x.id === etat.mission);
  const c = HC.COULEURS[etat.couleur] || HC.COULEURS[m ? m.couleur : 'jaune'];
  return c.teinte;
};
const nomCmd = id => {
  const c = HC.commande(id);
  const autre = lg() === 'fr' ? 'en' : 'fr';
  return `<span class="v-nom-cmd"><b lang="${lg()}">${esc(ch(c.nom))}</b><span lang="${autre}">${esc(HC.champ(c.nom, autre))}</span></span>`;
};

/* ============================ Voix et bulles de Moussi ============================ */
let tempsSim = 0;
let occupeJusqu = 0;
const dureeDite = texte => 1.2 + texte.length * 0.062;
/* Les phrases passent en file : la suivante attend la fin de la précédente au lieu de la couper
   (retour de Louis et Henri du 07/11/2026). La bulle s'affiche au moment où sa phrase commence.
   Au plus deux phrases en attente : au-delà, la plus ancienne en attente saute. */
const fileVoix = [];
let voixEnCours = false;
function phraseSuivante() {
  const p = fileVoix.shift();
  if (!p) { voixEnCours = false; return; }
  voixEnCours = true;
  hud.bulle(p.texte, p.attitude, p.radio);
  KR.lireSuite([{ texte: p.texte, langue: lg() }], 15000).then(phraseSuivante, phraseSuivante);
}
function dire(texte, attitude, o) {
  o = o || {};
  if (!texte) return;
  if (o.siLibre && (tempsSim < occupeJusqu || voixEnCours || fileVoix.length)) return false;
  occupeJusqu = tempsSim + dureeDite(texte);
  const p = { texte, attitude: attitude || 'attend', radio: o.radio };
  if (!KR.reglages().voix) { hud.bulle(p.texte, p.attitude, p.radio); return true; }
  fileVoix.push(p);
  while (fileVoix.length > 2) fileVoix.shift();
  if (!voixEnCours) phraseSuivante();
  return true;
}
const direObj = (o, attitude, opt) => dire(ch(o), attitude, opt);

/* ============================ Événements planifiés (temps simulé) ============================ */
let planning = [];
const planifier = (delai, fn) => planning.push({ t: tempsSim + delai, fn });
function deroulerPlanning() {
  const prets = planning.filter(p => p.t <= tempsSim);
  planning = planning.filter(p => p.t > tempsSim);
  prets.forEach(p => p.fn());
}

/* ============================ Le son du rotor (Web Audio) ============================
   Un bruit filtré, modulé au passage des trois pales (trois fois les tours par seconde), et le sifflement
   de la turbine. Le collectif change la charge (le claquement, le grave), jamais la cadence : le rotor
   garde sa vitesse. Démarré au premier toucher. */
const Son = {
  ctx: null,
  pret: false,
  init() {
    if (this.ctx || !KR.reglages().sons) return;
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return;
    try { this.ctx = new C(); } catch (e) { return; }
    const c = this.ctx;
    const longueur = c.sampleRate * 2;
    const tampon = c.createBuffer(1, longueur, c.sampleRate);
    const d = tampon.getChannelData(0);
    let b = 0;
    for (let i = 0; i < longueur; i++) { b = 0.97 * b + 0.03 * (Math.random() * 2 - 1); d[i] = b * 6; }
    const bruit = c.createBufferSource();
    bruit.buffer = tampon;
    bruit.loop = true;
    this.filtre = c.createBiquadFilter();
    this.filtre.type = 'lowpass';
    this.filtre.frequency.value = 500;
    this.pale = c.createGain(); // modulé au rythme des pales
    this.pale.gain.value = 0;
    this.lfo = c.createOscillator();
    this.lfo.type = 'sine';
    this.lfo.frequency.value = 0.01;
    this.profondeur = c.createGain();
    this.profondeur.gain.value = 0;
    this.lfo.connect(this.profondeur);
    this.profondeur.connect(this.pale.gain);
    this.base = c.createConstantSource ? c.createConstantSource() : null;
    if (this.base) { this.base.offset.value = 0; this.base.connect(this.pale.gain); this.base.start(); }
    bruit.connect(this.filtre);
    this.filtre.connect(this.pale);
    this.turbine = c.createOscillator();
    this.turbine.type = 'triangle';
    this.turbine.frequency.value = 200;
    this.turbineGain = c.createGain();
    this.turbineGain.gain.value = 0;
    this.turbine.connect(this.turbineGain);
    this.maitre = c.createGain();
    this.maitre.gain.value = 0.55;
    this.pale.connect(this.maitre);
    this.turbineGain.connect(this.maitre);
    this.maitre.connect(c.destination);
    bruit.start();
    this.lfo.start();
    this.turbine.start();
    this.pret = true;
  },
  reveiller() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); },
  maj(v, charge) {
    if (!this.pret) return;
    const f = V.fractionRotor(v);
    const t = this.ctx.currentTime;
    const cadence = Math.max(0.01, 3 * v.rotor.tours / 60); // passages de pales par seconde
    this.lfo.frequency.setTargetAtTime(cadence, t, 0.05);
    const k = Math.max(0, Math.min(1.4, charge));
    const niveau = f * f * (0.16 + 0.22 * k);
    if (this.base) this.base.offset.setTargetAtTime(niveau, t, 0.1);
    this.profondeur.gain.setTargetAtTime(niveau * (0.55 + 0.4 * k), t, 0.1);
    this.filtre.frequency.setTargetAtTime(260 + 520 * k * f + 120 * f, t, 0.15);
    this.turbine.frequency.setTargetAtTime(90 + 520 * f, t, 0.2);
    this.turbineGain.gain.setTargetAtTime(0.025 * f, t, 0.2);
  },
};

/* ============================ Le terrain ============================ */
const lisse = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
function hauteurSol(x, z) {
  const r = Math.hypot(x - 6, z + 38);
  const m = lisse(85, 230, r);
  if (m <= 0) return 0;
  const h = 15 * Math.sin(x * 0.011 + 0.5) * Math.cos(z * 0.009) + 7 * Math.sin((x - z) * 0.023) + 3 * Math.sin(x * 0.05 + z * 0.031) + 13;
  return m * Math.max(0, h);
}

/* ============================ La scène ============================ */
let renderer;
let rendu = null;
const srgb = hex => new THREE.Vector3(((hex >> 16) & 255) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255);
const CIEL = { haut: 0x4E9BE0, horizon: 0xCFE5F2, bas: 0xE6DCC6 };
const SOLEIL = new THREE.Vector3(-0.45, 0.62, 0.38).normalize();

function webglDisponible() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch (e) { return false; }
}

function materiauCiel(rayonFog) {
  return new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { haut: { value: srgb(CIEL.haut) }, horizon: { value: srgb(CIEL.horizon) }, bas: { value: srgb(CIEL.bas) }, soleil: { value: SOLEIL }, fort: { value: rayonFog ? 0 : 1 } },
    vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); vec4 p = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * p; gl_Position.z = gl_Position.w; }',
    fragmentShader: `uniform vec3 haut; uniform vec3 horizon; uniform vec3 bas; uniform vec3 soleil; uniform float fort; varying vec3 vDir;
      void main(){ vec3 d = normalize(vDir); float y = d.y;
        vec3 c = y > 0.0 ? mix(horizon, haut, pow(min(1.0, y * 1.25), 0.6)) : mix(horizon, bas, min(1.0, -y * 6.0));
        float s = max(dot(d, soleil), 0.0);
        c += vec3(1.0, 0.92, 0.75) * (pow(s, 900.0) * 1.4 * fort + pow(s, 12.0) * 0.16);
        gl_FragColor = vec4(c, 1.0); }`,
  });
}

function construireScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(CIEL.horizon);
  scene.fog = new THREE.Fog(CIEL.horizon, 220, 1050);
  const camera = new THREE.PerspectiveCamera(55, 1, 0.5, 4000);

  // Le ciel, et un reflet d'environnement calculé une fois (vitres et peinture qui brillent).
  const ciel = new THREE.Mesh(new THREE.SphereGeometry(3000, 32, 16), materiauCiel(false));
  ciel.frustumCulled = false;
  ciel.renderOrder = -1;
  scene.add(ciel);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  envScene.add(new THREE.Mesh(new THREE.SphereGeometry(50, 32, 16), materiauCiel(true)));
  scene.environment = pmrem.fromScene(envScene, 0.02).texture;
  pmrem.dispose();

  // La lumière : le ciel et le sol, et le soleil, seule lumière à ombre, qui suit l'hélicoptère.
  scene.add(new THREE.HemisphereLight(0xD6ECFF, 0x9C8A62, 1.9));
  const soleil = new THREE.DirectionalLight(0xFFF0D8, 2.6);
  soleil.castShadow = true;
  soleil.shadow.mapSize.set(1024, 1024);
  const sc = soleil.shadow.camera;
  sc.left = -18; sc.right = 18; sc.top = 18; sc.bottom = -18; sc.near = 1; sc.far = 160;
  soleil.shadow.bias = -0.0006;
  soleil.shadow.normalBias = 0.03;
  scene.add(soleil);
  scene.add(soleil.target);

  scene.add(construireTerrain());
  scene.add(construireMontagnes());
  const terrain = construireTerrainDecor();
  scene.add(terrain.groupe);
  const nuages = construireNuages();
  scene.add(nuages);
  return { scene, camera, soleil, nuages, ...terrain };
}

/* Le sol : des collines de garrigue autour d'un terrain plat, couleurs par sommet (pas de texture). */
function construireTerrain() {
  const taille = 1800;
  const n = 140;
  const geo = new THREE.PlaneGeometry(taille, taille, n, n);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const couleurs = new Float32Array(pos.count * 3);
  const c = new THREE.Color();
  const herbe = new THREE.Color(0x9DB45E);
  const garrigue = new THREE.Color(0x6F8C45);
  const ocre = new THREE.Color(0xCDAE74);
  const calcaire = new THREE.Color(0xD8CFB4);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const h = hauteurSol(x, z);
    pos.setY(i, h);
    const n1 = 0.5 + 0.5 * Math.sin(x * 0.07 + Math.cos(z * 0.05) * 2) * Math.cos(z * 0.06 - x * 0.02);
    const n2 = 0.5 + 0.5 * Math.sin(x * 0.21 + z * 0.17);
    c.copy(herbe).lerp(garrigue, n1 * 0.8);
    c.lerp(ocre, Math.max(0, n2 - 0.55) * 1.4);
    c.lerp(calcaire, lisse(18, 34, h) * 0.6);
    couleurs.set([c.r, c.g, c.b], i * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(couleurs, 3));
  geo.computeVertexNormals();
  const sol = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true }));
  sol.receiveShadow = true;
  return sol;
}

/* La montagne au loin : une longue crête calcaire, qui se dresse en proue à l'ouest ; puis une chaîne bleutée. */
function crete(largeur, hauteur, profil, profondeur, couleur, z, x) {
  const forme = new THREE.Shape();
  const pas = 80;
  forme.moveTo(-largeur / 2, -20);
  for (let i = 0; i <= pas; i++) {
    const u = i / pas;
    forme.lineTo(-largeur / 2 + u * largeur, profil(u) * hauteur);
  }
  forme.lineTo(largeur / 2, -20);
  forme.lineTo(-largeur / 2, -20);
  const geo = new THREE.ExtrudeGeometry(forme, { depth: profondeur, bevelEnabled: false, steps: 1 });
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: couleur, fog: false }));
  m.position.set(x, 0, z);
  return m;
}
function construireMontagnes() {
  const g = new THREE.Group();
  const bruit = u => 0.025 * Math.sin(u * 61) + 0.018 * Math.sin(u * 137 + 1) + 0.01 * Math.sin(u * 290);
  const victoire = u => {
    let h;
    if (u < 0.12) h = Math.pow(u / 0.12, 1.6) * 0.92;
    else if (u < 0.18) h = 0.92 + (u - 0.12) / 0.06 * 0.08;
    else if (u < 0.72) h = 1 - (u - 0.18) * 0.3 + 0.04 * Math.sin(u * 22);
    else h = (0.84 - (u - 0.72) * 0.35) * Math.pow(Math.max(0, 1 - (u - 0.72) / 0.28), 0.7);
    return Math.max(0, h + bruit(u) * (u > 0.05 && u < 0.95 ? 1 : 0));
  };
  g.add(crete(1300, 270, u => Math.max(0, 0.45 + 0.18 * Math.sin(u * 9) + 0.1 * Math.sin(u * 23) + bruit(u)) * lisse(0, 0.15, u) * lisse(1, 0.85, u), 40, 0xA9BCD4, -1700, 250));
  g.add(crete(1150, 300, victoire, 60, 0xC9CCD8, -1350, -180));
  // Une ceinture de collines basses tout autour, pour fermer l'horizon.
  for (let i = 0; i < 7; i++) {
    const a = i / 7 * Math.PI * 2 + 0.6;
    const m = crete(900, 70 + 30 * Math.sin(i * 3), u => Math.max(0, 0.6 + 0.3 * Math.sin(u * 7 + i) + bruit(u)) * lisse(0, 0.2, u) * lisse(1, 0.8, u), 30, 0xB4C5B6, 0, 0);
    m.position.set(Math.sin(a) * 1500, 0, Math.cos(a) * 1500);
    m.rotation.y = a + Math.PI;
    if (Math.cos(a) < -0.6) continue; // pas devant la montagne
    g.add(m);
  }
  return g;
}

/* Le décor : hélisurface, tour de contrôle, manche à air, pins parasols, cyprès, garrigue, lavande, un mas. */
function construireTerrainDecor() {
  const groupe = new THREE.Group();
  const std = (couleur, o) => new THREE.MeshStandardMaterial(Object.assign({ color: couleur, roughness: 0.85, metalness: 0 }, o || {}));
  const lam = couleur => new THREE.MeshLambertMaterial({ color: couleur });

  // L'hélisurface : une dalle claire, le cercle et le H peints, des balises dorées.
  const dalle = new THREE.Mesh(new THREE.BoxGeometry(26, 0.3, 26), std(0xC9C3B6));
  dalle.position.y = -0.1;
  dalle.receiveShadow = true;
  groupe.add(dalle);
  const toile = document.createElement('canvas');
  toile.width = toile.height = 512;
  const x = toile.getContext('2d');
  x.fillStyle = '#5F646B';
  x.beginPath(); x.arc(256, 256, 250, 0, Math.PI * 2); x.fill();
  x.strokeStyle = '#F4F1E8'; x.lineWidth = 18;
  x.beginPath(); x.arc(256, 256, 205, 0, Math.PI * 2); x.stroke();
  x.fillStyle = '#F4F1E8';
  x.fillRect(160, 130, 52, 252); x.fillRect(300, 130, 52, 252); x.fillRect(205, 228, 100, 52);
  const tex = new THREE.CanvasTexture(toile);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const marque = new THREE.Mesh(new THREE.CircleGeometry(10, 64), new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.9 }));
  marque.rotation.x = -Math.PI / 2;
  marque.position.y = 0.07;
  marque.receiveShadow = true;
  groupe.add(marque);
  const balise = new THREE.SphereGeometry(0.28, 12, 8);
  const balMat = new THREE.MeshStandardMaterial({ color: 0xFFD54A, emissive: 0xFFB300, emissiveIntensity: 0.6 });
  for (let i = 0; i < 10; i++) {
    const a = i / 10 * Math.PI * 2;
    const b = new THREE.Mesh(balise, balMat);
    b.position.set(Math.cos(a) * 11.6, 0.25, Math.sin(a) * 11.6);
    groupe.add(b);
  }
  // Un chemin de terre battue vers la tour.
  const chemin = new THREE.Mesh(new THREE.PlaneGeometry(5, 70), lam(0xD7C29A));
  chemin.rotation.x = -Math.PI / 2;
  chemin.rotation.z = -0.2;
  chemin.position.set(9, 0.03, -46);
  chemin.receiveShadow = true;
  groupe.add(chemin);

  // La tour de contrôle : un fût clair, une vigie vitrée, un toit, une antenne.
  const tour = new THREE.Group();
  const blanc = std(0xF1ECE2, { roughness: 0.7 });
  const base = new THREE.Mesh(new THREE.BoxGeometry(10, 4.5, 8), std(0xE7DCC8));
  base.position.y = 2.25;
  const toitBase = new THREE.Mesh(new THREE.BoxGeometry(10.6, 0.5, 8.6), std(0xB86F45));
  toitBase.position.y = 4.7;
  const fut = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.6, 15, 20), blanc);
  fut.position.y = 7.5;
  const balcon = new THREE.Mesh(new THREE.CylinderGeometry(4.6, 4.6, 0.5, 24), blanc);
  balcon.position.y = 15.2;
  const vitre = new THREE.Mesh(new THREE.CylinderGeometry(4.3, 3.6, 3.4, 8, 1, true), new THREE.MeshStandardMaterial({ color: 0x1F5E73, roughness: 0.08, metalness: 0.4, envMapIntensity: 1.6 }));
  vitre.position.y = 17.1;
  const toit = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 4.8, 1.2, 8), std(0x4A5866));
  toit.position.y = 19.4;
  const antenne = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 4, 6), std(0x8B9097));
  antenne.position.y = 21.8;
  const feu = new THREE.Mesh(new THREE.SphereGeometry(0.25, 10, 8), new THREE.MeshBasicMaterial({ color: 0xFFC94A }));
  feu.position.y = 23.9;
  [base, toitBase, fut, balcon, vitre, toit, antenne, feu].forEach(m => { m.castShadow = true; m.receiveShadow = true; tour.add(m); });
  tour.position.set(TOUR.x, 0, TOUR.z);
  groupe.add(tour);

  // La manche à air, orange et blanche, qui ondule.
  const toileManche = document.createElement('canvas');
  toileManche.width = 128; toileManche.height = 16;
  const xm = toileManche.getContext('2d');
  for (let i = 0; i < 5; i++) { xm.fillStyle = i % 2 ? '#F7F3EA' : '#F08A24'; xm.fillRect(i * 25.6, 0, 25.6, 16); }
  const texManche = new THREE.CanvasTexture(toileManche);
  texManche.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 7, 6), std(0xD9D4CA));
  mat.position.set(-24, 3.5, -28);
  mat.castShadow = true;
  groupe.add(mat);
  const geoManche = new THREE.CylinderGeometry(0.25, 0.55, 3, 12, 1, true);
  geoManche.rotateZ(Math.PI / 2);
  geoManche.translate(1.5, 0, 0);
  const manche = new THREE.Mesh(geoManche, new THREE.MeshLambertMaterial({ map: texManche, side: THREE.DoubleSide }));
  manche.position.set(-24, 6.6, -28);
  manche.castShadow = true;
  groupe.add(manche);

  // Le mas provençal : murs ocre clair, toit de tuiles, volets lavande.
  const mas = new THREE.Group();
  const murs = new THREE.Mesh(new THREE.BoxGeometry(14, 6, 8), std(0xEAD6B0));
  murs.position.y = 3;
  const toitGeo = new THREE.CylinderGeometry(0.01, 6, 3, 4, 1);
  toitGeo.rotateY(Math.PI / 4);
  toitGeo.scale(1.65, 1, 0.95);
  const toitMas = new THREE.Mesh(toitGeo, std(0xC07548));
  toitMas.position.y = 7.4;
  mas.add(murs, toitMas);
  const volet = new THREE.BoxGeometry(1.2, 1.6, 0.2);
  const voletMat = std(0x8FA9C9);
  for (let i = 0; i < 4; i++) {
    const v = new THREE.Mesh(volet, voletMat);
    v.position.set(-4.5 + i * 3, 3.6, 4.05);
    mas.add(v);
  }
  mas.children.forEach(m => { m.castShadow = true; m.receiveShadow = true; });
  mas.position.set(-58, 0, -22);
  mas.rotation.y = 0.5;
  groupe.add(mas);

  // Les arbres et la garrigue, en instances (une poignée d'appels de dessin pour des centaines d'objets).
  const alea = (() => { let s = 7; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; })();
  const libre = (x2, z2, marge) => Math.hypot(x2 - LIEUX.H.x, z2 - LIEUX.H.z) > 22 + marge && Math.hypot(x2 - TOUR.x, z2 - TOUR.z) > 16 + marge
    && Math.hypot(x2 + 58, z2 + 22) > 14 && !(Math.abs(x2 - 9) < 6 && z2 < -10 && z2 > -80) && Math.hypot(x2 - 52, z2 - 22) > 26;
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const placer = (mesh, i, px, py, pz, sx, sy, sz, ry) => { e.set(0, ry || 0, 0); q.setFromEuler(e); m4.compose(new THREE.Vector3(px, py, pz), q, new THREE.Vector3(sx, sy, sz)); mesh.setMatrixAt(i, m4); };
  const varier = (mesh, i, base, ecart) => { const c = new THREE.Color(base); c.offsetHSL((alea() - 0.5) * 0.03, (alea() - 0.5) * 0.1, (alea() - 0.5) * ecart); mesh.setColorAt(i, c); };

  const NP = 110;
  const troncs = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.22, 0.4, 1, 6).translate(0, 0.5, 0), lam(0x7A5A3E), NP);
  const geoCime = new THREE.IcosahedronGeometry(1, 1);
  geoCime.scale(1, 0.42, 1);
  const cimes = new THREE.InstancedMesh(geoCime, new THREE.MeshLambertMaterial({ color: 0xFFFFFF }), NP);
  let k = 0;
  for (let tentative = 0; k < NP && tentative < 3000; tentative++) {
    const r = 30 + Math.pow(alea(), 1.4) * 380;
    const a = alea() * Math.PI * 2;
    const px = Math.cos(a) * r;
    const pz = Math.sin(a) * r - 30;
    if (!libre(px, pz, 6)) continue;
    const y = hauteurSol(px, pz);
    const haut = 6 + alea() * 5;
    const large = 3.2 + alea() * 2.4;
    placer(troncs, k, px, y, pz, 1, haut, 1, 0);
    placer(cimes, k, px + 0.3, y + haut + 0.4, pz, large, large, large, alea() * 3);
    varier(cimes, k, 0x4F7A3A, 0.08);
    k++;
  }
  troncs.count = cimes.count = k;
  const NC = 46;
  const geoCypres = new THREE.CylinderGeometry(0.15, 1.05, 1, 8, 3);
  geoCypres.translate(0, 0.5, 0);
  const pc = geoCypres.attributes.position;
  for (let i = 0; i < pc.count; i++) { const yy = pc.getY(i); const s = yy < 0.2 ? 0.8 + yy : 1 - Math.pow(yy, 2.2) * 0.85; pc.setX(i, pc.getX(i) * s); pc.setZ(i, pc.getZ(i) * s); }
  geoCypres.computeVertexNormals();
  const cypres = new THREE.InstancedMesh(geoCypres, new THREE.MeshLambertMaterial({ color: 0xFFFFFF }), NC);
  for (let i = 0; i < NC; i++) {
    const rang = i < 18;
    const px = rang ? -82 + i * 4.2 : (alea() - 0.5) * 600;
    const pz = rang ? -48 + Math.sin(i) * 0.6 : -60 - alea() * 300;
    if (!rang && !libre(px, pz, 4)) { placer(cypres, i, 0, -50, 0, 0.01, 0.01, 0.01, 0); continue; }
    placer(cypres, i, px, hauteurSol(px, pz), pz, 1.1, 9 + alea() * 4, 1.1, 0);
    varier(cypres, i, 0x2F5530, 0.05);
  }
  const NB = 420;
  const buissons = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), new THREE.MeshLambertMaterial({ color: 0xFFFFFF, flatShading: true }), NB);
  k = 0;
  for (let tentative = 0; k < NB && tentative < 5000; tentative++) {
    const r = 24 + Math.pow(alea(), 1.2) * 330;
    const a = alea() * Math.PI * 2;
    const px = Math.cos(a) * r;
    const pz = Math.sin(a) * r - 30;
    if (!libre(px, pz, 2)) continue;
    const s = 0.6 + alea() * 1.3;
    placer(buissons, k, px, hauteurSol(px, pz) + s * 0.3, pz, s * 1.3, s * 0.8, s * 1.2, alea() * 3);
    varier(buissons, k, alea() < 0.5 ? 0x7C8F4E : 0x8E9A6A, 0.1);
    k++;
  }
  buissons.count = k;
  // Le champ de lavande, en rangs serrés.
  const rangs = 14;
  const parRang = 26;
  const geoLav = new THREE.SphereGeometry(1, 7, 5);
  geoLav.scale(0.9, 0.55, 0.9);
  const lavande = new THREE.InstancedMesh(geoLav, new THREE.MeshLambertMaterial({ color: 0xFFFFFF }), rangs * parRang);
  k = 0;
  for (let r = 0; r < rangs; r++) {
    for (let i = 0; i < parRang; i++) {
      placer(lavande, k, 38 + i * 1.7 + (alea() - 0.5) * 0.3, 0.35, 10 + r * 2.4, 1, 1 + alea() * 0.2, 1, 0);
      varier(lavande, k, 0x8B78C8, 0.06);
      k++;
    }
  }
  [troncs, cimes, cypres, buissons, lavande].forEach(m => { m.castShadow = true; m.receiveShadow = true; m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; groupe.add(m); });
  buissons.castShadow = false;
  lavande.castShadow = false;
  return { groupe, manche };
}

/* Des nuages ronds et lents, en instances. */
function construireNuages() {
  const n = 9;
  const parNuage = 6;
  const geo = new THREE.IcosahedronGeometry(1, 2);
  const nuages = new THREE.InstancedMesh(geo, new THREE.MeshLambertMaterial({ color: 0xFFFFFF, emissive: 0xBFCADA, emissiveIntensity: 0.55, fog: false }), n * parNuage);
  const m4 = new THREE.Matrix4();
  let k = 0;
  nuages.userData.centres = [];
  for (let i = 0; i < n; i++) {
    const a = i / n * Math.PI * 2 + 0.3;
    const r = 260 + (i % 3) * 120;
    const c = new THREE.Vector3(Math.cos(a) * r, 150 + (i % 4) * 26, Math.sin(a) * r - 120);
    nuages.userData.centres.push(c);
    for (let j = 0; j < parNuage; j++) {
      const s = 14 + ((i * 7 + j * 13) % 10) * 1.6;
      m4.makeScale(s * 1.3, s * 0.75, s);
      m4.setPosition((j - parNuage / 2) * 15 + ((j * 5) % 7), ((j * 3) % 4) * 3.5, ((j * 11) % 5) * 4);
      nuages.userData[k] = m4.clone();
      k++;
    }
  }
  nuages.userData.n = n;
  nuages.userData.parNuage = parNuage;
  majNuages(nuages, 0);
  return nuages;
}
function majNuages(nuages, t) {
  const m4 = new THREE.Matrix4();
  const dec = new THREE.Matrix4();
  let k = 0;
  for (let i = 0; i < nuages.userData.n; i++) {
    const c = nuages.userData.centres[i];
    dec.makeTranslation(c.x + ((t * 1.6 + i * 40) % 300) - 150, c.y, c.z);
    for (let j = 0; j < nuages.userData.parNuage; j++) { m4.multiplyMatrices(dec, nuages.userData[k]); nuages.setMatrixAt(k, m4); k++; }
  }
  nuages.instanceMatrix.needsUpdate = true;
}

/* ============================ L'Écureuil ============================
   Un modèle original et stylisé, fait de formes simples (aucun plan ni logo du constructeur) : cabine en
   bulle vitrée, capot de turbine, poutre de queue, dérive, rotor principal à trois pales, rotor de queue
   à deux pales, patins. Le nez regarde -z ; l'origine est sous les patins. Moussi est assis à droite. */
function construireHelico(teinte, mission) {
  const g = new THREE.Group();
  const peinture = new THREE.MeshStandardMaterial({ color: teinte, roughness: 0.32, metalness: 0.12, envMapIntensity: 1.1 });
  const blanc = new THREE.MeshStandardMaterial({ color: 0xF4F2EC, roughness: 0.4, metalness: 0.05 });
  const sombre = new THREE.MeshStandardMaterial({ color: 0x343A46, roughness: 0.55, metalness: 0.3 });
  const metal = new THREE.MeshStandardMaterial({ color: 0xB8BEC6, roughness: 0.3, metalness: 0.75 });
  const vitre = new THREE.MeshStandardMaterial({ color: 0x9FD4EC, roughness: 0.04, metalness: 0.1, transparent: true, opacity: 0.32, envMapIntensity: 2.2, depthWrite: false });
  const ombre = m => { m.castShadow = true; m.receiveShadow = true; return m; };

  // La cabine : une bulle, faite de trois morceaux d'une même sphère (la vitre devant, la peinture ailleurs).
  const S = (ps, pl, ts, tl) => new THREE.SphereGeometry(1, 40, 28, ps, pl, ts, tl);
  const cabine = new THREE.Group();
  const deg = Math.PI / 180;
  cabine.add(ombre(new THREE.Mesh(S(355 * deg, 190 * deg, 0, Math.PI), peinture)));
  cabine.add(ombre(new THREE.Mesh(S(185 * deg, 170 * deg, 104 * deg, 76 * deg), peinture)));
  const bulle = new THREE.Mesh(S(185 * deg, 170 * deg, 0, 104 * deg), vitre);
  bulle.renderOrder = 2;
  cabine.add(bulle);
  cabine.scale.set(1.05, 1.0, 1.9);
  cabine.position.set(0, 1.7, -1.0);
  g.add(cabine);
  // Le corps arrière, le capot de turbine et sa grille, la tuyère.
  const corps = ombre(new THREE.Mesh(new THREE.CapsuleGeometry(0.98, 1.6, 8, 24).rotateX(Math.PI / 2), peinture));
  corps.scale.set(1.02, 0.98, 1);
  corps.position.set(0, 1.62, 0.7);
  g.add(corps);
  const bandeau = ombre(new THREE.Mesh(new THREE.CapsuleGeometry(1.0, 1.6, 6, 24).rotateX(Math.PI / 2), blanc));
  bandeau.scale.set(1.0, 0.55, 1.02);
  bandeau.position.set(0, 1.18, 0.7);
  g.add(bandeau);
  const capot = ombre(new THREE.Mesh(new THREE.CapsuleGeometry(0.56, 1.7, 6, 20).rotateX(Math.PI / 2), peinture));
  capot.scale.set(0.95, 0.85, 1);
  capot.position.set(0, 2.55, 0.55);
  g.add(capot);
  const grille = ombre(new THREE.Mesh(new THREE.CapsuleGeometry(0.42, 0.5, 4, 16).rotateX(Math.PI / 2), sombre));
  grille.scale.set(1.05, 0.7, 1);
  grille.position.set(0, 2.66, 0.1);
  g.add(grille);
  const tuyere = ombre(new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.38, 0.6, 16, 1, true).rotateX(Math.PI / 2), sombre));
  tuyere.position.set(0, 2.5, 1.9);
  g.add(tuyere);
  // La poutre de queue, effilée, la dérive en flèche, l'empennage.
  const poutre = ombre(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.46, 5.8, 18).rotateX(Math.PI / 2), peinture));
  poutre.position.set(0, 2.05, 4.6);
  poutre.rotation.x = -0.05;
  g.add(poutre);
  const empennage = ombre(new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.08, 0.62), peinture));
  empennage.position.set(0, 2.1, 5.9);
  g.add(empennage);
  [-1.3, 1.3].forEach(x => {
    const ailette = ombre(new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.62, 0.5), blanc));
    ailette.position.set(x, 2.15, 6.0);
    g.add(ailette);
  });
  const forme = new THREE.Shape();
  forme.moveTo(0, 0); forme.lineTo(0.95, 1.55); forme.lineTo(1.5, 1.55); forme.lineTo(1.05, -0.05); forme.lineTo(1.25, -0.75); forme.lineTo(0.8, -0.75); forme.lineTo(0, -0.2);
  const derive = ombre(new THREE.Mesh(new THREE.ExtrudeGeometry(forme, { depth: 0.1, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.02, bevelSegments: 1 }), peinture));
  derive.rotation.y = -Math.PI / 2;
  derive.position.set(-0.05, 2.15, 7.0);
  g.add(derive);
  const flash = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), new THREE.MeshBasicMaterial({ color: 0xFFFFFF }));
  flash.position.set(0, 3.72, 8.45);
  g.add(flash);
  // Le mât, la tête du rotor.
  const mat = ombre(new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.16, 0.75, 12), metal));
  mat.position.set(0, 3.15, -0.15);
  g.add(mat);
  const gyro = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), new THREE.MeshBasicMaterial({ color: 0xFFB74D }));
  gyro.position.set(0, 3.0, 0.95);
  g.add(gyro);

  // Le rotor principal : trois pales, un pas qu'on voit changer, et un disque flouté quand il tourne vite.
  const rotor = new THREE.Group(); // s'incline avec le manche
  rotor.position.set(0, 3.5, -0.15);
  g.add(rotor);
  const tourne = new THREE.Group(); // tourne autour du mât
  rotor.add(tourne);
  const moyeu = ombre(new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.3, 0.26, 16), metal));
  tourne.add(moyeu);
  const matPale = new THREE.MeshStandardMaterial({ color: 0x3A404C, roughness: 0.5, metalness: 0.2, transparent: true, opacity: 1 });
  const matBout = new THREE.MeshStandardMaterial({ color: 0xFFD54A, roughness: 0.5, transparent: true, opacity: 1 });
  const pales = [];
  for (let i = 0; i < 3; i++) {
    const bras = new THREE.Group();
    bras.rotation.y = i * Math.PI * 2 / 3;
    tourne.add(bras);
    const pas = new THREE.Group(); // le pas : rotation autour de la longueur de la pale
    bras.add(pas);
    const geoPale = new THREE.BoxGeometry(5.0, 0.07, 0.36);
    geoPale.translate(2.8, 0, 0);
    const pale = new THREE.Mesh(geoPale, matPale);
    pale.castShadow = true;
    pas.add(pale);
    const bout = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.075, 0.365), matBout);
    bout.position.x = 5.1;
    pas.add(bout);
    pales.push(pas);
  }
  const toileDisque = document.createElement('canvas');
  toileDisque.width = toileDisque.height = 256;
  const xd = toileDisque.getContext('2d');
  const grad = xd.createRadialGradient(128, 128, 10, 128, 128, 128);
  grad.addColorStop(0, 'rgba(60,64,76,0)');
  grad.addColorStop(0.2, 'rgba(60,64,76,0.10)');
  grad.addColorStop(0.86, 'rgba(60,64,76,0.20)');
  grad.addColorStop(0.9, 'rgba(255,213,74,0.55)');
  grad.addColorStop(0.97, 'rgba(255,213,74,0.35)');
  grad.addColorStop(1, 'rgba(255,213,74,0)');
  xd.fillStyle = grad;
  xd.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 26; i++) { xd.strokeStyle = `rgba(40,44,56,${0.05 + (i % 3) * 0.03})`; xd.lineWidth = 1.2; xd.beginPath(); xd.arc(128, 128, 30 + i * 3.6, 0, Math.PI * 2); xd.stroke(); }
  const texDisque = new THREE.CanvasTexture(toileDisque);
  texDisque.colorSpace = THREE.SRGBColorSpace;
  const disque = new THREE.Mesh(new THREE.CircleGeometry(5.35, 64), new THREE.MeshBasicMaterial({ map: texDisque, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }));
  disque.rotation.x = -Math.PI / 2;
  disque.position.y = 0.03;
  disque.renderOrder = 3;
  rotor.add(disque);

  // Le rotor de queue : deux pales, sur le côté de la dérive.
  const queue = new THREE.Group();
  queue.position.set(-0.32, 2.75, 7.6);
  g.add(queue);
  const queueTourne = new THREE.Group();
  queue.add(queueTourne);
  for (let i = 0; i < 2; i++) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.85, 0.2), matPale);
    p.rotation.x = i * Math.PI;
    p.position.y = i ? -0.46 : 0.46;
    queueTourne.add(p);
  }
  queueTourne.add(new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), metal));
  const queueDisque = new THREE.Mesh(new THREE.CircleGeometry(0.95, 32), new THREE.MeshBasicMaterial({ map: texDisque, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }));
  queueDisque.rotation.y = Math.PI / 2;
  queue.add(queueDisque);

  // Les patins : deux tubes relevés devant, deux traverses en arc.
  const tube = (points, r) => ombre(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 24, r, 8), metal));
  [-1, 1].forEach(s => {
    g.add(tube([new THREE.Vector3(s * 1.0, 0.1, 1.7), new THREE.Vector3(s * 1.0, 0.08, -1.4), new THREE.Vector3(s * 1.0, 0.16, -2.25), new THREE.Vector3(s * 1.0, 0.55, -2.65)], 0.075));
  });
  [-0.9, 0.95].forEach(z => {
    g.add(tube([new THREE.Vector3(-1.0, 0.1, z), new THREE.Vector3(-0.85, 0.75, z), new THREE.Vector3(0, 1.0, z), new THREE.Vector3(0.85, 0.75, z), new THREE.Vector3(1.0, 0.1, z)], 0.065));
  });

  // Dedans : le tableau de bord, deux sièges, et Moussi en pilote (à droite), casque et lunettes.
  const tableau = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.3, 0.42), sombre);
  tableau.position.set(0, 1.3, -1.95);
  tableau.rotation.x = 0.4;
  g.add(tableau);
  [-0.5, 0.5].forEach(x => {
    const siege = new THREE.Mesh(new THREE.BoxGeometry(0.62, 1.0, 0.18), sombre);
    siege.position.set(x, 1.55, -0.55);
    g.add(siege);
  });
  const moussi = construireMoussi();
  moussi.groupe.position.set(0.48, 0.92, -1.2);
  moussi.groupe.scale.setScalar(0.92);
  g.add(moussi.groupe);

  // Selon la mission : le seau d'eau (feux de forêt), le projecteur (police).
  let seau = null;
  if (mission === 'feux') {
    seau = new THREE.Group();
    const corde = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1, 4).translate(0, -0.5, 0), sombre);
    const panier = ombre(new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.5, 1.1, 16), new THREE.MeshStandardMaterial({ color: 0xE86A17, roughness: 0.6 })));
    seau.add(corde, panier);
    seau.userData = { corde, panier };
  }
  if (mission === 'police') {
    const phare = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.26, 0.4, 12), sombre);
    phare.rotation.x = Math.PI / 2;
    phare.position.set(0.55, 0.55, -2.1);
    const verre = new THREE.Mesh(new THREE.CircleGeometry(0.19, 16), new THREE.MeshBasicMaterial({ color: 0xFFF6C8 }));
    verre.position.set(0.55, 0.55, -2.31);
    verre.rotation.y = Math.PI;
    g.add(phare, verre);
  }
  return { groupe: g, rotor, tourne, pales, disque, matPale, matBout, queue: queueTourne, queueDisque, moussi, seau, flash, gyro, corps: [cabine, corps, capot, poutre] };
}

/* Moussi en 3D : une petite souris grise, grandes oreilles roses, casque brun et lunettes bleues (comme en 2D). */
function construireMoussi() {
  const groupe = new THREE.Group();
  const gris = new THREE.MeshStandardMaterial({ color: 0x9EA3AA, roughness: 0.75 });
  const rose = new THREE.MeshStandardMaterial({ color: 0xF2A7B8, roughness: 0.7 });
  const noir = new THREE.MeshStandardMaterial({ color: 0x1D1F26, roughness: 0.25 });
  const brun = new THREE.MeshStandardMaterial({ color: 0x8B5A2B, roughness: 0.6 });
  const bleu = new THREE.MeshStandardMaterial({ color: 0x9ED3F0, roughness: 0.1, metalness: 0.2 });
  const corps = new THREE.Mesh(new THREE.CapsuleGeometry(0.26, 0.35, 4, 12), gris);
  corps.position.y = 0.45;
  groupe.add(corps);
  const tete = new THREE.Group();
  tete.position.y = 1.02;
  groupe.add(tete);
  const crane = new THREE.Mesh(new THREE.SphereGeometry(0.36, 24, 18), gris);
  crane.scale.set(1, 0.95, 1.05);
  tete.add(crane);
  const museau = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 12), gris);
  museau.position.set(0, -0.08, -0.32);
  tete.add(museau);
  const nez = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 10), rose);
  nez.position.set(0, -0.04, -0.49);
  tete.add(nez);
  [-1, 1].forEach(s => {
    const oeil = new THREE.Mesh(new THREE.SphereGeometry(0.065, 12, 10), noir);
    oeil.position.set(s * 0.14, 0.04, -0.31);
    tete.add(oeil);
    const oreille = new THREE.Group();
    oreille.position.set(s * 0.3, 0.3, 0.02);
    oreille.rotation.z = -s * 0.5;
    const ext = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.06, 20), gris);
    ext.rotation.x = Math.PI / 2;
    const int = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.02, 20), rose);
    int.rotation.x = Math.PI / 2;
    int.position.z = -0.035;
    oreille.add(ext, int);
    tete.add(oreille);
  });
  const casque = new THREE.Group();
  const calotte = new THREE.Mesh(new THREE.SphereGeometry(0.385, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.42), brun);
  calotte.scale.set(1, 0.95, 1.07);
  casque.add(calotte);
  const bandeau = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.035, 6, 24), noir);
  bandeau.rotation.x = 0.35;
  bandeau.position.set(0, 0.16, -0.06);
  casque.add(bandeau);
  [-1, 1].forEach(s => {
    const lunette = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.025, 6, 16), noir);
    lunette.position.set(s * 0.11, 0.2, -0.3);
    lunette.rotation.x = 0.35;
    const verre = new THREE.Mesh(new THREE.CircleGeometry(0.07, 16), bleu);
    verre.position.copy(lunette.position);
    verre.rotation.x = 0.35 + Math.PI;
    verre.rotation.y = Math.PI;
    casque.add(lunette, verre);
  });
  tete.add(casque);
  const bras = new THREE.Group();
  bras.position.set(0.3, 0.68, -0.05);
  const avantBras = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.36, 4, 8), gris);
  avantBras.position.y = 0.22;
  bras.add(avantBras);
  const main = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), rose);
  main.position.y = 0.46;
  bras.add(main);
  bras.rotation.z = -2.6;
  groupe.add(bras);
  groupe.scale.setScalar(1.05);
  return { groupe, tete, casque, bras, peau: gris, couleurPeau: new THREE.Color(0x9EA3AA) };
}

/* ============================ Les effets ============================ */
/* Des points doux (poussière ocre, souffle d'air bleuté), mis à jour sur le processeur. */
function systemePoints(n, couleur, taille) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(n * 3);
  const alpha = new Float32Array(n);
  const tailles = new Float32Array(n);
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('a', new THREE.BufferAttribute(alpha, 1));
  geo.setAttribute('s', new THREE.BufferAttribute(tailles, 1));
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { couleur: { value: srgb(couleur) }, echelle: { value: 400 } },
    vertexShader: 'attribute float a; attribute float s; varying float vA; uniform float echelle; void main(){ vA = a; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = s * echelle / max(1.0, -mv.z); gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'uniform vec3 couleur; varying float vA; void main(){ vec2 d = gl_PointCoord - 0.5; float r = dot(d, d) * 4.0; float k = smoothstep(1.0, 0.0, r); gl_FragColor = vec4(couleur, vA * k); }',
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  const parts = [];
  for (let i = 0; i < n; i++) parts.push({ vie: 0, duree: 1, x: 0, y: -999, z: 0, vx: 0, vy: 0, vz: 0, s: taille });
  return { points, parts, geo, taille, prochain: 0 };
}

/* Une flèche plate (posée au sol) ou en volume, de la couleur d'une commande. */
function flechePlate(couleur) {
  const f = new THREE.Shape();
  f.moveTo(-0.5, 0); f.lineTo(0.5, 0); f.lineTo(0.5, 3); f.lineTo(1.3, 3); f.lineTo(0, 4.6); f.lineTo(-1.3, 3); f.lineTo(-0.5, 3); f.lineTo(-0.5, 0);
  const geo = new THREE.ShapeGeometry(f);
  geo.rotateX(-Math.PI / 2);
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: couleur, transparent: true, opacity: 0, depthWrite: false }));
  m.renderOrder = 4;
  return m;
}
function flecheVolume(couleur) {
  const g = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ color: couleur, transparent: true, opacity: 0, depthWrite: false });
  const tige = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 2.2, 12), mat);
  tige.position.y = 1.1;
  const pointe = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.1, 16), mat);
  pointe.position.y = 2.7;
  g.add(tige, pointe);
  g.userData.mat = mat;
  return g;
}
function flecheTour(couleur) {
  const g = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ color: couleur, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
  const arc = new THREE.Mesh(new THREE.RingGeometry(6.6, 7.6, 48, 1, 0.3, Math.PI * 1.25), mat);
  arc.rotation.x = -Math.PI / 2;
  const pointe = new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape([new THREE.Vector2(-1.2, 0), new THREE.Vector2(1.2, 0), new THREE.Vector2(0, 1.8)])), mat);
  pointe.rotation.x = -Math.PI / 2;
  const a = 0.3 + Math.PI * 1.25;
  pointe.position.set(Math.cos(a) * 7.1, 0, -Math.sin(a) * 7.1);
  pointe.rotation.z = a;
  g.add(arc, pointe);
  g.userData.mat = mat;
  return g;
}
/* La balise dorée au-dessus de la cible de la mission. */
function construireBalise() {
  const g = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ color: 0xFFC83D, transparent: true, opacity: 0.9, depthWrite: false });
  const anneau = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.22, 10, 40), mat);
  anneau.rotation.x = Math.PI / 2;
  const pointe = new THREE.Mesh(new THREE.ConeGeometry(1.0, 1.8, 4), mat);
  pointe.rotation.x = Math.PI;
  pointe.position.y = 2.4;
  const sol = new THREE.Mesh(new THREE.RingGeometry(10.5, 11.6, 64), new THREE.MeshBasicMaterial({ color: 0xFFC83D, transparent: true, opacity: 0.55, depthWrite: false }));
  sol.rotation.x = -Math.PI / 2;
  g.add(anneau, pointe);
  g.userData = { anneau, pointe, sol, mat };
  return g;
}
/* La mouette qui passe. */
function construireMouette() {
  const g = new THREE.Group();
  const blanc = new THREE.MeshLambertMaterial({ color: 0xFAFAF7 });
  const gris = new THREE.MeshLambertMaterial({ color: 0x9AA3AD, side: THREE.DoubleSide });
  const corps = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.7, 4, 8).rotateX(Math.PI / 2), blanc);
  const tete = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), blanc);
  tete.position.set(0, 0.1, -0.55);
  const bec = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.25, 6).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ color: 0xF2B632 }));
  bec.position.set(0, 0.08, -0.8);
  const aile = s => { const a = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.5).translate(s * 0.7, 0, 0).rotateX(-Math.PI / 2), gris); return a; };
  const ag = aile(-1);
  const ad = aile(1);
  g.add(corps, tete, bec, ag, ad);
  g.userData = { ag, ad };
  g.visible = false;
  g.scale.setScalar(1.6);
  return g;
}

/* ============================ L'interface par-dessus la 3D ============================ */
const hud = {
  el: null,
  bulle(texte, attitude, radio) {
    const b = app.querySelector('.v-bulle');
    if (!b) return;
    b.classList.toggle('radio', !!radio);
    b.innerHTML = `${radio ? `<span class="v-radio-etiq">${esc(radio)}</span>` : ''}<span lang="${lg()}">${esc(texte)}</span>`;
    b.classList.remove('arrive');
    void b.offsetWidth;
    b.classList.add('arrive');
    const m = app.querySelector('.v-moussi');
    if (m) m.dataset.attitude = attitude || 'attend';
  },
};

const ICONE_RADIO = '<svg viewBox="0 0 24 24" aria-hidden="true" class="ico"><g fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14a8 8 0 0116 0v4a2 2 0 01-2 2h-1v-6h3M4 14v4a2 2 0 002 2h1v-6H4"/></g></svg>';
const ICONE_CLE = '<svg viewBox="0 0 24 24" aria-hidden="true" class="ico"><use href="#i-cle"/></svg>';

function jaugeTours(fraction) {
  const a = (180 + 124 * Math.max(0, Math.min(1, fraction))) * Math.PI / 180;
  const arc = (r, a0, a1) => {
    const pt = x => [70 + r * Math.cos(x * Math.PI / 180), 74 + r * Math.sin(x * Math.PI / 180)].map(n => n.toFixed(1)).join(' ');
    return `M${pt(a0)} A${r} ${r} 0 0 1 ${pt(a1)}`;
  };
  return `<path d="${arc(56, 180, 360)}" fill="none" stroke="#D8D3CA" stroke-width="12" stroke-linecap="round"/>
    <path d="${arc(56, 290, 318)}" fill="none" stroke="#3AA75A" stroke-width="12" stroke-linecap="round"/>
    <path class="v-aiguille" d="M70 74 L${(70 + 46 * Math.cos(a)).toFixed(1)} ${(74 + 46 * Math.sin(a)).toFixed(1)}" stroke="#262A45" stroke-width="5" stroke-linecap="round"/>
    <circle cx="70" cy="74" r="7" fill="#262A45"/>`;
}

function ecranVol() {
  const missions = V.MISSIONS.map((id, i) => `<li class="v-pastille" data-mission="${id}" style="--encre:${D.ENCRE_VOL[id]}"><span class="v-num">${i + 1}</span><span class="v-tamp">${D.tamponVol(id, D.ENCRE_VOL[id])}</span></li>`).join('');
  app.innerHTML = `<div class="v-ecran exo">
    <div class="v-scene" id="scene3d"></div>
    <div class="v-hud">
      <header class="v-haut">
        <div class="nav"><a class="rond" href="helicopteres.html" aria-label="${esc(KR.t('retour'))}">${KR.icone('retour')}</a><span class="nom" aria-hidden="true">${esc(KR.t('retour'))}</span></div>
        <div class="v-missions"><ol>${missions}</ol><p class="v-titre-mission" lang="${lg()}"></p><div class="v-jauge-mission"><i></i></div></div>
        <div class="nav"><button type="button" class="rond" data-a="ecouter" aria-label="${esc(KR.t('ecouter'))}">${KR.icone('son')}</button><span class="nom" aria-hidden="true">${esc(KR.t('ecouter'))}</span></div>
      </header>
      <div class="v-moussi" data-attitude="attend"><div class="v-medaillon">${D.moussiPilote()}</div><div class="v-bulle bulle parle"></div></div>
      <div class="v-instruments">
        <div class="v-instr"><svg viewBox="0 0 140 86" aria-hidden="true" class="v-jauge">${jaugeTours(0)}</svg><b lang="${lg()}">${esc(ui('tours'))}</b><span lang="${lg()}">${esc(ch(HC.COMPTEUR))}</span></div>
        <div class="v-instr v-instr-pale"><svg viewBox="0 0 160 84" aria-hidden="true" class="v-pale">${D.pale(2)}</svg><b lang="${lg()}">${esc(ui('inclinaison'))}</b></div>
      </div>
      <button type="button" class="btn btn-primaire v-radio" data-a="radio" hidden>${ICONE_RADIO}<span lang="${lg()}">${esc(ui('radio'))}</span></button>
      <div class="v-cmd v-collectif" data-cmd="collectif" style="--c:${COUL.collectif}">
        <div class="v-rail" role="slider" aria-label="${esc(ch(HC.commande('collectif').nom))}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" tabindex="0"><span class="v-bande"></span><span class="v-poignee"><i></i><i></i><i></i></span></div>
        ${nomCmd('collectif')}
      </div>
      <div class="v-cmd v-pedales" data-cmd="pedales" style="--c:${COUL.pedales}">
        <div class="v-duo"><button type="button" class="v-pedale" data-pedale="-1" aria-label="${esc(ch(HC.commande('pedales').nom))} ${esc(ui('gauche'))}"><svg viewBox="0 0 40 40" aria-hidden="true" style="transform:scaleX(-1)"><path d="M28 12 A12 12 0 1 0 30 26" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><path d="M22 6 L29 12 L21 16" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
        <button type="button" class="v-pedale" data-pedale="1" aria-label="${esc(ch(HC.commande('pedales').nom))} ${esc(ui('droite'))}"><svg viewBox="0 0 40 40" aria-hidden="true"><path d="M28 12 A12 12 0 1 0 30 26" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><path d="M22 6 L29 12 L21 16" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg></button></div>
        ${nomCmd('pedales')}
      </div>
      <div class="v-cmd v-manche" data-cmd="manche" style="--c:${COUL.manche}">
        <div class="v-socle" role="slider" aria-label="${esc(ch(HC.commande('manche').nom))}" tabindex="0"><span class="v-repere h"></span><span class="v-repere b"></span><span class="v-repere g"></span><span class="v-repere d"></span><span class="v-bouton"></span></div>
        ${nomCmd('manche')}
      </div>
      <div class="v-doigt" aria-hidden="true"></div>
      <div class="v-toast" aria-live="polite"></div>
    </div>
    <div class="v-voile" hidden></div>
    ${params.has('fps') ? '<div class="v-fps"></div>' : ''}
  </div>`;
}

/* ============================ Les commandes au doigt ============================ */
const entree = { levier: 0, mancheX: 0, mancheY: 0, pedales: 0, pedaleVoulue: 0, derniere: 0, touche: { collectif: 0, manche: 0, pedales: 0 } };
let forcer = null; // commandes imposées par le parcours de test
function brancherCommandes() {
  const rail = app.querySelector('.v-rail');
  const poignee = app.querySelector('.v-poignee');
  const majLevier = () => {
    const h = rail.clientHeight - poignee.offsetHeight;
    poignee.style.transform = `translateY(${(-entree.levier * h).toFixed(1)}px)`;
    rail.setAttribute('aria-valuenow', Math.round(entree.levier * 100));
  };
  let prise = null;
  rail.addEventListener('pointerdown', e => {
    e.preventDefault();
    rail.setPointerCapture(e.pointerId);
    const r = rail.getBoundingClientRect();
    const hp = poignee.offsetHeight;
    const yPoignee = r.bottom - hp / 2 - entree.levier * (r.height - hp);
    prise = { id: e.pointerId, decalage: Math.abs(e.clientY - yPoignee) < hp ? e.clientY - yPoignee : 0 };
    bouger(e);
    toucher('collectif');
  });
  const bouger = e => {
    if (!prise || e.pointerId !== prise.id) return;
    const r = rail.getBoundingClientRect();
    const hp = poignee.offsetHeight;
    const y = e.clientY - prise.decalage;
    entree.levier = Math.max(0, Math.min(1, (r.bottom - hp / 2 - y) / (r.height - hp)));
    majLevier();
    toucher('collectif');
  };
  rail.addEventListener('pointermove', bouger);
  const lacher = e => { if (prise && e.pointerId === prise.id) { prise = null; app.querySelector('.v-collectif').classList.remove('actif'); } };
  rail.addEventListener('pointerup', lacher);
  rail.addEventListener('pointercancel', lacher);
  rail.addEventListener('keydown', e => { if (e.key === 'ArrowUp') entree.levier = Math.min(1, entree.levier + 0.05); if (e.key === 'ArrowDown') entree.levier = Math.max(0, entree.levier - 0.05); majLevier(); toucher('collectif'); });
  entree.majLevier = majLevier;
  majLevier();

  const socle = app.querySelector('.v-socle');
  const bouton = app.querySelector('.v-bouton');
  let doigt = null;
  const majBouton = () => {
    const R = (socle.clientWidth - bouton.offsetWidth) / 2;
    bouton.style.transform = `translate(${(entree.mancheX * R).toFixed(1)}px, ${(-entree.mancheY * R).toFixed(1)}px)`;
  };
  const viser = e => {
    const r = socle.getBoundingClientRect();
    const R = (r.width - bouton.offsetWidth) / 2;
    let dx = (e.clientX - (r.left + r.width / 2)) / R;
    let dy = -(e.clientY - (r.top + r.height / 2)) / R;
    const n = Math.hypot(dx, dy);
    if (n > 1) { dx /= n; dy /= n; }
    entree.mancheX = dx;
    entree.mancheY = dy;
    majBouton();
    toucher('manche');
  };
  socle.addEventListener('pointerdown', e => { e.preventDefault(); socle.setPointerCapture(e.pointerId); doigt = e.pointerId; socle.classList.add('tenu'); viser(e); });
  socle.addEventListener('pointermove', e => { if (e.pointerId === doigt) viser(e); });
  const relacher = e => { if (e.pointerId !== doigt) return; doigt = null; socle.classList.remove('tenu'); entree.mancheX = 0; entree.mancheY = 0; majBouton(); app.querySelector('.v-manche').classList.remove('actif'); };
  socle.addEventListener('pointerup', relacher);
  socle.addEventListener('pointercancel', relacher);
  entree.majBouton = majBouton;

  app.querySelectorAll('.v-pedale').forEach(p => {
    const sens = Number(p.dataset.pedale);
    p.addEventListener('pointerdown', e => { e.preventDefault(); p.setPointerCapture(e.pointerId); p.classList.add('tenue'); entree.pedaleVoulue = sens; toucher('pedales'); });
    const fin = () => { p.classList.remove('tenue'); if (entree.pedaleVoulue === sens) entree.pedaleVoulue = 0; app.querySelector('.v-pedales').classList.remove('actif'); };
    p.addEventListener('pointerup', fin);
    p.addEventListener('pointercancel', fin);
    p.addEventListener('lostpointercapture', fin);
    p.addEventListener('contextmenu', e => e.preventDefault());
  });
}
function toucher(cmd) {
  entree.derniere = tempsSim;
  entree.touche[cmd] = tempsSim;
  Son.reveiller();
  const el = app.querySelector(`.v-cmd[data-cmd="${cmd}"]`);
  if (el) el.classList.add('actif');
  cacherDoigt();
  if (enseignement && enseignement.cmd === cmd) merciInstructeur();
}

/* Le doigt qui montre où toucher (autonomie : Moussi aide quand rien ne se passe). */
function montrerDoigt(cmd) {
  const d = app.querySelector('.v-doigt');
  const cible = cmd === 'collectif' ? app.querySelector('.v-poignee') : cmd === 'manche' ? app.querySelector('.v-bouton') : cmd === 'radio' ? app.querySelector('.v-radio') : app.querySelector('.v-pedale[data-pedale="1"]');
  if (!d || !cible) return;
  const r = cible.getBoundingClientRect();
  d.style.left = (r.left + r.width / 2) + 'px';
  d.style.top = (r.top + r.height / 2) + 'px';
  d.dataset.geste = cmd;
  d.classList.add('voit');
  app.querySelectorAll('.v-cmd, .v-radio').forEach(c => c.classList.toggle('halo', c.dataset.cmd === cmd || (cmd === 'radio' && c.classList.contains('v-radio'))));
}
function cacherDoigt() {
  const d = app.querySelector('.v-doigt');
  if (d) d.classList.remove('voit');
  app.querySelectorAll('.halo').forEach(c => c.classList.remove('halo'));
}

/* ============================ Le vol : état, missions, Moussi ============================ */
let monde = null;
let heli = null;
let v = null;
let suivi = null;
let phase = 'attente';
let indexMission = 0;
let vols = 0; // nombre de vols commencés dans la séance : au deuxième, Moussi demande plus souvent « montre-moi »
let enseignement = null;
let derniereAide = 0;
let missionDebut = 0;
const souvenirs = {}; // les moments drôles déjà joués pendant ce vol
let cameraOrbite = { yaw: 0, pitch: 0, dist: 1, dernier: -99 };
let secousse = 0;
let vertJusqu = 0;
let casqueT = -1;
let salutT = -1;
let lacetRapide = 0;
let poussiere = 0;
let poussiereLongue = 0;
let bord = false;

const missionCourante = () => (phase === 'vol' ? V.MISSIONS[indexMission] : null);
const commandeDe = id => ({ decoller: 'collectif', stationnaire: 'collectif', tour: 'manche', tourner: 'pedales', poser: 'manche' }[id]);

function commencerMission(i) {
  indexMission = i;
  const id = V.MISSIONS[i];
  suivi = V.creerSuivi(v, LIEUX);
  missionDebut = tempsSim;
  derniereAide = tempsSim;
  majPastilles();
  const m = T.missions[id];
  app.querySelector('.v-titre-mission').textContent = ch(m.nom);
  // Moussi hésite et demande à Henri de lui montrer (D-25) : toujours pour les pédales, et pour les deux
  // autres commandes dès le deuxième vol.
  const demande = { decoller: 'collectif', tour: 'manche', tourner: 'pedales' }[id];
  if (demande && (id === 'tourner' || vols > 1)) {
    enseignement = { cmd: demande, t: tempsSim, merci: false };
    direObj(HC.COCKPIT.enseigner[demande].demande, 'aide');
  } else {
    enseignement = null;
    direObj(m.consigne, 'attend');
  }
}
function merciInstructeur() {
  if (!enseignement || enseignement.merci) return;
  enseignement.merci = true;
  const cmd = enseignement.cmd;
  planifier(0.6, () => { direObj(HC.COCKPIT.enseigner[cmd].merci, 'fete'); });
}

function missionReussie(id) {
  const nouveau = V.noterMission(etat, id, new Date());
  if (nouveau) sauver();
  cacherDoigt();
  enseignement = null;
  suivi = null;
  KR.son('juste');
  direObj(T.missions[id].bravo, 'fete');
  planifier(Math.min(2.2, dureeDite(ch(T.missions[id].bravo))), () => poserTampon(id, nouveau));
  const suite = dureeDite(ch(T.missions[id].bravo)) + 0.8;
  if (indexMission + 1 < V.MISSIONS.length) {
    phase = 'entre';
    planifier(suite, () => { phase = 'vol'; commencerMission(indexMission + 1); });
  } else {
    phase = 'arrivee';
    planifier(suite, couperMoteur);
  }
  majPastilles(id);
}

/* Le tampon s'abat dans le carnet, sur la page d'Henri et sur celle de Moussi (D-25). */
function poserTampon(id, nouveau) {
  const t = app.querySelector('.v-toast');
  if (!t) return;
  const page = (qui, nom) => `<div class="v-page"><span class="v-page-nom" lang="${lg()}">${esc(nom)}</span><span class="v-page-tampon">${D.tamponVol(id, D.ENCRE_VOL[id])}</span></div>`;
  t.innerHTML = `<b lang="${lg()}">${esc(ch(HC.CARNET.titre))}</b><div class="v-livret">${page('enfant', KR.prenom())}${page('moussi', ui('pilote_moussi'))}</div>`;
  t.classList.remove('voit');
  void t.offsetWidth;
  t.classList.add('voit');
  const pages = t.querySelectorAll('.v-page-tampon');
  setTimeout(() => { pages[0] && pages[0].classList.add('abat'); KR.son('tampon'); }, MOUVEMENT ? 350 : 0);
  setTimeout(() => { pages[1] && pages[1].classList.add('abat'); KR.son('tampon'); }, MOUVEMENT ? 1050 : 0);
  setTimeout(() => t.classList.remove('voit'), 3800);
  if (!nouveau) planifier(1.2, () => dire(ch(T.deja), 'fete', { siLibre: true }));
}

function majPastilles(enCours) {
  const faites = V.missionsFaites(etat);
  app.querySelectorAll('.v-pastille').forEach(p => {
    const id = p.dataset.mission;
    p.classList.toggle('faite', !!faites[id]);
    p.classList.toggle('courante', phase === 'vol' && id === V.MISSIONS[indexMission]);
    if (enCours === id) { p.classList.remove('gagne'); void p.offsetWidth; p.classList.add('gagne'); }
  });
}

function couperMoteur() {
  phase = 'coupure';
  V.couper(v);
  dire(ch(T.coupe), 'attend');
  cameraOrbite.vers = { yaw: 0.9, pitch: -0.12, dist: 0.62 };
}
function finDuVol() {
  phase = 'fin';
  const voile = app.querySelector('.v-voile');
  const faites = V.missionsFaites(etat);
  const page = nom => `<section class="v-grand-page"><h3 lang="${lg()}">${esc(nom)}</h3><div class="v-grand-tampons">${V.MISSIONS.map(id => `<span class="${faites[id] ? 'pose' : ''}">${faites[id] ? D.tamponVol(id, D.ENCRE_VOL[id]) : ''}</span>`).join('')}</div></section>`;
  voile.innerHTML = `<div class="v-fiche">
    <h2 lang="${lg()}">${esc(ch(HC.CARNET.titre))}</h2>
    <div class="v-grand-livret">${page(KR.prenom())}${page(ui('pilote_moussi'))}</div>
    <div class="v-fiche-boutons">
      <button type="button" class="btn btn-primaire" data-a="encore">${KR.icone('jouer')}<span lang="${lg()}">${esc(ui('encore'))}</span></button>
      <button type="button" class="btn btn-secondaire" data-a="libre"><span lang="${lg()}">${esc(ui('libre'))}</span></button>
    </div></div>`;
  voile.hidden = false;
  dire(ch(T.fin), 'fete');
  KR.son('fete');
}

function demarrerVol() {
  if (phase !== 'attente' && phase !== 'fin' && phase !== 'libre-pose') return;
  Son.init();
  Son.reveiller();
  vols++;
  Object.keys(souvenirs).forEach(k => delete souvenirs[k]);
  app.querySelector('.v-voile').hidden = true;
  app.querySelector('.v-demarrer') && app.querySelector('.v-demarrer').remove();
  cameraOrbite.vers = { yaw: 0, pitch: 0, dist: 1 };
  phase = 'demarrage';
  V.demarrer(v);
  dire(ch(T.demarrage), 'attend');
}

/* Les moments drôles et les petites leçons, jamais aux dépens d'Henri, chacun une fois par vol. */
function unSeulCoup(cle, fn) { if (souvenirs[cle]) return false; const ok = fn(); if (ok !== false) souvenirs[cle] = true; return ok; }
function surveiller(dt) {
  if (!v) return;
  const lacet = Math.abs(v.vitCap);
  lacetRapide = lacet > 0.55 ? lacetRapide + dt : Math.max(0, lacetRapide - dt);
  if (lacetRapide > 0.5) unSeulCoup('wiii', () => dire(ch(T.rigolo.wiii), 'fete', { siLibre: true }));
  if (lacetRapide > 2.6) unSeulCoup('vert', () => { vertJusqu = tempsSim + 2.2; return dire(ch(T.rigolo.vert), 'aide', { siLibre: true }); });
  if (v.vit.y > 3.2 && !v.sol) unSeulCoup('casque', () => { if (!dire(ch(T.rigolo.casque), 'fete', { siLibre: true })) return false; casqueT = 0; return true; });
  poussiereLongue = poussiere > 0.6 ? poussiereLongue + dt : Math.max(0, poussiereLongue - dt);
  if (poussiereLongue > 2.5) unSeulCoup('atchoum', () => dire(ch(T.rigolo.atchoum), 'aide', { siLibre: true }));
  if (V.poussee(v.collectif, 50) > 1.35 && !v.sol) unSeulCoup('air', () => dire(ch(T.air), 'attend', { siLibre: true }));
  if (v.hauteur > 32) unSeulCoup('haut', () => dire(ch(T.haut), 'fete', { siLibre: true }));
  if (v.choc > 0.5 && Math.hypot(v.pos.x - TOUR.x, v.pos.z - TOUR.z) < 14) { if (!souvenirs.tourT || tempsSim - souvenirs.tourT > 12) { souvenirs.tourT = tempsSim; dire(ch(T.rigolo.tour), 'aide', { siLibre: true }); } }
  const auBord = Math.hypot(v.pos.x, v.pos.z) > V.RAYON_MONDE - 2;
  if (auBord && !bord) dire(ch(T.rigolo.bord), 'aide', { siLibre: true });
  bord = auBord;
  // La mouette passe pendant le trajet vers la tour (ou plus haut en vol libre).
  if ((missionCourante() === 'tour' && V.distance(v, LIEUX.H) > 22) || v.hauteur > 20) unSeulCoup('mouette', () => { if (tempsSim < occupeJusqu) return false; lancerMouette(); return true; });
}
function lancerMouette() {
  const m = monde.mouette;
  const fa = V.avant(v.cap);
  const fd = V.droite(v.cap);
  m.userData.vol = { t: 0, depart: new THREE.Vector3(v.pos.x + fa.x * 20 - fd.x * 26, v.pos.y + 4.5, v.pos.z + fa.z * 20 - fd.z * 26), dir: new THREE.Vector3(fd.x, 0, fd.z) };
  m.visible = true;
  planifier(1.4, () => { salutT = 0; dire(ch(T.rigolo.mouette), 'fete'); });
}

/* L'aide quand ça coince : au bout de quelques secondes sans geste utile, Moussi montre où toucher. */
function aider() {
  const id = missionCourante();
  if (!id || tempsSim < occupeJusqu) return;
  const attente = id === 'stationnaire' ? 9 : 7;
  if (tempsSim - Math.max(entree.derniere, derniereAide, missionDebut) < attente) return;
  derniereAide = tempsSim;
  if (id === 'tour' && suivi && suivi.presTour) { direObj(T.missions.tour.radio, 'aide'); montrerDoigt('radio'); return; }
  if (enseignement && !enseignement.merci) { direObj(T.missions[id].consigne, 'aide'); montrerDoigt(enseignement.cmd); return; }
  const cmd = id === 'poser' && V.distance(v, LIEUX.H) < 6 ? 'collectif' : commandeDe(id);
  direObj(T.missions[id].aide, 'aide');
  montrerDoigt(cmd);
}

function appelRadio() {
  if (!suivi || missionCourante() !== 'tour' || !suivi.presTour || suivi.radioEnCours) return;
  suivi.radioEnCours = true;
  cacherDoigt();
  KR.son('touche');
  direObj(T.radio.moussi, 'attend');
  const d1 = dureeDite(ch(T.radio.moussi)) + 0.3;
  planifier(d1, () => { KR.son('juste'); dire(ch(T.radio.tour), 'attend', { radio: lg() === 'fr' ? 'Tour de contrôle' : 'Control tower' }); });
  planifier(d1 + dureeDite(ch(T.radio.tour)) + 0.3, () => { dire(ch(T.radio.merci), 'fete'); planifier(1.4, () => { if (suivi) V.appelerTour(suivi); }); });
}

/* Un pas de la simulation : physique, missions, effets (sans rendu, pour pouvoir avancer vite en test). */
const PAS = 1 / 120;
let jaugePart = '';
function tic(dt) {
  tempsSim += dt;
  // Commandes : le levier reste où on l'a mis ; les pédales montent et descendent sans à-coup.
  entree.pedales += (entree.pedaleVoulue - entree.pedales) * Math.min(1, dt * 7);
  const c = Object.assign({}, forcer || { collectif: entree.levier, mancheX: entree.mancheX, mancheY: entree.mancheY, pedales: entree.pedales });
  if (phase === 'attente' || phase === 'fin') { c.mancheX = c.mancheY = c.pedales = 0; }
  V.pas(v, c, dt, monde.physique);
  if (phase === 'demarrage' && V.enMarche(v)) {
    phase = 'pret';
    dire(ch(T.pret), 'fete');
    planifier(dureeDite(ch(T.pret)) + 0.4, () => { phase = 'vol'; commencerMission(0); });
  }
  if (phase === 'coupure' && v.rotor.etat === 'arret') finDuVol();
  const id = missionCourante();
  if (id && suivi) {
    const p = V.progres(id, v, suivi, dt, LIEUX);
    const part = Math.round(p.part * 100) + '%';
    if (part !== jaugePart) { jaugePart = part; app.querySelector('.v-jauge-mission i').style.width = part; }
    const radio = app.querySelector('.v-radio');
    const montrer = id === 'tour' && suivi.presTour && !suivi.radio;
    if (radio.hidden === montrer) {
      radio.hidden = !montrer;
      if (montrer && !suivi.radioDit) { suivi.radioDit = true; direObj(T.missions.tour.radio, 'attend'); }
    }
    if (p.fait) missionReussie(id);
  } else {
    const radio = app.querySelector('.v-radio');
    if (radio && !radio.hidden) radio.hidden = true;
  }
  aider();
  surveiller(dt);
  deroulerPlanning();
}

/* ============================ Rendu ============================ */
function construireMonde() {
  const s = construireScene();
  const h = construireHelico(teinteMission(), etat.mission);
  s.scene.add(h.groupe);
  if (h.seau) s.scene.add(h.seau);
  const poussiere = systemePoints(320, 0xD9C59A, 2.6);
  const air = systemePoints(90, 0xBFE4FF, 0.9);
  s.scene.add(poussiere.points, air.points);
  const fleches = { haut: flecheVolume(COUL.collectif), sol: flechePlate(COUL.manche), tour: flecheTour(COUL.pedales) };
  s.scene.add(fleches.haut, fleches.sol, fleches.tour);
  const balise = construireBalise();
  s.scene.add(balise, balise.userData.sol);
  const mouette = construireMouette();
  s.scene.add(mouette);
  return {
    ...s, heli: h, poussiere, air, fleches, balise, mouette,
    physique: { sol: hauteurSol, obstacles: [{ x: TOUR.x, z: TOUR.z, r: 4.8, h: 25 }] },
  };
}

const vecCam = new THREE.Vector3();
const vecVise = new THREE.Vector3();
const vecTmp = new THREE.Vector3();
let camInit = false;
function majCamera(dt) {
  const cam = monde.camera;
  const o = cameraOrbite;
  if (o.vers) {
    const k = 1 - Math.exp(-dt * 1.2);
    o.yaw += (o.vers.yaw - o.yaw) * k;
    o.pitch += (o.vers.pitch - o.pitch) * k;
    o.dist += (o.vers.dist - o.dist) * k;
  } else if (tempsSim - o.dernier > 3.5) {
    const k = 1 - Math.exp(-dt * 0.8);
    o.yaw *= 1 - k;
    o.pitch *= 1 - k;
  }
  if (phase === 'attente') o.yaw += dt * 0.12; // en attendant le démarrage, on tourne autour de l'Écureuil
  const portrait = innerHeight > innerWidth;
  const haut = lisse(8, 60, v.hauteur);
  const dist = (portrait ? 22 : 17.5) * (1 + haut * 0.55) * o.dist;
  const elev = (portrait ? 7.5 : 6.2) + haut * 10 + o.pitch * dist;
  const a = v.cap + o.yaw + 0.42; // vu de trois quarts arrière, côté droit : on voit Moussi
  vecCam.set(v.pos.x + Math.sin(a) * dist, v.pos.y + elev, v.pos.z + Math.cos(a) * dist);
  const solCam = hauteurSol(vecCam.x, vecCam.z) + 1.5;
  if (vecCam.y < solCam) vecCam.y = solCam;
  vecVise.set(v.pos.x, v.pos.y + 1.8, v.pos.z);
  if (!camInit) { cam.position.copy(vecCam); camInit = true; } else cam.position.lerp(vecCam, 1 - Math.exp(-dt * 3.2));
  if (secousse > 0.001) {
    cam.position.x += (Math.random() - 0.5) * secousse * 0.6;
    cam.position.y += (Math.random() - 0.5) * secousse * 0.6;
    secousse *= Math.exp(-dt * 7);
  }
  cam.lookAt(vecVise);
}

const AXE_Y = new THREE.Vector3(0, 1, 0);
let compteNuages = 0;
function majRendu(dt, t) {
  const h = monde.heli;
  const g = h.groupe;
  g.position.set(v.pos.x, v.pos.y, v.pos.z);
  // Le corps penche un peu avec le disque ; petite secousse au toucher du sol.
  if (v.choc > 0.12 && secousse < v.choc * 0.4) secousse = v.choc * 0.45;
  g.rotation.set(v.disque.avant * -0.55, v.cap, v.disque.cote * -0.5, 'YXZ');
  if (v.sol) g.rotation.x = g.rotation.z = 0;
  const f = V.fractionRotor(v);
  // Le disque des pales s'incline davantage que le corps : c'est lui qui tire l'hélicoptère.
  h.rotor.rotation.set(v.disque.avant * -0.9, 0, v.disque.cote * -0.9);
  h.tourne.rotation.y = -v.rotor.angle;
  h.queue.rotation.x = v.rotor.queue;
  // Le pas des pales suit le collectif (exagéré pour qu'on le voie), le disque devient flou quand ça tourne vite.
  const pas = (2 + v.collectif * 16) * Math.PI / 180;
  h.pales.forEach(p => { p.rotation.x = -pas; });
  const flou = lisse(0.35, 0.95, f);
  h.disque.material.opacity = flou * 0.95;
  h.queueDisque.material.opacity = flou * 0.7;
  h.matPale.opacity = 1 - flou * 0.78;
  h.matBout.opacity = 1 - flou * 0.6;
  const transparent = flou > 0.02;
  if (h.matPale.transparent !== transparent) { h.matPale.transparent = h.matBout.transparent = transparent; h.matPale.needsUpdate = h.matBout.needsUpdate = true; }
  h.matPale.depthWrite = !transparent;
  h.flash.visible = V.enMarche(v) && (t % 1.4) < 0.08;
  h.gyro.material.color.setHex((t % 0.9) < 0.45 && f > 0.1 ? 0xFFB74D : 0x6B4A20);
  // Moussi : il regarde où on va, devient vert s'il a le tournis, son casque s'envole et revient, il salue.
  const m = h.moussi;
  m.tete.rotation.y = Math.max(-0.5, Math.min(0.5, -v.vitCap * 0.5));
  m.tete.rotation.z = Math.sin(t * 2.1) * 0.04;
  const vert = tempsSim < vertJusqu ? Math.sin(Math.min(1, (vertJusqu - tempsSim) / 2.2) * Math.PI) : 0;
  m.peau.color.copy(m.couleurPeau).lerp(new THREE.Color(0x8BC34A), vert * 0.85);
  if (casqueT >= 0) {
    casqueT += dt;
    const u = casqueT / 1.3;
    m.casque.position.y = Math.sin(Math.min(1, u) * Math.PI) * 0.55;
    m.casque.rotation.z = Math.sin(Math.min(1, u) * Math.PI * 2) * 0.6;
    m.bras.rotation.z = u < 1 ? -2.6 + Math.sin(u * Math.PI) * 0.8 : -2.6;
    if (u >= 1) { casqueT = -1; m.casque.position.y = 0; m.casque.rotation.z = 0; }
  } else if (salutT >= 0) {
    salutT += dt;
    m.bras.rotation.z = -2.9 + Math.sin(salutT * 12) * 0.35;
    if (salutT > 2.2) { salutT = -1; m.bras.rotation.z = -2.6; }
  } else m.bras.rotation.z = -2.6 + Math.sin(t * 1.3) * 0.03;
  // Le seau (feux de forêt) pend sous l'hélicoptère, et se pose au sol avec lui.
  if (h.seau) {
    const L = 4.5;
    const fond = Math.max(hauteurSol(v.pos.x, v.pos.z + 1.5) + 0.55, v.pos.y - L);
    h.seau.position.set(v.pos.x - v.vit.x * 0.08, fond, v.pos.z + 1.5 - v.vit.z * 0.08);
    const longueur = Math.max(0.05, v.pos.y + 0.2 - fond - 0.55);
    h.seau.userData.corde.scale.y = longueur;
    h.seau.userData.corde.position.y = longueur + 0.55;
    h.seau.userData.corde.visible = longueur > 0.3;
  }

  // Les flèches de la couleur de la commande, qui montrent son effet en direct.
  const F = monde.fleches;
  const solIci = hauteurSol(v.pos.x, v.pos.z);
  const vy = v.vit.y;
  const oHaut = Math.min(0.85, Math.abs(vy) / 2.2) * (v.sol && vy <= 0 ? 0 : 1);
  F.haut.userData.mat.opacity += (oHaut - F.haut.userData.mat.opacity) * Math.min(1, dt * 6);
  F.haut.position.set(v.pos.x, vy >= 0 ? v.pos.y + 4.6 : v.pos.y - 0.6, v.pos.z);
  F.haut.rotation.set(vy >= 0 ? 0 : Math.PI, 0, 0);
  F.haut.scale.setScalar(0.8 + Math.min(1, Math.abs(vy) / 4) * 0.6);
  const vh = V.vitesseH(v);
  F.sol.material.opacity += (Math.min(0.8, vh / 3) - F.sol.material.opacity) * Math.min(1, dt * 6);
  F.sol.position.set(v.pos.x, solIci + 0.18, v.pos.z);
  F.sol.rotation.y = Math.atan2(-v.vit.x, -v.vit.z);
  F.sol.scale.setScalar(1 + Math.min(1.2, vh / 6));
  F.sol.visible = F.sol.material.opacity > 0.02;
  const oTour = Math.min(0.85, Math.abs(v.vitCap) / 0.5);
  F.tour.userData.mat.opacity += (oTour - F.tour.userData.mat.opacity) * Math.min(1, dt * 6);
  F.tour.position.set(v.pos.x, solIci + 0.2, v.pos.z);
  F.tour.scale.set(v.vitCap > 0 ? -1 : 1, 1, 1);
  F.tour.rotation.y = v.cap + t * v.vitCap * 0.3;
  F.tour.visible = F.tour.userData.mat.opacity > 0.02;

  // La balise dorée au-dessus de la cible de la mission.
  const B = monde.balise;
  const id = missionCourante();
  const cible = id === 'tour' ? LIEUX.tour : (id === 'stationnaire' || id === 'poser' || id === 'tourner') ? LIEUX.H : null;
  B.visible = !!cible;
  B.userData.sol.visible = !!cible && id !== 'tour';
  if (cible) {
    B.position.set(cible.x, (id === 'tour' ? 16 : 13) + Math.sin(t * 2.4) * 0.6, cible.z);
    B.rotation.y = t * 1.2;
    B.userData.sol.position.set(LIEUX.H.x, 0.1, LIEUX.H.z);
    B.userData.sol.material.opacity = 0.35 + 0.25 * Math.sin(t * 3);
  }

  // La poussière soulevée par le souffle du rotor près du sol, le souffle d'air sous les pales.
  const souffle = f * f * Math.max(0, V.poussee(v.collectif, v.hauteur)) * lisse(14, 2, v.hauteur);
  poussiere = souffle;
  majPoussiere(monde.poussiere, dt, souffle, solIci);
  majAir(monde.air, dt, f * f * Math.max(0, V.poussee(v.collectif, 50) - 0.7) * (v.sol ? 0.4 : 1));

  // La mouette.
  const mo = monde.mouette;
  if (mo.visible && mo.userData.vol) {
    const w = mo.userData.vol;
    w.t += dt;
    mo.position.copy(w.depart).addScaledVector(w.dir, w.t * 9);
    mo.position.y += Math.sin(w.t * 1.5) * 0.8;
    mo.rotation.y = Math.atan2(-w.dir.x, -w.dir.z);
    const b = Math.sin(w.t * 9) * 0.6;
    mo.userData.ag.rotation.z = b;
    mo.userData.ad.rotation.z = -b;
    if (w.t > 8) mo.visible = false;
  }
  // Le soleil suit l'hélicoptère pour garder une ombre nette.
  monde.soleil.target.position.set(v.pos.x, solIci, v.pos.z);
  monde.soleil.position.set(v.pos.x + SOLEIL.x * 80, solIci + SOLEIL.y * 80, v.pos.z + SOLEIL.z * 80);
  monde.manche.rotation.y = 0.6 + Math.sin(t * 0.7) * 0.15;
  monde.manche.rotation.z = -0.15 + Math.sin(t * 3.1) * 0.05;
  if (++compteNuages % 8 === 0) majNuages(monde.nuages, t);

  // L'interface : la jauge de tours, la pale en coupe, les commandes qui brillent.
  const aiguille = app.querySelector('.v-aiguille');
  if (aiguille && aiguille.dataset.f !== f.toFixed(3)) {
    aiguille.dataset.f = f.toFixed(3);
    const ang = (180 + 124 * f) * Math.PI / 180;
    aiguille.setAttribute('d', `M70 74 L${(70 + 46 * Math.cos(ang)).toFixed(1)} ${(74 + 46 * Math.sin(ang)).toFixed(1)}`);
  }
  const pale = app.querySelector('.v-pale');
  const angle = Math.round(2 + v.collectif * 16);
  if (pale && pale.dataset.a !== String(angle)) { pale.dataset.a = String(angle); pale.innerHTML = D.pale(angle); }
}

function majPoussiere(sys, dt, souffle, solIci) {
  const P = sys.parts;
  const pos = sys.geo.attributes.position.array;
  const al = sys.geo.attributes.a.array;
  const ta = sys.geo.attributes.s.array;
  let aCreer = souffle > 0.05 && MOUVEMENT ? souffle * 140 * dt : 0;
  for (let i = 0; i < P.length; i++) {
    const p = P[i];
    if (p.vie <= 0 && aCreer >= 1 - Math.random()) {
      aCreer -= 1;
      const a = Math.random() * Math.PI * 2;
      const r = 1 + Math.random() * 3;
      p.x = v.pos.x + Math.cos(a) * r; p.z = v.pos.z + Math.sin(a) * r; p.y = solIci + 0.3;
      const vit = 6 + Math.random() * 6 * souffle;
      p.vx = Math.cos(a) * vit + v.vit.x * 0.3; p.vz = Math.sin(a) * vit + v.vit.z * 0.3; p.vy = 0.6 + Math.random() * 1.6;
      p.duree = 1.4 + Math.random() * 1.2; p.vie = p.duree; p.s = sys.taille * (0.7 + Math.random() * 0.8);
    }
    if (p.vie > 0) {
      p.vie -= dt;
      p.vx *= 1 - dt * 1.1; p.vz *= 1 - dt * 1.1; p.vy -= dt * 0.4;
      p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
      const u = 1 - p.vie / p.duree;
      al[i] = Math.sin(Math.min(1, u * 3) * Math.PI / 2) * (1 - u) * 0.55;
      ta[i] = p.s * (1 + u * 2.4);
    } else { al[i] = 0; }
    pos[i * 3] = p.x; pos[i * 3 + 1] = p.vie > 0 ? p.y : -999; pos[i * 3 + 2] = p.z;
  }
  sys.geo.attributes.position.needsUpdate = sys.geo.attributes.a.needsUpdate = sys.geo.attributes.s.needsUpdate = true;
}
function majAir(sys, dt, force) {
  const P = sys.parts;
  const pos = sys.geo.attributes.position.array;
  const al = sys.geo.attributes.a.array;
  const ta = sys.geo.attributes.s.array;
  let aCreer = force > 0.05 && MOUVEMENT ? force * 70 * dt : 0;
  for (let i = 0; i < P.length; i++) {
    const p = P[i];
    if (p.vie <= 0 && aCreer >= 1 - Math.random()) {
      aCreer -= 1;
      const a = Math.random() * Math.PI * 2;
      const r = 1.2 + Math.sqrt(Math.random()) * 4;
      p.x = v.pos.x + Math.cos(a) * r; p.z = v.pos.z + Math.sin(a) * r; p.y = v.pos.y + 3.3;
      p.vy = -(6 + Math.random() * 4); p.duree = 0.8; p.vie = p.duree;
    }
    if (p.vie > 0) {
      p.vie -= dt;
      p.y += p.vy * dt; p.x += v.vit.x * dt; p.z += v.vit.z * dt;
      const u = 1 - p.vie / p.duree;
      al[i] = Math.sin(u * Math.PI) * 0.5 * Math.min(1, force);
      ta[i] = sys.taille;
    } else al[i] = 0;
    pos[i * 3] = p.x; pos[i * 3 + 1] = p.vie > 0 ? p.y : -999; pos[i * 3 + 2] = p.z;
  }
  sys.geo.attributes.position.needsUpdate = sys.geo.attributes.a.needsUpdate = sys.geo.attributes.s.needsUpdate = true;
}

/* ============================ La boucle, la fréquence d'images, la résolution ============================ */
const mesure = { images: 0, depuis: performance.now(), fps: 0, journal: [] };
let ratioMax = 1.5;
let ratio = 1.5;
function redimensionner() {
  const w = innerWidth;
  const h = innerHeight;
  renderer.setPixelRatio(ratio);
  renderer.setSize(w, h, false);
  monde.camera.aspect = w / h;
  monde.camera.fov = h > w ? 62 : 50;
  // L'hélicoptère un peu au-dessus du centre de l'écran, loin des commandes du bas.
  monde.camera.setViewOffset(w, h, 0, Math.round(h * (h > w ? 0.07 : 0.09)), w, h);
  monde.camera.updateProjectionMatrix();
  monde.poussiere.points.material.uniforms.echelle.value = h * ratio * 0.7;
  monde.air.points.material.uniforms.echelle.value = h * ratio * 0.7;
  if (entree.majLevier) { entree.majLevier(); entree.majBouton(); }
}
let avant = performance.now();
let ecranEl = null;
let reste = 0;
let tempsRendu = 0;
function boucle(maintenant) {
  requestAnimationFrame(boucle);
  let dt = (maintenant - avant) / 1000;
  avant = maintenant;
  if (!(dt > 0)) return;
  dt = Math.min(dt, 0.1);
  reste += dt;
  while (reste >= PAS) { tic(PAS); reste -= PAS; }
  if (ecranEl.dataset.phase !== phase) ecranEl.dataset.phase = phase;
  tempsRendu += dt;
  majRendu(dt, tempsRendu);
  majCamera(dt);
  Son.maj(v, V.poussee(v.collectif, 50) - 0.45);
  renderer.render(monde.scene, monde.camera);
  // Fréquence d'images, mesurée sur des fenêtres de deux secondes ; la résolution baisse si l'appareil peine.
  mesure.images++;
  const ecoule = maintenant - mesure.depuis;
  if (ecoule >= 2000) {
    mesure.fps = mesure.images * 1000 / ecoule;
    mesure.journal.push(Math.round(mesure.fps * 10) / 10);
    if (mesure.journal.length > 30) mesure.journal.shift();
    mesure.images = 0;
    mesure.depuis = maintenant;
    if (mesure.fps < 50 && ratio > 1 && !document.hidden) { ratio = Math.max(1, ratio - 0.25); redimensionner(); }
    const el = app.querySelector('.v-fps');
    if (el) el.textContent = `${mesure.fps.toFixed(0)} i/s · x${ratio}`;
  }
}

/* ============================ Les écrans d'avant le vol ============================ */
function choisirLangue(suite) {
  const carte = l => `<button type="button" class="v-langue" data-a="langue" data-langue="${l}" lang="${l}">${KR.drapeau(l, 'v-drapeau')}<span>${l === 'fr' ? 'Français' : 'English'}</span></button>`;
  app.innerHTML = `<div class="v-ecran v-avant"><div class="v-fiche"><h2>${esc(KR.t('heli_langue_titre'))}</h2><div class="v-langues">${carte('fr')}${carte('en')}</div></div></div>`;
  KR.lire(KR.t('heli_langue_titre'), window.Textes.langue);
  app.onclick = e => { const b = e.target.closest('[data-a="langue"]'); if (!b) return; KR.son('touche'); etat.langue = b.dataset.langue; sauver(); suite(); };
}
function choisirMission(suite) {
  const carte = m => `<button type="button" class="v-mission-carte" data-a="mission" data-mission="${m.id}" style="--t:${HC.COULEURS[m.couleur].teinte}"><span class="v-ecusson">${D.svgObjet('ecusson', m.id, HC.COULEURS[m.couleur].teinte)}</span><b lang="${lg()}">${esc(ch(m.nom))}</b></button>`;
  app.innerHTML = `<div class="v-ecran v-avant"><div class="v-fiche"><h2 lang="${lg()}">${esc(ch(HC.HELICO.mission))}</h2><div class="v-missions-choix">${HC.MISSIONS.map(carte).join('')}</div></div></div>`;
  dire(ch(HC.HELICO.mission));
  app.onclick = e => { const b = e.target.closest('[data-a="mission"]'); if (!b) return; KR.son('touche'); etat.mission = b.dataset.mission; etat.couleur = HC.MISSIONS.find(x => x.id === etat.mission).couleur; sauver(); suite(); };
}
function sansWebGL() {
  app.innerHTML = `<div class="v-ecran v-avant"><div class="v-fiche"><div class="v-medaillon grand">${D.moussiPilote('aide')}</div><h2 lang="${lg()}">${esc(ui('pas3d'))}</h2>
    <a class="btn btn-primaire" href="helicopteres.html"><span lang="${lg()}">${esc(ui('version2d'))}</span></a></div></div>`;
}

/* ============================ Le lancement ============================ */
function lancer() {
  if (!webglDisponible()) { sansWebGL(); return; }
  ecranVol();
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  } catch (e) { sansWebGL(); return; }
  const tactile = matchMedia('(pointer: coarse)').matches;
  ratioMax = Math.min(window.devicePixelRatio || 1, tactile ? 1.5 : 2);
  ratio = Number(params.get('ratio')) || ratioMax;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.className = 'v-toile';
  app.querySelector('#scene3d').appendChild(renderer.domElement);
  ecranEl = app.querySelector('.v-ecran');
  monde = construireMonde();
  v = V.creer({ x: LIEUX.H.x, z: LIEUX.H.z, cap: Math.atan2(-(LIEUX.tour.x - LIEUX.H.x), -(LIEUX.tour.z - LIEUX.H.z)) });
  heli = monde.heli;
  cameraOrbite.yaw = 2.0;
  redimensionner();
  addEventListener('resize', redimensionner);
  brancherCommandes();
  brancherOrbite(renderer.domElement);
  majPastilles();
  app.querySelector('.v-titre-mission').textContent = '';
  // Avant le vol : le gros bouton pour démarrer le moteur, et le premier toucher réveille le son.
  const depart = document.createElement('div');
  depart.className = 'v-demarrer';
  depart.innerHTML = `<button type="button" class="btn btn-primaire v-gros" data-a="demarrer">${ICONE_CLE}<span lang="${lg()}">${esc(ui('demarrer'))}</span></button>`;
  app.querySelector('.v-hud').appendChild(depart);
  app.onclick = e => {
    const b = e.target.closest('[data-a]');
    if (!b) return;
    const a = b.dataset.a;
    if (a === 'demarrer') { KR.son('touche'); demarrerVol(); }
    if (a === 'radio') appelRadio();
    if (a === 'ecouter') { const id = missionCourante(); dire(id ? ch(enseignement && !enseignement.merci ? HC.COCKPIT.enseigner[enseignement.cmd].demande : T.missions[id].consigne) : ch(phase === 'attente' ? T.bienvenue : T.libre), 'attend'); }
    if (a === 'encore') { phase = 'fin'; v.rotor.etat = 'arret'; demarrerVol(); }
    if (a === 'libre') { app.querySelector('.v-voile').hidden = true; phase = 'libre'; V.demarrer(v); dire(ch(T.libre), 'fete'); app.querySelector('.v-titre-mission').textContent = ui('libre'); }
  };
  document.addEventListener('pointerdown', () => { Son.init(); Son.reveiller(); }, { once: true, capture: true });
  dire(ch(T.bienvenue), 'attend');
  requestAnimationFrame(t => { avant = t; boucle(t); });
}

/* Deux doigts sur la scène (ou la souris) font tourner la caméra autour de l'hélicoptère ; pincer rapproche. */
function brancherOrbite(toile) {
  const doigts = new Map();
  let ecart = 0;
  toile.addEventListener('pointerdown', e => { doigts.set(e.pointerId, { x: e.clientX, y: e.clientY }); toile.setPointerCapture(e.pointerId); if (doigts.size === 2) { const [a, b] = [...doigts.values()]; ecart = Math.hypot(a.x - b.x, a.y - b.y); } });
  toile.addEventListener('pointermove', e => {
    const d = doigts.get(e.pointerId);
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    d.x = e.clientX; d.y = e.clientY;
    const deux = doigts.size >= 2;
    if (!deux && e.pointerType !== 'mouse') return;
    const k = deux ? 0.5 : 1;
    cameraOrbite.vers = null;
    cameraOrbite.yaw -= dx * 0.006 * k;
    cameraOrbite.pitch = Math.max(-0.25, Math.min(0.9, cameraOrbite.pitch + dy * 0.004 * k));
    cameraOrbite.dernier = tempsSim;
    if (deux) {
      const [a, b] = [...doigts.values()];
      const n = Math.hypot(a.x - b.x, a.y - b.y);
      if (ecart > 0) cameraOrbite.dist = Math.max(0.55, Math.min(1.8, cameraOrbite.dist * ecart / n));
      ecart = n;
    }
  });
  const fin = e => { doigts.delete(e.pointerId); ecart = 0; };
  toile.addEventListener('pointerup', fin);
  toile.addEventListener('pointercancel', fin);
  toile.addEventListener('wheel', e => { e.preventDefault(); cameraOrbite.dist = Math.max(0.55, Math.min(1.8, cameraOrbite.dist * (1 + e.deltaY * 0.001))); }, { passive: false });
}

/* Pour le parcours de test : lire l'état, imposer des commandes, avancer le temps simulé. */
window.__vol3d = {
  etat: () => ({ phase, mission: missionCourante(), index: indexMission, pos: { ...v.pos }, hauteur: v.hauteur, sol: v.sol, cap: v.cap, vit: { ...v.vit }, tours: v.rotor.tours, rotor: v.rotor.etat, collectif: v.collectif, levier: entree.levier, manche: [entree.mancheX, entree.mancheY], pedales: entree.pedales, suivi: suivi ? { ...suivi } : null, fps: mesure.fps, journalFps: mesure.journal.slice(), ratio, temps: tempsSim, missions: { ...V.missionsFaites(etat) } }),
  lieux: LIEUX,
  forcer: c => { forcer = c; },
  avancer: (secondes, pilote) => { const n = Math.round(secondes / PAS); for (let i = 0; i < n; i++) { if (pilote) forcer = pilote(v, missionCourante(), suivi); tic(PAS); } if (pilote) forcer = null; return window.__vol3d.etat(); },
  radio: () => appelRadio(),
  camera: (yaw, pitch, dist) => { cameraOrbite.vers = { yaw, pitch, dist }; cameraOrbite.dernier = tempsSim; },
  V,
};

function commencer() {
  if (!etat.langue) { choisirLangue(commencer); return; }
  if (!etat.mission) { choisirMission(commencer); return; }
  lancer();
}
commencer();
