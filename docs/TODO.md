# À faire dans « Nos révisions », par ordre d'importance

Mis à jour le 01/11/2026. Chaque entrée dit qui la porte. Une idée des parents ou des enfants s'ajoute ici le jour même, avec sa date.

**En pause du 01/11 au soir jusqu'après le RENT** (Louis, pour se consacrer au salon) : reprise prévue le 06/11/2026 (échéance dans `Louis-Kids/outils/echeances.yaml`). La version en ligne le 01/11 à 18 h 36 porte tout ce qui est décrit ici comme fait.

## Ce qui attend Louis

- **Faire choisir leur code à Henri et à Clara, puis installer leurs apps sur l'iPad.** Le code parent est posé depuis le 01/11/2026. Sur la page `https://nos-revisions.vercel.app/parents/`, chaque enfant tape son code deux fois. Ensuite, dans Safari, ouvrir son app, puis Partager et « Sur l'écran d'accueil ». Ouvrir l'icône et taper son code une dernière fois.

## Ce qui attend Louise

- **Passer le dépôt `louisepasq/revisions` en privé, en priorité**, et couper GitHub Pages, qui montre encore l'ancienne version publique avec les prénoms. Constaté encore public le 01/11/2026 à 18 h 40 : tout ce qu'on pousse (prénoms, mascottes, nom du village, décisions) y est lisible par tous. Sur GitHub : Settings, puis General, Danger Zone, « Change visibility » ; puis Settings, Pages, « Unpublish site ».
- **Pas de branchement automatique de Vercel au dépôt** (constaté le 01/11/2026, sur les forums de Vercel) : en plan gratuit, Vercel refuse de déployer un dépôt privé quand l'auteur du commit n'est pas le propriétaire du compte. Les pushs de Louise ne déploieraient donc pas. On déploie par `outils/deployer.sh`, depuis le Mac de Louis, qui envoie une copie sans historique git. À reconsidérer seulement si le besoin grandit : une action GitHub avec un jeton Vercel, ou le plan payant.
- **Le planisphère** : passer à 56 px et au mode anglais, et migrer les clés de stockage : c'est fait (01/11). À elle de dire si elle veut qu'il devienne l'étage « Terre » du zoom de géographie.

## À décider (parents)

- **Le nouvel accueil en cahiers par matière (D-19)** : construit le 01/11 (`commun/portail.js`, catalogue `commun/modules.js`, contrat `resume` dans `ARCHITECTURE.md`, section 8), parcours `commun/test_portail.py` vert, voix fabriquées et mis en ligne le même jour. Reste à Louis :
  - le montrer aux enfants (« trouve ce qu'il faut faire aujourd'hui », « trouve le voyage ») et noter ici leurs retours ;
  - trancher les écarts à la maquette : les cinq cahiers toujours affichés (trois « Coming soon » aujourd'hui), l'état « Today, you choose. » quand rien n'est dû ni fait, la bulle qui se lit en la touchant.
  - La règle du « Today » relue (`revues/2026-11-01_relecture-today.md`) et ses dix points appliqués et mis en ligne le 01/11 (D-22, `ARCHITECTURE.md`, section 8) : plafond sur la journée et « All done », découverte « New! » d'office, une par jour.
  - **Point à deux semaines (D-22, point 6), vers le 15/11** : regarder si Henri et Clara ouvrent le nombre cible d'eux-mêmes. Aujourd'hui, seul un jeu jamais ouvert revient dans le « Today » (lundi et jeudi) ; s'ils l'ont découvert puis délaissé, décider s'il revient deux fois par semaine sous la forme « une cible ».
- **Le planisphère de Louise dans le cahier d'histoire-géographie** : il y apparaît sans résumé. À Louise de dire si elle veut publier le sien (`KR.publierResume('planisphere', …)`, contrat dans `ARCHITECTURE.md`, section 8) ; son état, rangé sous plusieurs clés, reste hors de la sauvegarde en ligne (`synchro: false`).

- **Les trois ajouts audio proposés par le spécialiste** (`revues/2026-11-01_relecture-audio.md`) : le mode « écoute et réponds », l'enfant qui dit le fait à voix haute après une erreur, et le diagnostic et le défi silencieux. Ce dernier point s'écarte de D-11 : c'est aux parents de trancher.
- **Le zoom de géographie « De l'univers à Éguilles »** : décidé (D-17), construit et mis en ligne le 01/11 (`docs/zoom/PLAN.md`), en anglais ou en français au choix de l'enfant (D-21). Reste à Louis : le faire essayer aux enfants sur l'iPad et noter ici leurs retours. À faire relire par `relecteur-pedagogique` : les traductions anglaises (l'adresse dans l'univers, la phrase des planètes « My Very Easy Method Just Speeds Up Naming », « Lake Geneva », « main town » à la place de « prefecture »). À trancher ensuite : les questions qui relient deux étapes et la réponse sans proposition (PLAN, section 5).
- **Une petite API d'IA dans l'app** (question de Louis du 01/11). Reco du 01/11 : pas tout de suite, et jamais de conversation libre avec un enfant. Le premier usage utile est la dictée : corriger une dictée prise en photo (D-14) et fabriquer une dictée à partir des mots de la semaine. Toujours par une fonction Vercel qui garde la clé (section « Écarté » de `DECISIONS.md`). À trancher par les parents quand la dictée se construit.
- **Choix de langue laissés par défaut le 01/11 (D-21)** : « Oui », « Non » et la correction des tables restent en français, comme l'énoncé ; le réglage « Langue de l'app » du coin parent reste, anglais par défaut ; la page du code d'un enfant est en anglais (« Henri's app »), celle du code parent en français. À revenir dessus seulement si un enfant bute.

