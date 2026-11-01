# Module des tables : moteur testé, séance, interface aux trois formats

La pédagogie et les décisions sont dans [`docs/tables/PLAN.md`](../../docs/tables/PLAN.md) ; le design dans [`docs/design-system/DESIGN-SYSTEM.md`](../../docs/design-system/DESIGN-SYSTEM.md).

## Architecture : trois couches, sans bibliothèque ni build

| Fichier | Rôle | Dépend de |
|---|---|---|
| `moteur.js` | `window.Tables` : boîtes de Leitner par résultat, familles d'Eduscol, quatre types de questions, astuces, diagnostic, semaine, stockage (`<enfant>.tables`) | rien |
| `seance.js` | `window.Seance` : déroulé d'une séance, erreur à retaper, retour de la question ratée trois questions plus loin, bilan | `moteur.js` |
| `tables.js`, `tables.css` | l'interface : accueil du module, diagnostic, séance, fin, grille | `commun/textes.js`, `commun/kit.js`, `kit.css` |
| `henri/tables.html`, `clara/tables.html` | pages fines qui posent `data-enfant` et chargent le tout | |

Le parcours : au premier lancement, le diagnostic (questions de `Tables.questionsDiagnostic`, 60 secondes au plus, aucun chrono visible, « Skip » compté comme non su), puis `Tables.appliquerDiagnostic`. Ensuite, l'accueil propose « Today's practice » (une séance de `Seance`) et « My grid ». La progression est sauvée après chaque réponse.

## Tester : deux tests de logique, un parcours au rendu réel

```sh
node modules/tables/moteur.test.js
node modules/tables/seance.test.js
uv run modules/tables/test_parcours.py
```

Le parcours sert le dépôt en local et pilote Chrome (Playwright) aux formats iPad paysage (1080 × 810), iPad portrait (810 × 1080) et iPhone (402 × 874) : portails d'Henri et de Clara, coin parent (appui long, export, remise à zéro, import), puis le module de Clara de bout en bout (diagnostic au pavé, séance avec une erreur volontaire retapée, fin, grille) et une séance avancée qui montre les quatre types de questions. Il échoue sur toute erreur JavaScript, tout débordement horizontal ou tout produit affiché dans la grille hors de la case touchée. Les captures vont dans `captures/` (ignoré par git) : les regarder après chaque changement d'interface.

## Ce qui reste à faire

- **Sur l'iPad lui-même** : la voix française et anglaise, les sons après le premier toucher, la conservation de la progression une fois l'app posée sur l'écran d'accueil, l'icône et le nom sous l'icône, l'export (feuille de partage de Safari) et l'import (app Fichiers).
- « Défi 1 minute » et « Découvrir une famille », affichés comme à venir.
- « Practise it » depuis une case de la grille (la vitrine le montre ; il faut une séance ciblée dans `seance.js`).
- Les confusions répétées (56 et 54) qui déclenchent des questions opposant les deux résultats (PLAN, section 3).
- La séance n'est pas reprise si l'enfant quitte au milieu : la progression des réponses données est gardée, la file de questions repart.
