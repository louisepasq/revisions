/* Prototype 3D du module des hélicoptères (D-26) : le modèle de vol de l'Écureuil, les cinq missions et
   leur trace dans le carnet de pilote. Logique pure, sans rendu : testée par vol.test.js, utilisée par
   vol3d.js. Script classique, chargé aussi par node.

   Physique simplifiée mais juste dans son principe (faits du README, FAA chapitres 2 et 3) :
   - le rotor tourne à vitesse constante en vol (390 tours par minute, entre 375 et 405) ; le collectif ne
     change jamais cette vitesse, il change l'inclinaison des pales, donc la poussée ;
   - poussée plus forte que le poids : on monte ; plus faible : on descend ; égale : on reste à la même
     hauteur (une bande au milieu du levier, pour qu'un enfant y arrive) ;
   - effet de sol : près du sol, l'air poussé vers le bas rebondit, la même inclinaison porte un peu plus ;
   - le manche penche le disque des pales : une part de la poussée tire l'hélicoptère de ce côté ;
   - les pédales changent la poussée du rotor de queue : le nez tourne ;
   - inertie douce (traînée), atterrissage freiné près du sol, aucun crash : le sol, les obstacles et les
     bords du monde arrêtent sans casser.

   Repère : y vers le haut ; le nez regarde -z quand le cap vaut 0 ; pédale droite, nez à droite. */
