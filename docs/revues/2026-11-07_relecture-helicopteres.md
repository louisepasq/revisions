# Relecture du 07/11/2026 : le projet hélicoptères tient pour Henri, à condition de corriger l'idée que le rotor accélère pour décoller, d'avancer l'atelier en vraie expérience, et de réduire les règles à trois idées concrètes

Relecture de `docs/helicopteres/PLAN.md` (D-23), à deux regards comme le veut D-15 : le relecteur pédagogique (professeur des écoles en CM1 et CM2, formateur) et le designer d'apps pour enfants (iPad, 8 à 10 ans). Rien n'est construit, rien n'est décidé : **chaque proposition ci-dessous est à valider par les parents.** D-23 n'est pas rouverte : l'appareil, les trois dimensions, le modèle en papier et la visite restent ; la note dit comment les réussir.

Lu dans le dépôt : `CLAUDE.md`, `docs/DECISIONS.md` (D-15, D-19, D-20, D-21, D-22, D-23), `docs/DISPOSITIF.md` (sections 1 et 2), `docs/CONTRIBUER.md` (section 7), `docs/TODO.md` (la demande d'Henri), les deux fiches de `.claude/agents/`, le plan.

Marquage : **[programme]** texte officiel lu aujourd'hui ; **[source]** fait vérifié aujourd'hui dans un document primaire ; **[pratique]** usage de classe ou de design, notre expérience ; **à vérifier** : pas encore lu à la source, ne doit pas entrer dans l'app tel quel.

## La conclusion en cinq lignes

1. **Le plan tient pour un enfant de 9 ans** : un seul appareil, né à côté de chez lui, des questions qui viennent d'Henri, un objet à fabriquer et un vrai hélicoptère à voir. C'est exactement ce que le programme de CM1 demande d'un objet technique (décrire, nommer les parties, relier une pièce à sa fonction).
2. **Premier changement : répondre juste à la première question d'Henri.** Le rotor de l'H125 tourne presque toujours à la même vitesse, environ 6 à 7 tours par seconde **[source]** ; pour monter, le pilote ne le fait pas tourner plus vite, il **incline davantage les pales** (le pas collectif). Toute l'étape « comment il vole » et le cockpit se construisent autour de ce fait étonnant, avec un compteur de tours qui ne bouge pas.
3. **Deuxième changement : l'atelier passe en troisième position, en vraie expérience** (une question, une hypothèse, une seule chose qui change, une durée mesurée trois fois), ouvert par le fait d'avoir exploré, jamais par un score.
4. **Troisième changement : les règles se réduisent à trois idées concrètes** (la tour de contrôle dit oui ou non par radio ; ailleurs, il faut un endroit permis et l'accord du propriétaire ; on devient pilote après des leçons, une visite médicale et un examen, pas avant 17 ans **[source]**), jouées en petite scène radio plutôt qu'expliquées.
5. **Les boîtes de Leitner ne portent qu'une vingtaine de cartes** (les noms des parties, chaque commande et son effet, les trois idées des règles, quelques comparaisons de records) ; le reste est de la découverte, et aucun chiffre n'entre dans l'app avant d'avoir été lu à la source (section 7).

## 1. Le programme : le CM1 d'Henri demande de décrire un objet technique et de mesurer une durée ; la portance et les règles de l'air sont de la découverte

Source : [programme de sciences et technologie du cycle 3, annexe 2 de l'arrêté du 5 juin 2026](https://www.education.gouv.fr/sites/default/files/document/annexe-2-programme-de-sciences-et-technologie-du-cycle-3-519023.pdf), [BO n° 24 du 11 juin 2026](https://www.education.gouv.fr/bo/2026/Hebdo24/MENE2611650A), **lu en entier pour les principes, le CM1 et le CM2** le 07/11/2026. Point d'entrée Eduscol : [ressources d'accompagnement du programme de sciences et technologie au cycle 3](https://eduscol.education.gouv.fr/6878/ressources-d-accompagnement-du-programme-de-sciences-et-technologie-au-cycle-3) (**non lu** : accès refusé au robot le 07/11 ; d'après le résumé d'une recherche, le nouveau programme s'applique **au CM1 dès la rentrée 2026**, au CM2 et en sixième à la rentrée 2027). Henri est donc dans le nouveau programme.

### Ce que le programme de CM1 dit et qui touche ce projet

| Ce que dit le programme de CM1 | Ce qu'on en tire pour le projet |
|---|---|
| **[programme]** Objets techniques : « Identifier les fonctions assurées par les différents composants », « Associer les solutions technologiques aux fonctions techniques », « Identifier les sous-ensembles », décrire le fonctionnement « à l'aide d'un croquis », « croquis légendé » | le cœur de l'étape b : les pales, le rotor principal, le rotor de queue, les patins, chacun avec sa fonction ; un croquis légendé de l'Écureuil fait **sur papier** par Henri, photographié dans l'app (principe 5 de `DISPOSITIF.md`) |
| **[programme]** « Repérer les évolutions d'un objet dans différents contextes (historique, [...] technologique) » | le musée : l'Alouette, la Gazelle, le Dauphin et l'Écureuil côte à côte montrent comment un hélicoptère de Marignane a changé |
| **[programme]** Programmation : « l'élève associe chaque bloc ou instruction à son effet observable sur le comportement d'un objet technique » | c'est exactement le geste du cockpit : une commande, un effet visible |
| **[programme]** Mouvement : « Mesurer une durée, comme intervalle entre deux instants, lors du déplacement d'un objet », avec « un chronomètre » | la mesure de l'expérience : la **durée** de chute du modèle en papier |
| **[programme]** Introduction du CM1 : « une première approche des concepts de reproductibilité et de variabilité des mesures » | refaire chaque lâcher trois fois et constater que les durées ne sont pas identiques |
| **[programme]** Principes : « la formulation d'hypothèses qui sont mises à l'épreuve du réel » ; « Prendre en compte les conceptions initiales des élèves » ; « la réalisation d'une maquette, est vivement encouragée » | demander à Henri ce qu'il croit avant de montrer (le rotor accélère-t-il pour monter ?) ; l'atelier comme vraie démarche |
| **[programme]** Principes : « la distinction à faire entre les mots de la langue commune et ceux des discours spécialisés » | « hélice » (le mot d'Henri) contre « rotor » et « pales » (le mot juste) ; « manche » et « pas collectif » |

**L'an prochain, en CM2** **[programme]** : le mouvement circulaire (« un point coloré sur une toupie [...] décrit un cercle par rapport à l'axe de rotation ») et la formule « par rapport à » pour le caractère relatif du mouvement ; puis la conception d'une maquette en équipe. Le projet prépare bien les deux. En sixième, « la vitesse est abordée uniquement de manière qualitative, sans aborder la formule » : **l'expérience mesure une durée, pas une vitesse**, et le plan doit dire « la durée de chute » plutôt que « la vitesse de chute ».

### Ce qui est découverte, au-delà du programme

- **La portance et les forces** : le mot « force » n'apparaît pas dans le programme du cycle 3 (recherche dans le texte, 07/11) **[programme]**. On en parle avec des mots d'enfant (« les pales poussent l'air vers le bas, l'air pousse l'hélicoptère vers le haut »), sans flèches de forces ni vocabulaire de physique.
- **Les règles de l'aviation, les licences, la tour de contrôle** : aucun lien au programme de sciences ; c'est de la culture, à garder court.
- **Les records** : culture générale ; leur seul lien au programme est l'usage des grands nombres et des comparaisons (« se familiariser avec les grands nombres », principes) **[programme]**.
- **Les drones** : la comparaison avec l'hélicoptère est un bon exercice de « comparer des réponses à un besoin » **[programme]**, mais D-23 la garde pour plus tard ; une seule carte suffit ici.

## 2. Le parcours : garder les sept étapes, avancer l'atelier, rendre concret tout ce qui est abstrait

### L'ordre proposé (à valider par les parents)

| Ordre | Étape du plan | Ce qui change | Leitner ou découverte |
|---|---|---|---|
| 1 | a) Mon hélicoptère | inchangée : l'Écureuil, sa mission, ses couleurs ; une seule séance | découverte |
| 2 | b) Comment il vole | bâtie sur la conception initiale d'Henri et sur deux objets qu'il tient en main (ci-dessous) | **cartes** : les noms des parties et leur fonction (6 à 8 cartes) |
| 3 | c) Le cockpit | trois commandes seulement, un compteur de tours fixe (section 3) | **cartes** : chaque commande et son effet, dans les deux sens (6 cartes) |
| 4 | f) L'atelier | **avancé** juste après le cockpit : c'est l'activité qu'Henri attend le plus, et elle éclaire ce qu'il vient d'apprendre | découverte, et une carte « durée » à la fin |
| 5 | g) La sortie | **dès que le cockpit et l'atelier sont faits**, sans attendre la fin : Henri arrive au musée avec les mots, une liste de choses à trouver | découverte |
| 6 | d) Qui décide où on vole | réduite à trois idées, jouée en scène radio | **cartes** : trois ou quatre |
| 7 | e) Records, puis drone | en comparaisons, jamais en chiffres à retenir | **cartes** : trois ou quatre comparaisons |

