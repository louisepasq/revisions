# Relecture du 02/11/2026 : tous les pays du monde dans un module « The world » à part, explorés en entier mais appris par petits paquets, les drapeaux tout de suite, les capitales une fois le pays situé

Réponse à la demande de Louis du 02/11/2026 : faire travailler aux enfants tous les pays du monde, avec leurs drapeaux et leurs capitales, et leur proposer de petits jeux de géographie pour découvrir. Deux regards réunis, comme le veut D-15 : le relecteur pédagogique (professeur des écoles en CM1 et CM2, formateur) et le designer d'apps pour enfants (iPad, 8 à 10 ans). Rien n'est construit, aucune décision n'est prise : tout ce qui suit attend l'accord des parents.

Lu dans le dépôt : `CLAUDE.md`, `docs/DECISIONS.md` (D-15, D-17, D-20, D-21, D-22), les deux fiches de `.claude/agents/`, `docs/zoom/PLAN.md`, `modules/zoom/README.md`, `docs/revues/2026-11-01_relecture-zoom-geographie.md`, `henri/planisphere.html` (structure, données `ITEMS`, trois jeux), `commun/modules.js` (champ `libre`), la couche des pays déjà téléchargée par `modules/zoom/outils/cartes.py`.

Marquage : **[programme]** texte officiel lu aujourd'hui ; **[recherche]** étude citée ; **[pratique]** usage de classe ou de design, notre expérience ; **[donnée]** fait vérifié dans un fichier ou une base. Chaque source dit si elle a été **lue en entier** ou en **résumé seulement**.

## La recommandation en cinq lignes

