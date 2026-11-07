# Décisions de « Nos révisions » : ce qui est tranché, par qui, et pourquoi

Le registre des décisions. **Une décision écrite ici ne se rouvre pas sans un fait nouveau** ; une proposition d'un relecteur qui la contredit arrive aux parents comme une question, jamais comme une correction. Les décisions encore ouvertes sont dans [`TODO.md`](TODO.md).

Format : numéro, date, qui, la décision, la raison, la source.

## Organisation et hébergement

- **D-01, 01/11/2026, Louis : une app par enfant, posée sur l'écran d'accueil de l'iPad, avec sa mascotte en icône.** Raison : que chacun ait « sa petite app ». Source : conversation avec Louis ; mécanique dans `ARCHITECTURE.md`, section 3.
- **D-02, 01/11/2026, Louis : un seul dépôt, `louisepasq/revisions`, où les deux parents écrivent.** Raison : tout doit vivre sur le même site pour que les modules s'ouvrent dans l'app de l'enfant. L'ancien dépôt `LouisVap/tables-multiplication` est archivé.
- **D-03, 01/11/2026, Louis : tout est servi par Vercel (compte perso de Louis), derrière des codes, avec une sauvegarde en ligne de la progression.** Raison : ne rien laisser public (prénoms, mascottes, progression), et que la progression survive à la suppression de l'icône et suive l'enfant d'un appareil à l'autre. Remplace l'hébergement GitHub Pages.
- **D-04, 01/11/2026, Louis : un code parent qui ouvre tout, et un code secret par enfant, choisi par lui, qui n'ouvre que son app.** Le code parent est posé par Louis dans Vercel ; **aucun code ne passe par une conversation ni par le dépôt** (règle de sécurité d'Avest : jamais de mot de passe dans un chat).
- **D-05, 01/11/2026, Louis : appareils visés.** L'iPad 9e génération des enfants, en paysage et en portrait ; ponctuellement les iPhone 17 et 16 Pro des parents. Les deux enfants sont droitiers : pavé et bouton principal à droite.

## Design

- **D-06, 01/11/2026, Louis : aucune contrainte de design héritée.** Le portail et le planisphère de départ ont été faits sans designer ; on vise les meilleures pratiques des apps pour enfants, avant que les enfants ne s'habituent à une interface.
- **D-07, 01/11/2026, choix délégué par Louis : la direction « Gros jeu tactile », corrigée et enrichie des trois autres directions du panel.** Raison : la plus désirable pour un enfant de 9 ans, ses défauts étant corrigeables. Source : `design-system/archive/2026-11-01_panel/README.md`.
- **D-08, 01/11/2026, Louis : les mascottes.** Moussi pour Henri (petite souris grise en bouclette, le nez au-dessus de la bouche, d'après son doudou) ; Pooh Bear pour Clara (petit ours jaune pâle au t-shirt rouge sans inscription, dessin original d'après son doudou). Retouches demandées par les enfants le 01/11 : le nez de Moussi, les bras de Pooh Bear.

## Pédagogie des tables

- **D-09, 01/11/2026, Louis, sur les fiches Eduscol : la méthode des tables.** Familles dans l'ordre d'Eduscol (faciles, ×2, ×4 et ×8, ×3 et ×6, ×9, ×7) ; quatre types de questions ; boîtes de Leitner ; la justesse avant la vitesse ; erreur sans punition, avec astuce et retapage. Source : `tables/PLAN.md`.
- **D-10, 01/11/2026, Louis, sur proposition du relecteur pédagogique : le diagnostic du premier lancement sans chrono visible ; la régularité en jours faits dans la semaine, jamais en série qui retombe à zéro ; « Rapide ! » discret.** La rapidité se mesure jusqu'au premier chiffre tapé.
- **D-11, 01/11/2026, Louis, après le premier essai : la voix est active par défaut dans les tables.** Chaque question est lue dès qu'elle s'affiche (« neuf fois cinq »), et une réponse juste fait dire le fait complet (« neuf fois cinq, quarante-cinq ») avant la question suivante. Raison : faire entrer le fait par l'oreille.
- **D-11 bis, 01/11/2026, Louis et Henri : la voix s'adapte à la rapidité.** Une réponse rapide (premier chiffre en moins de 3 secondes) veut dire que le fait est su : on ne le redit pas, on enchaîne. Une réponse hésitante, ou une erreur, fait dire le fait complet (« sept fois sept, quarante-neuf »), et l'enfant ne peut pas avancer, ni retaper, avant la fin de la phrase. Précise D-11.
- **D-12, 01/11/2026, Louis : les voix sont fabriquées d'avance par Gemini TTS, voix Sulafat, en français et en anglais.** Raison : la qualité, la même que les films Avest, sans dépendre des voix de l'iPad. Coût unique, de l'ordre de 0,50 $ pour le module des tables.

## Langue

