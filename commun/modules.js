/* Le catalogue des modules et les cinq matières : la partie fixe que lit le portail (D-19).
   Contrat complet : docs/ARCHITECTURE.md, section « Le portail, le catalogue et le résumé ».

   Ajouter un module : une ligne ici, et le module publie son résumé par KR.publierResume(module,
   resume) ; commun/portail.js et commun/synchro-page.js ne changent pas.

   Champs d'un module :
   - titre    : { en, fr }, court, sans « My » (cadre en anglais britannique, D-13) ;
   - matiere  : maths | francais | hg | sciences | anglais ;
   - icone    : nom d'un symbole du sprite de kit.js (i-<nom>) ;
   - page     : la page du module, relative au dossier de l'enfant ;
   - enfants  : les apps où il apparaît ;
   - etat     : actif | bientot ;
   - objet    : facultatif, l'objet global du module qui porte charger(enfant) et sauver(enfant,
                etat) : synchro-page.js enveloppe son sauver pour la sauvegarde en ligne ;
   - synchro  : false pour un module qui ne range pas son état sous <enfant>.<module> (le
                planisphère de Louise) : la sauvegarde en ligne l'ignore ;
   - noteParent : facultatif, une clé de commun/textes.js affichée sous son résumé dans le coin
                parent (crédits des cartes du zoom).
   L'ordre des lignes est l'ordre des modules dans leur cahier. */
(function (racine) {
  'use strict';

  /* Les cinq matières, dans l'ordre de l'emploi du temps. Noms dans textes.js (mat_<id>, et
     mat_<id>_court quand le nom long ne tient pas) ; le motif est celui de la couverture du cahier. */
  const MATIERES = [
    { id: 'maths', icone: 'maths', motif: 'carreaux' },
    { id: 'francais', icone: 'livre', motif: 'seyes' },
    { id: 'hg', icone: 'globe', motif: 'courbes' },
    { id: 'sciences', icone: 'fiole', motif: 'points' },
    { id: 'anglais', icone: 'bulle', motif: 'rayures' },
  ];

  const CATALOGUE = {
    tables: {
      titre: { en: 'Times tables', fr: 'Les tables' },
      matiere: 'maths',
      icone: 'grille',
      page: 'tables.html',
      enfants: ['henri', 'clara'],
      etat: 'actif',
      objet: 'Tables',
    },
    cible: {
      titre: { en: 'Target number', fr: 'Le nombre cible' },
      matiere: 'maths',
      icone: 'cible',
      page: 'cible.html',
      enfants: ['henri', 'clara'],
      etat: 'actif',
      objet: 'CibleEtat',
    },
    planisphere: {
      // Le module de Louise : il apparaît sans résumé tant qu'il n'en publie pas.
      titre: { en: 'World map', fr: 'Le planisphère' },
      matiere: 'hg',
      icone: 'carte',
      page: 'planisphere.html',
      enfants: ['henri'],
      etat: 'actif',
      synchro: false,
    },
    zoom: {
      titre: { en: 'Space to Éguilles', fr: "De l'univers à Éguilles" },
      matiere: 'hg',
      icone: 'planete',
      page: 'zoom.html',
      enfants: ['henri', 'clara'],
      etat: 'actif',
      objet: 'Zoom',
      noteParent: 'parent_cartes',
    },
  };

  /* Les modules d'un enfant, dans l'ordre du catalogue : [{ id, ...ligne }]. */
  function modulesDe(enfant) {
    return Object.keys(CATALOGUE)
      .filter(id => (CATALOGUE[id].enfants || []).includes(enfant))
      .map(id => Object.assign({ id }, CATALOGUE[id]));
  }

  racine.Matieres = MATIERES;
  racine.Catalogue = CATALOGUE;
  racine.ModulesDe = modulesDe;
})(typeof window !== 'undefined' ? window : globalThis);
