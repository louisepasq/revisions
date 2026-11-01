/* Géométrie des cartes du zoom : tracés SVG et « l'enfant a-t-il touché ce lieu ? ».
   Les formes viennent de cartes.js (entiers, viewBox de 1000 de large) :
   zone { f:'z', g:[anneau…] }, ligne { f:'l', g:[trait…] }, point { f:'p', g:[x,y], r? },
   chaque anneau ou trait étant une liste plate [x0,y0,x1,y1,…].
   Les tolérances sont en pixels d'écran : `echelle` donne les pixels par unité de la carte,
   pour qu'un doigt d'enfant ait la même marge sur iPad et sur iPhone. */
(function (racine) {
  'use strict';

  const RAYON_POINT_PX = 26; // un point se touche dans un disque de 52 px de diamètre
  const MARGE_POINT_PX = 16; // au-delà du dessin d'un gros point (une planète)
  const MARGE_LIGNE_PX = 22; // de part et d'autre d'un fleuve ou d'une ligne
  const MARGE_ZONE_PX = 10; // un peu au-delà du bord d'une zone
  const AUTRE_POINT_PX = 14; // toucher pile sur un autre lieu ponctuel, c'est le désigner

  function chemin(anneaux, fermer) {
    let d = '';
    for (const a of anneaux || []) {
      if (a.length < 4) continue;
      d += 'M' + a[0] + ' ' + a[1];
      for (let i = 2; i < a.length; i += 2) d += 'L' + a[i] + ' ' + a[i + 1];
      if (fermer) d += 'Z';
    }
    return d;
  }
  const dZone = anneaux => chemin(anneaux, true);
  const dLigne = traits => chemin(traits, false);

  /* Pair-impair sur tous les anneaux : les trous et les îles se règlent d'eux-mêmes. */
  function dedans(anneaux, x, y) {
    let c = false;
    for (const a of anneaux || []) {
      const n = a.length;
      for (let i = 0, j = n - 2; i < n; j = i, i += 2) {
        const xi = a[i], yi = a[i + 1], xj = a[j], yj = a[j + 1];
        if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
      }
    }
    return c;
  }

  function distSegment(x, y, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const l2 = dx * dx + dy * dy;
    let t = l2 ? ((x - x1) * dx + (y - y1) * dy) / l2 : 0;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(x - (x1 + t * dx), y - (y1 + t * dy));
  }

  function distTraits(traits, x, y, fermer) {
    let d = Infinity;
    for (const a of traits || []) {
      for (let i = 2; i < a.length; i += 2) d = Math.min(d, distSegment(x, y, a[i - 2], a[i - 1], a[i], a[i + 1]));
      if (fermer && a.length >= 4) d = Math.min(d, distSegment(x, y, a[a.length - 2], a[a.length - 1], a[0], a[1]));
    }
    return d;
  }

  /* Distance du toucher au lieu, en pixels d'écran ; 0 dans une zone. */
  function distancePx(forme, x, y, echelle) {
    if (forme.f === 'p') {
      const d = Math.hypot(x - forme.g[0], y - forme.g[1]) * echelle;
      return Math.max(0, d - (forme.r || 0) * echelle);
    }
    if (forme.f === 'l') return distTraits(forme.g, x, y, false) * echelle;
    if (dedans(forme.g, x, y)) return 0;
    return distTraits(forme.g, x, y, true) * echelle;
  }

  function surTerre(etage, x, y) {
    return (etage.terre || []).some(i => dedans(etage.fond[i][2], x, y));
  }

  /* Le toucher tombe-t-il sur ce lieu, avec la marge d'un doigt ? Une mer ou un océan (ht)
     ne compte que hors des terres. */
  function touche(etage, forme, x, y, echelle) {
    if (!forme) return false;
    if (forme.ht && surTerre(etage, x, y)) return false;
    const d = distancePx(forme, x, y, echelle);
    if (forme.f === 'p') return d <= (forme.r ? MARGE_POINT_PX : RAYON_POINT_PX);
    if (forme.f === 'l') return d <= MARGE_LIGNE_PX;
    return d <= MARGE_ZONE_PX;
  }

  /* Un autre lieu ponctuel touché de près, et plus près que la cible : l'enfant l'a désigné
     (la Lune quand on demandait la Terre), même si le disque de la cible le couvre aussi. */
  function autrePointDesigne(etage, idCible, ids, x, y, echelle) {
    const cible = etage.formes[idCible];
    const dCible = cible ? distancePx(cible, x, y, echelle) : Infinity;
    return ids.some(id => {
      if (id === idCible) return false;
      const f = etage.formes[id];
      if (!f || f.f !== 'p') return false;
      const d = distancePx(f, x, y, echelle);
      return d <= AUTRE_POINT_PX && d < dCible;
    });
  }

  /* Réponse à « Touche X » : ids est la liste des lieux de la carte qui comptent. */
  function toucheJuste(etage, idCible, ids, x, y, echelle) {
    return touche(etage, etage.formes[idCible], x, y, echelle) && !autrePointDesigne(etage, idCible, ids, x, y, echelle);
  }

  /* Le lieu le plus précis sous le doigt (exploration) : un point, puis une ligne, puis la plus
     petite zone ; null si rien. */
  function lieuSous(etage, ids, x, y, echelle) {
    let meilleur = null;
    let rang = Infinity;
    for (const id of ids) {
      const f = etage.formes[id];
      if (!f || !touche(etage, f, x, y, echelle)) continue;
      const d = distancePx(f, x, y, echelle);
      const r = f.f === 'p' ? d : f.f === 'l' ? 1e4 + d : 1e6 + (f.a || 0) / 1e3;
      if (r < rang) { rang = r; meilleur = id; }
    }
    return meilleur;
  }

  /* Rectangle englobant d'une forme, pour cadrer un zoom. */
  function boite(forme) {
    if (forme.f === 'p') {
      const r = forme.r || 0;
      return [forme.g[0] - r, forme.g[1] - r, 2 * r, 2 * r];
    }
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const a of forme.g) for (let i = 0; i < a.length; i += 2) {
      x0 = Math.min(x0, a[i]); x1 = Math.max(x1, a[i]);
      y0 = Math.min(y0, a[i + 1]); y1 = Math.max(y1, a[i + 1]);
    }
    return [x0, y0, x1 - x0, y1 - y0];
  }

  racine.ZoomGeo = { RAYON_POINT_PX, dZone, dLigne, dedans, distancePx, surTerre, touche, toucheJuste, lieuSous, boite };
})(typeof window !== 'undefined' ? window : globalThis);
