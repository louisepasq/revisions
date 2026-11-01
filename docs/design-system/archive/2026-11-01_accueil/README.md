# Accueil de l'app de chaque enfant : trois directions, et les cahiers par matière recommandés

Réponse au besoin posé par Henri et son papa le 01/11/2026 : quinze petits modules à terme, cinq matières, et une page d'accueil qui montre à la fois quoi faire maintenant, la progression, et l'accès à tout, de façon harmonieuse. Trois directions sont dessinées sur le kit v2 (`commun/kit.css`, `commun/kit.js`), chacune avec Henri (Moussi, Lagon) et Clara (Pooh Bear, Prune), aujourd'hui puis dans six mois, en iPad paysage (1080 × 810), iPad portrait (810 × 1080) et iPhone (402 × 874) :

- [`1-programme-du-jour.html`](1-programme-du-jour.html) ;
- [`2-cahiers.html`](2-cahiers.html), la recommandation ;
- [`3-onglets.html`](3-onglets.html).

Ouverte sans paramètre, chaque page montre sa planche : chaque écran y est la même page chargée dans un cadre aux dimensions réelles, donc les media queries du kit s'appliquent pour de vrai, et chaque cadre se fait défiler et se touche (un cahier ou un onglet ouvre la matière). « Ouvrir seul » sous un cadre donne l'écran plein. Les captures PNG de chaque planche sont à côté (`1-programme-du-jour.png`, etc.), celles de chaque écran dans `captures/` (vue d'arrivée, puis page entière en `_entier`).

Fichiers communs : [`maquette.js`](maquette.js) (données d'exemple, contrat `resume`, choix du « Today », planche) et [`maquette.css`](maquette.css) (pièces partagées : carte « Today », jauge, phrase de progrès, coin parent). Rejouer le rendu et les contrôles : `uv run docs/design-system/archive/2026-11-01_accueil/capturer.py` (Chrome sans tête par Playwright ; il vérifie qu'aucune page ne déborde, qu'aucun texte qui doit tenir sur une ligne n'est coupé ni replié, et qu'aucune cible tactile ne fait moins de 56 px ; dernier passage : aucun problème relevé sur les 48 écrans).

## Le portail actuel ne tient pas à quinze modules, et chaque module doit le modifier pour y entrer

Ce qui est aujourd'hui (`commun/portail.js`, `henri/index.html`, captures `modules/tables/captures/portail_*.png`) :

- **Une carte de 300 px par module, en une seule liste** : trois cartes remplissent l'écran en paysage ; quinze feraient cinq écrans à faire défiler, sans regroupement, et l'enfant devrait choisir seul parmi quinze.
- **Rien ne dit quoi faire aujourd'hui** : la bulle demande « Where shall we go today? », c'est l'enfant qui décide, chaque jour.
- **La semaine ne compte que les tables** (`T.joursDeLaSemaine` sur l'état des tables) : une dictée faite un mardi ne poserait aucun tampon.
- **Le portail connaît chaque module de l'intérieur** : il charge le moteur des tables et écrit à la main une fonction `carte()` par module. Chaque nouveau module modifie `portail.js`, ce qui est déjà le cas en ce moment pour le zoom.

## Les trois directions partagent une carte « Today » et une jauge par module

Communs aux trois, pour qu'on compare seulement l'organisation :

- **La carte « Today »** : trois activités au plus, quinze minutes au plus, une seule activité par matière au premier passage. La première porte **le seul bouton plein de l'écran, Start** ; les suivantes sont listées en lignes calmes sous « Then ». Règle complète dans `maquette.js`, fonction `planDuJour` : ce qui est dû (`du.des` atteinte), les révisions d'abord (la mémoire n'attend pas), puis les séances, puis les découvertes ; ce qui ne rentre pas attend demain sans rien perdre.
- **Une jauge par module, jamais une moyenne par matière** : une moyenne baisserait le jour où un module arrive, ce qui ressemblerait à une perte. La jauge ne redescend jamais (même principe que la couche `meilleure` de l'album à tampons), elle devient or quand le module est complet, et le « monté aujourd'hui » reprend l'or vif du kit (« +1 step »).
- **La semaine en tampons du kit**, comptée sur tous les modules : « 1 day this week », jamais une série qui retombe à zéro, jamais « tu as manqué ».
- **Un badge « Today »** sur ce qui est au programme, partout où le module apparaît.

### 1 · Le programme du jour : une seule page, « Today » en haut, toutes les matières en sections

**L'idée.** Tout est sur une page : programme et semaine dans le bandeau de l'enfant, puis « All my subjects », une section par matière avec ses cartes de modules. Au-delà de six modules, une rangée de raccourcis par matière en tête de la bibliothèque.

- **Pour** : aucun second niveau, rien n'est caché derrière une porte ; tout le progrès est visible en faisant défiler.
- **Contre** : à quinze modules, la page fait trois écrans en paysage, cinq sur iPhone ; quinze cartes sous les yeux, c'est le choix trop large qu'on voulait éviter, et l'écran change de forme à chaque module ajouté. La bulle et la semaine prennent de la place au-dessus d'une liste qu'on ne voit pas.

### 2 · Les cahiers par matière : « Today » en bandeau, un cahier par matière qui ouvre sa page (recommandée)

**L'idée.** L'accueil tient sur un écran : la mascotte, le prénom et la semaine en haut, le programme du jour en bandeau, puis **un cahier par matière**, comme dans le cartable. Chaque couverture porte le motif d'un cahier d'écolier dans la teinte de l'enfant (petits carreaux pour les maths, lignes Seyès pour le français, courbes de niveau pour l'histoire-géographie, points pour les sciences, rayures pour l'anglais), avec une étiquette : icône et nom. Sous la couverture, « 4 activities » et une petite jauge par activité, la jauge en pointillé pour une activité à venir. Toucher un cahier ouvre la page de la matière : Back, le titre sur le motif du cahier, et les grandes cartes de modules.

- **Pour** : voir l'argumentaire de la recommandation.
- **Contre** : un toucher de plus pour une activité hors programme ; un cahier à une seule activité au début (Maths, avec les tables) ; sur iPhone l'accueil défile (le programme, puis cinq cahiers couchés).

### 3 · Les onglets : un rail Today puis une matière par onglet

**L'idée.** Un rail permanent, à gauche en paysage : le prénom, l'onglet Today, puis un onglet par matière, avec un rond quand la matière a quelque chose aujourd'hui. L'onglet Today montre le programme et une carte « My week » qui réunit la semaine et une rangée de jauges par matière. En portrait, le rail devient une barre d'onglets en haut ; sur iPhone, une rangée d'onglets qui défile.

- **Pour** : la progression globale a sa place, toujours au premier écran ; on change de matière sans revenir en arrière.
- **Contre** : un onglet est une abstraction d'adulte (l'état « sélectionné » se comprend moins bien qu'un objet qu'on ouvre) ; sur iPhone, « History & geo », « Science » et « English » sortent de l'écran ; en portrait, la barre d'onglets passe au-dessus de la mascotte et du prénom, donc le premier objet vu est de la navigation, pas l'enfant ni son programme.

## Recommandation : les cahiers par matière, avec la carte « My week » des onglets comme vue de progression

**Je recommande la direction 2.**

- **Une seule chose évidente, et un écran qui ne change pas** : à deux modules comme à quinze, l'accueil d'iPad tient sans défiler, avec un seul bouton plein. Un enfant de 9 ans retrouve chaque jour le même écran au même endroit ; ajouter un module ne déplace rien, il remplit un cahier.
- **Le rangement de l'école, sans rien à apprendre** : à 9 ans, les matières sont déjà des cahiers et des protège-cahiers. « Fractions est dans le cahier de maths » se comprend sans explication, là où un onglet ou une section demande de lire.
- **Le progrès par matière sans moyenne trompeuse** : la pile de jauges sous chaque cahier montre ce qui avance et ce qui est complet (en or), d'un coup d'œil, et ne baisse jamais quand un module arrive.
- **L'harmonie du système de design tient** : aucune couleur nouvelle par matière (le motif et l'icône distinguent, même sans la couleur), la teinte de l'enfant reste la seule teinte, l'or garde ses deux sens du kit.
- **Le toucher de plus est le bon compromis** : le travail du jour ne le demande pas (il passe par Start), et le choix libre devient un choix en deux temps, cinq cahiers puis trois à cinq cartes, plus facile à 9 ans que quinze cartes d'un coup.

**Une greffe de la direction 3** : la carte « My week » (la semaine et une rangée de jauges par matière) devient la vue de progression globale à part, ouverte en touchant la semaine du bandeau ; elle sert aussi de base au futur bilan du coin parent. **De la direction 1, rien** : sa force (tout voir) est justement ce qu'on veut éviter à quinze modules.

**Avant de coder**, trois vérifications :

1. Montrer les trois planches à Henri et à Clara, chacun sur son iPad, et leur demander de trouver « Fractions », puis « ce qu'il faut faire aujourd'hui » : la direction retenue est celle où ils trouvent sans hésiter, pas celle qu'ils trouvent la plus jolie.
2. Faire relire par `relecteur-pedagogique` la règle du « Today » (trois activités et quinze minutes au plus, les révisions d'abord, une matière à la fois) : c'est une décision pédagogique, et elle touche la règle « Peu et souvent » du dispositif.
3. Montrer à Louise comment son planisphère entre dans le cahier d'histoire-géographie sans rien changer à son module (il apparaît sans résumé tant qu'il n'en publie pas, comme dans la maquette d'Henri aujourd'hui).

## Le contrat `resume` : ce que chaque module publie pour le portail

Le portail ne connaît plus l'intérieur des modules : il lit un catalogue fixe et un résumé que chaque module tient à jour. Un module futur s'y branche en ajoutant sa ligne au catalogue et en publiant son résumé ; `portail.js` ne change pas.

### La partie fixe : une ligne par module dans `commun/modules.js`

```js
window.Catalogue = {
  tables: {
    titre: { en: 'Times tables', fr: 'Les tables' },   // cadre : court, sans « My »
    matiere: 'maths',          // maths | francais | hg | sciences | anglais
    icone: 'grille',           // nom d'un symbole du sprite de kit.js (i-<nom>)
    page: 'tables.html',       // relative au dossier de l'enfant
    enfants: ['henri', 'clara'],
    etat: 'actif',             // actif | bientot
  },
};
```

Les matières (ordre de l'emploi du temps, nom, nom court pour un onglet, icône, motif de cahier) vivent dans le même fichier. La page de chaque enfant garde sa liste : `data-modules="planisphere,tables,dictee"`.

### La partie vivante : `resume`, écrit par le module

```js
{
  version: 1,
  ecritLe: '2027-05-04T17:42:10+02:00',   // ISO 8601 ; sert à garder le plus récent à la synchronisation
  progres: {
    avancement: 0.73,          // 0 à 1, ne redescend jamais (couche « meilleure ») ; null si le module n'en a pas
    phrase: { en: '211 stamps · 15 gold', fr: '211 tampons · 15 en or' },  // 28 caractères au plus
    aujourdhui: { en: '+6 stamps', fr: '+6 tampons' },   // ce qui est monté aujourd'hui, ou null
    jour: '2027-05-04',        // le jour auquel `aujourdhui` se rapporte ; périmé le lendemain
  },
  du: {                        // ce que le module propose pour le « Today », ou null
    des: '2027-05-03',         // date (AAAA-MM-JJ) à partir de laquelle c'est dû ; le portail compare à la date du jour
    nature: 'revision',        // revision | seance | decouverte
    phrase: { en: '12 cards come back', fr: '12 cartes reviennent' },    // 28 caractères au plus
    minutes: 5,                // durée honnête d'une séance, de 2 à 8
    lien: 'tables.html',       // facultatif : une ancre ou un paramètre pour ouvrir directement la séance
  },
  jours: ['2027-04-28', '2027-05-03'],   // jours pratiqués, les 14 derniers au plus
  parent: 'Les tables : 15 multiplications par cœur sur 36 ; fragiles : 7 × 8, 6 × 7.',  // français, pour le coin parent
}
```

Règles du contrat :

- **Où il vit** : dans l'état du module, `localStorage['<enfant>.<module>'].resume`, pour qu'il parte avec l'export du coin parent et la sauvegarde en ligne sans clé de plus. À la synchronisation, le résumé le plus récent (`ecritLe`) l'emporte : `commun/sync.js` ne sait aujourd'hui fusionner que les tables, il lui faut cette règle générique.
- **Quand il s'écrit** : à l'ouverture du module et à la fin de chaque séance, par une fonction du kit à ajouter, `KR.publierResume(module, resume)`, qui pose `version` et `ecritLe`.
- **Tous les textes sont dans les deux langues** (`{ en, fr }`), pour que le changement de langue dans le coin parent s'applique sans attendre que le module tourne. Le cadre est en anglais britannique (*colour*, *practise* pour le verbe) ; le contenu scolaire cité dans une phrase reste en français (« Dictée »).
- **Le portail calcule, le module déclare** : dû ou pas dû, fait aujourd'hui ou pas (`jours` contient la date du jour), au programme ou pas ; un module n'écrit jamais « à faire aujourd'hui ».
- **Un module sans résumé s'affiche quand même**, sans jauge ni phrase, et n'entre jamais dans le « Today » : c'est le cas du planisphère tant qu'il n'en publie pas.
- **Ce que le résumé n'a pas le droit de porter** : un pourcentage écrit, un rang, une comparaison, une série, un compte à rebours, une perte (« tu as perdu », « il te reste »).
- **Le module garde sa mécanique** : l'album à tampons reste dans le module des tables ; il n'expose au portail que sa phrase (« 211 stamps · 15 gold »), son avancement et ce qui est dû.

## La place du coin parent, des mascottes et de la langue du cadre

- **Coin parent** : même place dans les trois directions, en haut à droite de l'accueil et de chaque page de matière (sur iPhone, le cadenas seul sur la page d'une matière), toujours à l'appui long, toujours en français. À quinze modules, sa feuille gagne une section par module, remplie par `resume.parent`, puis les réglages et la sauvegarde comme aujourd'hui.
- **Mascotte** : sur l'accueil seulement, attitude `attend`, avec une bulle qui annonce le programme (« 3 short things today! », « One thing today. Ready? ») au lieu de demander où aller ; attitude `repos` quand le programme est fini (« All done. See you tomorrow! »). Elle n'apparaît pas sur la page d'une matière : c'est un écran de choix, pas un retour.
- **Langue du cadre, à ajouter à `commun/textes.js`** : « Hello, {prenom}! », « Today », « Start », « Then », « {n} things · {m} min », « {n} short things today! », « {n} activities », les cinq matières (« Maths », « French », « History & geography » et sa forme courte « History & geo », « Science », « English »), « All done. See you tomorrow! ». Les titres de modules perdent leur « My » (« Times tables », « World map ») : à quinze, la répétition ne dit plus rien. Henri commence l'anglais : chaque bulle tient en cinq mots, et Listen la lit.

## Ce que les maquettes ajoutent au kit, si la direction 2 est retenue

- **Quatorze icônes** pour les matières et les modules à venir (maths, livre, fiole, bulle, fraction, cubes, règle, temps, frise, cible, planète, goutte, carte, maison), dans `maquette.js` : à verser dans le sprite de `kit.js`.
- **Composants** : la carte « Today » (`.jour-c`, `.jour-1`, `.jour-suite`), la jauge d'un module (`.jauge-m`), la phrase de progrès (`.phrase-p`, `.gain-auj`), le cahier (`.cahier`, `.couv[data-motif]`, `.etiq-c`, `.barres`), le badge « Today ».
- **Écarts au système de design, justifiés** : les motifs de couverture sont du décor en `--e-200` et `--e-300` (rôles « traits » et « presque » du kit), jamais une couleur d'état.

## Ce que montrent les maquettes, et ce qu'elles ne montrent pas

- Les chiffres d'avancement et les modules marqués `exemple` dans `maquette.js` (Big numbers, Measures, Water cycle, Phonics) sont inventés pour atteindre l'échelle de quinze ; les autres modules sont ceux prévus. Henri en a quinze, Clara douze, et pas les mêmes (le planisphère est à Henri).
- Rendu vérifié dans Chrome sans tête, en mode jour, aux trois formats, pour les deux enfants ; chaque PNG a été regardé.
- Pas encore dessinés : le mode soir, la carte « Today » qui coche une activité finie et propose la suivante, la vue « My week » ouverte, l'animation d'ouverture d'un cahier (à faire sobre, compatible `prefers-reduced-motion`), et la feuille du coin parent à quinze modules.