**Longueur** **[pratique]** : une étape par séance d'environ dix minutes, l'atelier et la sortie le week-end. Le parcours tient en quelques semaines, au rythme d'Henri. Le module peut être `libre` (hors du « Today » sauf le jour de sa découverte, comme le nombre cible et le module « The world », D-22 point 6), tandis que les cartes dues entrent dans le « Today » comme les autres révisions, en respectant le plafond de trois activités et quinze minutes (D-22 point 1). **Au plus quatre cartes nouvelles par jour**, comme les tables (D-20). Une vingtaine de cartes en tout : au-delà, la découverte deviendrait un devoir.

### Ce qui est trop abstrait à 9 ans, et comment le rendre concret

- **La portance** (étape b). Ne pas l'expliquer par les pressions (l'explication par Bernoulli est souvent mal enseignée, et inutile à cet âge) **[pratique]**. Partir de ce qu'Henri voit et sent :
  - **l'hélicoptère-toupie en carton** (une hélice en carton fin collée sur une paille ou une brochette, qu'on fait tourner entre les paumes) : il **monte**, parce que ses pales sont inclinées ; retourner l'hélice, il ne monte plus. C'est la portance vue en vrai, en trente secondes **[pratique]**. Sécurité : dehors, pointe de la brochette coupée, jamais vers le visage ;
  - **le vent sous un hélicoptère** : une vidéo ou une image de l'herbe couchée et de l'eau soulevée sous un hélicoptère en vol stationnaire montre que l'air est poussé vers le bas ;
  - **la phrase à retenir** : « The blades push the air down, so the air pushes the helicopter up. »
