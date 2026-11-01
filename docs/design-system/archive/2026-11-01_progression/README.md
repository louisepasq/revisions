# Progression visible des tables : trois mécaniques, et l'album à tampons recommandé

Réponse au retour d'Henri (CM1) après quelques séances : il ne voit pas son progrès sur la page de progression des tables. Trois mécaniques sont dessinées sur les vrais écrans de l'app (kit v2, Moussi, iPad paysage 1080 × 810), chacune sur trois écrans (accueil du module, fin de séance, vue « ma progression ») et une ligne d'état après 1, 5 et 20 séances :

- [`1-route-familles.html`](1-route-familles.html) ;
- [`2-album-tampons.html`](2-album-tampons.html), la recommandation ;
- [`3-pot-etoiles.html`](3-pot-etoiles.html).

Les chiffres des maquettes ne sont pas inventés : [`simulation.js`](simulation.js) fait jouer 20 séances au vrai moteur (`modules/tables/moteur.js` et `seance.js`) par un profil d'enfant de CM1 [appréciation : justesse de 90 % sur les faciles à 35 % sur le ×7, qui monte avec la boîte], cinq séances par semaine à partir du lundi 2 novembre 2026. Sortie : `simulation.json`. Rejouer : `node docs/design-system/archive/2026-11-01_progression/simulation.js`.

## Pourquoi Henri ne voit rien : l'app ne montre que l'or, qui demande une semaine et les deux sens

Constats sur le code, chiffrés par la simulation :

- **Le seul chiffre affiché, « N of 36 by heart », reste à 0 pendant les deux premières séances, puis vaut 2 après cinq séances** (15 après vingt). Une paire n'y compte que si ses deux sens sont en boîte 4, et la boîte 4 demande une réponse rapide à un jour différent après les intervalles de 1, 2 et 4 jours : une semaine au moins pour un fait nouveau. Sur douze profils tirés, l'or après cinq séances va de 0 à 2.
- **« N squares went up » en fin de séance ne compte que les changements de couleur.** Les montées de boîte 1 vers 2 et de 4 vers 5 restent invisibles, et la grille compte chaque paire dans l'état le plus faible de ses deux sens : 7 × 8 qui progresse pendant que 8 × 7 attend ne change rien à l'écran.
- **Une erreur efface visuellement un acquis**, contre le garde-fou des décisions D-09 et D-10 : `enregistrer` remet la boîte à 1, et la case de la grille repasse à « Starting ».
- **Les familles s'ouvrent par paliers, sans fête.** Le diagnostic en ouvre d'un coup une à quatre selon le profil, sur douze profils tirés (deux questions au plus par famille en une minute), puis plus rien ne bouge pendant une à deux semaines (simulation : ×4 et ×8 à la séance 9, ×3 et ×6 à la séance 18).
- **Le progrès réel existe pourtant à chaque séance** : 6 boîtes gagnées à la première séance, 13 à 17 par séance le reste de la première semaine, 2 à 18 en quatrième semaine ; et dès la deuxième semaine, 7 à 18 faits dus retrouvés justes du premier coup par séance. C'est cette matière que les trois mécaniques rendent visible.

## Une couche visuelle qui ne redescend jamais, commune aux trois mécaniques

Chaque fait garde la plus haute boîte atteinte sur une réponse juste (`meilleure`). Le moteur continue de planifier sur la boîte réelle, qui redescend à 1 après une erreur ; l'écran, lui, ne montre que `meilleure`. Une erreur ne retire donc ni tampon, ni pierre, ni étoile, et l'or reste exigeant parce qu'il demande les deux sens en boîte 4. Une réponse fausse ne pose rien : la boîte 1 qu'elle crée n'est pas un tampon.

## 1 · La route des familles : Moussi avance d'un pas par tampon vers la famille suivante

**Ce que l'enfant voit.** Une route en serpentin pavée par les 36 paires, en six tronçons dans l'ordre d'Eduscol, chaque pierre se remplissant avec ses tampons et dorant à l'or ; Moussi se tient sur le tronçon en cours, la prochaine station en vue (« Next stop: Double doubles · 16 steps to go »).

- **Après une séance** : Moussi a fait 6 pas, dont 2 sur le tronçon des doubles ; deux pierres ouvertes sur trois sont vides.
- **Après un mois** : quatre familles ouvertes, la station des faciles en médaille d'or, Moussi à mi-chemin du ×9, 211 pas.

**Pourquoi ça motive à 9 ans.** Le but suivant est toujours visible et proche (6 à 16 pas), le personnage avance littéralement, la route entière montre le voyage. Le boss final porte une seule pierre neuve, 7 × 7 : le reste de la table de 7 est déjà pavé, ce qui dédramatise la table qu'il redoute.

**Risques.**

