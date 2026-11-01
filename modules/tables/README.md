# Module des tables : moteur testé, séance, album à tampons, interface aux trois formats

La pédagogie et les décisions sont dans [`docs/tables/PLAN.md`](../../docs/tables/PLAN.md) ; le design dans [`docs/design-system/DESIGN-SYSTEM.md`](../../docs/design-system/DESIGN-SYSTEM.md).

## Architecture : trois couches, sans bibliothèque ni build

| Fichier | Rôle | Dépend de |
|---|---|---|
| `moteur.js` | `window.Tables` : boîtes de Leitner par résultat, familles d'Eduscol, quatre types de questions, astuces, diagnostic, semaine, **règles des tampons** (`tamponner`, `estOr`, `aRevoir`, `migrer`), stockage (`<enfant>.tables`) | rien |
| `seance.js` | `window.Seance` : déroulé d'une séance, erreur à retaper, retour de la question ratée trois questions plus loin, bilan (tampons de la séance, cartes dorées retrouvées) | `moteur.js` |
| `album.js` | `window.Album` : l'album vu par l'enfant, logique pure : cartes, pages par famille, cartes les plus proches de l'or, bilan du jour, carte qui revient demain, état des cases de la grille | `moteur.js` |
| `resume.js` | `window.TablesResume` : le résumé publié pour le portail (D-19, contrat dans `docs/ARCHITECTURE.md`, section 8) : tampons et or, cartes qui reviennent, jours pratiqués, phrase du coin parent ; testé dans `test/resume.test.js` | `moteur.js`, `album.js`, `commun/textes.js` |
| `tables.js`, `tables.css` | l'interface : accueil du module, diagnostic, séance, fin, album, grille en bascule ; publie le résumé à l'accueil et en fin de séance | `commun/textes.js`, `commun/kit.js`, `kit.css` |
| `henri/tables.html`, `clara/tables.html` | pages fines qui posent `data-enfant` et chargent le tout | |

Le parcours : au premier lancement, le diagnostic (questions de `Tables.questionsDiagnostic`, 60 secondes au plus, aucun chrono visible, « Skip » compté comme non su), puis `Tables.appliquerDiagnostic`, et « Let's go » enchaîne sur la première séance. Ensuite, l'accueil propose « Today's practice » (une séance de `Seance`, la carte dit combien de questions, la semaine et le résultat qui revient aujourd'hui) et « My cards », l'album. La grille de Pythagore s'ouvre depuis l'album (« See as a grid »). La progression est sauvée après chaque réponse ; « Back » en pleine séance demande « Stop for today? ».

## L'album à tampons (D-20) : une carte par paire, un tampon par jour, l'or au quatrième

Les 36 paires de 2 à 9 sont des cartes (7 × 8 et 8 × 7 sur la même), rangées en six pages, une par famille, dans l'ordre d'Eduscol. Les règles vivent dans `moteur.js` et sont testées dans `album.test.js` :

- **Un tampon entier par jour et par carte** quand un fait de la paire sort juste et monte de boîte ce jour-là (`enregistrer` rend `tampon`) ; un diagnostic juste en pose un aussi.
- **L'or, au quatrième tampon**, un autre jour : à une révision prévue (le fait était dû), juste et rapide, avec les deux sens en boîte 4 ou plus. Il tombe aussi sur un fait déjà en boîte 5, pour qu'aucune carte ne reste bloquée à trois tampons.
- **La boîte 4 ne se gagne qu'à une révision prévue**, et une réponse hors programme qui ne fait rien monter ne repousse pas la date prévue (relecture de la progression, proposition 1).
- **Les tampons ne redescendent jamais** et ne s'échangent contre rien. Une carte dorée qui retombe (erreur) garde son or et affiche « Comes back tomorrow » (« Comes back today » les jours suivants) jusqu'à ce que le fait soit retrouvé ; la fin de séance dit alors « 2 × 2 is back on track ». Le coin parent garde l'état réel (boîtes).
- **Les familles s'ouvrent selon les boîtes réelles** (`majFamilles`), jamais selon les tampons ; une famille fermée est en pointillé, jamais cadenassée.
- **Au plus quatre faits nouveaux par jour**, toutes séances comprises : chaque fait garde son premier jour (`debut`), que `seance()` compte. Le diagnostic n'entame pas ce quota.
- **Rien n'annonce qu'une carte peut dorer aujourd'hui** : l'or se découvre en fin de séance.

