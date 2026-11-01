/* Contenu du module « De l'univers à Éguilles » : sept étapes, leurs lieux, le niveau de chaque
   enfant et le repère qui aide après une erreur. En deux langues (D-21) : l'enfant choisit au début
   l'anglais ou le français, et le choix se change depuis l'accueil du module ; le français est
   l'écriture d'origine (ETAGES), l'anglais vit dans EN_ETAGES et EN_LIEUX, sous le même identifiant.
   La progression ne dépend pas de la langue : un lieu su en français reste su en anglais.
   Périmètre : docs/revues/2026-11-01_relecture-zoom-geographie.md et docs/zoom/PLAN.md.
   Niveau par enfant : 'o' = au programme, entre dans les boîtes ; 'p' = « en plus » (an prochain
   ou bonus) : visible et touchable dans l'exploration, jamais interrogé.
   Les tracés sont dans cartes.js, sous le même identifiant. */
(function (racine) {
  'use strict';

  // [identifiant, nom, groupe, Henri, Clara, repère, information facultative, forme dite si elle diffère]
  const ETAGES = [
    {
      id: 'univers', nom: 'La Voie lactée', dit: 'La Voie lactée, notre galaxie.', adresse: 'dans la Voie lactée',
      lieux: [
        ['voie-lactee', 'la Voie lactée', 'galaxie', 'o', 'o', "C'est la grande spirale : notre galaxie.", "Elle mesure environ cent mille années-lumière d'un bout à l'autre."],
        ['systeme-solaire', 'le système solaire', 'galaxie', 'o', 'o', "C'est le petit point brillant dans un bras de la spirale : chez nous.", 'Il est à vingt-six mille années-lumière du centre de la galaxie.'],
        ['autre-galaxie', 'une autre galaxie', 'galaxie', 'o', 'o', 'Loin de la Voie lactée, il y a une autre spirale : une autre galaxie.', "Celle-ci, c'est la galaxie d'Andromède, la grande galaxie la plus proche de nous."],
      ],
    },
    {
      id: 'solaire', nom: 'Le système solaire', dit: 'Le système solaire, autour du Soleil.', adresse: 'dans le système solaire',
      astuce: "Pour l'ordre des planètes : Me Voici Tout Mouillé, J'ai Suivi Un Nuage.",
      lieux: [
        ['soleil', 'le Soleil', 'astre', 'o', 'o', 'Le Soleil est une étoile, au centre du système solaire.'],
        ['terre-planete', 'la Terre', 'planete', 'o', 'o', "La Terre est la troisième planète en partant du Soleil : c'est chez nous."],
        ['lune', 'la Lune', 'astre', 'o', 'o', 'La Lune tourne autour de la Terre : c\'est son satellite.'],
        ['mercure', 'Mercure', 'planete', 'o', 'o', 'Mercure est la planète la plus proche du Soleil.'],
        ['venus', 'Vénus', 'planete', 'o', 'o', 'Vénus est la deuxième planète, entre Mercure et la Terre.'],
        ['mars', 'Mars', 'planete', 'o', 'o', 'Mars, la planète rouge, vient juste après la Terre.'],
        ['jupiter', 'Jupiter', 'planete', 'o', 'o', 'Jupiter est la plus grosse planète, la cinquième.'],
        ['saturne', 'Saturne', 'planete', 'o', 'o', 'Saturne a de grands anneaux. C\'est la sixième planète.'],
        ['uranus', 'Uranus', 'planete', 'o', 'o', 'Uranus est la septième planète, juste après Saturne.'],
        ['neptune', 'Neptune', 'planete', 'o', 'o', 'Neptune est la huitième planète, la plus loin du Soleil.'],
        ['pluton', 'Pluton', 'naine', 'p', 'p', 'Pluton est tout au bout, très petite.', "Pluton était une planète quand Papa était petit ; en 2006, les astronomes ont décidé que c'est une planète naine."],
      ],
    },
    {
      id: 'terre', nom: 'La Terre', dit: 'La Terre, notre planète.', adresse: 'sur la Terre',
      lieux: [
        ['europe', "l'Europe", 'continent', 'o', 'o', "L'Europe est notre continent : la France y est."],
        ['afrique', "l'Afrique", 'continent', 'o', 'o', "L'Afrique est au sud de l'Europe, de l'autre côté de la Méditerranée."],
        ['asie', "l'Asie", 'continent', 'o', 'o', "L'Asie est le plus grand continent, à l'est de l'Europe."],
        ['amerique-nord', "l'Amérique du Nord", 'continent', 'o', 'o', "L'Amérique du Nord est en haut à gauche, de l'autre côté de l'océan Atlantique."],
        ['amerique-sud', "l'Amérique du Sud", 'continent', 'o', 'o', "L'Amérique du Sud est sous l'Amérique du Nord, à gauche de l'océan Atlantique."],
        ['oceanie', "l'Océanie", 'continent', 'o', 'o', "L'Océanie est en bas à droite, avec l'Australie."],
        ['antarctique', "l'Antarctique", 'continent', 'o', 'o', "L'Antarctique est tout en bas, autour du pôle Sud."],
        ['atlantique', "l'océan Atlantique", 'ocean', 'o', 'o', "L'océan Atlantique est entre l'Amérique d'un côté, l'Europe et l'Afrique de l'autre."],
        ['pacifique', "l'océan Pacifique", 'ocean', 'o', 'o', "L'océan Pacifique est le plus grand : il est entre l'Amérique et l'Asie."],
        ['indien', "l'océan Indien", 'ocean', 'o', 'o', "L'océan Indien est au sud de l'Asie, entre l'Afrique et l'Australie."],
        ['arctique', "l'océan Arctique", 'ocean', 'o', 'o', "L'océan Arctique est tout en haut, autour du pôle Nord."],
        ['austral', "l'océan Austral", 'ocean', 'o', 'o', "L'océan Austral entoure l'Antarctique, tout en bas."],
        ['equateur', "l'équateur", 'repere', 'o', 'o', "L'équateur est la ligne du milieu : il coupe la Terre en deux moitiés."],
        ['pole-nord', 'le pôle Nord', 'repere', 'o', 'o', 'Le pôle Nord est tout en haut de la carte.'],
        ['pole-sud', 'le pôle Sud', 'repere', 'o', 'o', "Le pôle Sud est tout en bas, sur l'Antarctique."],
        ['hemisphere-nord', "l'hémisphère Nord", 'repere', 'o', 'o', "L'hémisphère Nord, c'est toute la moitié au-dessus de l'équateur. La France y est."],
        ['hemisphere-sud', "l'hémisphère Sud", 'repere', 'o', 'o', "L'hémisphère Sud, c'est toute la moitié sous l'équateur."],
        ['tropique-cancer', 'le tropique du Cancer', 'ligne', 'p', 'o', "Le tropique du Cancer est la ligne juste au-dessus de l'équateur ; il traverse le Sahara."],
        ['tropique-capricorne', 'le tropique du Capricorne', 'ligne', 'p', 'o', "Le tropique du Capricorne est la ligne juste sous l'équateur ; il traverse l'Australie."],
        ['greenwich', 'le méridien de Greenwich', 'ligne', 'p', 'o', 'Le méridien de Greenwich va du pôle Nord au pôle Sud ; il passe par Londres et par la France.'],
        ['cercle-arctique', 'le cercle polaire arctique', 'ligne', 'p', 'p', 'Le cercle polaire arctique est la ligne tout en haut, près du pôle Nord.'],
        ['cercle-antarctique', 'le cercle polaire antarctique', 'ligne', 'p', 'p', 'Le cercle polaire antarctique est la ligne tout en bas, autour de l\'Antarctique.'],
        ['afrique-subsaharienne', "l'Afrique subsaharienne", 'aire', 'o', 'p', "L'Afrique subsaharienne, c'est l'Afrique au sud du Sahara."],
        ['maghreb', 'le Maghreb', 'aire', 'o', 'p', "Le Maghreb est au nord-ouest de l'Afrique : le Maroc, l'Algérie, la Tunisie."],
        ['asie-est', "l'Asie de l'Est", 'aire', 'o', 'p', "L'Asie de l'Est, c'est la Chine, le Japon et la Corée."],
        ['asie-sud-est', "l'Asie du Sud-Est", 'aire', 'o', 'p', "L'Asie du Sud-Est est au sud de la Chine, avec beaucoup d'îles."],
        ['guadeloupe', 'la Guadeloupe', 'outremer', 'o', 'o', "La Guadeloupe est une île française des Caraïbes, près de l'Amérique."],
        ['martinique', 'la Martinique', 'outremer', 'o', 'o', 'La Martinique est une île française des Caraïbes, juste au sud de la Guadeloupe.'],
        ['guyane', 'la Guyane', 'outremer', 'o', 'o', "La Guyane est en Amérique du Sud, au bord de l'océan Atlantique."],
        ['la-reunion', 'La Réunion', 'outremer', 'o', 'o', "La Réunion est une île française de l'océan Indien, à l'est de Madagascar."],
        ['mayotte', 'Mayotte', 'outremer', 'o', 'o', "Mayotte est une île française de l'océan Indien, entre l'Afrique et Madagascar."],
        ['nil', 'le Nil', 'fleuve', 'p', 'p', "Le Nil traverse l'Afrique du sud au nord.", "C'est l'un des trois plus longs fleuves du monde, avec l'Amazone et le Yangzi Jiang."],
        ['amazone', "l'Amazone", 'fleuve', 'p', 'p', "L'Amazone traverse l'Amérique du Sud.", "C'est l'un des trois plus longs fleuves du monde, avec le Nil et le Yangzi Jiang."],
        ['yangzi', 'le Yangzi Jiang', 'fleuve', 'p', 'p', 'Le Yangzi Jiang traverse la Chine.', "C'est l'un des trois plus longs fleuves du monde, avec le Nil et l'Amazone."],
      ],
    },
    {
      id: 'europe', nom: "L'Europe", dit: "L'Europe, notre continent.", adresse: 'en Europe',
      lieux: [
        ['france', 'la France', 'pays', 'o', 'o', "La France est à l'ouest de l'Europe, entre la Manche et la Méditerranée."],
        ['espagne', "l'Espagne", 'pays', 'o', 'o', "L'Espagne est au sud-ouest de la France, derrière les Pyrénées."],
        ['italie', "l'Italie", 'pays', 'o', 'o', "L'Italie a la forme d'une botte, à l'est de chez nous."],
        ['suisse', 'la Suisse', 'pays', 'o', 'o', "La Suisse est à l'est de la France, dans les montagnes.", "La Suisse est en Europe, mais elle n'est pas dans l'Union européenne."],
        ['allemagne', "l'Allemagne", 'pays', 'o', 'o', "L'Allemagne est au nord-est de la France."],
        ['belgique', 'la Belgique', 'pays', 'o', 'o', 'La Belgique est juste au nord de la France.'],
        ['luxembourg', 'le Luxembourg', 'pays', 'o', 'o', "Le Luxembourg est un tout petit pays, entre la Belgique, l'Allemagne et la France."],
        ['monaco', 'Monaco', 'pays', 'o', 'o', 'Monaco est un tout petit pays au bord de la Méditerranée, collé à Nice.'],
        ['royaume-uni', 'le Royaume-Uni', 'pays', 'o', 'o', 'Le Royaume-Uni est de l\'autre côté de la Manche.', "Le Royaume-Uni est en Europe, mais il n'est pas dans l'Union européenne."],
        ['andorre', "l'Andorre", 'pays', 'p', 'o', "L'Andorre est un tout petit pays dans les Pyrénées, entre la France et l'Espagne."],
        ['pays-bas', 'les Pays-Bas', 'pays', 'p', 'o', 'Les Pays-Bas sont au nord de la Belgique, au bord de la mer du Nord.'],
        ['portugal', 'le Portugal', 'pays', 'p', 'o', "Le Portugal est à l'ouest de l'Espagne, au bord de l'océan Atlantique."],
        ['grece', 'la Grèce', 'pays', 'p', 'p', "La Grèce est tout au sud-est de l'Europe."],
        ['pologne', 'la Pologne', 'pays', 'p', 'p', "La Pologne est à l'est de l'Allemagne."],
        ['manche', 'la Manche', 'mer', 'o', 'o', 'La Manche est la mer entre la France et le Royaume-Uni.'],
        ['mer-du-nord', 'la mer du Nord', 'mer', 'o', 'o', 'La mer du Nord est au-dessus de la Manche, entre le Royaume-Uni et les Pays-Bas.'],
        ['atlantique-europe', "l'océan Atlantique", 'mer', 'o', 'o', "L'océan Atlantique est à l'ouest de la France, à gauche de la carte."],
        ['mediterranee-europe', 'la mer Méditerranée', 'mer', 'o', 'o', 'La mer Méditerranée est au sud de la France, sous l\'Europe.'],
        ['golfe-gascogne', 'le golfe de Gascogne', 'mer', 'p', 'p', "Le golfe de Gascogne est le grand creux de l'océan Atlantique, entre la France et l'Espagne."],
      ],
    },
    {
      id: 'france', nom: 'La France', dit: 'La France, notre pays.', adresse: 'en France',
      lieux: [
        ['paca', "la région Provence-Alpes-Côte d'Azur", 'region', 'o', 'o', 'C\'est notre région, au sud-est de la France, au bord de la Méditerranée.', 'On l\'appelle aussi « Région Sud » sur les panneaux : c\'est son nom de communication, pas son nom officiel.'],
        ['paris', 'Paris', 'ville', 'o', 'o', 'Paris, la capitale, est au nord de la France.'],
        ['marseille', 'Marseille', 'ville', 'o', 'o', "Marseille est au bord de la Méditerranée : c'est la capitale de notre région."],
        ['lyon', 'Lyon', 'ville', 'o', 'o', 'Lyon est sur le Rhône, au nord de notre région.'],
        ['toulouse', 'Toulouse', 'ville', 'o', 'o', 'Toulouse est au sud-ouest, pas loin des Pyrénées.'],
        ['ajaccio', 'Ajaccio', 'ville', 'o', 'o', "Ajaccio est en Corse, l'île de la Méditerranée."],
        ['alpes', 'les Alpes', 'massif', 'o', 'o', "Les Alpes sont les plus hautes montagnes de France, à l'est, près de l'Italie et de la Suisse."],
        ['lille', 'Lille', 'ville', 'p', 'o', 'Lille est tout au nord, près de la Belgique.'],
        ['seine', 'la Seine', 'fleuve', 'p', 'o', 'La Seine traverse Paris et se jette dans la Manche.'],
        ['loire', 'la Loire', 'fleuve', 'p', 'o', "La Loire est le plus long fleuve de France ; elle se jette dans l'océan Atlantique."],
        ['garonne', 'la Garonne', 'fleuve', 'p', 'o', 'La Garonne passe à Toulouse et à Bordeaux, au sud-ouest.'],
        ['rhin', 'le Rhin', 'fleuve', 'p', 'o', "Le Rhin fait la frontière entre la France et l'Allemagne, à l'est."],
        ['pyrenees', 'les Pyrénées', 'massif', 'p', 'o', "Les Pyrénées sont au sud-ouest, entre la France et l'Espagne."],
        ['massif-central', 'le Massif central', 'massif', 'p', 'o', 'Le Massif central est au milieu de la France, un peu vers le sud.'],
        ['jura', 'le Jura', 'massif', 'p', 'o', "Le Jura est à l'est, le long de la Suisse, au nord des Alpes."],
        ['vosges', 'les Vosges', 'massif', 'p', 'o', "Les Vosges sont au nord-est, près de l'Allemagne."],
        ['corse', 'la Corse', 'region', 'p', 'o', 'La Corse est une île de montagnes, dans la Méditerranée.'],
        ['leman', 'le lac Léman', 'lac', 'p', 'o', 'Le lac Léman est un grand lac naturel, entre la France et la Suisse.'],
        ['occitanie', "l'Occitanie", 'region', 'p', 'o', "L'Occitanie est à l'ouest de notre région, de l'autre côté du Rhône."],
        ['auvergne-rhone-alpes', "l'Auvergne-Rhône-Alpes", 'region', 'p', 'o', "L'Auvergne-Rhône-Alpes est juste au nord de notre région, avec Lyon."],
        ['nouvelle-aquitaine', 'la Nouvelle-Aquitaine', 'region', 'p', 'o', "La Nouvelle-Aquitaine est la plus grande région, au sud-ouest, au bord de l'océan Atlantique."],
        ['bretagne', 'la Bretagne', 'region', 'p', 'o', "La Bretagne est la pointe de l'ouest, entre la Manche et l'océan Atlantique."],
        ['normandie', 'la Normandie', 'region', 'p', 'o', 'La Normandie est au nord-ouest, au bord de la Manche.'],
        ['hauts-de-france', 'les Hauts-de-France', 'region', 'p', 'o', 'Les Hauts-de-France sont tout au nord, avec Lille.'],
        ['grand-est', 'le Grand Est', 'region', 'p', 'o', "Le Grand Est est au nord-est, le long de l'Allemagne."],
        ['ile-de-france', "l'Île-de-France", 'region', 'p', 'o', "L'Île-de-France est la petite région autour de Paris."],
        ['bourgogne-franche-comte', 'la Bourgogne-Franche-Comté', 'region', 'p', 'o', "La Bourgogne-Franche-Comté est à l'est, le long de la Suisse."],
        ['centre-val-de-loire', 'le Centre-Val de Loire', 'region', 'p', 'o', 'Le Centre-Val de Loire est au milieu de la France, au sud de Paris.'],
        ['pays-de-la-loire', 'les Pays de la Loire', 'region', 'p', 'o', "Les Pays de la Loire sont à l'ouest, là où la Loire rejoint l'océan Atlantique."],
        ['dijon', 'Dijon', 'capitale', 'p', 'p', 'Dijon est la capitale de la Bourgogne-Franche-Comté.'],
        ['rennes', 'Rennes', 'capitale', 'p', 'p', 'Rennes est la capitale de la Bretagne.'],
        ['orleans', 'Orléans', 'capitale', 'p', 'p', 'Orléans est la capitale du Centre-Val de Loire.'],
        ['strasbourg', 'Strasbourg', 'capitale', 'p', 'p', 'Strasbourg est la capitale du Grand Est.'],
        ['rouen', 'Rouen', 'capitale', 'p', 'p', 'Rouen est la capitale de la Normandie.'],
        ['bordeaux', 'Bordeaux', 'capitale', 'p', 'p', 'Bordeaux est la capitale de la Nouvelle-Aquitaine.'],
        ['nantes', 'Nantes', 'capitale', 'p', 'p', 'Nantes est la capitale des Pays de la Loire.'],
      ],
    },
    {
      id: 'paca', nom: "Provence-Alpes-Côte d'Azur", dit: "Provence-Alpes-Côte d'Azur, notre région.", adresse: "en Provence-Alpes-Côte d'Azur",
      lieux: [
        ['bouches-du-rhone', 'les Bouches-du-Rhône', 'departement', 'o', 'o', "Le 13, ce sont les Bouches-du-Rhône : notre département, à l'ouest, au bord de la mer.", null, 'les Bouches-du-Rhône, le treize', '13'],
        ['var', 'le Var', 'departement', 'o', 'o', 'Le 83, c\'est le Var : au bord de la mer, entre les Bouches-du-Rhône et les Alpes-Maritimes.', null, 'le Var, le quatre-vingt-trois', '83'],
        ['vaucluse', 'le Vaucluse', 'departement', 'o', 'o', 'Le 84, c\'est le Vaucluse : au nord des Bouches-du-Rhône, avec le mont Ventoux.', null, 'le Vaucluse, le quatre-vingt-quatre', '84'],
        ['alpes-maritimes', 'les Alpes-Maritimes', 'departement', 'o', 'o', "Le 06, ce sont les Alpes-Maritimes : tout à l'est, collées à l'Italie.", null, 'les Alpes-Maritimes, le zéro-six', '06'],
        ['alpes-de-haute-provence', 'les Alpes-de-Haute-Provence', 'departement', 'o', 'o', 'Le 04, ce sont les Alpes-de-Haute-Provence : au milieu de la région, dans les montagnes.', null, 'les Alpes-de-Haute-Provence, le zéro-quatre', '04'],
        ['hautes-alpes', 'les Hautes-Alpes', 'departement', 'o', 'o', 'Le 05, ce sont les Hautes-Alpes : tout au nord de la région, dans les hautes montagnes.', null, 'les Hautes-Alpes, le zéro-cinq', '05'],
        ['marseille-prefecture', 'Marseille', 'ville', 'o', 'o', 'Marseille est la préfecture des Bouches-du-Rhône, au bord de la mer : la plus grande ville de la région.'],
        ['aix', 'Aix-en-Provence', 'ville', 'o', 'o', 'Aix-en-Provence est une sous-préfecture des Bouches-du-Rhône, au nord de Marseille : notre ville.'],
        ['toulon', 'Toulon', 'ville', 'o', 'o', 'Toulon est la préfecture du Var, au bord de la mer.'],
        ['avignon', 'Avignon', 'ville', 'o', 'o', 'Avignon est la préfecture du Vaucluse, au bord du Rhône.'],
        ['nice', 'Nice', 'ville', 'o', 'o', "Nice est la préfecture des Alpes-Maritimes, au bord de la mer, près de l'Italie."],
        ['digne', 'Digne-les-Bains', 'ville', 'o', 'o', 'Digne-les-Bains est la préfecture des Alpes-de-Haute-Provence.'],
        ['gap', 'Gap', 'ville', 'o', 'o', 'Gap est la préfecture des Hautes-Alpes, au nord de la région.'],
        ['cannes', 'Cannes', 'ville', 'o', 'o', "Cannes est une grande ville au bord de la mer, à l'ouest de Nice. Ce n'est pas une préfecture."],
        ['rhone', 'le Rhône', 'cours', 'o', 'o', "Le Rhône est un fleuve : il fait la frontière ouest de la région et se jette dans la Méditerranée."],
        ['durance', 'la Durance', 'cours', 'o', 'o', 'La Durance est une rivière : elle descend des Alpes et se jette dans le Rhône, près d\'Avignon.'],
        ['camargue', 'la Camargue', 'nature', 'o', 'o', 'La Camargue est le delta du Rhône, entre ses deux bras, au bord de la mer.'],
        ['ventoux', 'le mont Ventoux', 'nature', 'o', 'o', 'Le mont Ventoux est une grande montagne toute seule, dans le Vaucluse.'],
        ['serre-poncon', 'le lac de Serre-Ponçon', 'nature', 'o', 'o', 'Le lac de Serre-Ponçon est un grand lac de barrage sur la Durance, dans les montagnes du nord de la région.'],
        ['mediterranee-paca', 'la mer Méditerranée', 'voisin', 'o', 'o', 'La mer Méditerranée est au sud de la région.'],
        ['italie-voisine', "l'Italie", 'voisin', 'o', 'o', "L'Italie est le pays voisin, à l'est, derrière les Alpes-Maritimes."],
        ['monaco-voisin', 'Monaco', 'voisin', 'o', 'o', 'Monaco est un tout petit pays, collé à Nice, au bord de la mer.'],
        ['occitanie-voisine', "l'Occitanie", 'voisin', 'o', 'o', "L'Occitanie est la région voisine, à l'ouest, de l'autre côté du Rhône."],
        ['auvergne-rhone-alpes-voisine', "l'Auvergne-Rhône-Alpes", 'voisin', 'o', 'o', "L'Auvergne-Rhône-Alpes est la région voisine, au nord."],
        ['fleuve-var', 'le fleuve Var', 'cours', 'p', 'o', 'Le fleuve Var descend des Alpes et se jette dans la mer, tout près de Nice.'],
        ['verdon', 'le Verdon', 'cours', 'p', 'p', 'Le Verdon est une rivière qui se jette dans la Durance.'],
        ['briancon', 'Briançon', 'ville', 'p', 'p', 'Briançon est une sous-préfecture des Hautes-Alpes, tout au nord, dans les montagnes.'],
        ['grasse', 'Grasse', 'ville', 'p', 'p', 'Grasse est la sous-préfecture des Alpes-Maritimes, au-dessus de Cannes.'],
      ],
    },
    {
      id: 'bdr', nom: 'Les Bouches-du-Rhône', dit: 'Les Bouches-du-Rhône, notre département, et Éguilles, notre village.', adresse: 'dans les Bouches-du-Rhône',
      lieux: [
        ['eguilles', 'Éguilles', 'commune', 'o', 'o', "Éguilles est notre village, juste à l'ouest d'Aix-en-Provence."],
        ['sainte-victoire', 'la montagne Sainte-Victoire', 'commune', 'o', 'o', "La montagne Sainte-Victoire est à l'est d'Aix-en-Provence : on la voit depuis Éguilles."],
        ['arles', 'Arles', 'commune', 'p', 'p', 'Arles est une sous-préfecture des Bouches-du-Rhône, au bord du Rhône, au nord de la Camargue.'],
        ['istres', 'Istres', 'commune', 'p', 'p', "Istres est une sous-préfecture des Bouches-du-Rhône, au bord de l'étang de Berre."],
        ['etang-de-berre', "l'étang de Berre", 'commune', 'p', 'p', "L'étang de Berre est une grande lagune, au nord-ouest de Marseille."],
      ],
    },
  ];

  /* La version anglaise (D-21 : l'enfant choisit la langue du voyage au début). Anglais britannique,
     phrases courtes pour un enfant qui commence à lire l'anglais. Noms usuels en anglais (the Milky
     Way, the English Channel, the Alps) ; les noms propres français sans équivalent restent tels quels
     (Bouches-du-Rhône, Éguilles, Mont Sainte-Victoire), les départements avec leur numéro.
     Étapes : [nom, dit, adresse, astuce] ; lieux : [nom, repère, information, forme dite]. */
  const EN_ETAGES = {
    univers: ['The Milky Way', 'The Milky Way, our galaxy.', 'in the Milky Way'],
    solaire: ['The Solar System', 'The Solar System, around the Sun.', 'in the Solar System', 'For the order of the planets: My Very Easy Method Just Speeds Up Naming.'],
    terre: ['The Earth', 'The Earth, our planet.', 'on Earth'],
    europe: ['Europe', 'Europe, our continent.', 'in Europe'],
    france: ['France', 'France, our country.', 'in France'],
    paca: ["Provence-Alpes-Côte d'Azur", "Provence-Alpes-Côte d'Azur, our region.", "in Provence-Alpes-Côte d'Azur"],
    bdr: ['Bouches-du-Rhône', 'Bouches-du-Rhône, our department, and Éguilles, our village.', 'in Bouches-du-Rhône'],
  };
  const EN_LIEUX = {
    // La Voie lactée
    'voie-lactee': ['the Milky Way', "It's the big spiral: our galaxy.", 'It is about one hundred thousand light years from one end to the other.'],
    'systeme-solaire': ['the Solar System', "It's the little bright dot in one arm of the spiral: our home.", 'It is twenty-six thousand light years from the centre of the galaxy.'],
    'autre-galaxie': ['another galaxy', 'Far from the Milky Way, there is another spiral: another galaxy.', 'This one is the Andromeda Galaxy, the closest big galaxy to us.'],
    // Le système solaire
    soleil: ['the Sun', 'The Sun is a star, in the centre of the Solar System.'],
    'terre-planete': ['the Earth', 'The Earth is the third planet from the Sun: it is our home.'],
    lune: ['the Moon', 'The Moon goes round the Earth.'],
    mercure: ['Mercury', 'Mercury is the planet closest to the Sun.'],
    venus: ['Venus', 'Venus is the second planet, between Mercury and the Earth.'],
    mars: ['Mars', 'Mars, the red planet, comes just after the Earth.'],
    jupiter: ['Jupiter', 'Jupiter is the biggest planet. It is the fifth one.'],
    saturne: ['Saturn', 'Saturn has big rings. It is the sixth planet.'],
    uranus: ['Uranus', 'Uranus is the seventh planet, just after Saturn.'],
    neptune: ['Neptune', 'Neptune is the eighth planet, the furthest from the Sun.'],
    pluton: ['Pluto', 'Pluto is right at the end, and very small.', 'Pluto was a planet when Daddy was little. In 2006, astronomers decided it is a dwarf planet.'],
    // La Terre
    europe: ['Europe', 'Europe is our continent: France is in Europe.'],
    afrique: ['Africa', 'Africa is south of Europe, across the Mediterranean.'],
    asie: ['Asia', 'Asia is the biggest continent, east of Europe.'],
    'amerique-nord': ['North America', 'North America is at the top on the left, across the Atlantic Ocean.'],
    'amerique-sud': ['South America', 'South America is below North America, to the left of the Atlantic Ocean.'],
    oceanie: ['Oceania', 'Oceania is at the bottom on the right, with Australia.'],
    antarctique: ['Antarctica', 'Antarctica is right at the bottom, around the South Pole.'],
    atlantique: ['the Atlantic Ocean', 'The Atlantic Ocean is between America on one side, and Europe and Africa on the other.'],
    pacifique: ['the Pacific Ocean', 'The Pacific Ocean is the biggest. It is between America and Asia.'],
    indien: ['the Indian Ocean', 'The Indian Ocean is south of Asia, between Africa and Australia.'],
    arctique: ['the Arctic Ocean', 'The Arctic Ocean is right at the top, around the North Pole.'],
    austral: ['the Southern Ocean', 'The Southern Ocean goes all round Antarctica, right at the bottom.'],
    equateur: ['the Equator', 'The Equator is the line in the middle. It cuts the Earth into two halves.'],
    'pole-nord': ['the North Pole', 'The North Pole is right at the top of the map.'],
    'pole-sud': ['the South Pole', 'The South Pole is right at the bottom, on Antarctica.'],
    'hemisphere-nord': ['the Northern Hemisphere', 'The Northern Hemisphere is the whole half above the Equator. France is in it.'],
    'hemisphere-sud': ['the Southern Hemisphere', 'The Southern Hemisphere is the whole half below the Equator.'],
    'tropique-cancer': ['the Tropic of Cancer', 'The Tropic of Cancer is the line just above the Equator. It crosses the Sahara.'],
    'tropique-capricorne': ['the Tropic of Capricorn', 'The Tropic of Capricorn is the line just below the Equator. It crosses Australia.'],
    greenwich: ['the Greenwich Meridian', 'The Greenwich Meridian goes from the North Pole to the South Pole. It passes through London and through France.'],
    'cercle-arctique': ['the Arctic Circle', 'The Arctic Circle is the line right at the top, near the North Pole.'],
    'cercle-antarctique': ['the Antarctic Circle', 'The Antarctic Circle is the line right at the bottom, around Antarctica.'],
    'afrique-subsaharienne': ['Sub-Saharan Africa', 'Sub-Saharan Africa is the part of Africa south of the Sahara.'],
    maghreb: ['the Maghreb', 'The Maghreb is in the north-west of Africa: Morocco, Algeria and Tunisia.'],
    'asie-est': ['East Asia', 'East Asia is China, Japan and Korea.'],
    'asie-sud-est': ['South-East Asia', 'South-East Asia is south of China, with lots of islands.'],
    guadeloupe: ['Guadeloupe', 'Guadeloupe is a French island in the Caribbean, near America.'],
    martinique: ['Martinique', 'Martinique is a French island in the Caribbean, just south of Guadeloupe.'],
    guyane: ['French Guiana', 'French Guiana is in South America, by the Atlantic Ocean.'],
    'la-reunion': ['Réunion', 'Réunion is a French island in the Indian Ocean, east of Madagascar.'],
    mayotte: ['Mayotte', 'Mayotte is a French island in the Indian Ocean, between Africa and Madagascar.'],
    nil: ['the Nile', 'The Nile crosses Africa from south to north.', 'It is one of the three longest rivers in the world, with the Amazon and the Yangtze.'],
    amazone: ['the Amazon', 'The Amazon crosses South America.', 'It is one of the three longest rivers in the world, with the Nile and the Yangtze.'],
    yangzi: ['the Yangtze', 'The Yangtze crosses China.', 'It is one of the three longest rivers in the world, with the Nile and the Amazon.'],
    // L'Europe
    france: ['France', 'France is in the west of Europe, between the English Channel and the Mediterranean.'],
    espagne: ['Spain', 'Spain is south-west of France, behind the Pyrenees.'],
    italie: ['Italy', 'Italy is shaped like a boot. It is east of us.'],
    suisse: ['Switzerland', 'Switzerland is east of France, in the mountains.', 'Switzerland is in Europe, but it is not in the European Union.'],
    allemagne: ['Germany', 'Germany is north-east of France.'],
    belgique: ['Belgium', 'Belgium is just north of France.'],
    luxembourg: ['Luxembourg', 'Luxembourg is a tiny country, between Belgium, Germany and France.'],
    monaco: ['Monaco', 'Monaco is a tiny country by the Mediterranean, right next to Nice.'],
    'royaume-uni': ['the United Kingdom', 'The United Kingdom is across the English Channel.', 'The United Kingdom is in Europe, but it is not in the European Union.'],
    andorre: ['Andorra', 'Andorra is a tiny country in the Pyrenees, between France and Spain.'],
    'pays-bas': ['the Netherlands', 'The Netherlands is north of Belgium, by the North Sea.'],
    portugal: ['Portugal', 'Portugal is west of Spain, by the Atlantic Ocean.'],
    grece: ['Greece', 'Greece is right in the south-east of Europe.'],
    pologne: ['Poland', 'Poland is east of Germany.'],
    manche: ['the English Channel', 'The English Channel is the sea between France and the United Kingdom.'],
    'mer-du-nord': ['the North Sea', 'The North Sea is above the English Channel, between the United Kingdom and the Netherlands.'],
    'atlantique-europe': ['the Atlantic Ocean', 'The Atlantic Ocean is west of France, on the left of the map.'],
    'mediterranee-europe': ['the Mediterranean Sea', 'The Mediterranean Sea is south of France, below Europe.'],
    'golfe-gascogne': ['the Bay of Biscay', 'The Bay of Biscay is the big curve of the Atlantic Ocean, between France and Spain.'],
    // La France
    paca: ["the Provence-Alpes-Côte d'Azur region", "It's our region, in the south-east of France, by the Mediterranean.", 'On road signs, it is also called "Région Sud". That is a nickname, not its official name.'],
    paris: ['Paris', 'Paris, the capital, is in the north of France.'],
    marseille: ['Marseille', 'Marseille is by the Mediterranean. It is the capital of our region.'],
    lyon: ['Lyon', 'Lyon is on the Rhône, north of our region.'],
    toulouse: ['Toulouse', 'Toulouse is in the south-west, not far from the Pyrenees.'],
    ajaccio: ['Ajaccio', 'Ajaccio is in Corsica, the island in the Mediterranean.'],
    alpes: ['the Alps', 'The Alps are the highest mountains in France. They are in the east, near Italy and Switzerland.'],
    lille: ['Lille', 'Lille is right in the north, near Belgium.'],
    seine: ['the Seine', 'The Seine goes through Paris and flows into the English Channel.'],
    loire: ['the Loire', 'The Loire is the longest river in France. It flows into the Atlantic Ocean.'],
    garonne: ['the Garonne', 'The Garonne goes through Toulouse and Bordeaux, in the south-west.'],
    rhin: ['the Rhine', 'The Rhine is the border between France and Germany, in the east.'],
    pyrenees: ['the Pyrenees', 'The Pyrenees are in the south-west, between France and Spain.'],
    'massif-central': ['the Massif Central', 'The Massif Central is in the middle of France, a little to the south.'],
    jura: ['the Jura', 'The Jura is in the east, along Switzerland, north of the Alps.'],
    vosges: ['the Vosges', 'The Vosges are in the north-east, near Germany.'],
    corse: ['Corsica', 'Corsica is an island of mountains, in the Mediterranean.'],
    leman: ['Lake Geneva', 'Lake Geneva is a big natural lake, between France and Switzerland.'],
    occitanie: ['Occitanie', 'Occitanie is west of our region, across the Rhône.'],
    'auvergne-rhone-alpes': ['Auvergne-Rhône-Alpes', 'Auvergne-Rhône-Alpes is just north of our region, with Lyon.'],
    'nouvelle-aquitaine': ['Nouvelle-Aquitaine', 'Nouvelle-Aquitaine is the biggest region, in the south-west, by the Atlantic Ocean.'],
    bretagne: ['Brittany', 'Brittany is the point in the west, between the English Channel and the Atlantic Ocean.'],
    normandie: ['Normandy', 'Normandy is in the north-west, by the English Channel.'],
    'hauts-de-france': ['Hauts-de-France', 'Hauts-de-France is right in the north, with Lille.'],
    'grand-est': ['Grand Est', 'Grand Est is in the north-east, along Germany.'],
    'ile-de-france': ['Île-de-France', 'Île-de-France is the small region around Paris.'],
    'bourgogne-franche-comte': ['Bourgogne-Franche-Comté', 'Bourgogne-Franche-Comté is in the east, along Switzerland.'],
    'centre-val-de-loire': ['Centre-Val de Loire', 'Centre-Val de Loire is in the middle of France, south of Paris.'],
    'pays-de-la-loire': ['Pays de la Loire', 'Pays de la Loire is in the west, where the Loire reaches the Atlantic Ocean.'],
    dijon: ['Dijon', 'Dijon is the capital of Bourgogne-Franche-Comté.'],
    rennes: ['Rennes', 'Rennes is the capital of Brittany.'],
    orleans: ['Orléans', 'Orléans is the capital of Centre-Val de Loire.'],
    strasbourg: ['Strasbourg', 'Strasbourg is the capital of Grand Est.'],
    rouen: ['Rouen', 'Rouen is the capital of Normandy.'],
    bordeaux: ['Bordeaux', 'Bordeaux is the capital of Nouvelle-Aquitaine.'],
    nantes: ['Nantes', 'Nantes is the capital of Pays de la Loire.'],
    // Provence-Alpes-Côte d'Azur
    'bouches-du-rhone': ['Bouches-du-Rhône', 'Number 13 is Bouches-du-Rhône: our department, in the west, by the sea.', null, 'Bouches-du-Rhône, number thirteen'],
    var: ['Var', 'Number 83 is Var: by the sea, between Bouches-du-Rhône and Alpes-Maritimes.', null, 'Var, number eighty-three'],
    vaucluse: ['Vaucluse', 'Number 84 is Vaucluse: north of Bouches-du-Rhône, with Mont Ventoux.', null, 'Vaucluse, number eighty-four'],
    'alpes-maritimes': ['Alpes-Maritimes', 'Number 06 is Alpes-Maritimes: right in the east, next to Italy.', null, 'Alpes-Maritimes, number zero six'],
    'alpes-de-haute-provence': ['Alpes-de-Haute-Provence', 'Number 04 is Alpes-de-Haute-Provence: in the middle of the region, in the mountains.', null, 'Alpes-de-Haute-Provence, number zero four'],
    'hautes-alpes': ['Hautes-Alpes', 'Number 05 is Hautes-Alpes: right in the north of the region, in the high mountains.', null, 'Hautes-Alpes, number zero five'],
    'marseille-prefecture': ['Marseille', 'Marseille is the main town of Bouches-du-Rhône, by the sea. It is the biggest city in the region.'],
    aix: ['Aix-en-Provence', 'Aix-en-Provence is an important town of Bouches-du-Rhône, north of Marseille. It is our town.'],
    toulon: ['Toulon', 'Toulon is the main town of Var, by the sea.'],
    avignon: ['Avignon', 'Avignon is the main town of Vaucluse, on the Rhône.'],
    nice: ['Nice', 'Nice is the main town of Alpes-Maritimes, by the sea, near Italy.'],
    digne: ['Digne-les-Bains', 'Digne-les-Bains is the main town of Alpes-de-Haute-Provence.'],
    gap: ['Gap', 'Gap is the main town of Hautes-Alpes, in the north of the region.'],
    cannes: ['Cannes', 'Cannes is a big town by the sea, west of Nice. It is not the main town.'],
    rhone: ['the Rhône', 'The Rhône is a big river. It is the western edge of the region, and it flows into the Mediterranean.'],
    durance: ['the Durance', 'The Durance is a river. It comes down from the Alps and flows into the Rhône, near Avignon.'],
    camargue: ['the Camargue', 'The Camargue is the delta of the Rhône, between its two arms, by the sea.'],
    ventoux: ['Mont Ventoux', 'Mont Ventoux is a big mountain on its own, in Vaucluse.'],
    'serre-poncon': ['Lake Serre-Ponçon', 'Lake Serre-Ponçon is a big lake behind a dam on the Durance, in the mountains in the north of the region.'],
    'mediterranee-paca': ['the Mediterranean Sea', 'The Mediterranean Sea is south of the region.'],
    'italie-voisine': ['Italy', 'Italy is the country next door, to the east, behind Alpes-Maritimes.'],
    'monaco-voisin': ['Monaco', 'Monaco is a tiny country, right next to Nice, by the sea.'],
    'occitanie-voisine': ['Occitanie', 'Occitanie is the region next door, to the west, across the Rhône.'],
    'auvergne-rhone-alpes-voisine': ['Auvergne-Rhône-Alpes', 'Auvergne-Rhône-Alpes is the region next door, to the north.'],
    'fleuve-var': ['the River Var', 'The River Var comes down from the Alps and flows into the sea, very near Nice.'],
    verdon: ['the Verdon', 'The Verdon is a river that flows into the Durance.'],
    briancon: ['Briançon', 'Briançon is an important town of Hautes-Alpes, right in the north, in the mountains.'],
    grasse: ['Grasse', 'Grasse is an important town of Alpes-Maritimes, above Cannes.'],
    // Les Bouches-du-Rhône
    eguilles: ['Éguilles', 'Éguilles is our village, just west of Aix-en-Provence.'],
    'sainte-victoire': ['Mont Sainte-Victoire', 'Mont Sainte-Victoire is east of Aix-en-Provence. You can see it from Éguilles.'],
    arles: ['Arles', 'Arles is an important town of Bouches-du-Rhône, on the Rhône, north of the Camargue.'],
    istres: ['Istres', 'Istres is an important town of Bouches-du-Rhône, by the Étang de Berre.'],
    'etang-de-berre': ['the Étang de Berre', 'The Étang de Berre is a big lagoon, north-west of Marseille.'],
  };

  const ADRESSES = {
    fr: "J'habite à Éguilles, dans les Bouches-du-Rhône, en Provence-Alpes-Côte d'Azur, en France, en Europe, sur la Terre, dans le système solaire, dans la Voie lactée.",
    en: "I live in Éguilles, in Bouches-du-Rhône, in Provence-Alpes-Côte d'Azur, in France, in Europe, on Earth, in the Solar System, in the Milky Way.",
  };
  const QUESTIONS_NOMMER = { fr: "Comment s'appelle ce lieu ?", en: 'What is this place called?' };
  // Les noms d'origine, gardés pour la compatibilité : la version française.
  const ADRESSE = ADRESSES.fr;
  const QUESTION_NOMMER = QUESTIONS_NOMMER.fr;

  /* Les consignes et étiquettes du contenu, qui suivent la langue choisie (le cadre, lui, reste dans
     commun/textes.js). Les crédits des cartes restent tels quels, en français. */
  const CONSIGNES = {
    fr: { decouverte: 'Touche ce lieu sur la carte.', retouche: 'À toi : touche ce lieu sur la carte.', bonNom: 'À toi : touche le bon nom.', voici: 'Voici', touche: 'Touche', repere: nom => `Le repère de ${nom}` },
    en: { decouverte: 'Touch this place on the map.', retouche: 'Your turn: touch this place on the map.', bonNom: 'Your turn: touch the right name.', voici: 'This is', touche: 'Touch', repere: nom => `${nom}'s clue` },
  };

  const LIEUX = {};
  ETAGES.forEach((e, rang) => {
    const [nomEn, ditEn, adresseEn, astuceEn] = EN_ETAGES[e.id];
    e.en = { nom: nomEn, dit: ditEn, adresse: adresseEn, astuce: astuceEn || null };
    e.lieux = e.lieux.map(([id, nom, groupe, henri, clara, indice, info, dit, numero]) => {
      const en = EN_LIEUX[id] || [];
      const l = {
        id, nom, groupe, etage: e.id, rang, niveaux: { henri, clara }, indice, info: info || null, dit: dit || nom, numero: numero || null,
        en: { nom: en[0], indice: en[1], info: en[2] || null, dit: en[3] || en[0] },
      };
      LIEUX[id] = l;
      return l;
    });
  });

  /* Un texte d'un lieu ou d'une étape dans une langue ('fr' par défaut : le coin parent et l'écriture
     d'origine) : nom, indice (le repère), info, dit ; pour une étape : nom, dit, adresse, astuce. */
  const champ = (x, c, langue) => (langue === 'en' ? x.en[c] : x[c]);
  const affiche = (l, langue) => {
    const nom = champ(l, 'nom', langue);
    return l.numero ? `${nom} (${l.numero})` : nom;
  };
  const etage = id => ETAGES.find(e => e.id === id);
  const majuscule = s => s.charAt(0).toUpperCase() + s.slice(1);
  // Phrases dites par la voix, toujours construites ici : commun/outils/phrases.js les énumère.
  const PHRASES = {
    toucher: (l, langue) => (langue === 'en' ? `Touch ${l.en.dit}.` : `Touche ${l.dit}.`),
    voici: (l, langue) => (langue === 'en' ? `This is ${l.en.dit}.` : `Voici ${l.dit}.`),
    cest: (l, langue) => (langue === 'en' ? `It's ${l.en.dit}.` : `C'est ${l.dit}.`),
  };

  /* Le programme d'un enfant pour le moteur : les étapes dans l'ordre du zoom, et pour chacune
     les lieux au programme ; les groupes servent à choisir des noms voisins. */
  function programme(enfant) {
    return {
      etages: ETAGES.map(e => ({ id: e.id, lieux: e.lieux.filter(l => l.niveaux[enfant] === 'o').map(l => l.id) })),
      groupes: Object.fromEntries(Object.values(LIEUX).map(l => [l.id, l.groupe])),
    };
  }

  racine.ZoomContenu = {
    LANGUES: ['en', 'fr'], ETAGES, LIEUX, ADRESSE, ADRESSES, QUESTION_NOMMER, QUESTIONS_NOMMER, CONSIGNES, PHRASES,
    programme, champ, affiche, majuscule, etage, lieu: id => LIEUX[id],
  };
})(typeof window !== 'undefined' ? window : globalThis);
