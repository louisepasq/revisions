/* Kit « Nos révisions » : comportements communs aux modules.
   Sans bibliothèque. Expose un seul objet global : KR.
   L'enfant et le module se lisent sur <html data-enfant="henri" data-module="tables">. */
(function () {
  'use strict';

  var racine = document.documentElement;
  var KR = {};

  KR.enfant = function () { return racine.getAttribute('data-enfant') || 'famille'; };
  KR.module = function () { return racine.getAttribute('data-module') || 'portail'; };
  KR.mouvementReduit = function () {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  };

  /* ---------- Stockage : clé « enfant.module.cle », JSON, jamais d'exception ---------- */
  function cle(c, module) { return KR.enfant() + '.' + (module || KR.module()) + '.' + c; }

  KR.stock = {
    lire: function (c, defaut, module) {
      try {
        var brut = window.localStorage.getItem(cle(c, module));
        return brut === null ? defaut : JSON.parse(brut);
      } catch (e) { return defaut; }
    },
    ecrire: function (c, valeur, module) {
      try { window.localStorage.setItem(cle(c, module), JSON.stringify(valeur)); return true; }
      catch (e) { return false; }
    },
    maj: function (c, fn, defaut, module) {
      var v = fn(KR.stock.lire(c, defaut, module));
      KR.stock.ecrire(c, v, module);
      return v;
    }
  };

  /* Sauvegarde de toute la progression de l'enfant (coin parent) :
     supprimer l'icône de l'écran d'accueil efface le stockage. */
  KR.exporter = function () {
    var sortie = { enfant: KR.enfant(), date: new Date().toISOString(), donnees: {} };
    try {
      var pref = KR.enfant() + '.';
      for (var i = 0; i < window.localStorage.length; i++) {
        var k = window.localStorage.key(i);
        if (k && k.indexOf(pref) === 0) sortie.donnees[k] = window.localStorage.getItem(k);
      }
    } catch (e) { /* rien à exporter */ }
    return JSON.stringify(sortie);
  };
  KR.importer = function (texte) {
    try {
      var lu = JSON.parse(texte);
      if (!lu || lu.enfant !== KR.enfant() || typeof lu.donnees !== 'object') return false;
      Object.keys(lu.donnees).forEach(function (k) {
        if (k.indexOf(KR.enfant() + '.') === 0) window.localStorage.setItem(k, lu.donnees[k]);
      });
      return true;
    } catch (e) { return false; }
  };

  /* ---------- Jours d'entraînement : la régularité, sans série perdue ---------- */
  function jourLocal(d) {
    d = d || new Date();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var j = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + m + '-' + j;
  }
  KR.jours = {
    marquer: function () {
      return KR.stock.maj('jours', function (liste) {
        var a = jourLocal();
        if (liste.indexOf(a) < 0) liste.push(a);
        return liste.slice(-120);
      }, [], 'commun');
    },
    /* Semaine du lundi au dimanche : [{jour:'L', fait:true, aujourdhui:false}, ...] */
    semaine: function () {
      var liste = KR.stock.lire('jours', [], 'commun');
      var d = new Date();
      var decal = (d.getDay() + 6) % 7;
      var lundi = new Date(d.getFullYear(), d.getMonth(), d.getDate() - decal);
      var noms = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
      return noms.map(function (n, i) {
        var x = new Date(lundi.getFullYear(), lundi.getMonth(), lundi.getDate() + i);
        return { jour: n, fait: liste.indexOf(jourLocal(x)) >= 0, aujourdhui: i === decal };
      });
    },
    dessiner: function (el) {
      el.innerHTML = '';
      KR.jours.semaine().forEach(function (j) {
        var s = document.createElement('span');
        if (j.fait) s.setAttribute('data-fait', '');
        if (j.aujourdhui) s.setAttribute('data-aujourdhui', '');
        s.innerHTML = '<b>' + j.jour + '</b>';
        el.appendChild(s);
      });
    }
  };

  /* ---------- Sons Web Audio, sans fichier ---------- */
  var ctx = null;
  function audio() {
    if (!ctx) {
      var C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      ctx = new C();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  /* Safari ne joue un son qu'après un geste : on débloque au premier appui. */
  document.addEventListener('pointerdown', function deb() {
    audio();
    document.removeEventListener('pointerdown', deb, true);
  }, true);

  function note(freq, debut, duree, type, vol) {
    var c = audio();
    if (!c) return;
    var o = c.createOscillator();
    var g = c.createGain();
    var t = c.currentTime + debut;
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
  var SONS = {
    touche: function () { note(660, 0, 0.06, 'triangle', 0.08); },
    juste: function () { note(880, 0, 0.25, 'triangle'); note(1320, 0.09, 0.35, 'triangle'); },
    revoir: function () { note(392, 0, 0.3, 'sine', 0.14); note(330, 0.14, 0.4, 'sine', 0.12); },
    monte: function () { [660, 880, 1100].forEach(function (f, i) { note(f, i * 0.08, 0.25, 'triangle', 0.15); }); },
    debloque: function () { [523, 784, 1047].forEach(function (f, i) { note(f, i * 0.1, 0.4, 'sine', 0.18); }); },
    record: function () {
      [523, 659, 784, 1047].forEach(function (f, i) { note(f, i * 0.12, 0.3, 'triangle'); });
      note(1047, 0.5, 0.7, 'triangle');
      note(1319, 0.5, 0.7, 'sine', 0.12);
    }
  };
  KR.sonActif = function (v) {
    if (typeof v === 'boolean') KR.stock.ecrire('son', v, 'reglages');
    return KR.stock.lire('son', true, 'reglages');
  };
  KR.son = function (nom) {
    if (!KR.sonActif() || !SONS[nom]) return;
    try { SONS[nom](); } catch (e) { /* pas de son, pas grave */ }
  };

  /* ---------- Voix : lire une consigne ou une question ---------- */
  KR.lire = function (texte) {
    if (!('speechSynthesis' in window)) return false;
    try {
      window.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(texte);
      u.lang = 'fr-FR';
      u.rate = 0.9;
      var voix = window.speechSynthesis.getVoices().filter(function (v) { return /^fr/i.test(v.lang); });
      if (voix.length) u.voice = voix[0];
      window.speechSynthesis.speak(u);
      return true;
    } catch (e) { return false; }
  };

  /* ---------- Annonce brève, visible et lue par VoiceOver ---------- */
  var zoneAnnonce = null;
  KR.annoncer = function (texte, duree) {
    if (!zoneAnnonce) {
      zoneAnnonce = document.createElement('div');
      zoneAnnonce.className = 'kr-annonce';
      zoneAnnonce.setAttribute('role', 'status');
      zoneAnnonce.setAttribute('aria-live', 'polite');
      document.body.appendChild(zoneAnnonce);
    }
    zoneAnnonce.textContent = texte;
    clearTimeout(zoneAnnonce._t);
    zoneAnnonce._t = setTimeout(function () { zoneAnnonce.textContent = ''; }, duree || 2400);
  };

  /* ---------- Pavé numérique ----------
     KR.pave(conteneur, { afficheur: el, max: 3, onSaisie: fn(valeur), onValider: fn(valeur) })
     Renvoie { valeur(), vider(), activer(bool) }. Le clavier physique marche aussi. */
  KR.pave = function (conteneur, opts) {
    opts = opts || {};
    var max = opts.max || 3;
    var valeur = '';
    var actif = true;
    var ordre = ['7', '8', '9', '4', '5', '6', '1', '2', '3', 'effacer', '0', 'valider'];
    conteneur.classList.add('kr-pave', 'kr-jeu');
    conteneur.setAttribute('role', 'group');
    conteneur.setAttribute('aria-label', 'Pavé de chiffres');
    conteneur.innerHTML = '';
    ordre.forEach(function (t) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'kr-touche' + (t === 'effacer' ? ' kr-touche--effacer' : t === 'valider' ? ' kr-touche--valider' : '');
      b.dataset.touche = t;
      b.textContent = t === 'effacer' ? '⌫' : t === 'valider' ? '✓' : t;
      if (t === 'effacer') b.setAttribute('aria-label', 'Effacer');
      if (t === 'valider') b.setAttribute('aria-label', 'Valider');
      conteneur.appendChild(b);
    });
    function afficher() {
      if (!opts.afficheur) return;
      opts.afficheur.textContent = valeur || (opts.afficheur.dataset.vide || '?');
      opts.afficheur.setAttribute('data-etat', valeur ? 'saisie' : 'vide');
    }
    function appuyer(t) {
      if (!actif) return;
      if (t === 'effacer') { valeur = valeur.slice(0, -1); KR.son('touche'); }
      else if (t === 'valider') { if (valeur && opts.onValider) opts.onValider(valeur); return; }
      else if (valeur.length < max) { valeur = valeur === '0' ? t : valeur + t; KR.son('touche'); }
      afficher();
      if (opts.onSaisie) opts.onSaisie(valeur);
    }
    conteneur.addEventListener('click', function (e) {
      var b = e.target.closest('.kr-touche');
      if (b) appuyer(b.dataset.touche);
    });
    document.addEventListener('keydown', function (e) {
      if (!actif || e.metaKey || e.ctrlKey) return;
      if (/^[0-9]$/.test(e.key)) appuyer(e.key);
      else if (e.key === 'Backspace') appuyer('effacer');
      else if (e.key === 'Enter') appuyer('valider');
      else return;
      e.preventDefault();
    });
    afficher();
    return {
      valeur: function () { return valeur; },
      vider: function () { valeur = ''; afficher(); },
      activer: function (v) {
        actif = v;
        conteneur.setAttribute('aria-disabled', v ? 'false' : 'true');
      }
    };
  };

  /* ---------- Appui long (le coin parent ne s'ouvre pas par hasard) ---------- */
  KR.appuiLong = function (el, duree, action) {
    duree = duree || 1500;
    var debut = 0;
    var raf = 0;
    function tour(t) {
      if (!debut) debut = t;
      var p = Math.min(1, (t - debut) / duree);
      el.style.setProperty('--kr-appui', p);
      if (p >= 1) { arreter(); action(); return; }
      raf = requestAnimationFrame(tour);
    }
    function arreter() {
      cancelAnimationFrame(raf);
      debut = 0;
      el.style.setProperty('--kr-appui', 0);
    }
    el.addEventListener('pointerdown', function (e) { e.preventDefault(); debut = 0; raf = requestAnimationFrame(tour); });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (n) { el.addEventListener(n, arreter); });
    el.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  };

  /* ---------- Mascotte : changer d'humeur ----------
     <img class="kr-mascotte" data-dossier="../commun/mascottes/"> prend
     <dossier><enfant>-<humeur>.png ; un emplacement réservé (div) affiche l'humeur en texte. */
  KR.HUMEURS = ['accueil', 'ecoute', 'bravo', 'encourage', 'fete', 'repos'];
  KR.mascotte = function (el, humeur) {
    el.setAttribute('data-humeur', humeur);
    if (el.tagName === 'IMG' && el.dataset.dossier) {
      el.src = el.dataset.dossier + KR.enfant() + '-' + humeur + '.png';
    } else if (el.dataset.nom) {
      el.textContent = el.dataset.nom + ' ' + humeur;
    }
    if (humeur === 'bravo' || humeur === 'fete') {
      el.classList.remove('kr-saute');
      void el.offsetWidth;
      el.classList.add('kr-saute');
    }
  };

  window.KR = KR;
})();