Les données : `faits['7x8'].tampons` (jours de tampon de la carte, rangés dans le fait écrit petit facteur d'abord) et `faits[k].debut` ; l'état passe en `version: 2`. Une progression d'avant l'album se convertit au chargement (`migrer`) : les jours justes des deux sens (`justesJours`) donnent jusqu'à trois tampons, et le quatrième si les deux sens sont en boîte 4 ; rien d'autre ne change. La sauvegarde en ligne réunit les jours de tampon et garde le premier jour le plus ancien (`lib/fusion.js` et `commun/sync.js`, identiques).

La grille en bascule montre les mêmes données que l'album (proposition 8 de la relecture) : une case par carte selon ses tampons (Starting, Nearly there à trois tampons, or, or du jour) ; les lignes 1 et 10, hors album, gardent leurs boîtes.

## Voix : chaque question lue, chaque fait juste dit (décision de Louis du 01/11/2026)

- **Active par défaut** (`voix: true` dans les réglages de `commun/kit.js`) ; le coin parent peut la couper.
- **Chaque question est lue dès qu'elle s'affiche**, en français (voix fr-FR), diagnostic compris : « neuf fois cinq », « sept fois combien font cinquante-six ? », « quarante-huit, c'est quel produit ? », « quarante-huit est-il un multiple de six ? ». La première parle dans le geste qui lance la séance ou le diagnostic, comme l'exige Safari iOS.
- **Une réponse juste fait dire le fait complet** : « neuf fois cinq, quarante-cinq » (pour une décomposition, le produit que l'enfant a donné). La question suivante attend la fin de la phrase (`onend`, 6 secondes au plus) et la jauge de Next ; Next la passe à tout moment.
- **Une erreur** : après la correction, la voix dit le fait juste ; la retape juste le redit.
- Les phrases viennent de `Tables.questionDite` et `Tables.faitDit`, **toujours en toutes lettres** (`Tables.enLettres`), jamais avec le signe × ; `KR.lireSuite` annule toujours l'énoncé précédent, une seule voix à la fois, et rend une promesse tenue à la fin de la lecture.
- Listen relit la question ; sur l'écran d'erreur, il lit la bulle de la mascotte (langue du cadre), le fait juste puis l'astuce.

## Langues

Le cadre (boutons, bulles de la mascotte, fins de séance) suit la langue de l'enfant, anglais par défaut ; le contenu scolaire (questions, consignes, Oui et Non, astuces et leur étiquette) reste en français ; le coin parent est toujours en français (`t(cle, valeurs, 'fr')`). La règle est écrite en tête de `commun/textes.js`. « Est-il un multiple de » pour Clara (CM2, vocabulaire d'Eduscol), « est-il dans la table de » pour Henri (CM1) : `classe` dans `KR.infos()`.

## Tester : deux tests de logique, un parcours au rendu réel

```sh
node modules/tables/moteur.test.js
node modules/tables/seance.test.js
node modules/tables/album.test.js
uv run modules/tables/test_parcours.py
```

Le parcours sert le dépôt en local et pilote Chrome (Playwright) aux formats iPad paysage (1080 × 810), iPad portrait (810 × 1080) et iPhone (402 × 874) : portails d'Henri et de Clara, coin parent (appui long, export, remise à zéro, import), puis le module de Clara de bout en bout (diagnostic au pavé, séance avec une erreur volontaire retapée, fin, album, bascule vers la grille), un album avancé (accueil avec les trois cartes les plus proches de l'or, carte dorée retombée qui « revient », famille fermée, séance où 5 × 2 dore à sa date, fin avec les tampons du jour et la carte retrouvée, grille qui montre la carte dorée du jour) et une séance avancée qui montre les quatre types de questions. Il échoue sur toute erreur JavaScript, tout débordement horizontal ou tout produit affiché dans la grille hors de la case touchée. Il espionne aussi la voix (`speechSynthesis.speak` remplacé, chaque énoncé terminé aussitôt) : la question du diagnostic et la première de la séance doivent être lues, chaque réponse juste à un produit ou à un facteur manquant doit faire dire le fait, une erreur aussi, et aucune phrase ne contient le signe ×. Il vérifie encore les six onglets de l'album (familles fermées en pointillé, aucun cadenas, 36 cartes), l'absence de « can turn gold today », la relance de « 1 × 24 », la confirmation de Back, la légende de la grille sur 36, le coin parent en français et l'écran juste de 10 × 10 aux trois formats. Les captures vont dans `captures/` (ignoré par git) : les regarder après chaque changement d'interface.

## Ce qui reste à faire

- **Sur l'iPad lui-même** : la voix française et anglaise, les sons après le premier toucher, la conservation de la progression une fois l'app posée sur l'écran d'accueil, l'icône et le nom sous l'icône, l'export (feuille de partage de Safari) et l'import (app Fichiers).
- « Défi 1 minute » et « Découvrir une famille » : plus affichés sur l'accueil du module depuis l'album (la maquette retenue n'en a pas), à remettre quand ils seront construits.
- **Album, à essayer avec Henri** : montrer la page des doubles et la fin de séance, et vérifier qu'il comprend « un tampon par jour » et « les deux sens ».
- **Album, pistes de la relecture non construites** : poser en priorité l'autre sens quand un sens est en boîte 3 ou plus (proposition 7) ; « You already knew these! » pour les tampons du diagnostic au lieu de les compter dans la fin de séance ; la phrase des rappels (« 18 sums came back today... ») ; le message de fin d'album ; l'animation du tampon qui se pose.
- « Practise it » depuis une case de la grille (la vitrine le montre ; il faut une séance ciblée dans `seance.js`).
- Les confusions répétées (56 et 54) qui déclenchent des questions opposant les deux résultats (PLAN, section 3).
- La séance n'est pas reprise si l'enfant quitte au milieu (Back demande confirmation) : la progression des réponses données est gardée, la file de questions repart.
- Les astuces (relecture du 01/11/2026, point 6) sont à faire valider par les maîtresses avant de les figer.
- Demander à la maîtresse d'Henri si elle emploie déjà « multiple » ; si oui, passer `classe` ou `MULTIPLE` (tables.js) à « un multiple de ».
