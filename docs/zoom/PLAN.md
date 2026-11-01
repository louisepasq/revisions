# De l'univers à Éguilles : sept étapes de zoom, un contenu par enfant, les tables de Leitner appliquées aux cartes

Le module « Mon voyage » (*My journey*) fait descendre l'enfant de la Voie lactée jusqu'à son village, Éguilles (13510), et lui fait nommer et situer chaque lieu en chemin. Idée de Louis du 01/11/2026 ; périmètre et pédagogie : [`../revues/2026-11-01_relecture-zoom-geographie.md`](../revues/2026-11-01_relecture-zoom-geographie.md) ; décision : D-17 dans [`../DECISIONS.md`](../DECISIONS.md). Le code et son mode d'emploi : [`../../modules/zoom/README.md`](../../modules/zoom/README.md).

## 1. Le contenu : la table « par enfant » de la relecture, étape par étape

Henri (CM1) suit le nouveau programme, Clara (CM2) finit l'ancien : chaque lieu a un niveau par enfant. **« Au programme »** entre dans les boîtes de Leitner ; **« En plus »** (an prochain ou bonus de la relecture) se voit et se touche dans l'exploration, avec l'étiquette *Extra*, mais n'est jamais interrogé. Le détail lieu par lieu, avec le repère qui aide après une erreur, est dans `modules/zoom/contenu.js`.