- **D-13, 01/11/2026, Louis, sur proposition du relecteur bilingue : le cadre de l'app en anglais britannique, le contenu scolaire en français.** Le portail, les boutons, la mascotte et les fins de séance sont en anglais ; les questions, les astuces et les consignes d'exercice restent en français. Les tables restent en français parce qu'un fait arithmétique se retrouve mieux dans la langue où on l'a appris (Spelke et Tsivkin, 2001). Clara lit bien l'anglais, Henri commence. Le coin parent est en français. Source : `revues/2026-11-01_relecture-anglais.md`. **Remplacée par D-21 pour tout ce qui n'est pas les tables.**
- **D-21, 01/11/2026, Louis : l'anglais par défaut partout, le français seulement là où l'apprentissage l'exige.** Le cadre, les consignes d'exercice (« Touch a number », « What is this place called? »), les explications d'un coup refusé, la mascotte et les voix sont en anglais britannique dans tous les modules. Deux exceptions :
  - **les tables** : les énoncés des multiplications (questions et faits dits à voix haute) et les astuces restent en français, parce qu'elles construisent la compréhension et les automatismes, qui se retrouvent dans la langue où on les a appris (Spelke et Tsivkin, 2001) ; les consignes autour passent en anglais ;
  - **la géographie** : l'enfant choisit au début, en anglais ou en français, comme le faisait au départ le planisphère ; le choix se retient et se change à tout moment.

  Un module futur part en anglais ; le français n'y entre que pour une matière qui l'exige (la dictée, l'orthographe). Le coin parent reste en français. Source : demande de Louis du 01/11/2026, après l'essai d'Henri.

## Dictée et retour de Claude (décidés, pas encore construits)

- **D-14, 01/11/2026, Louis, sur proposition du relecteur pédagogique : la dictée se prépare avant d'être dictée.**
  - Les mots du jour sont au cœur du module.
  - L'enfant se corrige d'abord, Claude ensuite, en comparant au texte connu.
  - Trois erreurs au plus par retour.
  - La première version du retour sur photo ne porte que sur les dictées.
  - N'importe qui peut charger une dictée, en collant un texte ou à partir d'une photo.

  Source : `DISPOSITIF.md`, sections 4 et 5.

## Méthode de travail

- **D-15, 01/11/2026, Louis : les parents ne sont ni enseignants ni designers.** Dès qu'un choix paraît douteux ou qu'une idée surprend, faire relire par `relecteur-pedagogique` et `designer-apps-enfants` (`.claude/agents/`). Leurs relectures vont dans `docs/revues/`, et leurs propositions ne s'appliquent qu'avec l'accord des parents.

## Accueil et progression

- **D-19, 01/11/2026, Louis : l'accueil de chaque app en « cahiers par matière ».** En haut, le bandeau « Today », avec un seul bouton Start et ce qui est dû aujourd'hui. Dessous, un cahier par matière (maths, français, histoire-géographie, sciences, anglais), avec une jauge par activité. Toucher un cahier ouvre la page de la matière. La carte « My week » montre la progression de la semaine. Chaque module publie un résumé standard (`resume`) que le portail affiche sans être modifié. Raison : beaucoup de petits modules à venir (Henri). Source : `design-system/archive/2026-11-01_accueil/README.md`.
- **D-20, 01/11/2026, Louis : la progression des tables en album à tampons, avec les cinq ajustements du relecteur pédagogique.**
  - Chaque paire est une carte. Un fait sorti juste, et qui monte de boîte un jour donné, gagne un tampon entier par jour.
  - L'or demande les deux sens, et ne se gagne qu'à une révision prévue.
  - Une carte dorée qui retombe reste dorée, et affiche « revient demain » ; le coin parent garde l'état réel.
  - Un tampon ne s'échange jamais contre une récompense.
  - Au plus quatre faits nouveaux par jour, et non par séance.

  Les familles s'ouvrent toujours selon ce que l'enfant sait (boîtes réelles), jamais selon les tampons. La grille de Pythagore reste accessible depuis l'album. Sources : `design-system/archive/2026-11-01_progression/README.md` et `revues/2026-11-01_relecture-progression.md`.

- **D-22, 01/11/2026, Louis : les dix recommandations du relecteur pédagogique sur le « Today » et le nombre cible.** Source : `revues/2026-11-01_relecture-today.md`.
  1. Ce qui est déjà fait dans la journée compte dans le plafond de trois activités et quinze minutes, pour que « All done » arrive ; un jeu libre comme le nombre cible ne prend pas de place.
  2. Un module qui sait publier un résumé mais ne l'a pas encore fait est proposé d'office en découverte, 5 minutes, marqué « New! » ; le planisphère reste hors du « Today ».
  3. Au plus une découverte par jour dans le « Today ».
  4. Nombre cible : après un coup parfait obtenu avec un indice, la bulle de fin devient « Perfect move! Can you do it again without a hint? ».
  5. Nombre cible, pour Henri : seulement des cibles dont la solution la plus courte demande au moins deux calculs.
  6. Le nombre cible reste hors du « Today », sauf le jour de sa découverte ; point au bout de deux semaines, et s'il n'est jamais ouvert, proposé au plus deux fois par semaine.
  7. La voix lit d'elle-même les deux bulles du cadre (coût de l'indice, défi de fin), et le « −3 » de l'indice s'affiche en gros.
  8. Le badge « Perfect move! » reste affiché quand un indice a été pris.
  9. Tables entièrement en or et rien de dû : l'accueil propose la prochaine révision prévue, pas une séance chaque jour.
  10. Un module ne quitte le « Today » qu'une fois sa séance finie.

