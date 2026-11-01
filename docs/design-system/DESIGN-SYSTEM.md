# Système de design « Nos révisions »

Le socle commun de toutes les petites apps de révision d'Henri (CM1) et de Clara (CM2) sur iPad : les principes, les tokens, les composants, les modèles d'écran et l'ossature d'une page. Trois fichiers l'accompagnent :

- `kit.css` : les tokens en variables CSS et les classes des composants, préfixées `kr-`.
- `kit.js` : les sons, la voix, le pavé numérique, le stockage par enfant et par module, l'appui long, l'annonce.
- `composants.html` : la vitrine, qui s'ouvre directement depuis le disque.

Dans le site, ces trois fichiers vont dans `revisions/commun/` (organisation du `PLAN.md`, section 3 bis). Les mascottes ne sont pas dessinées ici : chaque composant leur réserve un emplacement.

| Enfant | Classe | Mascotte | Couleur | Attribut |
|---|---|---|---|---|
| Henri | CM1 | Moussi, petite souris grise en bouclette, grandes oreilles rondes doublées de crème, museau pointu, gros nez noir | vert `#6DB86A` | `data-enfant="henri"` |
| Clara | CM2 | Pooh Bear, petit ours jaune pâle au t-shirt rouge, museau clair, nez brun, sourcils arqués | violet `#9B86D0` | `data-enfant="clara"` |

## Appareils visés : l'iPad 9e génération dans les deux sens, l'iPhone des parents en portrait

| Appareil | Zone d'affichage (points) | Particularités | Mise en page |
|---|---|---|---|
| iPad 9e génération, iPadOS 26.5 (appareil des enfants) | 1080 × 810 en paysage, 810 × 1080 en portrait | bouton d'accueil, aucune encoche, zones sûres nulles | paysage : question à gauche, pavé à droite ; portrait : question en haut, pavé en bas |
| iPhone 17 et iPhone 16 Pro (usage ponctuel) | 402 × 874 en portrait | Dynamic Island (62 points en haut), barre d'accueil (34 en bas) | format téléphone : tout empilé, tailles resserrées |

