# Jeu du nombre cible : un moteur testé, un contenu en anglais, un état publié au portail, une interface aux trois formats

Les règles sont celles d'Henri, fixées le 01/11/2026 ([`docs/DECISIONS.md`](../../docs/DECISIONS.md), D-18) ; le design suit [`docs/design-system/DESIGN-SYSTEM.md`](../../docs/design-system/DESIGN-SYSTEM.md) ; la relecture est dans [`docs/revues/2026-11-01_relecture-cible.md`](../../docs/revues/2026-11-01_relecture-cible.md).

## Architecture : quatre scripts sans bibliothèque ni build

| Fichier | Rôle | Dépend de |
|---|---|---|
| `moteur.js` | `window.Cible` : barème (`POINTS`, `COUP_PARFAIT` 13, `COUT_INDICE` 3, `CIBLE_MAX` 99), `tirer(graine, scoreMin)`, `resoudre`, partie (`nouvellePartie`, `jouer`, `annuler`, `scorePartie`, `indice`). Logique pure | rien |
| `contenu.js` | `window.CibleContenu` : consignes, explications et étiquettes de la mascotte, en anglais britannique et en français (`LANGUES.en`, `LANGUES.fr`, `de(langue)`). `DIT` est ce que la voix dit, mot pour mot ; `AFFICHE` la même idée avec les nombres du calcul ; `refus(a, op, b)` donne la raison d'un coup refusé | rien |
| `etat.js` | `window.CibleEtat` : l'état sous `<enfant>.cible`, `charger` et `sauver` (l'objet `CibleEtat` du catalogue, que `commun/synchro-page.js` enveloppe), la semaine, et `resume(etat, date)`, le résumé publié au portail | `commun/textes.js` |
| `cible.js`, `cible.css` | l'interface : accueil du jeu (barème, choix du chrono), partie, fin de partie | `commun/textes.js`, `commun/kit.js` et les trois fichiers ci-dessus |
| `henri/cible.html`, `clara/cible.html` | pages fines qui posent `data-enfant` et chargent le tout, avec `commun/modules.js`, `commun/sync.js` et `commun/synchro-page.js` | |

## Le jeu, tel qu'il se joue

