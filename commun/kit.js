/* Kit « Nos révisions » v2 : comportements communs aux modules, objet global KR.
   L'enfant se lit sur <html data-enfant="henri|clara">. Dépend de commun/textes.js. */
(function () {
  'use strict';

  const racine = document.documentElement;
  const KR = {};
  const ENFANTS = {
    henri: { prenom: 'Henri', mascotte: 'moussi', nomMascotte: 'Moussi' },
    clara: { prenom: 'Clara', mascotte: 'ours', nomMascotte: 'Pooh Bear' },
  };

  KR.enfant = () => (ENFANTS[racine.dataset.enfant] ? racine.dataset.enfant : 'henri');
  KR.infos = () => ENFANTS[KR.enfant()];
  KR.prenom = () => KR.infos().prenom;
  KR.nomMascotte = () => KR.infos().nomMascotte;
  KR.mouvementReduit = () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  KR.echapper = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- Réglages par enfant : langue du cadre, voix, sons ---------- */
  const DEFAUT = { langue: 'en', voix: false, sons: true };
  KR.reglages = function () {
    try {
      const brut = window.localStorage.getItem(KR.enfant() + '.reglages');
      return Object.assign({}, DEFAUT, brut ? JSON.parse(brut) : {});
    } catch (e) { return Object.assign({}, DEFAUT); }
  };
  KR.regler = function (cle, valeur) {
    const r = KR.reglages();
    r[cle] = valeur;
    try { window.localStorage.setItem(KR.enfant() + '.reglages', JSON.stringify(r)); } catch (e) { /* stockage indisponible */ }
    if (cle === 'langue') KR.appliquerLangue();
    return r;
  };
  KR.appliquerLangue = function () {
    const l = window.Textes.choisirLangue(KR.reglages().langue);
    racine.lang = l;
    window.Textes.traduirePage(document);
    return l;
  };
  KR.t = (cle, valeurs) => window.Textes.t(cle, valeurs);

  /* ---------- Sons Web Audio, sans fichier ---------- */
  let ctx = null;
  function audio() {
    if (!ctx) {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      try { ctx = new C(); } catch (e) { return null; }
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function note(freq, debut, duree, type, vol) {
    const c = audio();
    if (!c) return;
    const o = c.createOscillator();
    const g = c.createGain();
    const t = c.currentTime + debut;
    o.type = type || 'sine';
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol || 0.2, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duree);
    o.connect(g);
    g.connect(c.destination);
    o.start(t);
    o.stop(t + duree + 0.05);
  }
  const SONS = {
    touche: () => note(660, 0, 0.06, 'triangle', 0.07),
    juste: () => { note(880, 0, 0.25, 'triangle'); note(1320, 0.09, 0.35, 'triangle'); },
    doux: () => { note(392, 0, 0.3, 'sine', 0.13); note(330, 0.14, 0.4, 'sine', 0.11); },
    fete: () => {
      [523, 659, 784, 1047].forEach((f, i) => note(f, i * 0.12, 0.3, 'triangle'));
      note(1047, 0.5, 0.7, 'triangle');
      note(1319, 0.5, 0.7, 'sine', 0.12);
    },
  };
  KR.son = function (nom) {
    if (!KR.reglages().sons || !SONS[nom]) return;
    try { SONS[nom](); } catch (e) { /* pas de son */ }
  };

  /* ---------- Voix : fr-FR ou en-GB, voix chargées au premier besoin ---------- */
  let voixEnAttente = null;
  function voixDisponibles() {
    if (!('speechSynthesis' in window)) return Promise.resolve([]);
    const liste = window.speechSynthesis.getVoices();
    if (liste.length) return Promise.resolve(liste);
    if (!voixEnAttente) {
      voixEnAttente = new Promise(resoudre => {
        const fin = () => resoudre(window.speechSynthesis.getVoices());
        window.speechSynthesis.addEventListener('voiceschanged', fin, { once: true });
        setTimeout(fin, 1500);
      });
    }
    return voixEnAttente;
  }
  function parler(texte, code, liste) {
    const u = new SpeechSynthesisUtterance(texte);
    u.lang = code;
    u.rate = 0.9;
    const norm = v => v.lang.replace('_', '-');
    const v = liste.find(x => norm(x) === code) || liste.find(x => norm(x).indexOf(code.slice(0, 2)) === 0);
    if (v) u.voice = v;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }
  KR.lire = function (texte, langue) {
    if (!('speechSynthesis' in window) || !texte) return;
    const code = langue === 'en' ? 'en-GB' : 'fr-FR';
    const liste = window.speechSynthesis.getVoices();
    if (liste.length) parler(texte, code, liste); // dans le geste, pour Safari
    else voixDisponibles().then(l => parler(texte, code, l));
  };
  KR.taire = () => { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); };

  /* ---------- Sprite SVG : mascottes (quatre attitudes) et icônes ---------- */
  const SPRITE = `<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>
<filter id="bouclette" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="0.45" numOctaves="2" seed="4" result="b"/><feDisplacementMap in="SourceGraphic" in2="b" scale="1.8"/></filter>
<path id="scintille" d="M0 -11 L2.6 -2.6 L11 0 L2.6 2.6 L0 11 L-2.6 2.6 L-11 0 L-2.6 -2.6Z"/>
<g id="ours-corps" stroke="#C4A65A" stroke-width="2.6"><ellipse cx="78" cy="212" rx="17" ry="26" fill="#F1E3A0"/><ellipse cx="122" cy="212" rx="17" ry="26" fill="#F1E3A0"/><ellipse cx="78" cy="234" rx="18" ry="7" fill="#E9D98F"/><ellipse cx="122" cy="234" rx="18" ry="7" fill="#E9D98F"/><ellipse cx="100" cy="176" rx="42" ry="40" fill="#F7EBB3"/></g>
<g id="ours-bras-bas" stroke="#C4A65A" stroke-width="2.6" fill="#F1E3A0"><ellipse cx="42" cy="158" rx="13" ry="22" transform="rotate(25 42 158)"/><ellipse cx="158" cy="158" rx="13" ry="22" transform="rotate(-25 158 158)"/></g>
<g id="ours-bras-haut" stroke="#C4A65A" stroke-width="2.6" fill="#F1E3A0"><ellipse cx="34" cy="124" rx="13" ry="24" transform="rotate(-32 34 124)"/><ellipse cx="166" cy="124" rx="13" ry="24" transform="rotate(32 166 124)"/></g>
<g id="ours-bras-aide" stroke="#C4A65A" stroke-width="2.6" fill="#F1E3A0"><ellipse cx="42" cy="158" rx="13" ry="22" transform="rotate(25 42 158)"/><ellipse cx="166" cy="124" rx="13" ry="24" transform="rotate(32 166 124)"/></g>
<g id="ours-buste"><path d="M58 138 Q100 126 142 138 L164 152 Q160 166 148 166 L144 176 Q100 186 56 176 L52 166 Q40 166 36 152 Z" fill="#D8392F" stroke="#A82A22" stroke-width="2.6" stroke-linejoin="round"/><path d="M84 136 Q100 146 116 136" stroke="#A82A22" stroke-width="3" fill="none" stroke-linecap="round"/><g stroke="#C4A65A" stroke-width="2.6"><circle cx="56" cy="40" r="17" fill="#EEDD93"/><circle cx="144" cy="40" r="17" fill="#EEDD93"/></g><circle cx="56" cy="42" r="9" fill="#E3CF7E"/><circle cx="144" cy="42" r="9" fill="#E3CF7E"/><ellipse cx="100" cy="80" rx="54" ry="56" fill="#F5E8A6" stroke="#C4A65A" stroke-width="2.6"/><ellipse cx="100" cy="102" rx="30" ry="24" fill="#F9F0C6"/><path d="M90 90 Q100 84 110 90 Q112 100 100 104 Q88 100 90 90 Z" fill="#7A4A2E"/><path d="M80 108 Q100 124 120 108" stroke="#6B3B24" stroke-width="2.8" fill="none" stroke-linecap="round"/><path d="M72 58 Q80 52 88 57" stroke="#6B3B24" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="M112 57 Q120 52 128 58" stroke="#6B3B24" stroke-width="2.6" fill="none" stroke-linecap="round"/><circle cx="68" cy="94" r="8" fill="#F2A07E" opacity=".35"/><circle cx="132" cy="94" r="8" fill="#F2A07E" opacity=".35"/></g>
<g id="ours-yeux"><circle cx="80" cy="70" r="4.6" fill="#4A2A1A"/><circle cx="120" cy="70" r="4.6" fill="#4A2A1A"/><circle cx="81.6" cy="68.4" r="1.4" fill="#fff"/><circle cx="121.6" cy="68.4" r="1.4" fill="#fff"/></g>
<g id="ours-yeux-rieurs" stroke="#4A2A1A" stroke-width="3" fill="none" stroke-linecap="round"><path d="M74.5 72 Q80 64 85.5 72"/><path d="M114.5 72 Q120 64 125.5 72"/></g>
<g id="ours-yeux-fermes" stroke="#4A2A1A" stroke-width="3" fill="none" stroke-linecap="round"><path d="M74.5 69 Q80 75 85.5 69"/><path d="M114.5 69 Q120 75 125.5 69"/></g>
<g id="moussi-corps" filter="url(#bouclette)" stroke="#968F84" stroke-width="2.6"><ellipse cx="80" cy="222" rx="20" ry="13" fill="#B3ADA3"/><ellipse cx="120" cy="222" rx="20" ry="13" fill="#B3ADA3"/><ellipse cx="100" cy="182" rx="44" ry="44" fill="#C2BDB3"/></g>
<g id="moussi-bras-bas" filter="url(#bouclette)" stroke="#968F84" stroke-width="2.6" fill="#B3ADA3"><ellipse cx="50" cy="168" rx="12" ry="22" transform="rotate(20 50 168)"/><ellipse cx="150" cy="168" rx="12" ry="22" transform="rotate(-20 150 168)"/></g>
<g id="moussi-bras-haut" filter="url(#bouclette)" stroke="#968F84" stroke-width="2.6" fill="#B3ADA3"><ellipse cx="44" cy="146" rx="12" ry="23" transform="rotate(-34 44 146)"/><ellipse cx="156" cy="146" rx="12" ry="23" transform="rotate(34 156 146)"/></g>
<g id="moussi-bras-aide" filter="url(#bouclette)" stroke="#968F84" stroke-width="2.6" fill="#B3ADA3"><ellipse cx="50" cy="168" rx="12" ry="22" transform="rotate(20 50 168)"/><ellipse cx="156" cy="146" rx="12" ry="23" transform="rotate(34 156 146)"/></g>
<g id="moussi-tete"><g filter="url(#bouclette)" stroke="#968F84" stroke-width="2.6"><circle cx="46" cy="58" r="33" fill="#BDB7AD"/><circle cx="154" cy="58" r="33" fill="#BDB7AD"/><ellipse cx="100" cy="92" rx="58" ry="54" fill="#C6C1B8"/></g><path d="M70 100 Q100 88 130 100 Q118 138 100 142 Q82 138 70 100 Z" fill="#CFCAC1"/><circle cx="48" cy="60" r="21" fill="#F2EBDD"/><circle cx="152" cy="60" r="21" fill="#F2EBDD"/><ellipse cx="100" cy="134" rx="15" ry="13" fill="#1E1E24"/><circle cx="95" cy="130" r="3.5" fill="#fff" opacity=".35"/><path d="M78 108 Q100 126 122 108" stroke="#4A4640" stroke-width="2.8" fill="none" stroke-linecap="round"/><circle cx="66" cy="110" r="8" fill="#E9A3A3" opacity=".3"/><circle cx="134" cy="110" r="8" fill="#E9A3A3" opacity=".3"/></g>
<g id="moussi-yeux"><circle cx="80" cy="86" r="4.6" fill="#1E1E24"/><circle cx="120" cy="86" r="4.6" fill="#1E1E24"/><circle cx="81.6" cy="84.4" r="1.4" fill="#fff"/><circle cx="121.6" cy="84.4" r="1.4" fill="#fff"/></g>
<g id="moussi-yeux-rieurs" stroke="#1E1E24" stroke-width="3" fill="none" stroke-linecap="round"><path d="M74.5 88 Q80 80 85.5 88"/><path d="M114.5 88 Q120 80 125.5 88"/></g>
<g id="moussi-yeux-fermes" stroke="#1E1E24" stroke-width="3" fill="none" stroke-linecap="round"><path d="M74.5 85 Q80 91 85.5 85"/><path d="M114.5 85 Q120 91 125.5 85"/></g>
<g id="acc-ampoule" transform="translate(194 34)"><circle r="24" fill="#FFF1B8"/><path d="M0 -15a10.5 10.5 0 00-6.3 18.9c1.2 1 1.9 2.3 1.9 3.9h8.8c0-1.6.7-2.9 1.9-3.9A10.5 10.5 0 000 -15z" fill="#FFC93C" stroke="#9A6B00" stroke-width="2.2" stroke-linejoin="round"/><path d="M-4.4 12.5h8.8M-3 16.5h6" stroke="#9A6B00" stroke-width="2.4" stroke-linecap="round"/></g>
<g id="acc-etincelles"><use href="#scintille" transform="translate(4 30) scale(1.1)" fill="#FFC93C"/><use href="#scintille" transform="translate(196 22) scale(1.25)" fill="#FFC93C"/><use href="#scintille" transform="translate(-6 92) scale(.7)" fill="currentColor"/><use href="#scintille" transform="translate(206 96) scale(.8)" fill="currentColor"/><use href="#scintille" transform="translate(100 -12) scale(.75)" fill="currentColor"/></g>
<g id="acc-lune" transform="translate(190 20)"><path d="M4 -16a16 16 0 1 0 12 26 13 13 0 0 1 -12 -26z" fill="currentColor"/><circle cx="-22" cy="-8" r="2.4" fill="currentColor" opacity=".7"/><circle cx="-12" cy="16" r="1.8" fill="currentColor" opacity=".6"/></g>
<g id="ours-attend"><use href="#ours-corps"/><use href="#ours-bras-bas"/><use href="#ours-buste"/><use href="#ours-yeux"/></g>
<g id="ours-aide-corps"><g transform="rotate(-7 100 240)"><use href="#ours-corps"/><use href="#ours-bras-aide"/><use href="#ours-buste"/><use href="#ours-yeux"/></g></g>
<g id="ours-aide"><use href="#ours-aide-corps"/><use href="#acc-ampoule"/></g>
<g id="ours-fete"><use href="#acc-etincelles"/><use href="#ours-corps"/><use href="#ours-bras-haut"/><use href="#ours-buste"/><use href="#ours-yeux-rieurs"/></g>
<g id="ours-repos"><use href="#acc-lune"/><g transform="rotate(5 100 240)"><use href="#ours-corps"/><use href="#ours-bras-bas"/><use href="#ours-buste"/><use href="#ours-yeux-fermes"/></g></g>
<g id="moussi-attend"><use href="#moussi-corps"/><use href="#moussi-bras-bas"/><use href="#moussi-tete"/><use href="#moussi-yeux"/></g>
<g id="moussi-aide-corps"><g transform="rotate(-7 100 240)"><use href="#moussi-corps"/><use href="#moussi-bras-aide"/><use href="#moussi-tete"/><use href="#moussi-yeux"/></g></g>
<g id="moussi-aide"><use href="#moussi-aide-corps"/><use href="#acc-ampoule"/></g>
<g id="moussi-fete"><use href="#acc-etincelles"/><use href="#moussi-corps"/><use href="#moussi-bras-haut"/><use href="#moussi-tete"/><use href="#moussi-yeux-rieurs"/></g>
<g id="moussi-repos"><use href="#acc-lune"/><g transform="rotate(5 100 240)"><use href="#moussi-corps"/><use href="#moussi-bras-bas"/><use href="#moussi-tete"/><use href="#moussi-yeux-fermes"/></g></g>
<symbol id="i-retour" viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></symbol>
<symbol id="i-suite" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></symbol>
<symbol id="i-son" viewBox="0 0 24 24"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M15.5 9.2a4 4 0 010 5.6M18.2 6.8a7.4 7.4 0 010 10.4" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></symbol>
<symbol id="i-effacer" viewBox="0 0 24 24"><path d="M9 5h10a2 2 0 012 2v10a2 2 0 01-2 2H9l-6-7z" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/><path d="M17.5 12h-7M13 9l-3 3 3 3" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></symbol>
<symbol id="i-ok" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></symbol>
<symbol id="i-cadenas" viewBox="0 0 24 24"><rect x="5" y="10.5" width="14" height="10" rx="2.5" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M8.5 10.5V8a3.5 3.5 0 017 0v2.5" fill="none" stroke="currentColor" stroke-width="2.4"/></symbol>
<symbol id="i-globe" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3.8 9.5h16.4M3.8 14.5h16.4M12 3.5c-2.8 3-2.8 14 0 17M12 3.5c2.8 3 2.8 14 0 17" fill="none" stroke="currentColor" stroke-width="2"/></symbol>
<symbol id="i-grille" viewBox="0 0 24 24"><rect x="3" y="3" width="5" height="5" rx="1.4" fill="currentColor"/><rect x="9.5" y="3" width="5" height="5" rx="1.4" fill="currentColor"/><rect x="16" y="3" width="5" height="5" rx="1.4" fill="none" stroke="currentColor" stroke-width="1.6"/><rect x="3" y="9.5" width="5" height="5" rx="1.4" fill="currentColor"/><rect x="9.5" y="9.5" width="5" height="5" rx="1.4" fill="none" stroke="currentColor" stroke-width="1.6"/><rect x="16" y="9.5" width="5" height="5" rx="1.4" fill="none" stroke="currentColor" stroke-width="1.6"/><rect x="3" y="16" width="5" height="5" rx="1.4" fill="none" stroke="currentColor" stroke-width="1.6"/><rect x="9.5" y="16" width="5" height="5" rx="1.4" fill="none" stroke="currentColor" stroke-width="1.6"/><rect x="16" y="16" width="5" height="5" rx="1.4" fill="none" stroke="currentColor" stroke-width="1.6"/></symbol>
<symbol id="i-crayon" viewBox="0 0 24 24"><path d="M4 20l1-4.5L15.5 5a2.1 2.1 0 013 3L8 18.5z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M13.5 7l3.5 3.5" stroke="currentColor" stroke-width="2"/></symbol>
<symbol id="i-ampoule" viewBox="0 0 24 24"><path d="M12 3a6 6 0 00-3.6 10.8c.7.6 1.1 1.3 1.1 2.2h5c0-.9.4-1.6 1.1-2.2A6 6 0 0012 3z" fill="currentColor"/><path d="M9.5 18.5h5M10.5 21h3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></symbol>
<symbol id="i-eclair" viewBox="0 0 24 24"><path d="M13.5 2.5L5 13.5h6l-1.5 8 8.5-11h-6z" fill="currentColor"/></symbol>
<symbol id="i-etoile" viewBox="0 0 24 24"><path d="M12 2.8l2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3-4.6-4.4 6.3-.9z" fill="currentColor"/></symbol>
<symbol id="i-monte" viewBox="0 0 24 24"><path d="M12 19V6M6 11.5L12 5.5l6 6" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></symbol>
<symbol id="i-cal" viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="15.5" rx="3" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M3.5 10h17M8 3v4M16 3v4" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><circle cx="12" cy="15" r="1.8" fill="currentColor"/></symbol>
<symbol id="i-chrono" viewBox="0 0 24 24"><circle cx="12" cy="13.5" r="7.5" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M12 9.5v4l2.5 2M9.5 3h5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></symbol>
<symbol id="i-cle" viewBox="0 0 24 24"><circle cx="8" cy="12" r="4.5" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M12.5 12H21M17.5 12v3.5M20.5 12v2.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></symbol>
<symbol id="i-jouer" viewBox="0 0 24 24"><path d="M8 5.5v13l10.5-6.5z" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></symbol>
<symbol id="i-sortir" viewBox="0 0 24 24"><path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M5 19.5h14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></symbol>
<symbol id="i-entrer" viewBox="0 0 24 24"><path d="M12 15V4M7.5 8.5L12 4l4.5 4.5M5 19.5h14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></symbol>
</defs></svg>`;

  KR.icone = (nom, classe) => `<svg class="ico${classe ? ' ' + classe : ''}" aria-hidden="true"><use href="#i-${nom}"/></svg>`;
  /* attitude : attend, aide, fete, repos */
  KR.mascotte = function (attitude, classe) {
    const id = KR.infos().mascotte + '-' + attitude;
    const couleur = attitude === 'fete' || attitude === 'repos' ? ' style="color:var(--e-500)"' : '';
    return `<svg class="masc${classe ? ' ' + classe : ''}" viewBox="-24 -20 248 268" role="img" aria-label="${KR.nomMascotte()}"${couleur}><use href="#${id}"/></svg>`;
  };
  KR.medaillon = function (attitude) {
    const corps = attitude === 'aide' ? 'aide-corps' : attitude;
    const lampe = attitude === 'aide' ? `<span class="lampe">${KR.icone('ampoule')}</span>` : '';
    return `<div class="medaillon-zone"><div class="medaillon" style="color:var(--e-500)"><svg viewBox="-12 -2 188 188" aria-hidden="true"><use href="#${KR.infos().mascotte}-${corps}"/></svg></div>${lampe}</div>`;
  };

  /* ---------- Semaine : sept jours, tampon, rond plein ou pointillé ---------- */
  KR.semaine = function (jours) {
    const noms = KR.t('jours_courts').split(',');
    return '<div class="semaine" role="list">' + jours.map((j, i) => {
      const cl = j.fait ? 'fait' : (j.avenir ? 'avenir' : (j.aujourdhui ? '' : 'passe'));
      return `<div class="jour ${cl}${j.aujourdhui ? ' auj' : ''}" role="listitem" aria-label="${noms[i]}${j.fait ? ', ' + KR.echapper(KR.t('juste_aria')) : ''}"><div class="rd">${j.fait ? KR.icone('etoile') : ''}</div><span class="lb">${noms[i]}</span></div>`;
    }).join('') + '</div>';
  };
  KR.joursFaits = function (jours) {
    const n = jours.filter(j => j.fait).length;
    return n === 1 ? KR.t('jour_semaine_un') : KR.t('jours_semaine', { n });
  };

  /* ---------- Pavé numérique ---------- */
  let paveActif = null;
  KR.pave = function (rappels) {
    const el = document.createElement('div');
    el.className = 'pave';
    el.setAttribute('role', 'group');
    el.setAttribute('aria-label', KR.t('numero_pad'));
    let html = '';
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 0].forEach(d => { html += `<button type="button" class="touche" data-chiffre="${d}" style="grid-area:k${d}">${d}</button>`; });
    html += `<button type="button" class="touche effacer" data-role="effacer" aria-label="${KR.t('effacer')}">${KR.icone('effacer')}<span class="mot">${KR.t('effacer')}</span></button>`;
    html += `<button type="button" class="touche valider" data-role="valider"><span class="v-ico">${KR.icone('ok')}</span><span class="mot">${KR.t('valider')}</span><span class="jauge"><i></i></span></button>`;
    el.innerHTML = html;
    const valider = el.querySelector('.valider');
    let etat = 'vide';
    let bloque = false;

    el.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b || b.disabled) return;
      if (b.dataset.chiffre !== undefined) { KR.son('touche'); rappels.chiffre(Number(b.dataset.chiffre)); }
      else if (b.dataset.role === 'effacer') { KR.son('touche'); rappels.effacer(); }
      else if (b.dataset.role === 'valider' && etat !== 'vide') rappels.valider(etat);
    });

    const api = {
      el,
      /* vide : rien à valider ; pret : Check ; suite : Next, avec la jauge sur duree ms */
      etat(nouvel, duree) {
        etat = nouvel;
        valider.classList.toggle('inactif', nouvel === 'vide');
        valider.classList.toggle('suite', nouvel === 'suite');
        valider.setAttribute('aria-disabled', nouvel === 'vide' ? 'true' : 'false');
        valider.querySelector('.v-ico').innerHTML = KR.icone(nouvel === 'suite' ? 'suite' : 'ok');
        valider.querySelector('.mot').textContent = KR.t(nouvel === 'suite' ? 'suite' : 'valider');
        api.bloquer(nouvel === 'suite');
        const i = valider.querySelector('.jauge i');
        i.style.transition = 'none';
        i.style.width = '0';
        if (nouvel === 'suite' && duree) {
          void i.offsetWidth;
          i.style.transition = KR.mouvementReduit() ? 'none' : `width ${duree}ms linear`;
          i.style.width = '100%';
        }
      },
      bloquer(oui) {
        bloque = oui;
        el.classList.toggle('inactif', oui);
        el.querySelectorAll('.touche:not(.valider)').forEach(b => { b.disabled = oui; });
      },
      activer() { paveActif = { api, rappels, etat: () => etat, bloque: () => bloque }; },
    };
    api.activer();
    return api;
  };
  /* Clavier physique (ordinateur, clavier d'iPad) */
  document.addEventListener('keydown', e => {
    if (!paveActif || !document.body.contains(paveActif.api.el) || document.querySelector('.voile')) return;
    if (/^[0-9]$/.test(e.key) && !paveActif.bloque()) { e.preventDefault(); paveActif.rappels.chiffre(Number(e.key)); }
    else if (e.key === 'Backspace' && !paveActif.bloque()) { e.preventDefault(); paveActif.rappels.effacer(); }
    else if (e.key === 'Enter' && paveActif.etat() !== 'vide') { e.preventDefault(); paveActif.rappels.valider(paveActif.etat()); }
  });

  /* ---------- Appui long ---------- */
  KR.appuiLong = function (el, action, duree) {
    duree = duree || 900;
    let minuterie = null;
    el.classList.add('appui-long-cible');
    el.style.setProperty('--duree-appui', duree + 'ms');
    if (!el.querySelector('.remplir')) el.insertAdjacentHTML('afterbegin', '<span class="remplir" aria-hidden="true"></span>');
    const fin = () => { clearTimeout(minuterie); minuterie = null; el.classList.remove('appui-en-cours'); };
    el.addEventListener('pointerdown', e => {
      if (e.button > 0) return;
      e.preventDefault();
      el.classList.add('appui-en-cours');
      minuterie = setTimeout(() => { fin(); action(); }, duree);
    });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(t => el.addEventListener(t, fin));
    el.addEventListener('contextmenu', e => e.preventDefault());
    el.addEventListener('keydown', e => { if (e.key === 'Enter' && e.repeat) action(); });
  };

  /* ---------- Sauvegarde de la progression d'un enfant ---------- */
  function clesDeLEnfant() {
    const pref = KR.enfant() + '.';
    const cles = [];
    try {
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (k && k.indexOf(pref) === 0) cles.push(k);
      }
    } catch (e) { /* stockage indisponible */ }
    return cles;
  }
  KR.exporter = function () {
    const donnees = {};
    clesDeLEnfant().forEach(k => { try { donnees[k] = window.localStorage.getItem(k); } catch (e) { /* rien */ } });
    return JSON.stringify({ app: 'nos-revisions', version: 2, enfant: KR.enfant(), date: new Date().toISOString(), donnees }, null, 2);
  };
  KR.importer = function (texte) {
    try {
      const lu = JSON.parse(texte);
      if (!lu || lu.enfant !== KR.enfant() || !lu.donnees || typeof lu.donnees !== 'object') return false;
      const pref = KR.enfant() + '.';
      Object.keys(lu.donnees).forEach(k => {
        if (k.indexOf(pref) === 0 && typeof lu.donnees[k] === 'string') window.localStorage.setItem(k, lu.donnees[k]);
      });
      return true;
    } catch (e) { return false; }
  };
  KR.effacerTout = function () {
    clesDeLEnfant().forEach(k => { try { window.localStorage.removeItem(k); } catch (e) { /* rien */ } });
  };
  KR.telecharger = function (nom, texte) {
    const url = URL.createObjectURL(new Blob([texte], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = nom;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1000);
  };

  /* ---------- Démarrage : sprite, langue, :active sur iOS, déblocage du son ---------- */
  KR.demarrer = function () {
    if (!document.getElementById('kr-sprite')) {
      const hote = document.createElement('div');
      hote.id = 'kr-sprite';
      hote.innerHTML = SPRITE;
      document.body.insertBefore(hote, document.body.firstChild);
    }
    KR.appliquerLangue();
    document.addEventListener('touchstart', () => {}, { passive: true });
    document.addEventListener('pointerdown', function debloquer() {
      audio();
      document.removeEventListener('pointerdown', debloquer, true);
    }, true);
  };

  window.KR = KR;
})();
