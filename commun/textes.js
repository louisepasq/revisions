/* Les textes du cadre des apps, en deux langues (relecture sur l'anglais du 01/11/2026) :
   le cadre (portail, boutons, mascotte, fins de séance) suit le réglage de langue de l'enfant,
   le contenu scolaire (questions, astuces, dictée) reste dans sa langue et n'est pas ici. */
(function (racine) {
  'use strict';

  const TEXTES = {
    portail_titre: { fr: 'Les révisions de {prenom}', en: "{prenom}'s practice" },
    coin_parent: { fr: 'Coin parent', en: 'Grown-ups' },
    ma_semaine: { fr: 'Ma semaine', en: 'My week' },
    jours_semaine: { fr: '{n} jours cette semaine', en: '{n} days this week' },
    jour_semaine_un: { fr: '1 jour cette semaine', en: '1 day this week' },
    bientot: { fr: 'Bientôt', en: 'Coming soon' },
    commencer: { fr: "C'est parti", en: "Let's go" },
    retour: { fr: 'Retour', en: 'Back' },
    ecouter: { fr: 'Écouter', en: 'Listen' },
    valider: { fr: 'Valider', en: 'Check' },
    effacer: { fr: 'Effacer', en: 'Delete' },
    suite: { fr: 'Suite', en: 'Next' },
    je_passe: { fr: 'Je passe', en: 'Skip' },
    oui: { fr: 'Oui', en: 'Yes' },
    non: { fr: 'Non', en: 'No' },
    avancement: { fr: '{n} sur {total}', en: '{n} of {total}' },
    rapide: { fr: 'Rapide !', en: 'Quick!' },
    bravo: { fr: 'Bravo !', en: 'Well done!' },
    presque: { fr: 'Presque !', en: 'Nearly!' },
    on_regarde: { fr: 'On regarde ensemble', en: "Let's look again" },
    a_toi_retaper: { fr: 'À toi de le retaper', en: 'Now type it yourself' },
    voir_grille: { fr: 'Voir ma grille', en: 'See my grid' },
    fini: { fr: "Fini pour aujourd'hui", en: 'Done for today' },
    cases_montent: { fr: '{n} cases montent', en: '{n} squares went up' },
    case_monte: { fr: '1 case monte', en: '1 square went up' },
    demain_revient: { fr: 'Demain, {fait} revient te voir.', en: 'Tomorrow, {fait} comes back to see you.' },
    ma_grille: { fr: 'Ma grille', en: 'My grid' },
    touche_case: { fr: 'Touche une case pour la revoir', en: 'Tap a square to see it again' },
    etat_gris: { fr: 'Pas encore', en: 'Not yet' },
    etat_bronze: { fr: 'Je commence', en: 'Starting' },
    etat_argent: { fr: 'Presque', en: 'Nearly there' },
    etat_or: { fr: 'Je sais par cœur', en: 'I know it by heart' },
    entrainement: { fr: 'Entraînement du jour', en: "Today's practice" },
    cinq_minutes: { fr: '5 minutes', en: '5 minutes' },
    decouvrir: { fr: 'Découvrir une famille', en: 'Discover a family' },
    defi: { fr: 'Défi 1 minute', en: '1-minute challenge' },
    record: { fr: 'Ton record : {n}', en: 'Your record: {n}' },
    nouveau_record: { fr: 'Nouveau record !', en: 'New record!' },
    diag_bulle: {
      fr: "Avant de jouer, réponds à ce que tu sais. Si tu ne sais pas, appuie sur « Je passe » : ça m'aide à savoir par où on commence.",
      en: "Before we play, answer what you know. If you don't know, tap Skip: it helps me know where to start.",
    },
    diag_fin: { fr: 'Super, je sais par où on commence !', en: 'Great, I know where to start!' },
    attente_bulle: { fr: 'On va où aujourd\'hui ?', en: 'Where shall we go today?' },
  };

  let langue = 'fr';

  function choisirLangue(l) { langue = l === 'en' ? 'en' : 'fr'; return langue; }

  function t(cle, valeurs) {
    const entree = TEXTES[cle];
    if (!entree) return cle;
    let s = entree[langue] || entree.fr;
    if (valeurs) Object.keys(valeurs).forEach(k => { s = s.split('{' + k + '}').join(valeurs[k]); });
    return s;
  }

  function traduirePage(racineDom) {
    (racineDom || document).querySelectorAll('[data-t]').forEach(el => {
      el.textContent = t(el.dataset.t);
      el.lang = langue;
    });
  }

  racine.Textes = { TEXTES, t, choisirLangue, traduirePage, get langue() { return langue; } };
})(typeof window !== 'undefined' ? window : globalThis);