(function (racine) {
  'use strict';

  const G = 9.81;
  const TOURS_ROTOR = 390; // tours par minute en vol (EASA.R.008 : 375 à 405)
  const DUREE_DEMARRAGE = 5; // secondes pour que le rotor prenne sa vitesse
  const DUREE_COUPURE = 9; // le rotor ralentit doucement, on voit ses trois pales
  const BANDE = [0.42, 0.58]; // collectif : la bande où la poussée égale le poids
  const MONTEE_MAX = 4.5; // m/s, collectif tout en haut
  const DESCENTE_MAX = 3.2; // m/s, collectif tout en bas
  const KV = 1.6; // amortissement vertical (par seconde)
  const KH = 0.32; // traînée horizontale : vitesse maximale g tan(18°) / KH, environ 10 m/s
  const INCLINAISON_MAX = 0.31; // radians, environ 18 degrés de disque
  const TAU_DISQUE = 0.35;
  const LACET_MAX = 0.9; // radians par seconde
  const TAU_LACET = 0.45;
  const TAU_COLLECTIF = 0.35; // le levier bouge les pales sans à-coup
  const EFFET_SOL = 0.15; // +15 % de poussée posé au sol, plus rien à HAUTEUR_EFFET_SOL
  const HAUTEUR_EFFET_SOL = 6;
  const DESCENTE_DOUCE = 0.9; // m/s : la vitesse la plus forte au contact du sol
  const HAUTEUR_DOUCE = 6;
  const PLAFOND = 140;
  const RAYON_MONDE = 260;
  const RAYON_HELICO = 5.4; // le disque du rotor : la place prise autour des obstacles

  const borne = (x, a, b) => Math.max(a, Math.min(b, x));
  const vers = (x, cible, tau, dt) => x + (cible - x) * (1 - Math.exp(-dt / tau));

  /* Un hélicoptère neuf, posé, rotor arrêté. */
  function creer(o) {
    o = o || {};
    return {
      pos: { x: o.x || 0, y: o.y || 0, z: o.z || 0 },
      vit: { x: 0, y: 0, z: 0 },
      cap: o.cap || 0,
      vitCap: 0,
      disque: { avant: 0, cote: 0 }, // inclinaison du disque des pales (radians)
      collectif: 0, // l'inclinaison commune des pales suit le levier (0 à 1)
      rotor: { tours: 0, etat: 'arret', angle: 0, queue: 0 },
      sol: true,
      hauteur: 0,
      choc: 0, // vitesse du dernier contact avec le sol ou un obstacle (petite secousse)
      temps: 0,
    };
  }

  function demarrer(v) { if (v.rotor.etat === 'arret' || v.rotor.etat === 'coupure') v.rotor.etat = 'demarrage'; }
  function couper(v) { if (v.rotor.etat !== 'arret') v.rotor.etat = 'coupure'; }
  const enMarche = v => v.rotor.etat === 'marche';
  const fractionRotor = v => v.rotor.tours / TOURS_ROTOR;

  /* La poussée par rapport au poids, en air libre, pour un collectif donné (0 à 1). */
  function facteurPas(c) {
    c = borne(c, 0, 1);
    if (c < BANDE[0]) return 1 - (1 - c / BANDE[0]) * (DESCENTE_MAX * KV / G);
    if (c <= BANDE[1]) return 1;
    return 1 + ((c - BANDE[1]) / (1 - BANDE[1])) * (MONTEE_MAX * KV / G);
  }
  const effetSol = h => 1 + EFFET_SOL * Math.max(0, 1 - Math.max(0, h) / HAUTEUR_EFFET_SOL);
  /* La poussée du rotor, rapportée au poids : 1 veut dire qu'elle porte exactement l'hélicoptère. */
  function poussee(c, hauteur, fraction) {
    const f = fraction === undefined ? 1 : fraction;
    return facteurPas(c) * effetSol(hauteur) * f * f;
  }

  const avant = cap => ({ x: -Math.sin(cap), z: -Math.cos(cap) });
  const droite = cap => ({ x: Math.cos(cap), z: -Math.sin(cap) });

  /* Un pas de simulation. cmd : { collectif 0..1, mancheX -1..1 (droite), mancheY -1..1 (avant),
     pedales -1..1 (droite) }. monde : { sol(x, z) -> hauteur du terrain, obstacles: [{ x, z, r, h }] }. */
  function pas(v, cmd, dt, monde) {
    dt = Math.min(Math.max(dt, 0), 0.05);
    const sol = monde && monde.sol ? monde.sol : () => 0;
    const obstacles = (monde && monde.obstacles) || [];
    v.temps += dt;
    v.choc = Math.max(0, v.choc - dt * 3);

    // Le rotor : il démarre, tourne à vitesse constante, ou ralentit à la coupure. Rien d'autre ne le change.
    const r = v.rotor;
    if (r.etat === 'demarrage') {
      r.tours = Math.min(TOURS_ROTOR, r.tours + TOURS_ROTOR / DUREE_DEMARRAGE * dt);
      if (r.tours >= TOURS_ROTOR) r.etat = 'marche';
    } else if (r.etat === 'marche') {
      r.tours = TOURS_ROTOR;
    } else if (r.etat === 'coupure') {
      r.tours = Math.max(0, r.tours - TOURS_ROTOR / DUREE_COUPURE * dt);
      if (r.tours <= 0) r.etat = 'arret';
    }
    r.angle = (r.angle + r.tours / 60 * 2 * Math.PI * dt) % (2 * Math.PI);
    r.queue = (r.queue + r.tours / 60 * 2 * Math.PI * dt * 4.6) % (2 * Math.PI);
    const frac = fractionRotor(v);

    // Les commandes : le collectif suit le levier ; le disque et le lacet suivent le manche et les pédales.
    const c = cmd || {};
    v.collectif = vers(v.collectif, borne(c.collectif || 0, 0, 1), TAU_COLLECTIF, dt);
    const enVol = !v.sol;
    const mx = enVol ? borne(c.mancheX || 0, -1, 1) : 0;
    const my = enVol ? borne(c.mancheY || 0, -1, 1) : 0;
    v.disque.avant = vers(v.disque.avant, my * INCLINAISON_MAX, TAU_DISQUE, dt);
    v.disque.cote = vers(v.disque.cote, mx * INCLINAISON_MAX, TAU_DISQUE, dt);
    const pedale = enVol ? borne(c.pedales || 0, -1, 1) : 0;
    v.vitCap = vers(v.vitCap, -pedale * LACET_MAX * frac, TAU_LACET, dt);
    if (!enVol) v.vitCap = vers(v.vitCap, 0, 0.1, dt);
    v.cap += v.vitCap * dt;

    // Vertical : la poussée contre le poids, amortie.
    const solIci = sol(v.pos.x, v.pos.z);
    const h = v.pos.y - solIci;
    const p = poussee(v.collectif, h, frac);
    let ay = G * (p - 1) - KV * v.vit.y;
    v.vit.y += ay * dt;
    // Près du sol, la descente est freinée : on touche toujours en douceur.
    if (h < HAUTEUR_DOUCE) v.vit.y = Math.max(v.vit.y, -(DESCENTE_DOUCE + Math.max(0, h) * 0.5));

    // Horizontal : la part de poussée du disque penché, moins la traînée ; au sol, les patins freinent.
    const fa = avant(v.cap);
    const fd = droite(v.cap);
    const portance = Math.min(p, 1.2) * (enVol ? 1 : 0);
    const ax = G * portance * (Math.tan(v.disque.avant) * fa.x + Math.tan(v.disque.cote) * fd.x) - KH * v.vit.x;
    const az = G * portance * (Math.tan(v.disque.avant) * fa.z + Math.tan(v.disque.cote) * fd.z) - KH * v.vit.z;
    v.vit.x += ax * dt;
    v.vit.z += az * dt;
    if (!enVol) { v.vit.x = vers(v.vit.x, 0, 0.12, dt); v.vit.z = vers(v.vit.z, 0, 0.12, dt); }

    v.pos.x += v.vit.x * dt;
    v.pos.y += v.vit.y * dt;
    v.pos.z += v.vit.z * dt;

    // Les obstacles (des cylindres) : on glisse le long, sans casser.
    for (const o of obstacles) {
      const dx = v.pos.x - o.x;
      const dz = v.pos.z - o.z;
      const d = Math.hypot(dx, dz);
      const mini = o.r + RAYON_HELICO;
      if (d < mini && v.pos.y < o.h) {
        const nx = d > 1e-6 ? dx / d : 1;
        const nz = d > 1e-6 ? dz / d : 0;
        v.pos.x = o.x + nx * mini;
        v.pos.z = o.z + nz * mini;
        const vn = v.vit.x * nx + v.vit.z * nz;
        if (vn < 0) {
          v.choc = Math.max(v.choc, Math.min(1, -vn / 6));
          v.vit.x -= vn * nx * 1.3;
          v.vit.z -= vn * nz * 1.3;
        }
      }
    }
    // Les bords du monde et le plafond : on est ramené doucement.
    const rayon = Math.hypot(v.pos.x, v.pos.z);
    if (rayon > RAYON_MONDE) {
      const nx = v.pos.x / rayon;
      const nz = v.pos.z / rayon;
      const vn = v.vit.x * nx + v.vit.z * nz;
      if (vn > 0) { v.vit.x -= vn * nx * 1.2; v.vit.z -= vn * nz * 1.2; }
      v.pos.x = nx * RAYON_MONDE;
      v.pos.z = nz * RAYON_MONDE;
    }
    if (v.pos.y > PLAFOND) { v.pos.y = PLAFOND; v.vit.y = Math.min(0, v.vit.y); }

    // Le sol : jamais en dessous ; un contact fait une petite secousse, rien de plus.
    const solApres = sol(v.pos.x, v.pos.z);
    if (v.pos.y <= solApres) {
      if (!v.sol && v.vit.y < -0.2) v.choc = Math.max(v.choc, Math.min(1, -v.vit.y / 3));
      v.pos.y = solApres;
      if (v.vit.y < 0) v.vit.y = 0;
      v.sol = true;
    } else if (v.pos.y > solApres + 0.05) {
      v.sol = false;
    }
    v.hauteur = v.pos.y - solApres;
    return v;
  }

  const vitesseH = v => Math.hypot(v.vit.x, v.vit.z);
  const distance = (v, p) => Math.hypot(v.pos.x - p.x, v.pos.z - p.z);
  /* L'angle (radians, -pi à pi) entre le nez et la direction d'un lieu. */
  function angleVers(v, p) {
    const a = Math.atan2(-(p.x - v.pos.x), -(p.z - v.pos.z));
    let d = a - v.cap;
    while (d > Math.PI) d -= 2 * Math.PI;
    while (d < -Math.PI) d += 2 * Math.PI;
    return d;
  }

  /* ---------- Les cinq missions, dans l'ordre ---------- */
  const MISSIONS = ['decoller', 'stationnaire', 'tour', 'tourner', 'poser'];
  const SEUILS = {
    decoller: 2.5, // mètres au-dessus du sol
    stationnaire: { rayon: 9, hMin: 1.5, hMax: 25, vitesse: 1.6, duree: 3 },
    tour: 42, // mètres de la tour : la radio s'allume
    tourner: { lacet: 1.2, angle: 0.6, vitesse: 4 },
    poser: 7, // mètres du centre du H
  };

  function creerSuivi(v, lieux) {
    return { stationnaire: 0, lacet: 0, capAvant: v ? v.cap : 0, presTour: false, radio: false, depart: lieux && v ? distance(v, lieux.tour) : 80 };
  }

  /* Où en est la mission ? Rend { fait, part } (part de 0 à 1, pour le cercle qui se remplit).
     lieux : { H: { x, z }, tour: { x, z } }. suivi : la mémoire de la mission, gardée par l'appelant. */
  function progres(id, v, suivi, dt, lieux) {
    const S = SEUILS;
    const dCap = v.cap - suivi.capAvant;
    suivi.capAvant = v.cap;
    switch (id) {
      case 'decoller':
        return { fait: enMarche(v) && v.hauteur > S.decoller, part: borne(v.hauteur / S.decoller, 0, 1) };
      case 'stationnaire': {
        const s = S.stationnaire;
        const ok = !v.sol && distance(v, lieux.H) < s.rayon && v.hauteur > s.hMin && v.hauteur < s.hMax
          && vitesseH(v) < s.vitesse && Math.abs(v.vit.y) < 1.2;
        suivi.stationnaire = ok ? suivi.stationnaire + dt : Math.max(0, suivi.stationnaire - dt * 0.5);
        return { fait: suivi.stationnaire >= s.duree, part: borne(suivi.stationnaire / s.duree, 0, 1), ok };
      }
      case 'tour': {
        const d = distance(v, lieux.tour);
        suivi.presTour = d < S.tour;
        return { fait: suivi.radio, part: suivi.radio ? 1 : borne(1 - (d - S.tour) / Math.max(1, suivi.depart - S.tour), 0, 0.95), pres: suivi.presTour };
      }
      case 'tourner': {
        const s = S.tourner;
        if (!v.sol && vitesseH(v) < s.vitesse) suivi.lacet += Math.abs(dCap);
        const a = Math.abs(angleVers(v, lieux.H));
        return { fait: suivi.lacet >= s.lacet && a < s.angle, part: borne(Math.min(suivi.lacet / s.lacet, 1 - a / Math.PI), 0, 1) };
      }
      case 'poser': {
        const d = distance(v, lieux.H);
        return { fait: v.sol && d < S.poser && enMarche(v), part: borne(1 - (d - S.poser) / 80, 0, 0.9) + (v.sol && d < S.poser ? 0.1 : 0) };
      }
      default:
        return { fait: false, part: 0 };
    }
  }
  /* La radio : appelée près de la tour, elle donne l'autorisation (mission « tour »). */
  function appelerTour(suivi) { if (suivi.presTour) suivi.radio = true; return suivi.radio; }

  /* ---------- Le carnet de pilote : un tampon par mission réussie ----------
     Champ facultatif `vol3d` de l'état du module (<enfant>.helicopteres) : { missions: { id: jour } }.
     Un état sans ce champ se relit tel quel ; un tampon posé ne s'enlève jamais. */
  function jour(maintenant) {
    const d = maintenant || new Date();
    if (racine.Zoom && racine.Zoom.jour) return racine.Zoom.jour(d);
    const p = n => String(n).padStart(2, '0');
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  }
  const estObjet = x => x !== null && typeof x === 'object' && !Array.isArray(x);
  function vols(etat) {
    if (!estObjet(etat.vol3d)) etat.vol3d = {};
    if (!estObjet(etat.vol3d.missions)) etat.vol3d.missions = {};
    return etat.vol3d;
  }
  const missionsFaites = etat => (estObjet(etat && etat.vol3d) && estObjet(etat.vol3d.missions) ? etat.vol3d.missions : {});
  /* Rend true si le tampon est nouveau. */
  function noterMission(etat, id, maintenant) {
    if (!MISSIONS.includes(id)) return false;
    const m = vols(etat).missions;
    if (m[id]) return false;
    m[id] = jour(maintenant);
    return true;
  }

  racine.HeliVol = {
    G, TOURS_ROTOR, DUREE_DEMARRAGE, DUREE_COUPURE, BANDE, INCLINAISON_MAX, RAYON_MONDE, PLAFOND, MISSIONS, SEUILS,
    creer, demarrer, couper, enMarche, fractionRotor, facteurPas, effetSol, poussee, pas, avant, droite,
    vitesseH, distance, angleVers, creerSuivi, progres, appelerTour, noterMission, missionsFaites,
  };
})(typeof window !== 'undefined' ? window : globalThis);
