/* Contenu du module « De l'univers à Éguilles » : sept étapes, leurs lieux, le niveau de chaque
   enfant et le repère qui aide après une erreur. Tout est en français (contenu scolaire).
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

  const ADRESSE = "J'habite à Éguilles, dans les Bouches-du-Rhône, en Provence-Alpes-Côte d'Azur, en France, en Europe, sur la Terre, dans le système solaire, dans la Voie lactée.";
  const QUESTION_NOMMER = "Comment s'appelle ce lieu ?";

  const LIEUX = {};
  ETAGES.forEach((e, rang) => {
    e.lieux = e.lieux.map(([id, nom, groupe, henri, clara, indice, info, dit, numero]) => {
      const l = { id, nom, groupe, etage: e.id, rang, niveaux: { henri, clara }, indice, info: info || null, dit: dit || nom, numero: numero || null };
      LIEUX[id] = l;
      return l;
    });
  });

  const affiche = l => (l.numero ? `${l.nom} (${l.numero})` : l.nom);
  const majuscule = s => s.charAt(0).toUpperCase() + s.slice(1);
  // Phrases dites par la voix, toujours construites ici : commun/outils/phrases.js les énumère.
  const PHRASES = {
    toucher: l => `Touche ${l.dit}.`,
    voici: l => `Voici ${l.dit}.`,
    cest: l => `C'est ${l.dit}.`,
  };

  /* Le programme d'un enfant pour le moteur : les étapes dans l'ordre du zoom, et pour chacune
     les lieux au programme ; les groupes servent à choisir des noms voisins. */
  function programme(enfant) {
    return {
      etages: ETAGES.map(e => ({ id: e.id, lieux: e.lieux.filter(l => l.niveaux[enfant] === 'o').map(l => l.id) })),
      groupes: Object.fromEntries(Object.values(LIEUX).map(l => [l.id, l.groupe])),
    };
  }

  racine.ZoomContenu = { ETAGES, LIEUX, ADRESSE, QUESTION_NOMMER, PHRASES, programme, affiche, majuscule, lieu: id => LIEUX[id] };
})(typeof window !== 'undefined' ? window : globalThis);