- La route avance par tronçon, donc par paliers ; sur des semaines de plateau, Moussi bouge peu sur le tronçon en cours pendant que les tampons tombent sur des tronçons déjà passés.
- **Elle exige de changer la règle d'ouverture des familles** : pour que Moussi arrive à la station au moment où la famille s'ouvre, l'ouverture doit suivre les tampons du tronçon (trois quarts des tampons, règle proposée) au lieu de 80 % des faits en boîte 3. Dans la simulation, les deux règles ouvrent ×4 et ×8 à la même séance (la 9) et ×3 et ×6 à une séance près, mais c'est une décision pédagogique à faire relire par `relecteur-pedagogique`.
- Le serpentin de 43 nœuds tient en trois rangées en paysage ; en portrait il en faudra cinq, sur iPhone sept, avec des pierres de 22 px qui ne se lisent plus.
- Un décor de chemin rejoint le défaut relevé par le panel du 01/11 sur la direction 4 (des lieux arbitraires qui ne se transposent pas aux autres modules) : la route reste ici abstraite, sans paysage.

## 2 · L'album à tampons : une carte par paire, un tampon par jour juste, l'or au quatrième

**Ce que l'enfant voit.** Chaque paire est une carte (« 7 × 8 ») à quatre emplacements de tampon. Un jour où le fait sort juste et monte d'une boîte, il gagne un demi-tampon dans le sens joué ; l'emplacement se remplit quand les deux sens l'ont. Au quatrième tampon plein, la carte devient dorée et montre enfin son résultat (« = 56 »). L'accueil donne le total de tampons et les trois cartes les plus proches de l'or ; la fin de séance montre les cartes dorées du jour en grand et les tampons gagnés en or vif ; l'album a une page par famille, avec une médaille sur l'onglet d'une page entièrement dorée.

- **Après une séance** : 22 tampons, dont 6 gagnés dans la séance, sur 8 cartes ; l'app actuelle affiche « 0 of 36 ».
- **Après cinq séances** : 84 tampons, 2 cartes d'or ; « Tomorrow, 2 × 6 comes back for a stamp ».
- **Après un mois** : 211 tampons sur 288, 15 cartes d'or, la page des faciles médaillée.

**Pourquoi ça motive à 9 ans.**