| Étape | Au programme d'Henri | Au programme de Clara | En plus |
|---|---|---|---|
| La Voie lactée (3) | la Voie lactée, le système solaire, une autre galaxie | les mêmes | Andromède et les tailles, en information |
| Le système solaire (10) | le Soleil, les huit planètes dans l'ordre, la Lune | les mêmes | Pluton, planète naine |
| La Terre | 7 continents, 5 océans, équateur, pôles, hémisphères, **les quatre aires régionales** (Afrique subsaharienne, Maghreb, Asie de l'Est, Asie du Sud-Est), les 5 régions d'outre-mer (26) | les mêmes, sans les aires ; **tropiques du Cancer et du Capricorne, méridien de Greenwich** (25) | cercles polaires, Nil, Amazone, Yangzi Jiang ; les aires pour Clara |
| L'Europe | la France, ses voisins (Espagne, Italie, Suisse, Allemagne, Belgique, Luxembourg, Monaco), le Royaume-Uni, la Manche, la mer du Nord, l'océan Atlantique, la Méditerranée (13) | les mêmes, plus l'Andorre, les Pays-Bas, le Portugal (16) | Grèce, Pologne, golfe de Gascogne ; Andorre, Pays-Bas et Portugal pour Henri |
| La France | la région Provence-Alpes-Côte d'Azur, Paris, Marseille, Lyon, Toulouse, Ajaccio, les Alpes (7) | les mêmes, plus Lille, les 13 régions de l'Hexagone, la Seine, la Loire, la Garonne, le Rhin, les Pyrénées, le Massif central, le Jura, les Vosges, la Corse, le lac Léman (29) | les capitales régionales, tout Clara pour Henri |
| Provence-Alpes-Côte d'Azur | les 6 départements avec leur numéro, les 6 préfectures, Aix-en-Provence (seule sous-préfecture), Cannes (grande ville), le Rhône, la Durance (une rivière), la Camargue, le mont Ventoux, le lac de Serre-Ponçon, et les voisins : Occitanie, Auvergne-Rhône-Alpes, Italie, Monaco, Méditerranée (24) | les mêmes, plus le fleuve Var (25) | le Verdon, Briançon, Grasse ; le fleuve Var pour Henri |
| Les Bouches-du-Rhône | **Éguilles**, la montagne Sainte-Victoire ; Aix-en-Provence et Marseille en repères dessinés (2) | les mêmes (2) | Arles, Istres, l'étang de Berre |

Total au programme : 85 lieux pour Henri, 110 pour Clara (la relecture estimait 90 et 115).

**Les deux corrections de la relecture sont appliquées** : la Durance est présentée comme une rivière (« elle se jette dans le Rhône »), et Cannes n'apparaît jamais comme préfecture (son repère le dit).

**Trois choix de placement**, faute d'un lieu à deux endroits :
- les Alpes sont à l'étape France, le lac de Serre-Ponçon et le Rhône à l'étape région ;
- **la Sainte-Victoire descend à l'étape des Bouches-du-Rhône** : à l'échelle de la région, elle tomberait à 15 km d'Aix, trop près pour un doigt sur iPhone ; à l'échelle du département, c'est le grand repère qu'on voit depuis Éguilles ;
- Marseille est interrogée deux fois, comme capitale de la région à l'étape France et comme préfecture du 13 : retrouver la même ville à deux échelles, c'est l'emboîtement que demande le programme.

## 2. La mécanique : celle des tables (D-09, D-10, D-11 bis), sans chrono

- **Une carte de Leitner par lieu et par type de question** : « toucher » (*Touche la Durance* : l'enfant touche la carte) et « nommer » (le lieu clignote ; *Comment s'appelle ce lieu ?*, trois noms pour Henri, quatre pour Clara, voisins du même groupe). La carte « nommer » ne naît qu'en boîte 2 de « toucher » : on apprend où avant de retrouver le nom.
- **Boîtes et intervalles des tables** (0, 1, 2, 4, 7 et 21 jours) ; **pas de seuil de temps** : juste du premier coup monte d'une boîte, une fois par jour ; une erreur ramène en boîte 1 et fait revenir le lieu trois questions plus loin.
- **Un lieu nouveau est d'abord montré** (pastille *New*, épingle, nom, la voix dit « Voici la Durance. Touche la Durance. »), puis demandé trois questions plus loin. Trois lieux nouveaux au plus par séance.
- **Une séance** : environ dix questions (cinq minutes), les lieux dus d'abord, puis les nouveaux, puis des révisions ; les questions sont rangées par étape, dans l'ordre du zoom, et la carte zoome d'une étape à la suivante pendant la séance.
- **Une étape s'ouvre** quand quatre lieux sur cinq de la précédente sont en boîte 2 au moins. **L'exploration reste ouverte partout** : toucher un lieu fait dire son nom et son information, Zoom in et Zoom out passent d'une étape à l'autre.
- **L'erreur** : ni rouge ni croix ; le bon lieu est surligné, une épingle le marque, la bulle dorée donne le repère (« Mercure est la planète la plus proche du Soleil »), la voix dit « Voici Mercure. » et le repère, puis l'enfant touche lui-même le lieu (ou le bon nom) pour avancer. Le bouton *Show me* compte comme une erreur, sans reproche.
- **La voix** (D-11, D-11 bis) : chaque question est lue dès qu'elle s'affiche ; une réponse juste en moins de 4 secondes enchaîne sans rien redire, une réponse plus lente fait dire « C'est la Durance. » avant de laisser avancer. Quatre secondes au lieu de trois : chercher sur une carte prend plus longtemps que retrouver un fait. La voix ne compte pas dans les boîtes.
- **La récompense** : la carte se colore lieu par lieu dans l'exploration (bronze dès le premier rappel juste, argent en boîte 3, or quand « toucher » est en boîte 4 et « nommer » en boîte 3), et la fin de séance montre les lieux qui montent et la nouvelle étape ouverte.
- **Le premier lancement** : le grand voyage, de la Voie lactée à Éguilles, chaque étape nommée par la voix, puis l'adresse dans l'univers : « J'habite à Éguilles, dans les Bouches-du-Rhône, en Provence-Alpes-Côte d'Azur, en France, en Europe, sur la Terre, dans le système solaire, dans la Voie lactée. » Il se revoit depuis l'accueil.
- **Précision du doigt** : un lieu ponctuel se touche dans un disque de 52 px, un fleuve à 22 px de part et d'autre, une zone à 10 px au-delà de son bord, quelle que soit la taille de l'écran ; une mer ne compte que hors des terres. Toucher pile un autre lieu ponctuel (la Lune pour la Terre) compte comme le désigner. Les tout petits pays et les villes sont dessinés en points de taille fixe : ils restent touchables sur iPhone sans zoomer.

## 3. Sources et licences : des cartes libres, simplifiées une fois, embarquées dans le site

| Ce qui est dessiné | Source | Licence | Vérifiée |
|---|---|---|---|
| Pays, continents, Europe, fleuves (Rhône, Durance, Seine, Loire, Garonne, Rhin, Nil, Amazone, Yangzi Jiang), lac Léman | [Natural Earth](https://www.naturalearthdata.com/), version 5.1.2 (1:50 millions pour les pays, 1:10 millions pour les fleuves et les lacs) | domaine public | le 01/11/2026, fichier `LICENSE.md` du dépôt `nvkelso/natural-earth-vector` (« Everything here is public domain ») |
| Régions et départements | ADMIN EXPRESS COG de l'IGN, édition 2018, mis en GeoJSON simplifié par [france-geojson](https://github.com/gregoiredavid/france-geojson) de Grégoire David | [Licence Ouverte Etalab](https://www.etalab.gouv.fr/licence-ouverte-open-licence) | le 01/11/2026, section « Licence » du README de france-geojson, qui renvoie aux conditions d'ADMIN EXPRESS |
| Villes (position de la mairie), contour de la commune d'Éguilles (code INSEE 13032) | [geo.api.gouv.fr](https://geo.api.gouv.fr/), API Découpage administratif | Licence Ouverte | données publiques des communes ; aucune adresse de particulier |
| Voie lactée, système solaire, massifs, Camargue, fleuve Var, Verdon, Sainte-Victoire, étang de Berre, découpage des océans et des mers | dessinés à la main dans `modules/zoom/outils/cartes.py`, d'après des positions connues | aucune | tracés schématiques, comme sur un fond de carte d'école |

- **Le crédit s'affiche** sous la carte de chaque exploration et dans le coin parent (section « Le voyage »).
- **Fabrication** : `uv run modules/zoom/outils/cartes.py` télécharge les sources dans `modules/zoom/outils/cache/` (ignoré par git), projette (Natural Earth pour le monde, projection plate corrigée de la latitude pour l'Europe, la France et la région), simplifie et écrit `modules/zoom/cartes.js` : **394 Ko** pour les sept étapes, sans aucun appel réseau à l'usage.
- **Une marge de contexte** est dessinée autour de chaque carte : quand l'écran n'a pas la forme de la carte (iPhone en portrait), les bandes de côté montrent la suite du pays ou de la mer au lieu d'un aplat.
- **Les aires régionales** sont des unions de pays de Natural Earth : Maghreb = Maroc, Sahara occidental, Algérie, Tunisie, Libye, Mauritanie ; Afrique subsaharienne = le reste de l'Afrique sans l'Égypte ni le Soudan ; Asie de l'Est et du Sud-Est = sous-régions de l'ONU. C'est un choix de découpage, à aligner sur la maîtresse d'Henri si elle en fait un autre.

## 4. Vie privée : le village est dans le code, ni l'école ni la maison

La relecture proposait de garder la commune hors du code public. Depuis D-03, tout le site est derrière les codes, et Louis a décidé le village (D-17) : Éguilles est dans `cartes.js` et `contenu.js`, par la position publique de sa mairie et le contour public de la commune. **Ni l'école ni la maison** ne sont dessinées ni nommées, aucune géolocalisation de l'iPad n'est demandée, et aucun fond de carte en ligne n'est appelé.

## 5. Ce qui n'est pas fait, volontairement ou pas encore

- Les questions qui relient deux étapes (« Gap est la préfecture de quel département ? ») et l'adresse cosmique à remettre dans l'ordre : types 3 et 4 de la relecture, après un essai des deux premiers.
- La réponse sans proposition (dire le nom à voix haute, puis *Voir*) : la relecture la propose après les choix ; à décider avec les parents.
- Le planisphère de Louise comme étape « La Terre » : à proposer à Louise (TODO), le zoom a sa propre étape Terre en attendant.
- Le résumé `resume` de D-19 pour le futur portail en cahiers : à publier dès que `KR.publierResume` existe.
- Les voix fabriquées : les phrases sont dans `commun/outils/phrases.js` ; en attendant `voix.py`, c'est la voix de l'appareil qui parle.