- **Le pas collectif** (étapes b et c). Le mot est opaque, même en français. Le rendre concret par la main : la main à plat qui fend l'air ne pousse rien, la main inclinée pousse ; « collective » veut dire que **les trois pales s'inclinent ensemble**. Dans le dessin, un gros plan d'une pale qui s'incline quand Henri lève la commande **[pratique]**.
- **Le rotor de queue**. Henri ne demande pas pourquoi il existe, mais il le verra au musée. L'expérience du fauteuil de bureau qui tourne : Henri assis fait tourner une roue de vélo ou ses bras d'un côté, le fauteuil part de l'autre ; sans le rotor de queue, la cabine de l'hélicoptère tournerait sur elle-même **[pratique]**. À ne pas confondre avec une hélice qui pousse vers l'avant (idée fausse fréquente).
- **Avancer** (sa deuxième question). Le pilote penche tout le disque des pales vers l'avant avec le manche ; l'hélicoptère suit, le nez un peu baissé. Une image avant et après suffit.
- **La réglementation** (étape d). Trois idées, pas un exposé, et une petite scène où Moussi pilote et Henri joue la tour de contrôle de l'aéroport de Marseille Provence, à Marignane (« Moussi, you may land on the helipad »). Les numéros d'articles, les hauteurs minimales de vol et les catégories de licences restent hors de l'app.
- **Les records** (étape e). Un nombre comme 12 442 m ne dit rien à 9 ans ; « plus haut que les avions de ligne », « plus haut que l'Everest », « plus vite qu'un TGV » parle. Chaque record se montre à côté d'un repère qu'Henri connaît (le mont Blanc vu des Alpes, l'autoroute à 130 km/h) **[pratique]**.

### Ce qui va dans les boîtes, ce qui reste découverte

- **Dans les boîtes** (ce qu'il faut savoir redire pour comprendre la suite, et qui se vérifie par une réponse courte) : nommer une partie montrée sur le dessin ; dire à quoi elle sert ; associer une commande à son effet et un effet à sa commande ; « Who says yes to take off at Marseille airport? » ; « Higher or lower than Everest? ». Questions à toucher (choix parmi trois images), jamais à taper pour Henri.
- **En découverte seulement** : la mission et les couleurs, l'explication de la portance, l'histoire des hélicoptères de Marignane, l'expérience, le musée, les records en détail, le drone.

## 3. Le cockpit : trois commandes placées comme dans le vrai, un effet à la fois, un compteur de tours qui ne bouge pas

### Quelles commandes

Seulement les trois que nomme le plan **[pratique]** :

- **le pas collectif** (« collective lever ») : un levier à gauche, qu'on glisse vers le haut ou le bas ; effet : l'hélicoptère monte ou descend ;
- **le manche** (« cyclic stick ») : un manche à droite, qu'on pousse dans quatre directions ; effet : le disque des pales penche et l'hélicoptère avance, recule ou glisse sur le côté ;
- **les palonniers** (« pedals ») : deux grosses pédales en bas ; effet : le nez tourne à gauche ou à droite, grâce au rotor de queue.

**Une chance pour la prise en main** : dans un hélicoptère, le manche se tient de la main droite et le collectif de la main gauche **[pratique, à vérifier pour l'H125]**. Le placer ainsi à l'écran respecte à la fois le vrai cockpit et D-05 (les enfants sont droitiers, le geste principal à droite).

Aucun autre bouton, aucun instrument sauf un : **un compteur de tours du rotor**, qui affiche « about 6 turns every second » et **ne bouge pas** quand Henri lève le collectif. C'est la réponse visible à sa première question, et le contraire de ce qu'il croit probablement **[pratique]**. Avant le cockpit, lui poser la question (« To go up, does the rotor spin faster? Yes / No / I'm not sure ») et y revenir après : c'est la « conception initiale » confrontée aux faits que demande le programme.

### Rendre l'effet visible sans fausse idée

| Risque d'idée fausse | Ce que le cockpit fait à la place |
|---|---|
| « Pour monter, l'hélice tourne plus vite » | compteur de tours fixe ; gros plan des pales qui s'inclinent |
| « Le rotor de queue pousse l'hélicoptère en avant » | le rotor de queue n'apparaît qu'avec les pédales, et la flèche montre le nez qui tourne, pas un déplacement |
| « Une flèche, c'est une force » | une seule sorte de flèche, la **flèche du mouvement**, épaisse, de la même couleur que la commande touchée ; l'air poussé vers le bas, s'il est montré, en pointillés clairs, clairement différent |
| « L'hélicoptère bouge tout seul » | le mouvement dure tant que le doigt tient la commande, et s'arrête au lâcher ; le manche revient au centre (simplification assumée, dite par Moussi une fois) |
| « Un mouvement existe dans l'absolu » | un repère fixe dans le décor (un arbre, la tour de contrôle) pour lire le mouvement « par rapport à » quelque chose, comme le demandera le CM2 |

**Simplifications à assumer, et à dire une fois** : dans un vrai hélicoptère, lever le collectif oblige aussi à appuyer sur une pédale (le rotor de queue doit compenser davantage). Le cockpit d'Henri ne couple pas les commandes ; une bulle « Real pilots use both at once! » le signale en fin d'étape **[pratique]**.

**Guidage** : d'abord une commande à la fois, demandée par Moussi (« Touch the collective lever »), voix qui nomme la commande et dit l'effet ; puis un mode libre ; puis les cartes. Pas d'écrasement, pas d'échec possible : le sol arrête la descente.

### La forme recommandée

**Un dessin original et simplifié, pas une photo** (la reco du plan, que je confirme) **[pratique]** :

- à gauche, la vue de côté de l'Écureuil en vol dans un petit décor fixe (sol, arbre, tour), assez grande pour voir le disque des pales pencher ;
- autour, les trois commandes dessinées comme de gros objets à saisir (levier, manche, pédales), cibles de 56 px au moins, chacune dans sa couleur ;
- pour les pédales seulement, une bulle « vue de dessus » apparaît, parce que le nez qui tourne ne se lit pas de côté ; une seule vue principale, jamais de bascule de caméra ;
- `prefers-reduced-motion` : l'hélicoptère se place directement à sa nouvelle position et la flèche reste affichée, sans animation ;
- le dessin respecte les faits visibles de l'H125 : trois pales, un rotor de queue à deux pales, des patins **[source]**, et le côté du rotor de queue **à vérifier**.

Une photo de vrai tableau de bord montrerait des dizaines d'instruments sans rapport avec la question d'Henri ; la vraie photo a sa place au musée.

## 4. L'expérience du modèle en papier : une question, une hypothèse, une seule chose qui change, une durée mesurée trois fois

### La démarche, telle que l'app la guide

1. **La question** : « Do longer blades make the paper helicopter fall more slowly? » (et non « la vitesse de chute » : en CM1 on mesure une durée, section 1).
2. **L'hypothèse** : Henri choisit parmi trois réponses (plus lentement, plus vite, pareil) et dit pourquoi à voix haute ou en un mot ; l'app garde son choix pour la fin.
3. **Une seule chose qui change** : la longueur des pales (par exemple trois modèles, pales de 6, 8 et 10 cm). Tout le reste est identique : même papier, même trombone, même hauteur de lâcher (un repère de ruban adhésif), même façon de lâcher. L'app le fait vérifier avec une petite liste à cocher avant le premier lâcher.
4. **La mesure** : la durée entre le lâcher et le sol, **trois fois par modèle** ; l'app range les durées dans un tableau et montre une barre par modèle avec la durée du milieu (la médiane, sans le mot).
5. **La conclusion** : l'app rappelle l'hypothèse d'Henri ; il dit si elle était juste. Une hypothèse fausse est une découverte, jamais une erreur : Moussi le dit (« Scientists are often surprised! »).
6. **Le lien avec le vrai** : le modèle en papier ne vole pas comme l'Écureuil, il **tombe lentement parce que l'air fait tourner ses pales** ; c'est ce qui permet à un vrai hélicoptère dont le moteur s'arrête de descendre en se posant doucement (l'autorotation) **[pratique, à vérifier avant d'écrire dans l'app]**. À dire, pour éviter l'idée que le papier « vole ».

Deux variables possibles pour une seconde expérience, une à la fois : le nombre de trombones (la masse), puis le sens de pliage des pales (le sens de rotation change, la durée presque pas).

### Ce qu'Henri peut faire seul, et ce qui demande un aide

- **Seul** : découper et plier en suivant le manuel illustré ; mesurer la longueur des pales à la règle ; compter les trombones ; **le test de comparaison** : lâcher deux modèles en même temps, un dans chaque main, depuis la même hauteur, et regarder lequel touche le sol en premier. C'est fiable, sans chronomètre, et c'est le meilleur premier essai **[pratique]**.
- **Avec un aide** (un parent ou Clara) : la mesure de durée. Lâcher et chronométrer en même temps fausse la mesure ; l'un lâche, l'autre touche le gros bouton du chronomètre de l'app. Une chute d'environ deux mètres dure peu ; d'où les trois essais et le constat, au programme, que les mesures varient. Pour allonger la chute, lâcher du haut d'un escalier, un adulte présent **[pratique]**.

### Ce que fait l'app, et ce qui reste sur papier

- **L'app** : le manuel pas à pas (une image et une phrase lue par étape), la liste « même hauteur, même papier », le chronomètre à gros bouton, le tableau des durées tapées sur le pavé numérique des tables, la barre par modèle, le rappel de l'hypothèse.
- **Le papier** (principe 5 de `DISPOSITIF.md`) : le croquis légendé du modèle, et la phrase de conclusion écrite par Henri ; une photo entre dans l'app.

## 5. Les trois questions du plan : mes recommandations

### La récompense : l'atelier s'ouvre en ayant exploré, jamais en réussissant ; la maîtrise se reconnaît par un « brevet de pilote » qui ne s'échange contre rien

**Recommandation (à valider par les parents)** : confirmer la reco du plan, et la préciser.

- **L'atelier s'ouvre quand les étapes a, b et c ont été faites une fois**, quel que soit le score. Raisons : bloquer l'activité la plus riche derrière un score ferait des exercices un obstacle et non un entraînement, punirait l'erreur que tout le site refuse de punir, et prolongerait l'esprit de D-20 (un tampon ne s'échange jamais contre une récompense) **[pratique]**. Le programme fait de la maquette une activité d'apprentissage à part entière, pas un bonus **[programme]**.
- **Ce qu'Henri demande vraiment, c'est que réussir très bien compte.** Lui donner cette reconnaissance sans troc : un **brevet de pilote de Moussi**, une carte à son nom qui se remplit d'un tampon par commande maîtrisée (carte en boîte 3 ou plus, par exemple). Le brevet n'ouvre rien ; il est la trace de ce qu'il sait, comme l'album des tables. Il rejoint le sujet de l'étape d : un vrai pilote aussi a une licence.
- **Le dire à Henri simplement** : « You've explored your helicopter. Time to build one! » à l'ouverture de l'atelier, et « Pilot licence: 3 of 3 controls » sur le brevet.

### La langue : le choix au début, comme la géographie, avec le français conseillé pour Henri ; c'est une extension de l'exception de D-21, à décider par les parents

D-21 met l'anglais par défaut, et le français seulement « pour une matière qui l'exige ». Je ne la rouvre pas ; je pose la question qu'elle laisse ouverte.

**Recommandation (à valider par les parents)** : faire de ce module la troisième exception, sur le modèle de la géographie : un choix au début, retenu, changeable à tout moment ; **le cadre reste en anglais** (boutons, Moussi, fins de séance), le contenu suit le choix. Pour Henri, proposer le français au premier lancement. Raisons **[pratique]** :

- le projet construit des **concepts nouveaux** (pas collectif, rotor de queue, autorotation), dans des phrases d'explication et non des consignes courtes ; Henri commence à lire l'anglais, et une explication qu'il ne comprend pas n'apprend rien ;
- tout le reste du projet se passe en français : le musée, les bénévoles qui commentent, le manuel qu'il lira seul en fabriquant, la classe ;
- l'anglais garde une place utile : le **nom anglais de chaque commande** s'affiche sous le nom français (« le manche, the cyclic stick »), et le vocabulaire de l'aviation est réellement anglais dans les cockpits et à la radio (à vérifier avant de l'écrire dans l'app), ce qui rend ce petit lexique motivant.

Si les parents gardent l'anglais par défaut sans choix, alors phrases très courtes, bouton Listen partout, et l'explication de la portance en une phrase plus une image **[pratique]**.

### La forme du cockpit : un dessin original et simplifié, trois commandes, un compteur de tours fixe

**Recommandation (à valider par les parents)** : confirmer la reco du plan (section 3 pour le détail) : dessin original, vue de côté, trois commandes placées comme dans le vrai (collectif à gauche, manche à droite, pédales en bas), flèches de mouvement aux couleurs des commandes, un seul instrument, le compteur de tours qui ne bouge pas. Ni photo, ni tableau de bord complet, ni crash.

## 6. Ce qui est bien et doit rester

- **Un seul appareil, et né à Marignane** : la limite protège de la dispersion, et le lien avec chez soi donne du sens, comme « De l'univers à Éguilles » **[pratique]**.
- **Les questions d'Henri, gardées dans ses mots** dans `TODO.md` : c'est la meilleure base pour une démarche d'investigation, qui part des questions de l'élève **[programme]**.
- **Le choix de la mission plutôt que de l'appareil** : il garde l'envie de choisir sans disperser le contenu. Les missions proposées doivent être de vraies missions de l'H125 (secours, travail aérien avec une charge sous l'appareil, lutte contre les feux avec un seau, tourisme), d'après la page du constructeur **(à vérifier)**.
- **Un vrai objet à fabriquer et un vrai hélicoptère à voir** : c'est ce qui fera tenir le reste.
- **La règle « aucun chiffre de mémoire »** du plan, que la section 7 outille.

### Pour la sortie au musée : une mission plutôt qu'une visite

- Avant de partir, l'app donne à Henri une liste de choses à trouver, cochées sur place par un parent : les trois pales de l'Écureuil, son rotor de queue, le levier du collectif dans une cabine, les patins ; puis **une comparaison** : la Gazelle a un rotor de queue caché dans la queue (le Fenestron), l'Écureuil un rotor de queue à l'air libre **(à vérifier sur place)** **[pratique]**.
- Les photos prises par un parent entrent dans l'app et illustrent ensuite ses cartes : Henri révise sur l'Écureuil qu'il a vu.
- Appeler avant (horaires du matin seulement, et sources contradictoires sur le lundi, comme le note le plan).

## 7. Les faits à sourcer avant de construire

Rien ne s'écrit dans l'app avant d'avoir été lu à la source indiquée. Quatre faits ont été vérifiés le 07/11/2026 ; les autres sont à vérifier.

| Fait du parcours | État | Source recommandée |
|---|---|---|
| **L'H125 est un AS 350 B3 avec moteur Arriel 2D et quelques modifications** ; fabriqué par Airbus Helicopters, Aéroport International Marseille Provence, 13725 Marignane | **vérifié à la source** | [EASA, fiche de certificat de type EASA.R.008, édition 19 du 11/12/2025](https://www.easa.europa.eu/en/downloads/7945/en), section 7 (AS 350 B3) |
| **Vitesse du rotor principal de l'H125 en vol moteur : de 375 à 405 tours par minute** | **vérifié à la source** | même fiche EASA, AS 350 B3 Arriel 2D, rubrique « Rotor Speed Limitations » |
| « Environ 6 à 7 tours par seconde » | **calcul à partir de la source** (390 ÷ 60 ≈ 6,5) | même fiche ; à faire relire par un parent |
| **Rotor principal : 3 pales, 10,69 m de diamètre ; rotor de queue : 2 pales, 1,86 m** | **vérifié à la source** | même fiche, rubrique « Main Rotor » et « Tail Rotor » |
| Bout de pale à environ 780 km/h | **calcul à partir de la source**, à relire | même fiche (diamètre et vitesse) ; à n'écrire que si un parent l'a refait |
| **Âge minimal pour une licence de pilote privé : 17 ans** | **vérifié à la source** (texte de FCL.200 lu, commun à toutes les catégories d'aéronefs ; la mention de l'hélicoptère est à confirmer) | [EASA, Easy Access Rules for Aircrew, FCL.200](https://www.easa.europa.eu/en/document-library/easy-access-rules/online-publications/easy-access-rules-aircrew-regulation-eu-no?page=9), règlement (UE) n° 1178/2011 modifié |
| Premier vol seul en élève pilote à 16 ans | à vérifier | même document, FCL.020 |
| Nombre d'heures de vol pour la licence de pilote privé d'hélicoptère | à vérifier | même document, FCL.210.H |
| Visite médicale obligatoire (certificat médical de classe 2) | à vérifier | EASA, Part-MED ; pages « licences de pilote » de la DGAC (ecologie.gouv.fr, lien à retrouver) |
| Près d'un aéroport, c'est le contrôleur de la tour qui autorise le décollage et l'atterrissage | à vérifier | règlement d'exécution (UE) n° 923/2012 (règles de l'air SERA), sur [EUR-Lex](https://eur-lex.europa.eu/eli/reg_impl/2012/923/oj) ; DSNA (navigation aérienne) |
| Hors aérodrome, un hélicoptère se pose sur une hélisurface, avec l'accord du propriétaire, et en ville avec une autorisation du préfet | à vérifier | arrêté du 6 mai 1995 relatif aux aérodromes et autres emplacements utilisés par les hélicoptères, sur [Légifrance](https://www.legifrance.gouv.fr/) |
| L'H125 est l'hélicoptère civil d'Airbus le plus vendu ; nombre d'Écureuil construits | à vérifier (le plan cite la presse spécialisée) | rapports annuels de livraisons de la GAMA (gama.aero, lien du rapport à retrouver) ; [page H125 d'Airbus](https://www.airbus.com/en/products-services/helicopters/civil-helicopters/h125) |
| Vitesse de croisière et vitesse maximale de l'H125 | à vérifier | page H125 d'Airbus ; fiche EASA (vitesse à ne jamais dépasser) |
| **Atterrissage au sommet de l'Everest** (8 848 m) le 14/05/2005 par Didier Delsalle, sur un AS 350 B3 | à vérifier (plusieurs sources secondaires concordent ; elles divergent sur la durée et le nombre d'atterrissages) | base des records de la [FAI](https://www.fai.org/records) ; communiqué Airbus Helicopters |
| **Record d'altitude en hélicoptère** : 12 442 m, Jean Boulet, 21/06/1972, sur une Lama (SA 315B), à Istres | à vérifier (sources secondaires concordantes ; la base de la FAI n'a pas répondu le 07/11) | [FAI](https://www.fai.org/records), record n° 788 |
| **Record de vitesse en hélicoptère** : 400,87 km/h, Westland Lynx, 11/08/1986 | à vérifier ; ne pas présenter comme record homologué les vitesses plus élevées d'appareils hybrides (X3 d'Eurocopter) sans l'avoir lu à la FAI | [FAI](https://www.fai.org/records) |
| Côté du rotor de queue de l'H125, sens de rotation du rotor principal, place du pilote (à droite ?) | à vérifier | manuel de vol ou documentation Airbus ; à observer au musée |
| L'autorotation : un hélicoptère dont le moteur s'arrête peut se poser grâce au rotor que l'air fait tourner | à vérifier dans les mots de l'app | manuel de pilotage hélicoptère de la [FAA](https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/helicopter_flying_handbook) (chapitre autorotation) |
| Un drone multirotor se dirige en changeant la vitesse de chacun de ses rotors, l'hélicoptère en changeant l'inclinaison de ses pales | à vérifier | un manuel d'ingénierie ou la documentation DGAC sur les drones ; une carte au plus |
| Horaires et collections du Musée de l'Aviation de Saint-Victoret (Écureuil, Gazelle, Alouette, Dauphin) | à vérifier par téléphone, comme le dit le plan | 04 42 34 59 16 |
| Repères de comparaison (hauteur de l'Everest et du mont Blanc, altitude de croisière d'un avion de ligne, vitesse d'un TGV) | à vérifier | IGN pour le mont Blanc, SNCF pour le TGV, une source unique pour l'Everest (8 848 ou 8 849 m selon les mesures) |

## Ce qui reste aux parents

Chaque point de cette note est une proposition **à valider par les parents** ; les trois réponses de la section 5 sont celles qui conditionnent la construction. Une décision prise s'écrit dans `docs/DECISIONS.md` dans le même geste (règle du `CLAUDE.md` du dépôt).
