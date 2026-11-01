# Module « De l'univers à Éguilles » : contenu, cartes, géométrie et moteur séparés, une interface aux trois formats

La pédagogie, le contenu par enfant, les sources et les licences sont dans [`docs/zoom/PLAN.md`](../../docs/zoom/PLAN.md) ; la décision dans [`docs/DECISIONS.md`](../../docs/DECISIONS.md) (D-17) ; le design dans [`docs/design-system/DESIGN-SYSTEM.md`](../../docs/design-system/DESIGN-SYSTEM.md).

## Architecture : cinq fichiers, sans bibliothèque ni build

| Fichier | Rôle | Dépend de |
|---|---|---|
| `contenu.js` | `window.ZoomContenu` : les sept étapes, chaque lieu (nom avec son article, groupe, niveau d'Henri et de Clara, repère, information), en français (`ETAGES`) et en anglais (`EN_ETAGES`, `EN_LIEUX`, sous le même identifiant) ; `champ(lieu, 'nom', langue)`, `affiche(lieu, langue)`, les phrases dites (`PHRASES.toucher(lieu, langue)`, `voici`, `cest`), `ADRESSES`, `QUESTIONS_NOMMER`, `CONSIGNES`, `programme(enfant)` pour le moteur | rien |
| `cartes.js` | `window.ZoomCartes` : les tracés de chaque étape, en entiers dans un viewBox de 1000 de large. **Fabriqué** par `outils/cartes.py`, ne pas le modifier à la main | rien |
| `geometrie.js` | `window.ZoomGeo` : chemins SVG et « le doigt a-t-il touché ce lieu ? » (marges en pixels d'écran, mers hors des terres, point voisin désigné) | rien |
| `moteur.js` | `window.Zoom` : boîtes de Leitner par lieu et par type de question, découvertes, étapes qui s'ouvrent, séance, choix des noms, bilan, stockage `<enfant>.zoom`. **Générique** : il ne connaît que le programme qu'on lui passe | rien |
| `resume.js` | `window.ZoomResume` : le résumé publié pour le portail (D-19, contrat dans `docs/ARCHITECTURE.md`, section 8), testé dans `test/resume.test.js` | `moteur.js`, `contenu.js`, `commun/textes.js` |
| `zoom.js`, `zoom.css` | l'interface : accueil et étapes, grand voyage, exploration, séance, fin | `commun/textes.js`, `commun/kit.js` et les quatre fichiers ci-dessus |
| `henri/zoom.html`, `clara/zoom.html` | pages fines qui posent `data-enfant` et chargent le tout, avec `commun/sync.js` et `commun/synchro-page.js` | |

L'état d'un enfant : `{ version, cartes: { 'mars|toucher': { boite, vu, prochain, justesJours, erreurs }, … }, etages, jours, intro, langue }`, `langue` (`en` ou `fr`) étant facultatif : un état enregistré avant D-21 se charge sans rien perdre et le choix s'affiche au lancement suivant (`test/progression.test.js`). La sauvegarde en ligne passe par `commun/synchro-page.js` (objet `Zoom`) et la fusion `fusionZoom` de `lib/fusion.js`, recopiée dans `commun/sync.js`.

## Langue du voyage (D-21) : l'enfant choisit, anglais ou français

- **Au premier lancement**, avant le grand voyage, deux grosses cartes à drapeau, « English » et « Français ». Le choix est rangé dans l'état (`langue`), passe par la sauvegarde en ligne, et se change depuis l'accueil du module (le drapeau en haut à droite).
- **Le contenu suit le choix** : noms d'étapes et de lieux, consignes (« Touch this place on the map. »), question « nommer » (« What is this place called? »), repère de la mascotte, informations, adresse dans l'univers et voix (en-GB ou fr-FR). Noms usuels en anglais (the Milky Way, the English Channel, the Alps) ; les noms propres français sans équivalent restent tels quels (Bouches-du-Rhône, Éguilles, Mont Sainte-Victoire), les départements avec leur numéro. Les crédits des cartes restent en français.
- **Le cadre ne bouge pas** : Back, Listen, Skip, la mascotte (« Nearly! Let's look again ») suivent la langue de l'app, l'anglais par défaut.
- **La progression est commune** : un lieu su en français reste su en anglais. Le coin parent reste en français.

## Changer le contenu ou les cartes

- **Un lieu** : une ligne dans `contenu.js`, sa version anglaise dans `EN_LIEUX` (`geometrie.test.js` refuse un lieu sans anglais), et son tracé sous le même identifiant dans `outils/cartes.py` ; `geometrie.test.js` vérifie que chaque lieu a son tracé et inversement.
- **Les cartes** : `uv run modules/zoom/outils/cartes.py` télécharge les sources une fois dans `outils/cache/` (ignoré par git), puis réécrit `cartes.js` (394 Ko au 01/11/2026 ; le test refuse plus de 1,5 Mo).
- **Les voix** : toute phrase dite passe par `ZoomContenu` ; `commun/outils/phrases.js` les énumère toutes. Après un changement de texte, relancer `uv run commun/outils/voix.py tables` (la commande fabrique toutes les phrases de `phrases.js`, zoom compris). Sans fichier, la voix de l'appareil prend le relais.

## Tester : deux tests de logique, un parcours au rendu réel

```sh
node modules/zoom/moteur.test.js
node modules/zoom/geometrie.test.js
uv run modules/zoom/test_parcours.py
```

- `moteur.test.js` : séance neuve, découvertes, première réponse seule comptée, erreur en boîte 1 qui revient, une montée par jour, intervalles, or, naissance de « nommer », ouverture des étapes, ordre du zoom, noms voisins, avancement.
- `geometrie.test.js` : toucher une zone, un trou, une mer, un fleuve, un point, les marges en pixels, le point voisin désigné ; puis la cohérence du contenu et des cartes (Éguilles à l'ouest d'Aix et dans le 13, Marseille dans le 13, l'Atlantique hors de l'Afrique) et le poids des cartes.
- `test_parcours.py` : aux trois formats (iPad paysage 1080 × 810, iPad portrait 810 × 1080, iPhone 402 × 874), la carte du voyage dans le cahier d'histoire-géographie du portail, le premier lancement de Clara (choix de l'anglais, grand voyage, Skip, adresse dans l'univers lue), une séance complète en anglais avec une erreur volontaire (surbrillance, épingle, repère, « This is … » dit en en-GB, retouche), la fin, l'accueil, l'exploration (Aix touchée et nommée, Zoom in vers les Bouches-du-Rhône), le passage au français depuis l'accueil (progression inchangée, cadre resté en anglais), puis une séance avancée d'Henri partie d'un état sans langue (choix du français, progression intacte) sur six étapes avec des questions « nommer », en clair et en mode soir, voix en fr-FR. Il échoue sur toute erreur JavaScript, tout débordement horizontal et toute cible de moins de 44 px. Les captures vont dans `captures/` (ignoré par git) : les regarder après chaque changement.

## Ce qui reste à faire

- **Sur l'iPad lui-même** : le toucher des petits lieux à la main d'un enfant, les voix française et anglaise, la compréhension des consignes anglaises par Henri, la fluidité du zoom sur un iPad 9e génération.
- Les écrans de parole et de fin reprennent la forme de ceux des tables, recopiée dans `zoom.css` : à remonter dans `commun/kit.css` quand un troisième module en aura besoin.
- Les types de questions 3 et 4 de la relecture, la réponse sans proposition, le planisphère de Louise comme étape « La Terre » (`docs/zoom/PLAN.md`, section 5).