- **La collection est le ressort le plus fort de cet âge** (albums d'images, cartes à échanger), ici sans aucun hasard : chaque carte est connue d'avance et se gagne.
- **Le tampon rend visible chaque montée de boîte**, la plus petite unité de vrai progrès : il y a quelque chose de neuf à chaque séance.
- **Il explique la répétition espacée sans un mot de théorie** : une carte ne prend qu'un tampon par jour, donc rejouer le soir même n'apporte rien, et l'or demande plusieurs jours. Henri comprend pourquoi « par cœur » prend du temps, au lieu de croire que l'app ne voit pas son travail.
- **Le demi-tampon montre la commutativité** : « One way round » ou « Both ways round », 7 × 8 et 8 × 7 sur la même carte.

**Risques.**

- Le demi-tampon est une abstraction : à essayer avec Henri sur la maquette. S'il ne le comprend pas, un tampon plein par jour sur le sens le moins avancé, au prix d'un progrès un peu plus lent à l'écran.
- Une carte d'or n'est plus jamais « perdue », mais le moteur la repose : il faut qu'une erreur sur une carte d'or ne la ternisse pas, et qu'elle reparte simplement dans la file des révisions.
- L'album remplace la tuile « My grid ». La table de Pythagore d'Eduscol mérite de rester, en bascule « See as a grid » dans l'album, sur les mêmes données.

## 3 · Le pot d'étoiles de la semaine : une étoile par fait retrouvé quand il revenait

**Ce que l'enfant voit.** Chaque séance verse des étoiles dans le pot de la semaine, une couche par jour joué : une étoile par fait dû ce jour-là (ou nouveau) réussi du premier coup. Un anneau compte les jours de la semaine vers un objectif de quatre ; à quatre, le pot reçoit son ruban. Le pot ne se vide jamais et rejoint l'étagère le lundi suivant.

- **Après une séance** : 5 étoiles, un jour sur quatre.
- **Après une semaine** : 43 étoiles en cinq couches, ruban gagné le jeudi.
- **Après un mois** : quatre pots sur l'étagère (43, 77, 71, 58), 249 étoiles.

**Pourquoi ça motive à 9 ans.** Un gros chiffre neuf à chaque séance (« +18 »), et c'est la seule des trois mécaniques qui **amortit les semaines de plateau** : un fait déjà su et retrouvé au bon moment est récompensé. En quatrième semaine, le mardi, le mercredi et le jeudi donnent 6, 4 puis 2 tampons, mais 16, 8 puis 3 étoiles : le creux s'adoucit sans disparaître. La régularité se voit en couches et en anneau, sans série qui retombe à zéro.

**Risques.**

- **C'est la plus proche d'un compteur d'effort** : l'étoile récompense un rappel réussi, pas un acquis nouveau, et elle se rapproche d'une monnaie si un jour on ajoute « quelque chose à faire avec ». Ne jamais lui donner d'usage.
- L'objectif de quatre jours peut se manquer ; il est formulé en gain (le ruban), sans perte, mais un pot sans ruban sur l'étagère reste visible. À trancher : objectif de trois jours, ou pas de ruban du tout.
- La première séance donne peu d'étoiles (5), rien n'étant encore dû : la récompense immédiate est la plus faible des trois au moment où elle compte le plus.
- En milieu de semaine, le pot paraît presque vide.

## Recommandation : l'album à tampons, avec la phrase des rappels du pot en fin de séance

**Je recommande la mécanique 2.**

- **Elle répond exactement au problème d'Henri** : elle rend visible l'unité réelle de progrès (la montée de boîte) à chaque séance dès la première, là où l'app montre 0, et l'or y reste un vrai « par cœur » sur plusieurs jours, dans les deux sens.
- **Elle respecte tous les garde-fous** sans contorsion : ni vitesse seule (un tampon demande la justesse, la rapidité ne compte que pour le quatrième), ni comparaison, ni série, ni hasard, ni monnaie, rien à perdre.
- **Elle enseigne au lieu de distraire** : un tampon par jour fait comprendre l'espacement, le demi-tampon la commutativité.
- **Elle ne change aucune règle pédagogique du moteur**, contrairement à la route.
- **Elle servira aux autres modules** : la carte à tampons convient aux mots de la dictée (D-14), ce qui tient l'harmonie de « Nos révisions ».

**Une greffe de la mécanique 3** : la phrase « 18 sums came back today, and you remembered them first time » dans la fin de séance de l'album, pour les semaines de plateau, sans pot ni anneau (la semaine en tampons du kit suffit). **La route** reste une piste pour plus tard, comme vue d'ensemble, si la règle d'ouverture par tampons est validée.

**Avant de coder**, deux vérifications : montrer la page 2 à Henri (comprend-il le demi-tampon, a-t-il envie de dorer une page ?), et faire relire par `relecteur-pedagogique` le principe de la couche visuelle qui ne redescend pas.

## Données à ajouter à l'état (`<enfant>.tables`)

| Donnée | Où | Sert à | Mécaniques |
|---|---|---|---|
| `faits[k].meilleure` : plus haute boîte atteinte sur une réponse juste | `enregistrer` et `appliquerDiagnostic` ; migration : `boite` si `dernierJuste`, sinon 0 | tampons, pierres, or qui ne redescendent pas | 1, 2, 3 |
| `seances[]` : `{ jour, tampons, dorees: [clés], rappels, etoiles }` par séance, bornée aux 200 dernières | `Seance.bilan` | fin de séance (« +14 »), étagère, ligne de temps, coin parent | 1, 2, 3 |
| un drapeau `etaitDu` capturé avant `enregistrer` | `Seance.repondre` | compter rappels et étoiles | 2 (greffe), 3 |
| `ouvertures` : `{ indexFamille: jour }` | `majFamilles`, `appliquerDiagnostic` | dates sous les stations | 1 |
| règle d'ouverture par tampons du tronçon (75 %) | `majFamilles` | Moussi arrive à la station quand la famille s'ouvre | 1, décision à faire relire |

## Effort pour coder : l'album est le plus court, la route le plus long

Tailles relatives, pour une session de code avec tests (pas de durée annoncée).

- **Socle commun (petit)** : `meilleure`, `seances`, `etaitDu` dans `moteur.js` et `seance.js`, avec leurs tests dans `moteur.test.js` et `seance.test.js`, et la migration d'un état existant.
- **2 · Album (moyen)** : un composant carte à tampons dans `kit.css` et `kit.js` (réutilisable par la dictée), l'écran album à onglets à la place de la grille (la grille gardée en bascule), la fin de séance réécrite, le panneau de l'accueil ; les trois formats (en portrait, 4 cartes par rangée ; sur iPhone, des cartes de 90 px à deux rangées par page) et le parcours Playwright à étendre.
- **3 · Pot (moyen, plus petit que la route)** : le pot, l'anneau et l'étagère en CSS, l'agrégation par semaine depuis `seances`.
- **1 · Route (gros)** : le serpentin et son tracé calculés après mise en page, le placement de Moussi, trois dispositions selon le format, et le changement de règle d'ouverture avec ses tests.

## Ce que montrent les maquettes, et ce qu'elles ne montrent pas

- Rendu vérifié dans Chrome sans tête au format iPad paysage, en mode jour (PNG à côté de chaque page) et en mode soir ; cibles de 56 px au moins pour tout ce qui se touche (cartes de 118 × 150, onglets de 76 px, boutons de 60 px), textes de 16 px au moins.
- Pas encore dessinés : l'iPad portrait, l'iPhone, l'animation du tampon qui se pose (à faire sobre et compatible `prefers-reduced-motion`), et le thème de Clara (Pooh Bear, Prune), que le kit applique sans changement de code.
