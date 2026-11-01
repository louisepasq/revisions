# Module « De l'univers à Éguilles » : contenu, cartes, géométrie et moteur séparés, une interface aux trois formats

La pédagogie, le contenu par enfant, les sources et les licences sont dans [`docs/zoom/PLAN.md`](../../docs/zoom/PLAN.md) ; la décision dans [`docs/DECISIONS.md`](../../docs/DECISIONS.md) (D-17) ; le design dans [`docs/design-system/DESIGN-SYSTEM.md`](../../docs/design-system/DESIGN-SYSTEM.md).

## Architecture : cinq fichiers, sans bibliothèque ni build

| Fichier | Rôle | Dépend de |
|---|---|---|
| `contenu.js` | `window.ZoomContenu` : les sept étapes, chaque lieu (nom avec son article, groupe, niveau d'Henri et de Clara, repère, information), les phrases dites (`PHRASES.toucher`, `voici`, `cest`), `programme(enfant)` pour le moteur | rien |
| `cartes.js` | `window.ZoomCartes` : les tracés de chaque étape, en entiers dans un viewBox de 1000 de large. **Fabriqué** par `outils/cartes.py`, ne pas le modifier à la main | rien |
| `geometrie.js` | `window.ZoomGeo` : chemins SVG et « le doigt a-t-il touché ce lieu ? » (marges en pixels d'écran, mers hors des terres, point voisin désigné) | rien |
| `moteur.js` | `window.Zoom` : boîtes de Leitner par lieu et par type de question, découvertes, étapes qui s'ouvrent, séance, choix des noms, bilan, stockage `<enfant>.zoom`. **Générique** : il ne connaît que le programme qu'on lui passe | rien |
| `zoom.js`, `zoom.css` | l'interface : accueil et étapes, grand voyage, exploration, séance, fin | `commun/textes.js`, `commun/kit.js` et les quatre fichiers ci-dessus |
| `henri/zoom.html`, `clara/zoom.html` | pages fines qui posent `data-enfant` et chargent le tout, avec `commun/sync.js` et `commun/synchro-page.js` | |

L'état d'un enfant : `{ version, cartes: { 'mars|toucher': { boite, vu, prochain, justesJours, erreurs }, … }, etages, jours, intro }`. La sauvegarde en ligne passe par `commun/synchro-page.js` (objet `Zoom`) et la fusion `fusionZoom` de `lib/fusion.js`, recopiée dans `commun/sync.js`.

## Changer le contenu ou les cartes

- **Un lieu** : une ligne dans `contenu.js`, et son tracé sous le même identifiant dans `outils/cartes.py` ; `geometrie.test.js` vérifie que chaque lieu a son tracé et inversement.
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
- `test_parcours.py` : aux trois formats (iPad paysage 1080 × 810, iPad portrait 810 × 1080, iPhone 402 × 874), la carte du portail, le premier lancement de Clara (grand voyage, Skip, adresse dans l'univers lue), une séance complète avec une erreur volontaire (surbrillance, épingle, repère, « Voici … » dit, retouche), la fin, l'accueil, l'exploration (Aix touchée et nommée, Zoom in vers les Bouches-du-Rhône), puis une séance avancée d'Henri sur six étapes avec des questions « nommer », en clair et en mode soir. Il échoue sur toute erreur JavaScript, tout débordement horizontal et toute cible de moins de 44 px. Les captures vont dans `captures/` (ignoré par git) : les regarder après chaque changement.

## Ce qui reste à faire

- **Sur l'iPad lui-même** : le toucher des petits lieux à la main d'un enfant, la voix française, la fluidité du zoom sur un iPad 9e génération.
- Les écrans de parole et de fin reprennent la forme de ceux des tables, recopiée dans `zoom.css` : à remonter dans `commun/kit.css` quand un troisième module en aura besoin.
- Publier le résumé `resume` de D-19 quand le portail en cahiers existera.
- Les types de questions 3 et 4 de la relecture, la réponse sans proposition, le planisphère de Louise comme étape « La Terre » (`docs/zoom/PLAN.md`, section 5).