## Retours des enfants

- **Henri, 01/11 : il voit mal son progrès après quelques séances.** Il faut une récompense immédiate et une progression bien visible, comme dans Duolingo ou Simply Piano. Réponse construite et en ligne le 01/11 : l'album à tampons des tables (D-20) et les jauges des cahiers (D-19). Reste : lui demander si ça lui parle.
- **Henri, 01/11 : un widget sur l'écran d'accueil de l'iPad**, qui dit où il en est et ce qu'il doit faire aujourd'hui. Priorité 2. Une web app ne peut pas créer de widget iOS : il faudrait une petite app native, ou l'app Scriptable qui lirait la progression en ligne. À instruire.

- **Henri, 01/11 : au milieu du voyage, la voix disait « Je suis une professeure… »** : Gemini lisait sa consigne de style à voix haute sur 126 clips. Refaits et en ligne le 01/11 à 17 h 23 ; `voix.py` refait désormais tout clip trop long pour son texte (`voix.py controler` pour un contrôle).

## Prochains modules

- **Le jeu du nombre cible, façon Mathador** (Henri, 01/11/2026, fait en classe) : un nombre cible, cinq petits nombres, et les quatre opérations pour l'atteindre. Barème d'Henri : addition et multiplication 1 point, soustraction 2 points, division 3 points ; 13 points quand on utilise tous les nombres et les quatre opérations. Eduscol cite Mathador comme entraînement au calcul réfléchi (fiche d'intervention de début de CM2). Règles fixées avec Henri le 01/11 (D-18) : cinq nombres, cible jusqu'à 99, chrono en option choisie par l'enfant, indice de Moussi qui coûte des points. **Construit le 01/11** (`modules/cible/README.md`, pages `henri/cible.html` et `clara/cible.html`), parcours Playwright vert aux trois formats. Branché au portail par le catalogue, voix fabriquées et mis en ligne le 01/11. Les quatre questions de la relecture sont tranchées (D-22) et appliquées le 01/11 : hors du « Today » sauf pour sa découverte, plus de cible en un calcul pour Henri, voix sur les deux bulles et « −3 » en gros, badge gardé et bulle « Perfect move! Can you do it again without a hint? ». Reste : le faire essayer aux enfants sur l'iPad.

- **La géographie du monde** (Louis, 02/11/2026) : tous les pays du monde, avec leurs drapeaux et leurs capitales, et de petits jeux de découverte. Proposition des experts (pédagogie et design) en cours : `revues/2026-11-02_geographie-monde.md`. À trancher par les parents, et à proposer à Louise si le planisphère est concerné.
- **Dictée** : décidée (D-14), pas encore construite. D'abord demander aux maîtresses leur façon de faire : la forme de la dictée, les codes de correction, la liste de mots de la semaine.
- **Retour de Claude sur une photo** : après la dictée, par une fonction Vercel qui garde la clé.
- **Tables** : le défi d'une minute, « Découvrir une famille », « Practise it » depuis la grille.
- **Spelling** : la dictée anglaise, avec le même moteur.