1. **Commencer par un module à part, « The world » (« Le monde »), dans le cahier d'histoire-géographie, en jeu libre** (`libre: true`, hors du « Today » sauf le jour de sa découverte, comme le nombre cible, D-22 point 6), bâti sur le moteur, la géométrie et la fabrique de cartes du voyage, avec le même choix de langue. Premier jeu : le **passeport** (toucher le pays nommé sur la carte de son continent, un tampon-drapeau par pays appris).
2. **Tous les pays s'explorent dès le premier jour** (toucher un pays : son nom, son drapeau, sa capitale, dits par la voix), **mais seuls de petits paquets d'environ dix pays entrent dans les boîtes de Leitner**, choisis par l'enfant : d'abord les voisins de la France pour les deux, puis les six pays fondateurs de l'UE pour Henri et toute l'Union européenne pour Clara, puis les grands pays.
3. **Les drapeaux tout de suite**, parce qu'ils accrochent sans demander de lecture ; **les capitales plus tard**, en carte qui ne naît qu'une fois le pays situé (boîte 2), dès maintenant pour Clara, limitées aux voisins de la France pour Henri cette année.
4. **Ce qu'on écarte** : verser les pays dans l'étape « Terre » du voyage (elle bloquerait l'ouverture des étapes et noierait le programme), interroger les 200 pays, poser une question « toucher » sur la vue du monde entier ou sur un micro-État, tout chronomètre, les anecdotes écrites sans source.
5. **Proposer à Louise** que son planisphère reste tel quel (continents, océans, mers) et qu'elle prenne, si elle le veut, le jeu du **puzzle des continents** (son mode « Drag » étendu aux pays) ; les questions que seuls les parents tranchent sont en section 7.

## 1. Programmes et recherche : les pays, drapeaux et capitales sont de la découverte, que la répétition espacée sur une carte fait tenir

### Ce que le cycle 3 attend : des aires régionales, quelques pays nommés, dix pays de l'UE ; aucune liste de capitales ni de drapeaux étrangers

Source principale : [programme d'histoire-géographie du cycle 3, annexe 4 de l'arrêté du 22 avril 2026](https://www.education.gouv.fr/sites/default/files/document/annexe-4-programme-d-histoire-geographie-cycle-3-516779.pdf), BO n° 22 du 28 mai 2026, **lu en entier pour la géographie** le 02/11/2026. Point d'entrée Eduscol : [ressources d'accompagnement du programme d'histoire et géographie au cycle 3](https://eduscol.education.gouv.fr/260/histoire-geographie-cycle-3) (**résumé seulement** : le calendrier, CM1 à la rentrée 2026, CM2 et sixième à la rentrée 2027).

- **Henri, CM1, nouveau programme** **[programme]** : « Localiser et nommer sur un planisphère les aires régionales » (thème « Les inégalités dans le monde ») ; et, dans le thème « Se nourrir », des repères qui sont des pays : « Deux pays à ration alimentaire très riche situés sur deux continents différents » et deux pays « à ration alimentaire insuffisante ». C'est la seule entrée de pays précis dans son année : **la maîtresse choisira ces quatre pays**, et le module peut les reprendre (section 7).
- **Henri l'an prochain, CM2, nouveau programme** **[programme]** : « Localiser et nommer dix pays membres de l'UE (dont les six pays fondateurs) » et « la différence entre le continent (Europe) et la construction politique (Union européenne) » ; en histoire, nommer « le drapeau tricolore » parmi les symboles de la République. Le seul drapeau du programme est donc le drapeau français.
- **Clara, CM2, ancien programme** : aucune liste de noms en géographie, seulement « nommer et localiser les grands repères géographiques » (relecture du 01/11/2026, section 1, **non relu aujourd'hui**).
- **Clara l'an prochain, sixième, nouveau programme** **[programme]** : continents, océans, grands parallèles, quatre projections dont Equal Earth, puis « les cinq principales métropoles à l'échelle mondiale ». Les métropoles ne sont pas les capitales (Shanghai, São Paulo) : un jeu sur les capitales qui ne sont pas la plus grande ville prépare bien cette nuance **[pratique]**.
- **Le cadre de méthode** **[programme]** : les repères vont « de l'échelle continentale à celle de l'aire régionale », et leur mémorisation « repose sur des rituels de localisation ». Les pays du monde sont l'échelon juste en dessous de l'aire régionale.

**Conclusion pour les parents** : tous les pays, tous les drapeaux et toutes les capitales sont **au-delà du programme**, ce que disait déjà la relecture du 01/11 (« tous les pays du monde » et « les capitales » rangés dans « ce qui serait trop »). La demande de Louis ne rouvre pas le contenu du voyage : elle ouvre un espace de découverte à côté, et c'est ce qui en fixe la forme. **Un enfant n'y est jamais tenu, rien n'y entre dans le « Today » de force, et une petite partie seulement passe par les boîtes** **[pratique]**.

### Comment un enfant de 9 et 10 ans retient des pays, des drapeaux et des capitales

| Principe | Ce qu'on en tire ici | Source | Lu |
|---|---|---|---|
| **Se tester sur une carte fait mieux retenir que la relire**, chez des élèves de CM1 et CM2 qui apprenaient des régions et des villes, et l'effet se transfère | le geste central est « toucher le pays nommé », pas regarder une carte légendée | **[recherche]** [Rohrer, Taylor et Sholar (2010)](https://digitalcommons.usf.edu/psy_facpub/1761) | résumé seulement |
| **Le rappel actif marche aussi à l'école élémentaire** | même mécanique que les tables et le voyage | **[recherche]** [Karpicke, Blunt et Smith (2016), *Frontiers in Psychology* 7:350](https://www.frontiersin.org/articles/10.3389/fpsyg.2016.00350/full) | résumé seulement |
| **Espacer les révisions** fait tenir plus longtemps, sur des contenus variés | boîtes de Leitner et intervalles du moteur (0, 1, 2, 4, 7, 21 jours) ; trois pays nouveaux au plus par jour | **[recherche]** [Carpenter, Cepeda, Rohrer, Kang et Pashler (2012), *Educational Psychology Review* 24](https://digitalcommons.usf.edu/psy_facpub/1756) | résumé seulement |
| **Entrelacer aide surtout à distinguer des choses qui se ressemblent** (effet modéré, plus fort quand les catégories sont proches) | les drapeaux jumeaux (Tchad et Roumanie, Irlande et Côte d'Ivoire, Indonésie et Monaco) se mélangent exprès, mais **une fois chacun connu seul** | **[recherche]** [Brunmair et Richter (2019), méta-analyse, *Psychological Bulletin* 145](https://pubmed.ncbi.nlm.nih.gov/31556629/) | résumé seulement |
| **Une information accrochée à un lieu sur une carte se retient mieux** (hypothèse de la « rétention conjointe », discutée : l'effet tiendrait autant aux images qu'à l'espace) | le drapeau et la capitale s'apprennent **sur la carte**, jamais en liste nue | **[recherche]** [Kulhavy et collègues, et sa remise en cause](https://scholars.georgiasouthern.edu/en/publications/does-spatial-or-visual-information-in-maps-facilitate-text-recall/) | résumé seulement |

**[pratique]** Ce qui ne figure dans aucune étude citée mais se voit en classe : les drapeaux plaisent immédiatement à cet âge et se reconnaissent sans savoir lire, ce qui en fait la bonne porte d'entrée pour Henri ; une capitale apprise sans savoir où est le pays ne tient pas (« Ouagadougou » devient un mot drôle, pas un lieu) ; une collection qui se remplit motive davantage qu'un score.

## 2. Le périmètre : tout le monde en exploration, des paquets d'une dizaine de pays dans les boîtes, les drapeaux d'abord

### Deux niveaux, comme « Au programme » et « En plus » dans le voyage

- **Exploration, ouverte en entier dès le premier jour** : chaque pays du monde se touche, la voix dit son nom, le drapeau et la capitale s'affichent, une ligne d'information (continent, voisins). Rien n'est interrogé, rien n'est compté. C'est ce qui répond à « tous les pays du monde » sans transformer la découverte en devoir **[pratique]**.
- **Boîtes de Leitner, par paquets d'environ dix pays que l'enfant choisit** : un paquet s'ouvre quand quatre pays sur cinq du précédent sont en boîte 2, comme une étape du voyage. Trois pays nouveaux au plus par jour (le plafond du voyage, proche des quatre faits par jour des tables, D-20) **[pratique]**.

### Les paquets, dans l'ordre proposé

| Ordre | Paquet | Pays | Henri (CM1) | Clara (CM2) |
|---|---|---|---|---|
| 1 | **Nos voisins** | Espagne, Andorre, Italie, Monaco, Suisse, Allemagne, Luxembourg, Belgique, Royaume-Uni | situer : déjà dans le voyage ; **drapeaux** ; capitales en fin d'année | situer, drapeaux, **capitales** |
| 2 | **Les six fondateurs, puis l'Union européenne** | France, Allemagne, Belgique, Italie, Luxembourg, Pays-Bas ; puis les autres pays de l'UE par trois | les six fondateurs et quatre autres (son programme de l'an prochain, en avance douce) | toute l'UE, avec la question « est-il dans l'Union européenne ? » sur la Suisse, le Royaume-Uni, la Norvège |
| 3 | **Les géants** | les dix plus grands pays par la superficie (Russie, Canada, Chine, États-Unis, Brésil, Australie, Inde, Argentine, Kazakhstan, Algérie, liste à vérifier à la source au moment de construire) | oui : ils se touchent sur la carte du monde et accrochent les aires régionales de son programme | oui |
| 4 | **Le paquet de la classe** | les quatre pays du thème « Se nourrir », ceux que nomme la maîtresse | dès qu'ils sont connus (section 7) | ceux du cours de Clara |
| 5 | **Un continent à la fois** | Afrique, Amérique, Asie, Océanie, par paquets de dix | à son rythme | à son rythme |
| 6 | **Les capitales pièges** | Australie (Canberra), Canada (Ottawa), Brésil (Brasília), Turquie (Ankara), Suisse (Berne), Maroc (Rabat), Nigeria (Abuja), États-Unis (Washington) | non | oui : pont vers les métropoles de sixième |

**Ordre de grandeur pour cette année** **[pratique]** : Henri, une trentaine de pays dans les boîtes ; Clara, une cinquantaine. Le reste vit en exploration. C'est assez pour que le passeport se remplisse chaque semaine, et assez peu pour ne pas concurrencer le voyage, qui porte le programme.

### Drapeaux tout de suite, capitales une fois le pays situé

- **Une carte de Leitner par pays et par type**, comme le voyage : « toucher » d'abord ; **« drapeau » naît quand « toucher » atteint la boîte 2** ; **« capitale » naît de la même façon**, sauf pour Henri, où elle reste fermée hors du paquet « Nos voisins » cette année. On apprend où, puis à quoi on le reconnaît, puis sa ville principale **[pratique]**, dans la logique de la carte « nommer » du voyage (`docs/zoom/PLAN.md`, section 2).
- **Le drapeau ne demande aucune lecture** : c'est ce qui le rend juste pour Henri, qui commence l'anglais. Une capitale se dit et se lit ; pour Henri, la voix lit les propositions quand il les touche **[pratique]**.
- **Le sens de la question compte** : pays vers capitale (« Quelle est la capitale de l'Italie ? ») bien avant capitale vers pays, plus difficile **[pratique]**.

## 3. L'articulation avec l'existant : un module à part qui réutilise le voyage, le planisphère de Louise laissé intact

### Trois voies, une recommandation

| Voie | Pour | Contre | Avis |
|---|---|---|---|
| **Prolonger l'étape « Terre » du voyage** | une seule carte, une seule progression | l'étape passerait de 25 lieux à plus de 200 ; la règle « quatre sur cinq en boîte 2 » ne s'ouvrirait plus ; le voyage est un récit de l'emboîtement, centré sur le programme, que la découverte noierait ; les totaux de `PLAN.md` (85 et 110 lieux) perdraient leur sens | **écarté** |
| **Un module à part, « The world » (« Le monde »)**, dans le cahier d'histoire-géographie | reprend `moteur.js` (générique : « il ne connaît que le programme qu'on lui passe »), `geometrie.js`, la fabrique `outils/cartes.py` et le choix de langue ; peut rester libre (hors du « Today ») ; sa propre jauge et son propre résumé (D-19) | un module de plus à tenir | **recommandé** |
| **Enrichir le planisphère de Louise** | c'est déjà sa carte du monde, Henri la connaît | un fichier unique de 176 Ko sans boîtes de Leitner ni sauvegarde en ligne (`synchro: false`) : l'enrichir, c'est le réécrire ; et c'est son module | **écarté, sauf si Louise le souhaite elle-même** |

### Comment le module « The world » tient au voyage

- **Un accès depuis l'étape Terre** : dans l'exploration du voyage, un bouton « Explore the countries » ouvre le monde sur le même continent. Le voyage garde ses lieux, rien n'y change **[pratique]**.
- **Un pays déjà situé dans le voyage compte comme situé dans le monde** : le module lit (sans jamais l'écrire) l'état `<enfant>.zoom` pour les pays communs (l'Espagne, l'Italie, la Suisse…), et ne redemande pas de les toucher. Son état propre, `<enfant>.monde`, ne porte que ses cartes. Un lieu su reste su, sans mélanger deux progressions **[pratique]**.
- **La langue** : le module reprend le choix de géographie de l'enfant (D-21) fait dans le voyage ; s'il n'a jamais été fait, il le demande avec les deux mêmes cartes à drapeau **[pratique]**.
- **Le cadre** reste en anglais britannique (D-21) : Back, Listen, la mascotte.

### Ce qu'il faudrait proposer à Louise

1. **Son planisphère reste tel quel**, pour les continents, les océans et les mers, avec ses trois jeux. Le module « The world » ne le remplace pas et ne le copie pas.
2. **Lui proposer le jeu du puzzle des continents** (section 4, jeu 5), qui est son mode « Drag » appliqué aux pays : elle peut le faire dans son module, avec le fichier de cartes des pays fabriqué pour « The world », ou le prêter au module avec son nom en crédit.
3. **La question encore ouverte dans `docs/TODO.md`** (son planisphère comme étape « Terre » du voyage) reste la sienne ; « The world » ne la tranche pas.

## 4. Cinq petits jeux, du plus utile et plaisant au plus secondaire

Règles communes **[pratique]** : jamais de rouge ni de croix pour une erreur ; le bon pays brille en doré avec une épingle, la voix dit son nom, et l'enfant le touche lui-même pour avancer (la mécanique du voyage). **Les drapeaux contiennent souvent du rouge : c'est du contenu, pas un retour d'erreur**, donc le cadre autour d'un drapeau reste neutre et un pays mal touché prend un gris doux, jamais une teinte de drapeau. Cibles de 56 px au moins, **aucune question « toucher » sur la vue du monde entier** (section 5) ; aucun compteur commun aux deux enfants ; aucun chronomètre.

### Jeu 1. Le passeport (*My passport*) : toucher le pays nommé, gagner son tampon

- **Le geste** : la carte d'un continent ; la voix dit « Touch Spain » (ou « Touche l'Espagne ») ; l'enfant touche le pays. Pour un micro-État, il touche un point de taille fixe.
- **Ce qu'il apprend** : situer, le premier verbe des programmes ; le continent de chaque pays et ses voisins, par la carte.
- **La progression** : cartes « toucher » des boîtes de Leitner, moteur du voyage. Un pays qui monte de boîte un jour donné pose **son drapeau en tampon** sur la page du continent dans le passeport, un tampon par jour au plus, comme l'album des tables (D-20) ; un tampon ne s'échange jamais contre une récompense.
- **La voix** : lit la consigne ; sur une réponse hésitante (plus de 4 secondes, comme le voyage) ou une erreur, « This is Spain. » avant d'avancer.
- **Ce qui le rend amusant** : la page du continent se remplit de drapeaux, et le passeport ouvert à la fin de la séance montre les nouveaux tampons. Le plaisir vient de la collection, pas de la vitesse.

### Jeu 2. Le drapeau mystère (*Flag detective*) : un drapeau, le doigt trouve le pays

- **Le geste** : un grand drapeau en haut (sur le côté en paysage) ; l'enfant touche **sur la carte** le pays à qui il appartient. Variante pour Clara : trois drapeaux, « Which one is Italy's? ».
- **Ce qu'il apprend** : relier drapeau et lieu, sans passer par l'écrit, donc à la portée d'Henri.
- **La progression** : carte « drapeau », qui naît en boîte 2 de « toucher ». **Les drapeaux jumeaux** (Tchad et Roumanie, Irlande et Côte d'Ivoire, Indonésie et Monaco, Pays-Bas et Luxembourg, Australie et Nouvelle-Zélande) ne se mélangent qu'une fois chacun connu seul, dans une manche « Twins! » proposée de temps en temps, ce qui est l'usage que la recherche sur l'entrelacement justifie.
- **La voix** : « Whose flag is this? », puis « This is the flag of Italy. » après la réponse.
- **Ce qui le rend amusant** : la mascotte joue au détective (une loupe, pas un compte à rebours) ; découvrir que deux drapeaux sont presque identiques est un vrai « waouh » à cet âge.

### Jeu 3. Le chemin des voisins (*Border hop*) : aller de la France à un pays en ne touchant que des voisins

- **Le geste** : départ la France, arrivée la Pologne ; l'enfant touche un pays qui touche le précédent, puis un autre, jusqu'à l'arrivée ; le chemin se dessine.
- **Ce qu'il apprend** : situer les pays les uns par rapport aux autres, la compétence que le voyage veut travailler avec ses questions « relier deux étages » (relecture du 01/11, section 4.1), et les frontières sans les apprendre par cœur.
- **La progression** : **hors des boîtes**, c'est un jeu libre comme le nombre cible ; il ne propose que des chemins entre pays déjà situés par l'enfant. L'app connaît le plus court chemin (comme le meilleur score du nombre cible, D-18) et le dit à la fin : « Perfect route! » si l'enfant l'a trouvé, « You did it in 5. It can be done in 4! » sinon.
- **La voix** : nomme chaque pays traversé, ce qui fait réentendre les noms sans questionner.
- **Ce qui le rend amusant** : un petit casse-tête à défi, où l'on peut chercher le chemin le plus court, sans temps et sans perte de points ; on peut toujours finir.

### Jeu 4. La chasse aux capitales (*Capital quest*) : la capitale d'un pays situé

- **Le geste** : un pays connu s'allume, une étoile marque sa capitale ; trois propositions (quatre pour Clara) sous la carte, grosses cartes de 56 px au moins ; pour Clara, plus tard, sans proposition : elle dit le nom à voix haute, touche « Show me », et dit honnêtement si elle l'avait (le type 2 de la relecture du 01/11).
- **Ce qu'il apprend** : la capitale, accrochée au lieu ; avec le paquet des capitales pièges, que la capitale n'est pas toujours la plus grande ville.
- **La progression** : carte « capitale », née en boîte 2 de « toucher » ; pour Henri, seulement dans le paquet « Nos voisins » cette année.
- **La voix** : lit la question et les propositions touchées ; dit « Rome is the capital of Italy. » sur une réponse hésitante.
- **Ce qui le rend amusant** : les pièges annoncés comme tels (« Careful, this one is a trick! ») transforment l'erreur probable en jeu, et une capitale multiple (l'Afrique du Sud en a trois) devient une devinette, jamais une question piège notée.

### Jeu 5. Le puzzle des continents (*Continent puzzle*) : poser les pays dans la silhouette, à proposer à Louise

- **Le geste** : la silhouette vide d'un continent ; les pays en pièces sur le côté ; l'enfant glisse chaque pièce à sa place, qui s'aimante si elle est proche. Les micro-États sont des jetons ronds de 56 px.
- **Ce qu'il apprend** : la forme et la position des pays d'un continent ; c'est l'activité de figurés « positionnables sur le fond » que cite Eduscol (relecture du 01/11, section 7).
- **La progression** : en exploration ou en jeu libre ; il ne nourrit les boîtes que si Louise le souhaite.
- **La voix** : dit le nom de la pièce prise en main.
- **Ce qui le rend amusant** : un vrai puzzle qui se complète ; c'est aussi le plus long à bien faire au doigt sur un iPad 9e génération, d'où son rang, et d'où la proposition à Louise, dont c'est déjà le geste du mode « Drag ».

## 5. Les données : des sources libres et légères, et des cas délicats tranchés pour des enfants

### D'où viennent les contours, les drapeaux, les capitales et les noms

| Quoi | Source proposée | Licence | Poids pour l'iPad | Vérifié |
|---|---|---|---|---|
| **Contours des pays** | [Natural Earth](https://www.naturalearthdata.com/), couche « Admin 0 – Countries » au 1:50 millions, **déjà téléchargée** par `outils/cartes.py` | domaine public (vérifié le 01/11, `docs/zoom/PLAN.md`) | simplifiée une fois comme le voyage : quelques centaines de Ko pour six vues de continent (mon estimation, à mesurer ; le voyage entier pèse 394 Ko, le test refuse plus de 1,5 Mo) | **[donnée]** fichier en cache lu le 02/11 : 242 unités, avec `NAME_FR`, `CONTINENT`, `SUBREGION`, et `FCLASS_FR`, le statut vu par la France |
| **Frontières vues par la France** | la variante « point de vue de la France » de Natural Earth 5.1.1 ([page des points de vue](https://www.naturalearthdata.com/?p=5118)) | domaine public | **au 1:10 millions seulement**, plus lourde à télécharger, mais simplifiée une fois hors ligne comme le reste | **[donnée]** page lue le 02/11 : la couche par défaut suit les frontières de fait, les 33 variantes (dont `fra`) les frontières de droit de chaque pays |
| **Drapeaux, premier choix** | les **drapeaux emoji d'iPadOS** (🇮🇹), dessinés par l'appareil | rien à embarquer ni à créditer | **0 Ko** | **à vérifier sur l'iPad** : rendu à grande taille, présence du Kosovo, style « drapeau qui flotte » |
| **Drapeaux, repli** | [flag-icons de lipis](https://github.com/lipis/flag-icons), SVG au format 4:3 et carré | MIT (page lue le 02/11) | à mesurer avant de choisir ; ne charger que les drapeaux d'un continent à la fois | le nombre de drapeaux et le poids total ne sont pas donnés par la page |
| **Capitales** | Natural Earth, « Populated Places » 5.1.2, qui « inclut toutes les capitales de pays » ([page](https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-populated-places/)), recoupée avec la liste française ci-dessous | domaine public | quelques Ko | page lue le 02/11 ; le nom exact des champs qui marquent une capitale est à lire dans le fichier |
| **Noms français, capitales et articles** | la liste [« Pays, territoires et villes du monde » de la Commission nationale de toponymie (CNIG)](https://cnig.gouv.fr/IMG/pdf/7__liste_pays_territoires_et_villes_du_monde.pdf), version du 12/02/2025 : nom français, gentilé, capitale | publication administrative | une table de 200 lignes dans le code | **résumé seulement** ; vérifier qu'elle donne l'article (« le Japon », « les Pays-Bas »), sinon l'ajouter à la main, comme le planisphère le fait |
| **Noms anglais** | `NAME_EN` de Natural Earth, relus en anglais britannique, avec l'article là où l'usage le veut (the United Kingdom, the Netherlands, the United States, the Philippines) | domaine public | négligeable | relecture humaine nécessaire |
| **Voix** | Gemini TTS, voix Sulafat (D-12), en anglais et en français | | environ 1 600 phrases (nom, consigne, « voici », capitale, dans les deux langues), soit une trentaine de Mo sur le serveur, **chargées une à une** (moyenne des 2 946 fichiers actuels : 19 Ko) | mon calcul ; écouter les noms difficiles (Ouagadougou, Reykjavik, Ashgabat) avant de valider |

### Les petits pays ne se touchent pas sur une carte du monde : on ne les y demande jamais

**[donnée]** Mon calcul sur le fichier en cache, en mesurant la plus grande île de chaque pays : sur un iPad en paysage, la vue du monde donne environ 3 pixels par degré, donc une cible de 56 px demande un pays d'environ 19 degrés de large. **185 pays sur 202 sont plus étroits** : sur la vue du monde, seule une quinzaine de géants se touchent. À l'échelle d'un continent (environ 18 pixels par degré pour l'Europe), une centaine de pays font moins de 6 degrés, 65 moins de 3 et 45 moins de 1,5 (Vatican, Monaco, Saint-Marin, Liechtenstein, Malte, Singapour, Bahreïn, les îles des Caraïbes et du Pacifique).

Traitement proposé **[pratique]** :

- **Les questions « toucher » se posent sur la vue d'un continent**, jamais sur le monde entier ; la vue du monde sert à l'exploration et au jeu des géants.
- **Un pays trop petit devient un point de taille fixe** (comme les tout petits pays et les villes du voyage, `docs/zoom/PLAN.md`, section 2), avec une zone de toucher de 56 px.
- **Les archipels lointains** (Caraïbes, Pacifique) s'ouvrent dans une vue rapprochée, et restent en exploration cette année.

### Les cas délicats, et comment les dire à un enfant

- **Les pays au statut discuté** **[donnée]** (le fichier les marque) : Kosovo (« Disputed », reconnu par la France d'après `FCLASS_FR`), Palestine (« Indeterminate »), Sahara occidental (« Indeterminate », non reconnu d'après `FCLASS_FR`), Taïwan, Chypre du Nord et Somaliland (« Unrecognized » pour les deux derniers). Proposition **[pratique]** : **ils se voient et se touchent en exploration, avec une phrase neutre** (« Countries do not all agree about this place. »), **et ne sont jamais interrogés**. Les frontières suivent la variante « vue de la France », celle de la classe.
- **Une capitale contestée** : celle d'Israël ne fait l'objet d'aucune question **[pratique]**.
- **Les capitales multiples** **[pratique, non relu à la source]** : Afrique du Sud (trois), Bolivie (Sucre et La Paz), Pays-Bas (Amsterdam, gouvernement à La Haye), Côte d'Ivoire, Bénin, Malaisie, Sri Lanka, Tanzanie, Eswatini ; la Suisse n'a pas de capitale de droit, Berne est la « ville fédérale ». La question n'attend que le nom de la liste du CNIG, toute capitale officielle est acceptée, et l'information le raconte comme une curiosité.
- **Les territoires d'un autre pays** (Groenland, Porto Rico, et la France d'outre-mer : Nouvelle-Calédonie, Polynésie française) : coloriés comme leur pays, avec « belongs to France » ; c'est un lien direct avec l'outre-mer du voyage.
- **Les pays sur deux continents** (Russie, Turquie, Égypte, Kazakhstan) : rangés dans le continent du fichier pour les paquets, avec « This country is in Europe and in Asia » dans l'information.
- **Les noms qui ont changé** (Eswatini, Macédoine du Nord, Tchéquie, Myanmar) : le nouveau nom, et l'ancien dit une fois, parce qu'un atlas de la maison peut le porter.
- **Pas d'anecdote sans source** : la ligne d'information se tire des données (continent, voisins, capitale), pas d'un texte écrit par une IA, qui inventerait.

## 6. Ce qui est bien dans l'existant et doit rester

- **Le voyage ne bouge pas** : son contenu par enfant, ses étapes et ses totaux restent ceux de D-17 et de `docs/zoom/PLAN.md`.
- **Sa mécanique sert telle quelle** : erreur sans punition puis retouche, voix qui lit et dit le nom sur une réponse hésitante, couleurs bronze, argent et or, crédit des cartes affiché.
- **Le planisphère de Louise** garde ses noms avec article, sa double langue et ses trois jeux, qui ont inspiré les jeux 1 et 5.

## 7. Les questions que seuls les parents tranchent, chacune avec notre recommandation

1. **Un module à part, « The world », plutôt qu'un enrichissement de l'étape « Terre » ou du planisphère ?** Recommandation : oui, module à part, relié au voyage par un bouton depuis l'étape Terre.
2. **Jeu libre, hors du « Today », ou activité du « Today » ?** Recommandation : libre (`libre: true`), proposé seulement le jour de sa découverte, comme le nombre cible (D-22, point 6) : c'est de la découverte au-delà du programme, et le plafond de trois activités et quinze minutes doit rester au programme.
3. **Les capitales pour Henri cette année ?** Recommandation : seulement celles des voisins de la France, en fin d'année ; les autres en exploration.
4. **Les pays au statut discuté : visibles en exploration et jamais interrogés ?** Recommandation : oui, avec la phrase neutre, et les frontières vues de la France.
5. **Un paquet « famille et vacances », que les parents composent depuis le coin parent (dix pays au plus) ?** Recommandation : oui, c'est le paquet qui donnera le plus de sens au reste.
6. **À demander à la maîtresse d'Henri** : quels quatre pays la classe étudie-t-elle dans le thème « Se nourrir », et quand ? Le paquet de la classe peut s'ouvrir la même semaine.
7. **À proposer à Louise** : garde-t-elle son planisphère tel quel, et veut-elle faire, ou prêter, le puzzle des continents ? Recommandation : son planisphère tel quel, et le puzzle proposé comme extension de son mode « Drag ».
8. **Reste ouverte depuis le 01/11** : six ou sept continents en classe. Elle décide comment les paquets « un continent à la fois » rangent l'Amérique ; recommandation inchangée, s'aligner sur les maîtresses.
