/* Les textes du cadre des apps, en deux langues (relecture sur l'anglais du 01/11/2026,
   décisions des parents du 01/11/2026) :
   - le cadre (portail, boutons, bulles de la mascotte, fins de séance) suit le réglage de langue
     de l'enfant, anglais par défaut, voix en-GB ; phrases courtes, lues par le bouton Listen ;
   - le contenu scolaire (questions, consignes, Oui et Non, astuces et leur étiquette, dictée)
     reste en français et n'est pas ici : il vit dans le module ;
   - le coin parent est toujours en français : ses clés s'appellent avec t(cle, valeurs, 'fr'). */
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
    avancement: { fr: '{n} sur {total}', en: '{n} of {total}' },
    rapide: { fr: 'Rapide !', en: 'Quick!' },
    bravo: { fr: 'Bravo !', en: 'Well done!' },
    presque: { fr: 'Presque !', en: 'Nearly!' },
    on_regarde: { fr: 'On regarde ensemble', en: "Let's look again" },
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
    // Ajouts de la synthèse de design du 01/11/2026 (docs/design-system/archive/2026-11-01_panel/5-synthese.html)
    repos_bulle: { fr: "C'est fait pour aujourd'hui !", en: 'All done for today!' },
    module_planisphere: { fr: 'Mon planisphère', en: 'My world map' },
    module_planisphere_sous: { fr: 'Géographie', en: 'Geography' },
    planisphere_theme: { fr: 'Continents et océans', en: 'Continents and oceans' },
    module_tables: { fr: 'Mes tables', en: 'My times tables' },
    module_tables_sous: { fr: 'Multiplications', en: 'Multiplication' },
    tables_par_coeur: { fr: '{n} sur {total} par cœur', en: '{n} of {total} by heart' },
    module_dictee: { fr: 'Dictée', en: 'Dictée' },
    module_dictee_sous: { fr: 'Orthographe', en: 'French spelling' },
    jours_courts: { fr: 'lun.,mar.,mer.,jeu.,ven.,sam.,dim.', en: 'Mon,Tue,Wed,Thu,Fri,Sat,Sun' },
    etat_or_court: { fr: 'Par cœur', en: 'By heart' },
    etat_auj: { fr: "Montée aujourd'hui", en: 'Up today' },
    je_mentraine: { fr: "Je m'entraîne", en: 'Practise it' },
    bravo_prenom: { fr: 'Bien joué, {prenom} !', en: 'Well done, {prenom}!' },
    questions_n: { fr: '{n} questions', en: '{n} questions' },
    // Ajouts de l'app v2 (01/11/2026)
    reponses_n: { fr: 'Tu as répondu à {n} questions.', en: 'You answered {n} questions.' },
    demain_simple: { fr: 'À demain !', en: 'See you tomorrow!' },
    entrainement_sous: { fr: 'Un peu chaque jour', en: 'A little every day' },
    numero_pad: { fr: 'Pavé numérique', en: 'Number pad' },
    case_reponse: { fr: 'Ta réponse', en: 'Your answer' },
    juste_aria: { fr: 'Juste', en: 'Right' },
    parent_titre: { fr: 'Coin parent', en: 'Grown-ups' },
    parent_aide: { fr: 'Appui long pour ouvrir', en: 'Press and hold to open' },
    parent_langue: { fr: "Langue de l'app", en: 'App language' },
    parent_langue_note: { fr: 'Les questions et les astuces restent en français.', en: 'Questions and tips stay in French.' },
    parent_voix: { fr: 'Lire les questions et les réponses à voix haute', en: 'Read questions and answers aloud' },
    parent_sons: { fr: 'Sons', en: 'Sounds' },
    active: { fr: 'Oui', en: 'On' },
    coupee: { fr: 'Non', en: 'Off' },
    parent_sauvegarde: { fr: 'Sauvegarde', en: 'Backup' },
    parent_sauvegarde_note: { fr: "Supprimer l'icône efface la progression : gardez une copie.", en: 'Removing the icon erases progress: keep a copy.' },
    parent_export: { fr: 'Exporter', en: 'Export' },
    parent_import: { fr: 'Importer', en: 'Import' },
    parent_import_ok: { fr: 'Progression restaurée.', en: 'Progress restored.' },
    parent_import_ko: { fr: "Ce fichier n'est pas une sauvegarde de {prenom}.", en: "This file is not {prenom}'s backup." },
    parent_raz: { fr: 'Tout effacer', en: 'Erase everything' },
    parent_raz_question: { fr: 'Effacer toute la progression de {prenom} sur cet appareil ?', en: "Erase all of {prenom}'s progress on this device?" },
    parent_raz_oui: { fr: 'Oui, tout effacer', en: 'Yes, erase everything' },
    annuler: { fr: 'Annuler', en: 'Cancel' },
    fermer: { fr: 'Fermer', en: 'Close' },
    parent_tables: { fr: 'Les tables', en: 'Times tables' },
    parent_pas_commence: { fr: "Les tables n'ont pas encore commencé.", en: "Times tables haven't started yet." },
    parent_auto: { fr: '{n} multiplications sur 36 sont devenues automatiques.', en: '{n} of the 36 facts have become automatic.' },
    parent_fragiles: { fr: '{n} restent fragiles : {liste}.', en: '{n} are still shaky: {liste}.' },
    parent_fragile_un: { fr: '1 reste fragile : {liste}.', en: '1 is still shaky: {liste}.' },
    parent_jour_un: { fr: '1 jour de pratique en tout.', en: '1 day of practice so far.' },
    parent_aucun_fragile: { fr: 'Aucun résultat fragile pour le moment.', en: 'No shaky facts at the moment.' },
    parent_jours: { fr: '{n} jours de pratique en tout.', en: '{n} days of practice so far.' },
    parent_lents: { fr: '{n} sont justes mais encore lents : {liste}.', en: '{n} are right but still slow: {liste}.' },
    parent_lent_un: { fr: '1 est juste mais encore lent : {liste}.', en: '1 is right but still slow: {liste}.' },
    // Ajouts de la relecture de l'app des tables (01/11/2026, points 9 et 12)
    questions_auj: { fr: "{n} questions aujourd'hui", en: '{n} questions today' },
    revient_auj: { fr: "{fait} revient aujourd'hui", en: '{fait} comes back today' },
    arreter_question: { fr: "On s'arrête pour aujourd'hui ?", en: 'Stop for today?' },
    continuer: { fr: 'Je continue', en: 'Keep going' },
    arreter: { fr: "J'arrête", en: 'Stop' },
  };

  let langue = 'fr';

  function choisirLangue(l) { langue = l === 'en' ? 'en' : 'fr'; return langue; }

  /* forcee : 'fr' ou 'en' pour ignorer le réglage de l'enfant (le coin parent est en français). */
  function t(cle, valeurs, forcee) {
    const entree = TEXTES[cle];
    if (!entree) return cle;
    let s = entree[forcee || langue] || entree.fr;
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