## Géographie : le grand zoom

- **D-17, 01/11/2026, Louis : un module « De l'univers à Éguilles », du zoom jusqu'au village ; l'école et la maison exclues.**
  - Sept étapes : la Voie lactée, le système solaire, la Terre, l'Europe, la France, Provence-Alpes-Côte d'Azur, les Bouches-du-Rhône avec Éguilles (Aix-en-Provence et Marseille en repères).
  - Le contenu de chaque étape suit la table « par enfant » de la relecture : Henri le nouveau programme de CM1, Clara l'ancien de CM2 ; tropiques et Greenwich pour Clara.
  - Même mécanique que les tables : boîtes de Leitner par lieu et par type de question (toucher, nommer), séances de cinq minutes, erreur sans punition puis retouche, voix qui lit la question et dit le nom juste sur une réponse hésitante.
  - Le village est dans le code (le site est derrière les codes depuis D-03) ; **ni l'école ni la maison**, ni géolocalisation, ni fond de carte en ligne.

  Raison : faire voir l'emboîtement des échelles, au programme du cycle 3, en partant de chez soi. Sources : `revues/2026-11-01_relecture-zoom-geographie.md`, `zoom/PLAN.md`.

## Jeu du nombre cible (façon Mathador)

- **D-18, 01/11/2026, Henri et Louis : les règles du jeu du nombre cible**, tel qu'Henri le pratique en classe.
  - Une cible jusqu'à 99, jamais plus de 100, et cinq petits nombres. L'app peut proposer d'autres tirages si elle en trouve de plus adaptés.
  - Les quatre opérations : chaque petit nombre sert une fois, et chaque résultat peut resservir.
  - Barème : addition et multiplication 1 point, soustraction 2 points, division 3 points ; le coup parfait (les cinq nombres et les quatre opérations) vaut 13 points.
  - L'app ne tire que des cibles atteignables, et connaît le meilleur score possible.
  - Pas de chrono par défaut : une option que l'enfant active lui-même au début d'une partie.
  - Un indice de Moussi, à la demande de l'enfant, montre un calcul d'une solution et coûte des points, annoncés avant de le prendre.
  - Diviser par 1 ne compte pas (validé par Louis le 01/11/2026), sinon on gagnerait 3 points sans calculer. À rouvrir seulement si la maîtresse l'accepte en classe.

## Sciences : le projet hélicoptères d'Henri

- **D-23, 07/11/2026, Henri et Louis : le premier projet de science d'Henri porte sur les hélicoptères, avec un seul appareil, le civil le plus vendu d'Airbus Helicopters (l'H125, de la famille Écureuil, né à Marignane).**
  - Trois dimensions : comment ça vole ; qui a le droit de voler, où et avec quelle autorisation ; les faits et records, et la différence avec un drone.
  - Un modèle en papier à fabriquer, et une visite à combiner (Musée de l'Aviation de Saint-Victoret, ou Airbus si une activité existe).
  - Pas à pas : les drones et les taxis volants viendront après.
  - Le choix de l'appareil par Henri devient le choix de la mission de son Écureuil.

  Rien n'est construit avant la relecture des experts (D-15). Source : `helicopteres/PLAN.md`.

## Écarté, avec la raison

- **La reconnaissance vocale pour répondre à l'oral** : l'API est absente des web apps de l'écran d'accueil sur iPadOS (ticket WebKit 225298). À confirmer par un essai sur l'iPad. Source : `revues/2026-11-01_relecture-audio.md`.
- **Une clé d'API dans le site** : elle serait lisible par tous. Tout appel à un service payant passe par une fonction Vercel.
- **Le pilote, le groupe témoin et le cadrage RGPD du brief ChatGPT** : ils visent un produit pour des classes, pas deux enfants. Source : `tables/PLAN.md`, section 6.
- **Le déploiement automatique au push** : en plan gratuit, Vercel refuse un dépôt privé dont le commit n'est pas du propriétaire du compte (forums Vercel, 01/11/2026). Déploiement par `outils/deployer.sh` depuis le Mac de Louis.
- **Un service de sauvegarde séparé** (`LouisVap/revisions-api`, archivé) : fusionné dans le site quand tout est passé sur Vercel, pour n'avoir qu'une adresse et qu'un code.
