/* Jeu du nombre cible : consignes, explications des coups refusés et phrases de la mascotte, séparées
   de l'interface pour que commun/outils/phrases.js puisse énumérer toutes les phrases dites et
   fabriquer leurs voix. En anglais britannique par défaut (D-21) : le jeu suit la langue du cadre
   (réglage de l'enfant, anglais sauf si un parent choisit le français), le français est gardé pour ce cas.
   Une phrase dite (DIT) ne contient jamais de nombre variable, sauf la cible (10 à 99) : les
   explications chiffrées s'affichent, et la voix dit leur version fixe.
   Ton : doux, jamais de reproche ; une explication dit ce qu'on peut faire à la place.
   Script classique, chargé aussi par node. */
(function (racine) {
  'use strict';

  const LANGUES = {
    en: {
      MOTS_OP: { '+': 'plus', '−': 'minus', '×': 'times', '÷': 'divided by' },
      /* Ce que la voix dit, mot pour mot (fichiers fabriqués d'avance). */
      DIT: {
        cible: n => `The target is ${n}. Reach it with the five numbers.`,
        consigneNombre: 'Touch a number.',
        consigneOperation: 'Pick an operation.',
        consigneSecond: 'Touch another number.',
        negatif: "You can't take away a bigger number. Start with the bigger number.",
        zero: "This would make zero, and zero doesn't help here. Try something else.",
        division: "This division doesn't work out exactly. Try another number.",
        divisionPlusGrand: 'To divide, start with the bigger number.',
        parUn: "Dividing by 1 doesn't change anything, so it doesn't count.",
        indice: "Here's an idea.",
        impasse: "From here, we can't reach the target. Undo a step to try again.",
        dernier: 'Only one number is left. Undo a step, or start again.',
      },
      /* Ce qui s'affiche : la même idée, avec les nombres du calcul. */
      AFFICHE: {
        negatif: (a, b) => `${a} − ${b}: you can't take ${b} away from ${a}. Start with the bigger number.`,
        zero: (a, b) => `${a} − ${b} would make 0, and zero doesn't help here.`,
        division: (a, b) => `${a} ÷ ${b} doesn't work out exactly: ${a % b} would be left over. Try another number.`,
        divisionPlusGrand: (a, b) => `${a} ÷ ${b}: to divide, start with the bigger number.`,
        parUn: a => `${a} ÷ 1 = ${a}: dividing by 1 doesn't change anything, so it doesn't count.`,
        indice: e => `Try: ${e.a} ${e.op} ${e.b} = ${e.r}`,
      },
      ETIQUETTE_INDICE: nom => `${nom}'s idea`,
      ETIQUETTE_CHEMIN: nom => `${nom}'s path`,
    },
    fr: {
      MOTS_OP: { '+': 'plus', '−': 'moins', '×': 'fois', '÷': 'divisé par' },
      DIT: {
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
      },
      AFFICHE: {
        negatif: (a, b) => `${a} − ${b} : on ne peut pas enlever ${b} à ${a}. Commence par le plus grand nombre.`,
        zero: (a, b) => `${a} − ${b} ferait 0 : le zéro ne sert à rien ici.`,
        division: (a, b) => `${a} ÷ ${b} ne tombe pas juste : il resterait ${a % b}. Essaie un autre nombre.`,
        divisionPlusGrand: (a, b) => `${a} ÷ ${b} : pour diviser, commence par le plus grand nombre.`,
        parUn: a => `${a} ÷ 1 = ${a} : diviser par 1 ne change rien, ça ne compte pas.`,
        indice: e => `Essaie : ${e.a} ${e.op} ${e.b} = ${e.r}`,
      },
      ETIQUETTE_INDICE: nom => `L'idée de ${nom}`,
      ETIQUETTE_CHEMIN: nom => `Le chemin de ${nom}`,
    },
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

  /* Le contenu dans une langue ('en' par défaut). */
  const de = langue => LANGUES[langue === 'fr' ? 'fr' : 'en'];

  // DIT, AFFICHE, MOTS_OP et les étiquettes au premier niveau : l'anglais, la langue par défaut.
  racine.CibleContenu = Object.assign({ LANGUES, de, refus }, LANGUES.en);
})(typeof window !== 'undefined' ? window : globalThis);