- **La bascule paysage ou portrait** se fait par `@media (orientation: portrait)` ; `data-orientation="paysage"` ou `"portrait"` sur un écran la force (la vitrine s'en sert).
- **Le format téléphone** s'active seul sous 600 px de large ; `data-format="telephone"` sur un bloc le force. Il resserre les tokens (question de 52 à 80 px, titres 30, 24 et 20 px, touches de 76 px) et empile tout : bulle sous la mascotte, chemin des notions sur deux rangs, pavé sous la question.
- **Les zones sûres** passent par `--kr-zs-haut`, `--kr-zs-bas`, `--kr-zs-gauche` et `--kr-zs-droite`, qui valent `env(safe-area-inset-*)` : la barre du haut descend sous la Dynamic Island, le pavé et le bas des écrans centrés remontent au-dessus de la barre d'accueil. Toute page déclare `viewport-fit=cover`. Sur l'iPad 9e génération, ces valeurs sont nulles et rien ne change.
- **Les cibles restent à 56 px au moins sur téléphone**, y compris les touches du pavé (76 px). Seule exception : les cases de la grille de maîtrise, qui ne servent qu'à regarder sur un téléphone (onze colonnes dans 370 points) ; sur l'iPad, la grille fait 666 points de large en paysage pour que chaque case atteigne 56 points.

## 1. Principes : six règles qui tiennent à l'âge de 8 à 10 ans

1. **Une seule chose évidente à faire par écran.** À cet âge, l'attention se disperse au premier élément concurrent et la lecture reste coûteuse : un bouton principal, en couleur forte de l'enfant ; le reste est secondaire, à plat ou plus petit.
2. **Le doigt d'abord : 56 px au minimum, 88 px pour les touches du pavé.** La motricité fine d'un enfant de 8 ans est moins précise que celle d'un adulte et l'iPad est souvent posé à plat. Tout ce qui s'appuie a un relief en dessous et s'enfonce au toucher ; ce qui se lit est à plat. Rien ne dépend du survol, qui n'existe pas sur iPad.
3. **Lire peu, entendre si besoin.** Un lecteur fragile ne doit jamais être bloqué par une consigne : texte de 20 px au moins pour lire, deux phrases au plus par bulle, et un haut-parleur sur chaque bulle et chaque question. Aucune capitale d'imprimerie, aucun italique pour du texte suivi.
4. **Une erreur est une information, jamais une sanction.** Pas de rouge, pas de croix, pas de secousse, pas de son grave : la couleur « à revoir » est un miel chaud, le son est doux, la bonne réponse s'affiche avec son astuce, puis l'enfant la retape. La mauvaise réponse n'est pas répétée, pour ne pas la graver.
5. **On récompense le progrès et la régularité, pas la vitesse ni le classement.** Les cases qui montent de niveau, les jours d'entraînement de la semaine, le record personnel. Un jour manqué n'efface rien (pas de « série » qui retombe à zéro), et aucune donnée d'un enfant n'apparaît dans l'app de l'autre.
6. **Chaque app appartient à son enfant, la famille garde un air commun.** Même ossature, mêmes polices, mêmes composants partout ; seules la couleur et la mascotte changent. L'enfant s'y retrouve d'un module à l'autre sans réapprendre l'interface, et reconnaît « son » app à sa couleur.

## 2. Tokens

Tous les tokens sont des variables CSS `--kr-*` définies dans `kit.css`. Le mode sombre suit l'iPad ; `data-theme="light"` ou `"dark"` sur `<html>` le force (même mécanique que les pages de la maman).

### 2.1 Couleurs de base : celles de la maman, reprises telles quelles

| Token | Clair | Sombre | Usage |
|---|---|---|---|
| `--kr-fond` | `#F3F6F2` | `#13212B` | fond de page |
| `--kr-papier` | `#FFFFFF` | `#1A2C38` | cartes, bulles, touches |
| `--kr-papier-2` | `#F8FAF9` | `#203441` | fond du pavé, bouton icône |
| `--kr-encre` | `#1F3340` | `#EAF2F6` | texte |
| `--kr-encre-douce` | `#5E7380` | `#A5B8C3` | texte secondaire (4,55 sur le fond) |
| `--kr-trait` | `#D5DEE2` | `#2E4554` | bordures |
| `--kr-relief` | `#C5D0D5` | `#0D1820` | bord épais sous ce qui s'appuie |
| `--kr-accent` | `#E8643A` | `#F27A50` | marque familiale (« révisions »), « Nouveau », record |
| `--kr-accent-fort` | `#B5441B` | `#FF9A72` | accent en texte (contraste suffisant) |
| `--kr-focus` | `#1D5F86` | `#BFE6FA` | anneau de focus du clavier |

### 2.2 Couleur de l'enfant : la teinte de la maman, plus une version forte pour le texte

| Token | Henri clair | Henri sombre | Clara clair | Clara sombre | Usage |
|---|---|---|---|---|---|
| `--kr-enfant` | `#6DB86A` | `#4E9B4C` | `#9B86D0` | `#7D6BB3` | identité : pastilles, bordures, jauges, points |
| `--kr-enfant-fort` | `#2A7327` | `#8FD18C` | `#6548A8` | `#B9A8EE` | texte coloré, fond du bouton principal |
| `--kr-enfant-sur` | `#FFFFFF` | `#13212B` | `#FFFFFF` | `#13212B` | texte posé sur la couleur forte |
| `--kr-enfant-doux` | `#E3F2E2` | `#1F3A27` | `#EDE8F8` | `#2C2742` | fonds teintés, puce choisie, mascotte réservée |

Sans `data-enfant` (page des parents), ces quatre tokens prennent l'accent orange.

### 2.3 Couleurs de sens : juste en vert, « à revoir » en miel, jamais de rouge

| Token | Clair | Sombre | Usage |
|---|---|---|---|
| `--kr-juste` / `-fort` / `-doux` | `#2E9E5B` / `#1E7A43` / `#DDF3E6` | `#4CC17D` / `#7FD9A3` / `#1D3B2C` | bonne réponse |
| `--kr-revoir` / `-fort` / `-doux` | `#F2B23A` / `#8A4B08` / `#FDF0D5` | `#E0A030` / `#F6C66A` / `#3A3020` | réponse à revoir, résultat fragile |

Le vert de la bonne réponse est proche du vert d'Henri : il n'arrive jamais seul (coche, mot « Bravo », tintement), et occupe la zone de question, pas la barre.

### 2.4 Maîtrise : quatre niveaux, chacun avec sa couleur, son symbole et son mot

| Niveau | Token | Clair | Symbole | Mot |
|---|---|---|---|---|
| 0 | `--kr-niv-0` | `#E4E9EC` | ○ | Pas encore |
| 1 | `--kr-niv-1` | `#D99A5B` (bronze) | ◔ | Je commence |
| 2 | `--kr-niv-2` | `#B8C4CF` (argent) | ◑ | Presque |
| 3 | `--kr-niv-3` | `#F2C230` (or) | ★ | Je sais par cœur |

Le texte sur un niveau est toujours `--kr-niv-encre` (encre foncée, 5,4 sur le bronze). Le symbole double la couleur pour un enfant qui distingue mal les teintes.

### 2.5 Typographie : Baloo 2 pour les titres et les nombres, Nunito pour lire

| Token | Taille | Police | Usage |
|---|---|---|---|
| `--kr-t-question` | 56 à 112 px (52 à 80 sur téléphone) | Baloo 2, 800 | la question (« 7 × 8 ») |
| `--kr-t-geant` | 72 px | Baloo 2, 800 | la réponse saisie |
| `--kr-t-titre-1` | 40 px | Baloo 2, 800 | titre d'écran |
| `--kr-t-titre-2` | 30 px | Baloo 2, 800 | bouton grand, choix |
| `--kr-t-titre-3` | 24 px | Baloo 2, 800 | barre, bouton, bulle, astuce |
| `--kr-t-corps` | 20 px | Nunito, 600 | texte à lire |
| `--kr-t-petit` | 17 px | Nunito, 600 | légendes, sous-titres |
| `--kr-t-mini` | 16 px | Nunito, 700 | plancher absolu, et taille des champs de saisie (pas de zoom de Safari) |

Interligne 1,4 pour le texte, 1,1 pour les titres. Les nombres prennent `font-variant-numeric: tabular-nums` pour ne pas danser pendant la saisie. Repli sans réseau : `ui-rounded` (SF Pro Rounded sur iPad), puis la police système.

### 2.6 Espacements, rayons, cibles, relief

- **Espacements**, base 4 : `--kr-e-1` 4, `-2` 8, `-3` 12, `-4` 16, `-5` 24, `-6` 32, `-7` 48, `-8` 64 px. Au moins 12 px entre deux cibles voisines.
- **Rayons** : `--kr-r-petit` 12, `-moyen` 18, `-grand` 26 px, `-pilule` 999 px.
- **Cibles** : `--kr-cible` 56 px (minimum de tout ce qui se touche), `--kr-cible-grande` 72 px (bouton grand, choix), `--kr-touche` 88 px sur iPad et 76 px sur téléphone (pavé).
- **Relief** : `--kr-relief-haut` 6 px, un bord plein sous ce qui s'appuie. Les cartes n'ont qu'une ombre légère (`--kr-ombre-carte`).

### 2.7 Mouvement : court, utile, coupé si l'iPad le demande

| Token | Valeur | Usage |
|---|---|---|
| `--kr-d-appui` | 90 ms | l'enfoncement d'un bouton |
| `--kr-d-retour` | 220 ms | l'apparition d'un retour, d'un fond |
| `--kr-d-fete` | 600 ms | saut de la mascotte, case qui monte |
| `--kr-courbe` | rebond léger | apparitions |

Rien ne clignote ni ne bouge en continu pendant une question, sauf le curseur de saisie. Avec `prefers-reduced-motion`, toutes les animations sont réduites à un instant : l'état final s'affiche, les couleurs changent toujours.

## 3. Composants

Chaque composant se voit dans ses états dans `composants.html`. Les états passent par des attributs ARIA quand ils existent (`aria-pressed`, `aria-selected`, `aria-checked`, `aria-disabled`), sinon par `data-etat`.

### Barre de module `kr-barre`
- **Usage** : en haut de chaque écran d'un module : retour (`kr-btn-icone`, 56 px), mascotte taille S, titre, une marque facultative, le son.
- **États** : titre coupé par des points de suspension s'il est trop long.
- **À éviter** : plus de deux icônes à droite ; un retour en bas de page (le planisphère le fait).

### Bouton `kr-btn`
- **Usage** : principal (couleur forte de l'enfant), `--secondaire` (papier et relief), `--discret` (lien souligné, pour « Je passe »), `--grand` (72 px), `--tuile` (pleine largeur, avec `kr-btn__sous` pour une précision).
- **États** : repos, appuyé (`:active` ou `.est-appuye` : il s'enfonce), désactivé (`disabled`), focus clavier.
- **À éviter** : deux boutons principaux sur un écran ; un verbe vague (« OK ») ; un bouton rouge.

### Bouton icône `kr-btn-icone`
- **Usage** : retour, haut-parleur, zoom. Toujours un `aria-label`.
- **États** : repos, appuyé, activé (`aria-pressed="true"`).
- **À éviter** : une icône sans texte pour une action rare ou ambiguë.

### Sélecteur de mode `kr-segments`
- **Usage** : deux à quatre modes d'un même module (Apprendre, Glisser, Toucher).
- **États** : `aria-selected="true"` sur le mode actif.
- **À éviter** : plus de quatre segments ; s'en servir pour naviguer entre modules.

### Puce de filtre `kr-puce`
- **Usage** : choisir ce qu'on révise (continents, océans, tables).
- **États** : `aria-pressed="true"` : couleur douce, bord fort et coche.
- **À éviter** : des puces de moins de 56 px (celles du planisphère font 33 px).

### Carte `kr-carte` et marque `kr-marque`
- **Usage** : la carte regroupe une information à lire (fin de séance, coin parent). La marque est une étiquette courte (« Nouveau », « 2 sur 3 », un résultat fragile).
- **États** : carte neutre, `--enfant` (teintée), `--compacte` ; marque neutre, `--accent`, `--revoir`, `--juste`.
- **À éviter** : rendre une carte entière cliquable sans relief ; une marque de plus de trois mots.

### Mascotte `kr-mascotte`
- **Usage** : la mascotte guide, félicite et rassure. Tailles : `data-taille="s"` 48 px (barre), `"m"` 120 px (à côté d'une bulle), `"l"` 220 px (accueil, fin de séance ; 150 sur téléphone), `"xl"` 300 px (fête, icône ; 180 sur téléphone).
- **Humeurs** (`data-humeur`) : `accueil` (ouverture, consigne), `ecoute` (pendant une question, discrète), `bravo` (bonne réponse, petit saut), `encourage` (« à revoir », regard bienveillant, jamais triste), `fete` (record, notion débloquée, fin de séance), `repos` (rien de dû aujourd'hui).
- **Emplacement réservé** : un `div.kr-mascotte` affiche un ovale en pointillés à la couleur de l'enfant. Quand les dessins existent : `<img class="kr-mascotte" data-taille="m" data-dossier="../commun/mascottes/" alt="Moussi">`, et `KR.mascotte(el, 'bravo')` charge `henri-bravo.png`. Six images par mascotte, fond transparent, cadrage identique (pieds en bas), 600 × 696 px pour couvrir la taille XL en Retina.
- **À éviter** : une mascotte qui bouge pendant que l'enfant réfléchit ; une humeur triste ou déçue ; la mascotte de l'autre enfant.

### Bulle `kr-bulle` et dialogue `kr-dialogue`
- **Usage** : la mascotte parle. La pointe vise la mascotte ; `kr-dialogue--haut` pose la bulle au-dessus (portrait, écran étroit). Un bouton `kr-bulle__ecouter` lit le texte (`KR.lire`).
- **États** : texte seul, texte avec mot fort (`<b>` en couleur de l'enfant).
- **À éviter** : plus de deux phrases ; une bulle sans haut-parleur ; une bulle pendant la question.

### Question `kr-question`, trou `kr-trou`, réponse `kr-reponse`
- **Usage** : la question en très grand ; le trou marque le nombre caché ; la réponse affiche ce que l'enfant tape.
- **États de la réponse** (`data-etat`) : `vide` (pointillés, « ? »), `saisie` (curseur), `juste` (vert et coche), `revoir` (miel). Le trou : vide (pointillés) ou `est-rempli`.
- **À éviter** : un champ `<input>` natif (le clavier de l'iPad couvre l'écran) ; une question de moins de 64 px.

### Pavé numérique `kr-pave` et `kr-touche`
- **Usage** : `KR.pave(conteneur, { afficheur, max, onValider })` construit les douze touches (7 8 9 en haut, effacer, 0, valider en bas) et branche aussi le clavier physique.
- **États** : touche appuyée, valider en couleur de l'enfant, pavé éteint (`activer(false)`) pendant un retour.
- **À éviter** : déplacer le pavé d'un écran à l'autre ; valider automatiquement à la saisie (l'enfant doit pouvoir se corriger).

### Choix `kr-choix`
- **Usage** : oui ou non, ou deux à quatre propositions.
- **États** : repos, choisi (`aria-pressed`), après correction `data-etat="juste"` (coche), `"revoir"` (miel), `"attenue"` (les autres).
- **À éviter** : colorer « Oui » en vert et « Non » en gris avant la réponse (la maquette des tables le fait : la couleur souffle la réponse).

### Retour `kr-retour`, zone `kr-zone-retour`, astuce `kr-astuce`
- **Usage** : après une réponse, la zone de question se teinte (`data-etat="juste"` ou `"revoir"`), un retour court s'affiche (« ✓ Bravo ! », « ⚡ Rapide ! », « Presque ! Regarde bien : »), puis l'astuce de la notion.
- **États** : `juste`, `rapide`, `revoir`.
- **À éviter** : « Faux », « Non », « Raté » ; répéter la mauvaise réponse ; un retour qui dure plus d'une seconde quand c'est juste.

### Avancement `kr-points`, jauge `kr-jauge`, semaine `kr-semaine`
- **Usage** : les points montrent la séance (une vingtaine de questions) ; la jauge montre un avancement global (`--kr-valeur: 40%`) ; la semaine montre les jours d'entraînement (`KR.jours.dessiner(el)`).
- **États des points** : à venir, `fait`, `revu` (une erreur reprise, en miel), `courant`.
- **À éviter** : un compte à rebours visible pendant l'entraînement ; une série de jours d'affilée qui retombe à zéro.

### Niveau `kr-niveau` et grille `kr-grille`
- **Usage** : le niveau qualifie un résultat ; la grille montre tous les résultats d'un coup (table de Pythagore, carte des continents découpée). `--kr-g-colonnes` règle le nombre de colonnes ; `kr-case--entete` pour les en-têtes.
- **États** : `data-niveau` 0 à 3, case choisie (`aria-pressed`), `vient-de-monter` (animation de fin de séance).
- **À éviter** : un pourcentage à la place des niveaux ; une case grise qui affiche un nombre (elle n'est pas encore sue).

### Chemin des notions `kr-chemin`
- **Usage** : les notions dans l'ordre où elles s'ouvrent (familles de tables, chapitres de conjugaison).
- **États** (`data-etat`) : `fait` (or), `encours` (couleur forte et halo), `ferme` (gris, cadenas).
- **À éviter** : plus de six étapes visibles ; une étape fermée qui ne dit pas ce qui l'ouvre (le dire dans une bulle quand l'enfant la touche).

### Chrono `kr-chrono` et records `kr-records`
- **Usage** : seulement dans un défi. Le chrono se vide (`--kr-avance` de 0 à 1) ; les barres montrent les cinq derniers scores de l'enfant, le dernier en couleur forte.
- **À éviter** : le chrono pendant l'entraînement ; le score de l'autre enfant ; un commentaire sur un défi sans record (« 21, ton record reste 26 » suffit).

### Étiquette à glisser `kr-etiquette`
- **Usage** : glisser un nom sur une carte ou une image (le planisphère). Toucher puis toucher la cible doit aussi marcher.
- **États** : repos, `est-choisie`, `est-source` (pendant le glisser), `est-fantome` (la copie sous le doigt), `est-posee`, `est-a-revoir` (elle hésite, sans secousse).
- **À éviter** : un glisser obligatoire sans alternative au toucher.

### Interrupteur `kr-interrupteur`
- **Usage** : réglages simples (son, lecture à voix haute). `role="switch"` et `aria-checked`.
- **À éviter** : un interrupteur sans libellé à côté.

### Appui long `kr-appui-long`
- **Usage** : l'entrée du coin parent. `KR.appuiLong(el, 1500, ouvrir)` : la barre se remplit pendant l'appui.
- **À éviter** : un code ou une opération à résoudre (les enfants de cet âge les résolvent, et cela ressemble à un exercice).

### Tuile de module `kr-tuile-module`
- **Usage** : une tuile par module dans le portail de l'enfant : icône, titre, matière et progrès en une ligne, jauge, et une marque « Nouveau » quand il y a lieu.
- **États** : repos, appuyé, bientôt (`aria-disabled="true"` : pointillés).
- **À éviter** : plus de six modules ouverts à la fois ; une tuile qui affiche une note.

### Annonce `kr-annonce`
- **Usage** : `KR.annoncer('3 cases montent en argent !')` affiche un court message en bas et le fait lire par VoiceOver (`aria-live`).
- **À éviter** : s'en servir pour une erreur ; l'empiler.

## 4. Modèles réutilisables d'un module éducatif

Chacun est montré à la taille de l'iPad 9e génération (1080 × 810) dans `composants.html`, section « Modèles d'écran », avec la question en portrait (810 × 1080) et trois écrans sur iPhone (402 × 874).

### Écran de question
`kr-ecran-question` : la zone de question à gauche, le pavé à droite en paysage ; en portrait et sur téléphone, la question en haut et le pavé en bas (bascule automatique). Sur l'iPad en paysage, le pavé occupe 360 points de large et la question 720. Barre en haut avec mascotte S en humeur `ecoute` et haut-parleur qui lit la question. Les points d'avancement en haut de la zone. Rien d'autre.

### Retour juste et retour à revoir
- **Juste** : zone teintée de vert, réponse en `juste`, « ✓ Bravo ! » (et « ⚡ Rapide ! » sous le seuil de temps), son `juste`, mascotte `bravo`, puis question suivante seule après 600 ms. Pavé éteint pendant ce temps.
- **À revoir** : zone teintée de miel, son `revoir`, mascotte `encourage`, « Presque ! Regarde bien : », la bonne écriture complète (« 7 × 8 = 56 »), l'astuce, puis la réponse se vide et l'enfant retape la bonne réponse avant de continuer. La question revient plus loin dans la séance. Point d'avancement en `revu`.

### Fin de séance
`kr-ecran-centre` : mascotte XL en `fete`, « Bravo Henri ! », puis trois cartes au plus, dans cet ordre : ce qui a progressé (cases montées, avec leur niveau), la semaine, ce qui revient demain. Deux boutons : « Voir ma grille » (principal) et « Fini pour aujourd'hui ». Son `monte` pendant que les cases s'animent. Pas de note sur 20.

### Carte de progression
La grille de maîtrise à gauche, la légende des quatre niveaux et la fiche de la case touchée à droite (résultat, niveau, astuce). Dans un autre module, la grille devient la carte des continents ou le tableau des terminaisons : même logique de niveaux.

### Découverte d'une notion
Trois écrans au plus, numérotés dans la barre (« 2 sur 3 »). À gauche le visuel qui montre (rectangle de points, carte zoomée) ; à droite la bulle de la mascotte, puis l'astuce encadrée, puis « Suivant ». On s'entraîne sur la notion tout de suite après. Son `debloque` à l'ouverture d'une nouvelle notion.

### Défi
Ouvert seulement quand la justesse est installée. Chrono à gauche, question et réponse au centre, « Je passe » en bouton discret, pavé à droite. Pas de son d'erreur pendant le défi. Fin : le score, le record d'avant, les cinq dernières barres ; son `record` et mascotte `fete` seulement en cas de record.

### Coin parent
Ouvert par appui long depuis le portail. **Un seul enfant par app**, donc jamais de comparaison. À gauche, des phrases par module : régularité de la semaine, ce qui est devenu automatique, ce qui reste fragile (en marques miel, « à poser en voiture »). À droite : réglages (son, lecture à voix haute) et sauvegarde (`KR.exporter()` et `KR.importer()`), puisque supprimer l'icône efface la progression.

### Accueil d'un module
Barre commune, mascotte L et récompense visible (mini grille, semaine) à gauche, une tuile principale (« ▶︎ Entraînement du jour ») et deux tuiles secondaires à droite.

## 5. Ossature d'une page de module et d'un portail d'enfant

### Arborescence (celle du `PLAN.md`, section 3 bis)

```
revisions/
  index.html                  page des parents
  commun/
    kit.css  kit.js
    polices/                  Baloo 2 et Nunito en woff2 (recommandé, voir § 7)
    mascottes/                henri-accueil.png ... clara-fete.png
  modules/tables/tables.js    moteur d'un module, écrit une fois
  henri/
    index.html                portail d'Henri
    manifest.webmanifest
    icone-180.png             Moussi
    planisphere.html  tables.html
  clara/                      même chose avec Pooh Bear
```

### Portail d'un enfant (`henri/index.html`)

```html
<!doctype html>
<html lang="fr" data-enfant="henri" data-module="portail">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Révisions d'Henri</title>
<meta name="apple-mobile-web-app-title" content="Henri">
<meta name="theme-color" content="#6DB86A">
<link rel="apple-touch-icon" href="icone-180.png">
<link rel="manifest" href="manifest.webmanifest">
<link rel="stylesheet" href="../commun/kit.css">
</head>
<body class="kr">
  <div class="kr-page">
    <main class="kr-page__corps">
      <!-- mascotte L, titre, kr-semaine, puis une kr-tuile-module par module -->
      <!-- en bas à droite : button.kr-appui-long « Coin parent » -->
    </main>
  </div>
  <script src="../commun/kit.js"></script>
</body>
</html>
```

Le manifeste porte `"name": "Révisions d'Henri"`, `"short_name": "Henri"`, `"start_url": "/revisions/henri/"`, `"scope": "/revisions/henri/"`, `"display": "standalone"`, `"background_color": "#F3F6F2"`, `"theme_color": "#6DB86A"`.

### Page de module (`henri/tables.html`, page fine)

```html
<!doctype html>
<html lang="fr" data-enfant="henri" data-module="tables">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Mes tables</title>
<link rel="stylesheet" href="../commun/kit.css">
</head>
<body class="kr">
  <div class="kr-page">
    <header class="kr-barre">
      <a class="kr-btn-icone" href="./" aria-label="Retour à mes révisions">‹</a>
      <div class="kr-mascotte" data-taille="s" data-humeur="accueil"></div>
      <div class="kr-barre__titre">Mes <span>tables</span></div>
      <button type="button" class="kr-btn-icone" aria-label="Son">🔊</button>
    </header>
    <main id="ecran" class="kr-jeu"><!-- le moteur du module dessine ici --></main>
  </div>
  <script src="../commun/kit.js"></script>
  <script src="../modules/tables/tables.js"></script>
</body>
</html>
```

Le moteur lit l'enfant et le module par `KR.enfant()` et `KR.module()` ; il n'écrit jamais un prénom ni une couleur en dur.

## 6. Son, voix et stockage

- **Sons** (`KR.son(nom)`) : `touche`, `juste`, `revoir`, `monte`, `debloque`, `record`, tous fabriqués par Web Audio, courts et sans grave. Safari ne joue un son qu'après un premier geste : `kit.js` débloque l'audio au premier appui. Le bouton muet est mémorisé par enfant (`KR.sonActif`). Le Web Audio suit l'interrupteur silencieux de l'iPad : c'est voulu.
- **Voix** (`KR.lire(texte)`) : voix française du navigateur, débit 0,9.
- **Stockage** (`KR.stock.lire/ecrire/maj`) : clé `enfant.module.cle` (`henri.tables.progression`), valeur en JSON, chaque accès protégé par `try/catch` ; une erreur de stockage ne bloque jamais le jeu. Les jours d'entraînement vont dans `henri.commun.jours`, les réglages dans `henri.reglages.*`. `KR.exporter()` rend tout ce qui commence par `henri.` en un texte JSON, `KR.importer(texte)` le recharge.

## 7. Écarts à corriger (propositions seulement)

### Dans la maquette des tables (`archive/mockup_ecrans_2026-11-01.html`)

| Écart | Proposition |
|---|---|
| Police Fredoka, fond crème `#FFF8EC`, ours rouge `#E4572E`, koala eucalyptus `#2A9D8F` | Baloo 2 et Nunito, tokens `--kr-*` : Clara en violet, Henri en vert |
| Koala dessiné en SVG pour l'enfant en CM1 | Moussi, la souris, en emplacement réservé jusqu'aux dessins ; ours dessiné : remplacé de même |
| Écran A « Qui joue aujourd'hui ? » | Supprimé : chaque app sait déjà quel enfant l'ouvre |
| Série « 🔥 5 jours de suite » | `kr-semaine` : les jours faits de la semaine, sans série qui retombe à zéro |
| Écran F : « Presque ! Ce n'est pas 54. » | « Presque ! Regarde bien : », sans répéter la mauvaise réponse |
| Écran G : « Oui » en vert, « Non » en gris avant la réponse | Deux `kr-choix__option` neutres ; la couleur vient après la correction |
| Écran H : « 18 bonnes réponses sur 20 » | Retirer : ce qui progresse et la semaine suffisent |
| Écran N : l'ours et le koala côte à côte dans un même coin parent | Un coin parent par app, un seul enfant |
| Boutons retour et icônes à 48 px, barre de 72 px | 56 px, barre de 80 px |
| Bonne réponse en orange `#D9782D` sur l'erreur | `--kr-revoir-fort` sur `--kr-revoir-doux` |
| Styles en ligne pour chaque écran | Classes du kit et modèles de la section 4 |

### Dans le planisphère (`henri/planisphere.html`)

| Écart | Proposition |
|---|---|
| Rouge pour l'erreur : `--bad` `#D64545`, continent qui flashe en rouge, point rouge, message rouge | Miel `--kr-revoir` pour le flash, le point et le message |
| « Non, là c'est l'Afrique » et « Oups ! » | « Là, c'est l'Afrique. Cherche l'Asie ! » |
| Étiquette qui secoue (`shake`) | `kr-etiquette.est-a-revoir` : elle hésite |
| Onglets à 37 px, puces à 33 px, zoom à 13 px de texte, bouton à 40 px, étiquettes à 40 px | `kr-segments`, `kr-puce`, `kr-btn-icone` ou `kr-puce` pour le zoom, `kr-btn`, `kr-etiquette` : 56 px |
| Textes à 14 px (`.tip`, `.lbl` en capitales espacées, `.rotate`) | 17 px au moins, sans capitales |
| Clés de stockage sans préfixe (`mode`, `filter`, `best-drag-all`) | `KR.stock` : `henri.planisphere.mode`, etc. ; reprendre les anciennes valeurs une fois |
| Retour au portail par un petit lien en bas de page | `kr-barre` en haut, bouton retour de 56 px |
| Onglet « Cliquer » | « Toucher » sur iPad |
| Fin de partie de une à trois étoiles selon le premier coup | Garder le record, remplacer une étoile seule par ce qui a été trouvé pour la première fois |
| Pas de son ni de mascotte | `KR.son('juste')` et `KR.son('revoir')`, bulle de Moussi dans le mode Apprendre |
| `<link>` des polices et `<meta>` dans le `<body>` | Les remonter dans le `<head>` |
| Étiquettes de la carte à 10 px en vue monde | 13 px au moins, le zoom Europe fait le reste |

### Dans la page des parents (`index.html`)

- Les liens de module deviennent des `kr-tuile-module` ; la page garde le thème familial (sans `data-enfant`).
- Elle ne peut pas montrer la progression des enfants : chaque app de l'écran d'accueil a son propre stockage, invisible depuis Safari. Le suivi se lit dans le coin parent de chaque app.

## 8. Changements par rapport aux choix de la maman, et pourquoi

- **Gardés tels quels** : Baloo 2 et Nunito, fond, papier, encre, traits, accent orange, palette sombre complète, vert d'Henri et violet de Clara comme couleurs d'identité, mécanique `data-theme`.
- **Ajout d'une version forte par couleur** : du texte blanc sur le vert `#6DB86A` n'atteint que 2,4:1, sur le violet `#9B86D0` 3,1:1, sur l'accent 3,3:1, sous le 4,5:1 attendu pour un lecteur fragile. Le bouton principal prend donc `#2A7327` (5,9:1) ou `#6548A8` (6,9:1).
- **Bouton principal en couleur de l'enfant plutôt qu'en orange** : l'app est la sienne ; l'orange reste la marque familiale et signale ce qui est nouveau ou exceptionnel (record, « Nouveau », « Rapide »).
- **Rouge retiré** : remplacé par le miel « à revoir » (principe 4).
- **Tailles relevées** : 56 px de cible, 16 px de plancher pour le texte.

## 9. Questions qui restent aux parents

1. Remplacer la série de jours d'affilée par la semaine de régularité ? Recommandé : oui.
2. Garder « ⚡ Rapide ! » pendant l'entraînement ? Il récompense l'automatisme visé, pas une course ; recommandé : oui, discret.
3. Héberger les polices dans `commun/polices/` plutôt que chez Google Fonts ? Recommandé : oui (l'app s'ouvre même sans réseau, et aucune requête ne part vers Google).
4. La lecture à voix haute des questions : active par défaut, ou à activer dans le coin parent ?
5. Un enfant gaucher ? Le pavé passerait à gauche pour lui.
6. « Pooh Bear » est le nom anglais de Winnie l'ourson : il convient pour l'usage familial, mais le dépôt est public ; un surnom propre au doudou éviterait la question.