- **Accueil** : la mascotte explique la règle, le barème est affiché (+ et × 1 pt, − 2 pts, ÷ 3 pts, coup parfait 13 pts), la semaine des jours joués. Le chrono se choisit là, à chaque partie : « No timer » est toujours présélectionné, 3 ou 5 minutes au choix (D-18).
- **Partie** : on touche un nombre, une opération, un second nombre ; le calcul se fait tout seul, et le résultat devient une tuile réutilisable. Aucun glisser-déposer. Les opérations sont en pointillé tant qu'aucun nombre n'est choisi. Undo défait le dernier calcul, Start again repart des cinq nombres (un indice déjà vu reste compté).
- **Coup refusé** (résultat négatif ou nul, division qui ne tombe pas juste, ÷1, diviser le plus petit par le plus grand) : rien ne se joue, le premier nombre reste choisi, la mascotte explique en anglais dans la bulle dorée (« 1 − 9: you can't take 9 away from 1. Start with the bigger number. »), avec les nombres du calcul ; la voix dit la version fixe de l'explication.
- **Indice** : avant, une feuille annonce son coût, lu à voix haute et affiché en gros, « −3 » avec l'étoile des points, compris même sans lire l'anglais (D-22, point 7) ; après, la bulle « L'idée de Moussi » (ou de Pooh Bear) montre le premier calcul d'un chemin le plus court, et les deux nombres sont surlignés. Une impasse (plus aucun chemin vers la cible) se dit gratuitement, sans indice.
- **Chrono** : une pastille discrète dans la barre ; au bout du temps, une feuille propose de continuer sans chrono ou de prendre une nouvelle cible. Rien n'est perdu.
- **Fin de partie** : le score, le badge du coup parfait, la retenue de l'indice écrite en clair, le chemin de l'enfant avec les points de chaque calcul. Si le moteur connaît mieux, la mascotte le présente en défi (« Moussi found a path worth 13 points. Want to try? ») avec « Same target again » en bouton principal, et « Show me » pour voir son chemin ; sinon, « That's the best score possible! ». Un coup parfait obtenu avec un indice garde son badge (D-22, point 8), et la bulle devient « Perfect move! Can you do it again without a hint? », avec « Same target again » en bouton principal et sans chemin de la mascotte, que l'enfant vient de jouer (point 4). La bulle est lue d'elle-même par la voix.
- **Difficulté** : Clara (CM2) ne reçoit que des cibles qui admettent le coup parfait (`tirer(graine, 13)`), Henri que des cibles dont la solution la plus courte demande au moins deux calculs (`tirer(graine, 1, 2)`, D-22 point 5 : aucun calcul unique entre deux nombres de départ ne donne la cible). La graine est `<enfant>-<jour>-<numéro de partie>` : un tirage se rejoue à l'identique.

## L'état et le résumé du portail

- **État** `<enfant>.cible` : `{ version, parties, gagnees, parfaits, meilleurs, indices, jours, dernieres, resume }`, et `decouvert` (facultatif, hors d'`etatNeuf`) : le jour de la première cible atteinte. `dernieres` garde les trente dernières parties gagnées (jour, cible, nombres, score, meilleur, indices, chrono). Un jour compte comme joué dès le premier calcul.
- **Résumé** (`KR.publierResume('cible', …)`, à l'ouverture et à chaque cible atteinte) : `avancement` à `null` (un jeu n'a pas de programme à parcourir), la phrase « 3 targets hit », « 1 target today », `du` à `null` une fois une cible atteinte (rien n'est dû : c'est un jeu libre, `libre: true` au catalogue), et avant une découverte « New! » de cinq minutes que le portail ne propose que le lundi et le jeudi (D-22, point 6) ; `fini`, la partie de découverte, qui compte dans le plafond du « Today » le jour où elle a eu lieu ; les jours des quatorze derniers jours, et la phrase du coin parent en français. Le résumé rendu par le kit est gardé dans l'état en mémoire, sinon le prochain `sauver` l'effacerait.
- **Fusion en ligne** : aujourd'hui la règle générique de `lib/fusion.js` (le dernier état reçu remplace l'autre, le résumé le plus récent est gardé). Règle proposée si les enfants jouent sur deux appareils : le maximum de chaque compteur, l'union des jours et des dernières parties.

## Langue (D-21)

Tout le jeu est en anglais britannique : consignes (« Touch a number », « Pick an operation »), explications des coups refusés, idée de la mascotte (« Moussi's idea »), cible annoncée et voix en-GB. Le ton reste doux : une explication dit ce qu'on peut faire à la place, jamais ce qui est faux. Si un parent passe le cadre de l'app en français (coin parent), le jeu suit, avec la version française de `contenu.js`.

## Les voix

Toute phrase dite passe par `contenu.js` (la cible de 10 à 99, les consignes, les refus, l'indice, l'impasse, en anglais et en français) ou par les clés `cible_*` de `commun/textes.js` (bulles du cadre, lues en anglais) ; `commun/outils/phrases.js` les énumère toutes, y compris les bulles qui nomment la mascotte. Les clés `res_cible_*` ne servent qu'au portail et ne sont jamais dites. Après un changement de texte, relancer la fabrication des voix (`uv run commun/outils/voix.py tables`) ; d'ici là, la voix de l'appareil prend le relais.

## Tester

```sh
node modules/cible/moteur.test.js
node modules/cible/etat.test.js
uv run modules/cible/test_parcours.py
```

- `moteur.test.js` : calculs refusés, barème, coup parfait, résolution, tirage reproductible, jamais de cible d'un seul calcul pour Henri, partie jouée, annulée, indice.
- `etat.test.js` : résumé d'un enfant neuf (découverte) et d'un enfant qui a joué (jeu libre, jour de découverte), phrases de 28 caractères au plus, quatorze jours, semaine, trente parties gardées, état abîmé, chaque refus expliqué.
- `test_parcours.py` : pour Henri et Clara, aux trois formats, une partie complète (cible lue, cible de deux calculs au moins pour Henri, refus expliqué et dit, calcul, Undo, indice annoncé avec son « −3 » en gros et lu, puis pris, cible atteinte, coup parfait avec indice et sa bulle dite, ou défi et Show me, même cible au meilleur score), une partie au chrono (temps fini, on continue, arrêt), et une partie d'Henri en mode soir. Il échoue sur toute erreur JavaScript, tout débordement, tout bouton de jeu sous le bas de l'écran, toute cible de moins de 56 px, tout rouge ou toute croix. Captures dans `captures/` (ignoré par git et par Vercel) : les regarder.

## Ce qui reste à faire

- **Sur l'iPad lui-même** avec Henri et Clara : la lisibilité des tuiles, la compréhension du geste « nombre, opération, nombre », les explications en anglais pour Henri, la voix anglaise.
- Fabriquer les voix du module (Louis), dont la nouvelle bulle « Perfect move! Can you do it again without a hint? ».
- Remonter dans `commun/kit.css` les formes de l'écran de fin (`.fin-seance`, `.montee`, `.ligne-fin`), désormais recopiées dans trois modules.
- Le point à deux semaines de D-22 (point 6) : si les enfants ne l'ouvrent pas d'eux-mêmes une fois découvert, décider s'il revient deux fois par semaine (`docs/TODO.md`).
