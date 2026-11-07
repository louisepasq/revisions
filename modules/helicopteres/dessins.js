/* Les dessins du module des hélicoptères, tous originaux (ni photo, ni logo Airbus, D-24 point 6) :
   l'Écureuil vu de côté et vu de dessus, ses parties, les trois commandes, Moussi en tenue de pilote,
   les objets du carnet, le gabarit A4 du modèle en papier et son manuel, les comparaisons des records.
   Faits visibles de l'H125 respectés : trois pales, rotor de queue à deux pales, patins (fiche EASA.R.008).
   Chaque fonction rend une chaîne SVG. Script classique, chargé aussi par node. */
(function (racine) {
  'use strict';

  const TRAIT = '#262A45';
  const VITRE = '#BFE3F5';
  const OR = '#F2B632';

  /* ---------- L'Écureuil vu de côté, nez à droite (viewBox 0 0 400 192) ----------
     o.couleur : teinte de la cabine ; o.mission : 'feux' ajoute le seau ; o.surligne : une partie
     (pales, queue, patins, cabine, poutre) entourée de surligneur ; o.tourne : les pales et le rotor
     de queue tournent ; o.queueActive : le rotor de queue s'allume (pédales) ; o.parties : chaque
     partie porte data-partie (on la touche). */
  function helico(o) {
    o = o || {};
    const c = o.couleur || '#F2C230';
    const p = id => (o.parties ? ` data-partie="${id}" class="h-partie${o.surligne === id ? ' h-surligne' : ''}"` : (o.surligne === id ? ' class="h-surligne"' : ''));
    const seau = o.mission === 'feux'
      ? `<g class="h-seau"><path d="M214 158V176" stroke="${TRAIT}" stroke-width="2.5"/><path d="M203 176h22l-3 13h-16z" fill="#E86A17" stroke="${TRAIT}" stroke-width="2.5" stroke-linejoin="round"/></g>` : '';
    return `<g class="h-helico">
      <g${p('poutre')}><path d="M134 90 L34 97 L34 107 L136 114 Z" fill="${c}" stroke="${TRAIT}" stroke-width="3" stroke-linejoin="round"/>
        <rect x="62" y="99" width="30" height="6" rx="3" fill="${c}" stroke="${TRAIT}" stroke-width="2.5"/>
        <path d="M44 98 L30 64 L41 62 L55 98 Z M42 106 L34 121 L45 121 L52 106 Z" fill="${c}" stroke="${TRAIT}" stroke-width="2.5" stroke-linejoin="round"/></g>
      <g${p('queue')}><circle cx="36" cy="80" r="17" class="h-disque-queue${o.queueActive ? ' actif' : ''}"/>
        <g class="h-rotor-queue${o.tourne ? ' tourne' : ''}"><path d="M36 64 V96" stroke="${TRAIT}" stroke-width="4" stroke-linecap="round"/></g>
        <circle cx="36" cy="80" r="4" fill="${TRAIT}"/></g>
      <g${p('patins')}><path d="M172 133 L162 157 M280 133 L290 157" stroke="${TRAIT}" stroke-width="5" stroke-linecap="round"/>
        <path d="M140 158 H310 C320 158 326 153 329 146" fill="none" stroke="${TRAIT}" stroke-width="6" stroke-linecap="round"/></g>
      ${seau}
      <g${p('cabine')}><path d="M160 58 C164 45 180 40 196 40 L232 40 C241 40 246 47 246 56 Z" fill="${c}" stroke="${TRAIT}" stroke-width="3" stroke-linejoin="round"/>
        <path d="M128 84 C132 62 160 55 190 55 L252 55 C287 55 313 76 319 100 C322 118 312 133 290 134 L160 134 C138 133 126 118 128 100 Z" fill="${c}" stroke="${TRAIT}" stroke-width="3" stroke-linejoin="round"/>
        <path d="M140 121 H306" stroke="${TRAIT}" stroke-width="2" opacity=".35"/>
        <path d="M258 62 C284 64 304 80 311 98 L262 98 Z" fill="${VITRE}" stroke="${TRAIT}" stroke-width="2.5" stroke-linejoin="round"/>
        <rect x="198" y="64" width="50" height="32" rx="7" fill="${VITRE}" stroke="${TRAIT}" stroke-width="2.5"/>
        <g class="h-moussi-vitre"><circle cx="271" cy="74" r="6" fill="#BDB7AD"/><circle cx="285" cy="74" r="6" fill="#BDB7AD"/><circle cx="278" cy="82" r="9" fill="#C6C1B8"/><circle cx="278" cy="85" r="2.6" fill="#1E1E24"/></g></g>
      <rect x="204" y="25" width="8" height="17" fill="${TRAIT}"/>
      <g${p('pales')}><ellipse cx="208" cy="23" rx="180" ry="6" class="h-disque"/>
        <g class="h-pales${o.tourne ? ' tourne' : ''}"><path d="M30 23 H386" stroke="${TRAIT}" stroke-width="5" stroke-linecap="round"/></g>
        <circle cx="208" cy="24" r="7" fill="${TRAIT}"/></g>
    </g>`;
  }
  const svgHelico = (o, classe) => `<svg class="h-dessin${classe ? ' ' + classe : ''}" viewBox="0 0 400 192" role="img" aria-hidden="true">${helico(o)}</svg>`;

  /* ---------- Vu de dessus, nez en haut (viewBox -60 -60 120 120) : pour les pédales et le manche
     sur le côté. cap en degrés (le nez qui tourne), glisse en unités (le manche à gauche ou à droite). */
  function vueDessus(couleur, cap, glisse) {
    return `<g transform="translate(${glisse || 0} 0) rotate(${cap || 0})">
      <circle r="50" fill="none" stroke="${TRAIT}" stroke-width="1.5" stroke-dasharray="4 5" opacity=".5"/>
      <path d="M-3 18 L-4 54 L4 54 L3 18 Z" fill="${couleur}" stroke="${TRAIT}" stroke-width="2"/>
      <path d="M-11 54 H11" stroke="${TRAIT}" stroke-width="3" stroke-linecap="round"/>
      <ellipse cx="0" cy="-2" rx="16" ry="26" fill="${couleur}" stroke="${TRAIT}" stroke-width="2.5"/>
      <path d="M-11 -14 C-8 -26 8 -26 11 -14 Z" fill="${VITRE}" stroke="${TRAIT}" stroke-width="2"/>
      <g stroke="${TRAIT}" stroke-width="3.5" stroke-linecap="round"><path d="M0 0 L0 -46"/><path d="M0 0 L40 23"/><path d="M0 0 L-40 23"/></g>
      <circle r="4" fill="${TRAIT}"/></g>`;
  }

  /* ---------- La pale vue en coupe (viewBox 0 0 160 80) : l'inclinaison du pas collectif. */
  function pale(angle) {
    const air = angle > 6 ? `<g class="h-air" stroke-dasharray="4 6" stroke-width="3" stroke-linecap="round"><path d="M50 52 V74"/><path d="M80 54 V78"/><path d="M110 52 V74"/></g>` : '';
    return `<path d="M8 40 H152" stroke="${TRAIT}" stroke-width="1.5" stroke-dasharray="3 5" opacity=".45"/>
      <g transform="rotate(${-angle} 80 40)"><path d="M22 40 C34 30 70 29 140 38 C70 44 34 46 22 40 Z" fill="#E8E6E1" stroke="${TRAIT}" stroke-width="3" stroke-linejoin="round"/></g>${air}`;
  }

  /* ---------- Le compteur de tours (viewBox 0 0 140 86) : l'aiguille ne bouge jamais (D-24, point 1). */
  function compteur() {
    const arc = (r, a0, a1) => {
      const pt = a => [70 + r * Math.cos(a * Math.PI / 180), 74 + r * Math.sin(a * Math.PI / 180)].map(n => n.toFixed(1)).join(' ');
      return `M${pt(a0)} A${r} ${r} 0 0 1 ${pt(a1)}`;
    };
    return `<path d="${arc(56, 180, 360)}" fill="none" stroke="#D8D3CA" stroke-width="12" stroke-linecap="round"/>
      <path d="${arc(56, 290, 318)}" fill="none" stroke="#3AA75A" stroke-width="12" stroke-linecap="round"/>
      <path d="M70 74 L${(70 + 46 * Math.cos(304 * Math.PI / 180)).toFixed(1)} ${(74 + 46 * Math.sin(304 * Math.PI / 180)).toFixed(1)}" stroke="${TRAIT}" stroke-width="5" stroke-linecap="round"/>
      <circle cx="70" cy="74" r="7" fill="${TRAIT}"/>`;
  }

  /* ---------- Les trois commandes, en pictogrammes (viewBox 0 0 120 120). */
  function commande(id, couleur) {
    const k = couleur || TRAIT;
    if (id === 'collectif') {
      return `<rect x="14" y="92" width="44" height="16" rx="6" fill="#8D877C" stroke="${TRAIT}" stroke-width="3"/>
        <path d="M36 96 L96 36" style="stroke:${k}" stroke-width="12" stroke-linecap="round"/>
        <rect x="84" y="16" width="26" height="34" rx="9" transform="rotate(45 97 33)" style="fill:${k}" stroke="${TRAIT}" stroke-width="3"/>`;
    }
    if (id === 'manche') {
      return `<ellipse cx="60" cy="104" rx="30" ry="9" fill="#8D877C" stroke="${TRAIT}" stroke-width="3"/>
        <path d="M60 102 V40" style="stroke:${k}" stroke-width="12" stroke-linecap="round"/>
        <rect x="46" y="12" width="28" height="40" rx="12" style="fill:${k}" stroke="${TRAIT}" stroke-width="3"/>
        <circle cx="60" cy="22" r="4" fill="#FFFFFF"/>`;
    }
    return `<rect x="10" y="30" width="44" height="64" rx="12" style="fill:${k}" stroke="${TRAIT}" stroke-width="3"/>
      <rect x="66" y="30" width="44" height="64" rx="12" style="fill:${k}" stroke="${TRAIT}" stroke-width="3"/>
      <path d="M20 46 H44 M20 58 H44 M20 70 H44 M76 46 H100 M76 58 H100 M76 70 H100" stroke="#FFFFFF" stroke-width="3" opacity=".6" stroke-linecap="round"/>`;
  }
  const svgCommande = (id, couleur, classe) => `<svg class="h-picto${classe ? ' ' + classe : ''}" viewBox="0 0 120 120" aria-hidden="true">${commande(id, couleur)}</svg>`;

  /* ---------- Moussi en tenue de pilote : casque de cuir, lunettes, écharpe (D-25). Il reprend le
     Moussi du kit (#moussi-attend), dessin original du doudou d'Henri. */
  function moussiPilote(attitude) {
    const a = attitude || 'attend';
    return `<svg class="masc h-moussi-pilote" viewBox="-24 -20 248 268" role="img" aria-label="Moussi"><use href="#moussi-${a}"/>
      <path d="M50 82 C48 42 74 26 100 26 C126 26 152 42 150 82 C140 64 122 56 100 56 C78 56 60 64 50 82 Z" fill="#8B5A2B" stroke="#5E3B1A" stroke-width="3" stroke-linejoin="round"/>
      <path d="M58 60 H142" stroke="#3A3A3A" stroke-width="5"/>
      <circle cx="82" cy="58" r="13" fill="#9ED3F0" stroke="#3A3A3A" stroke-width="5"/>
      <circle cx="118" cy="58" r="13" fill="#9ED3F0" stroke="#3A3A3A" stroke-width="5"/>
      <path d="M62 140 Q100 156 138 140 L134 153 Q100 166 66 153 Z" fill="#F2F1EC" stroke="#9A958B" stroke-width="2.5"/>
      <path d="M128 148 L164 172 L152 180 L120 156 Z" fill="#F2F1EC" stroke="#9A958B" stroke-width="2.5" stroke-linejoin="round"/></svg>`;
  }

  /* ---------- Les objets du carnet (viewBox 0 0 100 100) ---------- */
  const ICONES_MISSION = {
    secours: '<path d="M50 74 C30 60 24 50 24 42 C24 34 30 29 37 29 C43 29 47 33 50 37 C53 33 57 29 63 29 C70 29 76 34 76 42 C76 50 70 60 50 74 Z" fill="#FFFFFF"/>',
    police: '<path d="M50 24 L57 41 L75 42 L61 53 L66 71 L50 61 L34 71 L39 53 L25 42 L43 41 Z" fill="#FFFFFF"/>',
    feux: '<path d="M50 24 C58 38 68 48 68 58 C68 69 60 76 50 76 C40 76 32 69 32 58 C32 48 42 38 50 24 Z" fill="#FFFFFF"/>',
    tourisme: '<circle cx="50" cy="50" r="12" fill="#FFFFFF"/><g stroke="#FFFFFF" stroke-width="5" stroke-linecap="round"><path d="M50 26V32M50 68V74M26 50H32M68 50H74M33 33L37 37M63 63L67 67M67 33L63 37M37 63L33 67"/></g>',
  };
  function objet(id, mission, couleur) {
    const c = couleur || '#3C7BD9';
    const tr = `stroke="${TRAIT}" stroke-width="3" stroke-linejoin="round"`;
    switch (id) {
      case 'ecusson':
        return `<path d="M50 6 L88 18 L85 58 C81 80 65 92 50 96 C35 92 19 80 15 58 L12 18 Z" fill="${c}" ${tr}/>
          <path d="M50 14 L80 24 L77 57 C74 74 62 84 50 88 C38 84 26 74 23 57 L20 24 Z" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-dasharray="4 4"/>
          <g transform="translate(15 12) scale(.7)">${ICONES_MISSION[mission] || ICONES_MISSION.secours}</g>`;
      case 'autocollant':
        return `<circle cx="50" cy="50" r="46" fill="#FFFFFF" ${tr}/><g transform="translate(8 30) scale(.21)">${helico({ couleur: c })}</g>`;
      case 'ailes':
        return `<path d="M50 50 C36 38 18 34 4 36 C14 42 20 46 26 48 C16 48 10 50 6 54 C18 56 28 56 36 56 C30 60 24 62 20 66 C32 66 42 62 50 56 Z" fill="${OR}" ${tr}/>
          <path d="M50 50 C64 38 82 34 96 36 C86 42 80 46 74 48 C84 48 90 50 94 54 C82 56 72 56 64 56 C70 60 76 62 80 66 C68 66 58 62 50 56 Z" fill="${OR}" ${tr}/>
          <circle cx="50" cy="52" r="13" fill="#FFFFFF" ${tr}/><g transform="translate(37.5 44) scale(.0625)">${helico({ couleur: OR })}</g>`;
      case 'trombone':
        return `<circle cx="50" cy="50" r="46" fill="#FFF3C4" ${tr}/><path d="M40 74 V30 C40 20 60 20 60 30 V68 C60 76 48 76 48 68 V36" fill="none" stroke="${OR}" stroke-width="7" stroke-linecap="round"/><path d="M40 74 V30 C40 20 60 20 60 30 V68 C60 76 48 76 48 68 V36" fill="none" stroke="#A87A12" stroke-width="2" stroke-linecap="round"/>`;
      case 'casque':
        return `<circle cx="50" cy="50" r="46" fill="#E3ECF8" ${tr}/><path d="M24 58 C24 30 76 30 76 58" fill="none" stroke="${TRAIT}" stroke-width="7" stroke-linecap="round"/>
          <rect x="16" y="50" width="16" height="24" rx="7" fill="#454A6B" ${tr}/><rect x="68" y="50" width="16" height="24" rx="7" fill="#454A6B" ${tr}/>
          <path d="M24 72 C26 82 40 84 48 80" fill="none" stroke="${TRAIT}" stroke-width="3.5" stroke-linecap="round"/><circle cx="51" cy="79" r="4.5" fill="${TRAIT}"/>`;
      case 'medaille':
        return `<path d="M34 4 L46 40 H54 L66 4 Z" fill="#3C7BD9" ${tr}/><circle cx="50" cy="62" r="32" fill="${OR}" ${tr}/>
          <path d="M28 76 L44 50 L50 58 L56 48 L72 76 Z" fill="#FFFFFF" stroke="#A87A12" stroke-width="2.5" stroke-linejoin="round"/>
          <path d="M44 50 L50 58 L56 48 L60 55 L50 62 L40 56 Z" fill="#E8F4FB"/>`;
      case 'billet':
        return `<path d="M8 28 H92 V44 C86 44 86 56 92 56 V72 H8 V56 C14 56 14 44 8 44 Z" fill="#FCE7B2" ${tr}/>
          <path d="M70 30 V70" stroke="${TRAIT}" stroke-width="2" stroke-dasharray="3 4"/><g transform="translate(14 36) scale(.13)">${helico({ couleur: c })}</g>
          <path d="M76 42 H86 M76 50 H86 M76 58 H84" stroke="${TRAIT}" stroke-width="2.5" stroke-linecap="round"/>`;
      default:
        return '';
    }
  }
  const svgObjet = (id, mission, couleur, classe) => `<svg class="h-objet${classe ? ' ' + classe : ''}" viewBox="0 0 100 100" aria-hidden="true">${objet(id, mission, couleur)}</svg>`;
  const svgMission = (mission, couleur) => `<svg class="h-mission-ico" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="46" fill="${couleur}" stroke="${TRAIT}" stroke-width="3"/>${ICONES_MISSION[mission]}</svg>`;

  /* ---------- Le tampon d'une commande (viewBox 0 0 100 100), à l'encre de la commande. */
  function tampon(cmd, couleur) {
    return `<svg class="h-tampon-svg" viewBox="0 0 100 100" aria-hidden="true"><g opacity=".9">
      <circle cx="50" cy="50" r="44" fill="none" stroke="${couleur}" stroke-width="5"/>
      <circle cx="50" cy="50" r="35" fill="none" stroke="${couleur}" stroke-width="2" stroke-dasharray="3 4"/>
      <g transform="translate(26 26) scale(.4)">${commande(cmd, couleur)}</g></g></svg>`;
  }

  /* ---------- Les tampons des missions de vol du prototype 3D (D-26), même forme que ceux des commandes. */
  const ICONES_VOL = {
    decoller: k => `<path d="M14 82 H86" stroke="${k}" stroke-width="7" stroke-linecap="round"/><path d="M50 70 V22 M32 40 L50 20 L68 40" fill="none" stroke="${k}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>`,
    stationnaire: k => `<path d="M32 26 V74 M68 26 V74 M32 50 H68" fill="none" stroke="${k}" stroke-width="9" stroke-linecap="round"/><circle cx="50" cy="50" r="40" fill="none" stroke="${k}" stroke-width="5"/>`,
    tour: k => `<path d="M42 86 L45 40 H55 L58 86 Z" fill="${k}"/><path d="M28 22 H72 L66 42 H34 Z" fill="${k}"/><path d="M50 22 V8" stroke="${k}" stroke-width="5" stroke-linecap="round"/><path d="M18 86 H82" stroke="${k}" stroke-width="6" stroke-linecap="round"/>`,
    tourner: k => `<path d="M78 50 A28 28 0 1 1 64 25.8" fill="none" stroke="${k}" stroke-width="8" stroke-linecap="round"/><path d="M56 12 L72 26 L52 34" fill="none" stroke="${k}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>`,
    poser: k => `<path d="M50 12 V58 M32 42 L50 62 L68 42" fill="none" stroke="${k}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/><path d="M20 78 H80 M30 70 V86 M70 70 V86" stroke="${k}" stroke-width="6" stroke-linecap="round"/>`,
  };
  /* L'encre de chaque mission de vol (pas de rouge). */
  const ENCRE_VOL = { decoller: '#1E88E5', stationnaire: '#00897B', tour: '#8E44AD', tourner: '#E67E22', poser: '#2E7D32' };
  function tamponVol(id, couleur) {
    const icone = ICONES_VOL[id] || ICONES_VOL.decoller;
    return `<svg class="h-tampon-svg" viewBox="0 0 100 100" aria-hidden="true"><g opacity=".9">
      <circle cx="50" cy="50" r="44" fill="none" stroke="${couleur}" stroke-width="5"/>
      <circle cx="50" cy="50" r="35" fill="none" stroke="${couleur}" stroke-width="2" stroke-dasharray="3 4"/>
      <g transform="translate(26 26) scale(.48)">${icone(couleur)}</g></g></svg>`;
  }

  /* ---------- Le gabarit du modèle en papier, en millimètres pour une feuille A4 (190 x 270 mm
     imprimables). Trois modèles identiques sauf la longueur des pales : 6, 8 et 10 cm. Corps de
     5 cm de large et de 5 cm de haut, pied de 2 cm replié ; fentes de 1,5 cm de chaque côté.
     Traits pleins : couper ; pointillés : plier. */
  function gabarit(textes) {
    const T = textes || { couper: 'traits pleins : couper', plier: 'pointillés : plier', trombone: 'trombone', titre: '' };
    const modeles = [[6, 'A'], [8, 'B'], [10, 'C']];
    const plein = 'fill="none" stroke="#000" stroke-width="0.6"';
    const pointille = 'fill="none" stroke="#000" stroke-width="0.4" stroke-dasharray="2 1.6"';
    const W = 50;
    const corps = 50;
    const pied = 20;
    const fente = 15;
    let g = '';
    modeles.forEach(([cm, lettre], i) => {
      const L = cm * 10;
      const x = 8 + i * 62;
      const y = 34 + (100 - L); // les modèles alignés par le bas
      const bas = y + L + corps + pied;
      g += `<g>
        <path d="M${x} ${y} H${x + W} V${bas} H${x} Z" ${plein}/>
        <path d="M${x + W / 2} ${y} V${y + L}" ${plein}/>
        <path d="M${x} ${y + L + 4} H${x + fente} M${x + W} ${y + L + 4} H${x + W - fente}" ${plein}/>
        <path d="M${x} ${y + L} H${x + W}" ${pointille}/>
        <path d="M${x + fente} ${y + L + 4} V${bas} M${x + W - fente} ${y + L + 4} V${bas}" ${pointille}/>
        <path d="M${x} ${bas - pied} H${x + W}" ${pointille}/>
        <text x="${x + W / 4}" y="${y + L / 2}" font-size="5" text-anchor="middle" font-family="Andika, sans-serif">${lettre}</text>
        <text x="${x + 3 * W / 4}" y="${y + L / 2}" font-size="5" text-anchor="middle" font-family="Andika, sans-serif">${lettre}</text>
        <text x="${x + W / 2}" y="${y - 4}" font-size="5" text-anchor="middle" font-family="Andika, sans-serif">${lettre} : ${cm} cm</text>
        <text x="${x + W / 2}" y="${bas - 8}" font-size="3.6" text-anchor="middle" font-family="Andika, sans-serif">${T.trombone}</text>
      </g>`;
    });
    return `<svg class="h-gabarit-svg" xmlns="http://www.w3.org/2000/svg" width="190mm" height="270mm" viewBox="0 0 190 270">
      <text x="8" y="12" font-size="7" font-family="Andika, sans-serif" font-weight="700">${T.titre}</text>
      <text x="8" y="21" font-size="4.4" font-family="Andika, sans-serif">${T.couper} · ${T.plier}</text>
      ${g}
      <path d="M8 250 H58" stroke="#000" stroke-width="0.6"/><path d="M8 248 V252 M58 248 V252" stroke="#000" stroke-width="0.6"/>
      <text x="33" y="258" font-size="4" text-anchor="middle" font-family="Andika, sans-serif">5 cm</text>
    </svg>`;
  }

  /* ---------- Le manuel : une image par étape (viewBox 0 0 200 140) ---------- */
  const bande = (x, y, l, couleur) => `<path d="M${x} ${y} h30 v${l + 40} h-30 z" fill="${couleur || '#FFFFFF'}" stroke="${TRAIT}" stroke-width="2.5"/>`;
  const ciseaux = (x, y) => `<g transform="translate(${x} ${y})"><circle cx="-8" cy="12" r="6" fill="none" stroke="${TRAIT}" stroke-width="3"/><circle cx="8" cy="12" r="6" fill="none" stroke="${TRAIT}" stroke-width="3"/><path d="M-4 7 L6 -16 M4 7 L-6 -16" stroke="${TRAIT}" stroke-width="3" stroke-linecap="round"/></g>`;
  function manuel(n) {
    switch (n) {
      case 0: return `<rect x="56" y="10" width="88" height="122" rx="4" fill="#FFFFFF" stroke="${TRAIT}" stroke-width="2.5"/>${[0, 1, 2].map(i => `<path d="M${66 + i * 26} ${40 - i * 8} h18 v${70 + i * 8} h-18 z" fill="none" stroke="${TRAIT}" stroke-width="1.6"/>`).join('')}`;
      case 1: return `${bande(85, 14, 50)}${ciseaux(140, 70)}<path d="M120 60 L132 66" stroke="${TRAIT}" stroke-width="2" stroke-dasharray="3 3"/>`;
      case 2: return `${bande(85, 14, 50)}<path d="M100 14 V64" stroke="#E86A17" stroke-width="4"/>${ciseaux(100, 40)}`;
      case 3: return `<path d="M85 64 L58 30 L72 22 L100 64 Z" fill="#FFFFFF" stroke="${TRAIT}" stroke-width="2.5"/><path d="M100 64 L142 40 L148 54 L115 64 Z" fill="#EDEDED" stroke="${TRAIT}" stroke-width="2.5"/><path d="M85 64 h30 v60 h-30 z" fill="#FFFFFF" stroke="${TRAIT}" stroke-width="2.5"/><path d="M66 14 C56 18 54 26 58 30" fill="none" stroke="#3C7BD9" stroke-width="3"/><path d="M150 32 C158 38 156 46 148 52" fill="none" stroke="#3C7BD9" stroke-width="3"/>`;
      case 4: return `<path d="M85 20 h30 v104 h-30 z" fill="#FFFFFF" stroke="${TRAIT}" stroke-width="2.5"/><path d="M85 50 h9 v74 h-9 z M106 50 h9 v74 h-9 z" fill="#EDEDED" stroke="${TRAIT}" stroke-width="2"/><path d="M70 90 C74 80 82 80 88 86" fill="none" stroke="#3C7BD9" stroke-width="3"/><path d="M130 90 C126 80 118 80 112 86" fill="none" stroke="#3C7BD9" stroke-width="3"/>`;
      case 5: return `<path d="M88 20 h24 v86 h-24 z" fill="#FFFFFF" stroke="${TRAIT}" stroke-width="2.5"/><path d="M88 106 h24 v-18 h-24 z" fill="#EDEDED" stroke="${TRAIT}" stroke-width="2"/><path d="M96 84 V114 C96 120 106 120 106 114 V92" fill="none" stroke="${OR}" stroke-width="4" stroke-linecap="round"/>`;
      default: return `<g transform="translate(70 12) rotate(-12)"><path d="M15 50 L-12 22 L0 14 L22 50 Z" fill="#FFFFFF" stroke="${TRAIT}" stroke-width="2.5"/><path d="M22 50 L54 26 L58 38 L32 50 Z" fill="#EDEDED" stroke="${TRAIT}" stroke-width="2.5"/><path d="M15 50 h17 v40 h-17 z" fill="#FFFFFF" stroke="${TRAIT}" stroke-width="2.5"/></g><path d="M40 40 C30 70 40 100 60 120" fill="none" stroke="#3C7BD9" stroke-width="3" stroke-dasharray="5 5"/><path d="M150 30 C170 40 170 60 150 66 M150 66 l8 -2 M150 66 l4 6" fill="none" stroke="#3C7BD9" stroke-width="3" stroke-linecap="round"/>`;
    }
  }

  /* ---------- Les comparaisons des records (viewBox 0 0 320 220) ---------- */
  function altitude() {
    // Échelle : 12 442 m pour 170 px.
    const h = m => (m / 12442 * 170).toFixed(1);
    return `<path d="M10 200 H310" stroke="${TRAIT}" stroke-width="3"/>
      <path d="M40 200 L110 ${200 - h(8848)} L180 200 Z" fill="#9AA6B8" stroke="${TRAIT}" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M96 ${227 - h(8848)} L110 ${200 - h(8848)} L124 ${227 - h(8848)} Z" fill="#FFFFFF"/>
      <path d="M200 ${200 - h(12442)} H300" stroke="#3C7BD9" stroke-width="3" stroke-dasharray="6 5"/>
      <g transform="translate(212 ${200 - h(12442) - 30}) scale(.18)">${helico({ couleur: '#F2C230' })}</g>
      <path d="M100 ${200 - h(8848)} H200" stroke="${TRAIT}" stroke-width="1.5" stroke-dasharray="3 4" opacity=".6"/>`;
  }
  function vitesses(lignes) {
    // lignes : [{ v, nom, couleur }] ; 400 km/h pour 200 px.
    return lignes.map((l, i) => `<g transform="translate(0 ${20 + i * 64})"><rect x="100" y="8" width="${(l.v / 400 * 200).toFixed(1)}" height="34" rx="10" fill="${l.couleur}" stroke="${TRAIT}" stroke-width="2.5"/></g>`).join('');
  }
  function everest() {
    return `<path d="M20 200 L120 50 L160 100 L190 70 L300 200 Z" fill="#9AA6B8" stroke="${TRAIT}" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M95 88 L120 50 L140 76 L128 80 L118 70 L106 86 Z" fill="#FFFFFF"/>
      <g transform="translate(88 18) scale(.16)">${helico({ couleur: '#F2C230' })}</g>`;
  }
  function drone() {
    return `<g transform="translate(70 70)"><path d="M-30 -30 L30 30 M30 -30 L-30 30" stroke="${TRAIT}" stroke-width="6" stroke-linecap="round"/>
      ${[[-30, -30], [30, -30], [-30, 30], [30, 30]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="17" fill="#E3ECF8" stroke="${TRAIT}" stroke-width="2.5"/>`).join('')}
      <rect x="-14" y="-14" width="28" height="28" rx="7" fill="#8A63D2" stroke="${TRAIT}" stroke-width="2.5"/></g>
      <g transform="translate(70 196)"><circle cx="0" cy="-58" r="10" fill="#C6C1B8" stroke="${TRAIT}" stroke-width="2.5"/><path d="M0 -48 V-14 M0 -14 L-12 6 M0 -14 L12 6 M0 -40 L-14 -28 L-6 -26 M0 -40 L14 -28 L6 -26" stroke="${TRAIT}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/><rect x="-10" y="-34" width="20" height="12" rx="3" fill="#454A6B"/></g>
      <path d="M10 200 H310" stroke="${TRAIT}" stroke-width="3"/>
      <g transform="translate(160 60) scale(.38)">${helico({ couleur: '#3FA864' })}</g>`;
  }
  function famille() {
    // Un rond pour 100 hélicoptères : 72 ronds, plus de 7 200 livrés (Airbus).
    let s = '';
    for (let i = 0; i < 72; i++) s += `<circle cx="${28 + (i % 12) * 24}" cy="${30 + Math.floor(i / 12) * 30}" r="9" fill="#F2C230" stroke="${TRAIT}" stroke-width="2"/>`;
    return s;
  }

  /* ---------- Les scènes radio (viewBox 0 0 320 200) ---------- */
  function tour() {
    return `<path d="M0 180 H320" stroke="${TRAIT}" stroke-width="3"/>
      <path d="M232 180 L240 70 H270 L278 180 Z" fill="#E2DCCF" stroke="${TRAIT}" stroke-width="2.5"/>
      <path d="M222 44 H288 L280 70 H230 Z" fill="${VITRE}" stroke="${TRAIT}" stroke-width="2.5"/><path d="M226 40 H284" stroke="${TRAIT}" stroke-width="5" stroke-linecap="round"/>
      <path d="M255 40 V24" stroke="${TRAIT}" stroke-width="3"/><circle cx="255" cy="22" r="4" fill="#3AA75A"/>
      <g class="h-ondes" fill="none" stroke="#3C7BD9" stroke-width="3" stroke-linecap="round"><path d="M210 50 C200 60 200 74 210 84"/><path d="M198 42 C182 58 182 76 198 92"/></g>`;
  }
  function champ() {
    return `<path d="M0 150 C80 140 240 140 320 150 V200 H0 Z" fill="#9BCB7A" stroke="${TRAIT}" stroke-width="2.5"/>
      <path d="M40 150 V120 M70 148 V118 M100 147 V117 M40 128 H100 M40 140 H100" stroke="#8B5A2B" stroke-width="4" stroke-linecap="round"/>
      <g transform="translate(250 104)"><circle cx="0" cy="-30" r="10" fill="#E8C9A0" stroke="${TRAIT}" stroke-width="2.5"/><path d="M-12 -40 H12 L8 -46 H-8 Z" fill="#8B5A2B"/><path d="M0 -20 V10 M0 10 L-10 34 M0 10 L10 34 M0 -12 L-14 0 M0 -12 L14 -2" stroke="${TRAIT}" stroke-width="4" stroke-linecap="round" fill="none"/></g>`;
  }
  function licence() {
    return `<rect x="60" y="40" width="200" height="120" rx="14" fill="#FFFFFF" stroke="${TRAIT}" stroke-width="3"/>
      <rect x="76" y="58" width="56" height="70" rx="8" fill="#E3ECF8" stroke="${TRAIT}" stroke-width="2"/>
      <path d="M148 70 H240 M148 90 H226 M148 110 H236" stroke="#C9BDAE" stroke-width="6" stroke-linecap="round"/>
      <circle cx="226" cy="134" r="20" fill="${OR}" stroke="${TRAIT}" stroke-width="2.5"/><text x="226" y="141" font-size="20" font-weight="700" text-anchor="middle" font-family="Baloo 2, sans-serif" fill="${TRAIT}">17</text>`;
  }

  /* ---------- Le musée : l'Écureuil exposé, avec les parties à trouver ---------- */
  const musee = couleur => `<path d="M10 180 H310" stroke="${TRAIT}" stroke-width="3"/><path d="M20 40 L160 8 L300 40" fill="none" stroke="${TRAIT}" stroke-width="3" stroke-linejoin="round"/><g transform="translate(40 50) scale(.62)">${helico({ couleur })}</g>`;

  racine.HeliDessins = {
    TRAIT, helico, svgHelico, vueDessus, pale, compteur, commande, svgCommande, moussiPilote, objet, svgObjet, svgMission,
    tampon, tamponVol, ENCRE_VOL, gabarit, manuel, altitude, vitesses, everest, drone, famille, tour, champ, licence, musee,
  };
})(typeof window !== 'undefined' ? window : globalThis);
