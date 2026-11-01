/* Jeu du nombre cible : le contenu scolaire, en français (D-13), séparé de l'interface pour que
   commun/outils/phrases.js puisse énumérer toutes les phrases dites et fabriquer leurs voix.
   Une phrase dite (DIT) ne contient jamais de nombre variable, sauf la cible (10 à 99) : les
   explications chiffrées s'affichent, et la voix dit leur version fixe.
   Script classique, chargé aussi par node. */
(function (racine) {
  'use strict';

  const MOTS_OP = { '+': 'plus', '−': 'moins', '×': 'fois', '÷': 'divisé par' };

  /* Ce que la voix dit, mot pour mot (fichiers fabriqués d'avance). */
  const DIT = {
    cible: n => `La cible est ${n}. Atteins-la avec les cinq nombres.`,
    consigneNombre: 'Touche un nombre.',
    consigneOperation: 'Choisis une opération.',
    consigneSecond: 'Touche un autre nombre.',
    negatif: 'On ne peut pas enlever un nombre plus grand. Commence par le plus grand nombre.',
    zero: 'Ce calcul ferait zéro : il ne sert à rien ici. Essaie autre chose.',
    division: 'Cette division ne tombe pas juste. Essaie un autre nombre.',
    divisionPlusGrand: 'Pour diviser, commence par le plus grand nombre.',
    parUn: 'Diviser par 1 ne change rien : ça ne compte pas.',
    indice: 'Voici une idée de calcul.',
    impasse: "D'ici, on ne peut plus atteindre la cible. Annule un calcul pour repartir.",
    dernier: "Il ne reste qu'un nombre. Annule un calcul, ou recommence.",
  };

  /* Ce qui s'affiche : la même idée, avec les nombres du calcul. */
  const AFFICHE = {
    negatif: (a, b) => `${a} − ${b} : on ne peut pas enlever ${b} à ${a}. Commence par le plus grand nombre.`,
    zero: (a, b) => `${a} − ${b} ferait 0 : le zéro ne sert à rien ici.`,
    division: (a, b) => `${a} ÷ ${b} ne tombe pas juste : il resterait ${a % b}. Essaie un autre nombre.`,
    divisionPlusGrand: (a, b) => `${a} ÷ ${b} : pour diviser, commence par le plus grand nombre.`,
    parUn: a => `${a} ÷ 1 = ${a} : diviser par 1 ne change rien, ça ne compte pas.`,
    indice: e => `Essaie : ${e.a} ${e.op} ${e.b} = ${e.r}`,
  };

  /* La raison d'un refus, à partir du calcul tenté (le moteur dit seulement « division » ou « negatif »). */
  function refus(a, op, b) {
    if (op === '−') return a === b ? 'zero' : 'negatif';
    if (op === '÷') {
      if (b === 1) return 'parUn';
      if (a < b) return 'divisionPlusGrand';
      return 'division';
    }
    return null;
  }

  const ETIQUETTE_INDICE = nom => `L'idée de ${nom}`;
  const ETIQUETTE_CHEMIN = nom => `Le chemin de ${nom}`;

  racine.CibleContenu = { MOTS_OP, DIT, AFFICHE, refus, ETIQUETTE_INDICE, ETIQUETTE_CHEMIN };
})(typeof window !== 'undefined' ? window : globalThis);
