# Architecture de « Nos révisions » : un site statique sur Vercel, un middleware de codes, une petite base pour la progression

Ce document décrit comment le site est construit et pourquoi. Pour la pédagogie et les modules, voir [`DISPOSITIF.md`](DISPOSITIF.md) ; pour la façon de travailler dans le dépôt, [`CONTRIBUER.md`](CONTRIBUER.md) ; pour les décisions prises et leur raison, [`DECISIONS.md`](DECISIONS.md).

## 1. Vue d'ensemble : des pages HTML sans build, servies par Vercel derrière des codes

```
iPad (app d'Henri, app de Clara, posées sur l'écran d'accueil)
   │  https://nos-revisions.vercel.app/henri/ …
   ▼
Vercel, projet « revisions » (compte perso de Louis, équipe louispasquier-9288s-projects)
   ├─ middleware.js          vérifie le cookie d'accès sur toute requête (pages, sons, API), sauf icônes et manifeste
   ├─ api/entrer.js          vérifie un code saisi, pose le cookie (seule route ouverte)
   ├─ api/codes.js           codes secrets des enfants (rôle parent seulement)
   ├─ api/progression.js     sauvegarde en ligne de la progression (lib/serveur.js, lib/fusion.js)
   └─ fichiers statiques     henri/, clara/, commun/, modules/, parents/, docs/
   │
   ▼
Upstash Redis (plan gratuit, région Francfort), branché par l'intégration Vercel
   code:henri, code:clara              empreintes des codes des enfants
   progression:<enfant>:<module>       état JSON d'un module
   essais:<ip>:<quart d'heure>         compteur d'essais de code
   limite:<ip>:<minute>                compteur de requêtes de l'API
```

- **Aucun framework, aucun build** : HTML, CSS et JavaScript « classiques » (scripts non-module, pour fonctionner aussi ouverts depuis le disque). Les seules dépendances npm servent aux fonctions Vercel : `@vercel/edge` (middleware) et `@upstash/redis` (API).
- **Safari sur iPad d'abord** (iPad 9e génération, iPadOS 26.5, 1080 × 810 points en paysage, 810 × 1080 en portrait), puis iPhone en portrait (402 × 874 points).

## 2. Les fichiers : qui fait quoi

| Chemin | Rôle |
|---|---|
| `index.html` | Page des parents de Louise (rôle parent seulement) : liens vers les apps et la page parents |
| `parents/index.html` | Page parents : choisir le code secret de chaque enfant, installer les apps |
| `henri/`, `clara/` | L'app de chaque enfant : `index.html` (portail), `tables.html` (page fine du module), `manifest.webmanifest`, `icone-180.png`, `icone-512.png`. `henri/planisphere.html` est le module de Louise |
| `commun/kit.css`, `commun/kit.js` | Système de design v2 : jetons, composants, sons, voix, pavé, mascottes (sprite SVG), réglages, export et import. Doc : `docs/design-system/DESIGN-SYSTEM.md` |
| `commun/textes.js` | Textes du cadre en français et en anglais (`Textes.t(cle)`) ; la règle de langue (D-21) est écrite en tête du fichier et dans la section « Langues » ci-dessous |
| `commun/modules.js` | Le catalogue fixe des modules (`window.Catalogue`) et les cinq matières (`window.Matieres`) : section 8 |
| `commun/portail.js`, `commun/portail.css` | Portail d'un enfant en cahiers par matière (D-19) : carte « Today », cahiers, page d'une matière, « My week », coin parent (appui long sur « Coin parent »). Il ne charge aucun moteur de module (section 8) |
| `commun/test_portail.py` | Parcours Playwright du portail, captures dans `commun/captures/` (ignoré par git) |
| `commun/sync.js`, `commun/synchro-page.js` | Sauvegarde en ligne côté page (section 5) |
| `commun/voix/` | Voix fabriquées d'avance (section 6) : `index.json` et les MP3 `fr/`, `en/` |
| `commun/polices/` | Baloo 2 et Andika, hébergées (licences OFL à côté) |
| `commun/outils/` | Outils de fabrication : `voix.py` et `phrases.js` (voix), générateur d'icônes |
| `modules/tables/` | Module des tables : `moteur.js` (logique pure, testée), `seance.js` (déroulé), `album.js` (album à tampons), `resume.js` (résumé pour le portail), `tables.js` et `tables.css` (interface), `README.md` |
| `modules/zoom/` | Module « De l'univers à Éguilles » : `contenu.js`, `cartes.js` (fabriqué par `outils/cartes.py`), `geometrie.js`, `moteur.js` (logique pure, testée), `resume.js` (résumé pour le portail), `zoom.js` et `zoom.css`, `README.md` |
| `modules/cible/` | Jeu du nombre cible (D-18) : `moteur.js`, `contenu.js`, `etat.js` (état et résumé), `cible.js` et `cible.css`, `README.md` |
| `modules/helicopteres/` | Projet hélicoptères d'Henri (D-23 à D-25) : `contenu.js` (deux langues), `dessins.js` (SVG originaux, gabarit A4), `moteur.js` (étapes, cartes de Leitner sur le moteur du zoom, carnet de pilote, expérience), `resume.js`, `helicopteres.js` et `helicopteres.css`, `README.md` (avec les faits affichés et leur source) |
| `middleware.js`, `lib/acces.js` | Contrôle d'accès (section 4) |
| `api/`, `lib/serveur.js`, `lib/fusion.js` | Fonctions serveur (sections 4 et 5) |
| `test/` | Tests node du serveur, de la fusion et des accès |
| `outils/essais/` | Essais de bout en bout contre le site local, avec une base factice |
| `docs/` | Toute la documentation ; `docs/revues/` garde les relectures des spécialistes |
| `.claude/agents/` | Les deux relecteurs spécialisés ; `.claude/launch.json` lance le site en local |

## 3. Une app par enfant : pourquoi tout vit sous le même site

- Chaque enfant a son adresse (`/henri/`, `/clara/`), posée sur l'écran d'accueil de l'iPad. iPadOS 26 l'ouvre alors en app plein écran, avec l'icône et le nom de son manifeste.
- **Une app de l'écran d'accueil a son propre stockage et ses propres cookies**, séparés de Safari. D'où deux conséquences : le code se tape une fois dans Safari puis une fois dans l'app, et la progression locale n'est pas partagée avec Safari (la sauvegarde en ligne fait le lien).
- Un module d'un autre site s'ouvrirait dans une feuille Safari par-dessus l'app : tout reste donc sur ce site.
- Les pages d'un module sont des pages fines par enfant (`henri/tables.html`) qui chargent le code commun (`../modules/tables/*.js`) : le code est écrit une fois, l'enfant est posé par `data-enfant` sur `<html>`.

## 4. Accès : un code parent qui ouvre tout, un code par enfant qui n'ouvre que son app

- **Trois rôles** : `parent`, `henri`, `clara`. Règles dans `lib/acces.js` (`autorise`), testées dans `test/acces.test.mjs` :
  - parent : tout ;
  - un enfant : son dossier, les ressources communes (`commun/`, `modules/`), sa propre progression ; jamais l'app de l'autre, ni `/`, ni `/parents`, ni `/docs`, ni `/api/codes`.
- **Le code parent** est la variable d'environnement `CODE_PARENT` du projet Vercel, posée par Louis. Il n'est écrit nulle part dans le dépôt ni dans une conversation.
- **Les codes des enfants** sont choisis par eux sur la page parents ; la base ne garde que leur empreinte, `sha256("code|" + codeParent + "|" + enfant + "|" + code)` (codes comparés sans majuscules, espaces, accents ni ponctuation).
- **Le cookie** `revisions_acces = <rôle>.<jeton>`, avec `jeton = sha256("acces|" + codeParent + "|" + rôle)` : impossible à fabriquer sans le code parent, valable un an, inchangé d'un déploiement à l'autre. **Changer `CODE_PARENT` déconnecte tout le monde et invalide les codes des enfants** (à rechoisir).
- **Le flux** : `middleware.js` sert la page de code (401) tant que le cookie manque ; le formulaire poste vers `api/entrer.js`, qui vérifie le code, compte les essais (20 par quart d'heure et par adresse) et pose le cookie. `/sortir` efface le cookie. Pourquoi une fonction et pas le middleware : le serveur de développement de Vercel ne transmet pas le corps d'un formulaire au middleware.
- **Seules exceptions au code : les icônes et le manifeste de chaque app** (`henri/icone-*`, `clara/icone-*`, `*/manifest.webmanifest`, liste dans le `matcher` de `middleware.js`). Précaution : le manifeste se charge sans identifiants selon la norme, et l'iPad peut les demander avant que l'enfant ait tapé son code. La vraie cause du « C » de Clara le 02/11/2026 était ailleurs : son app s'ouvrait sur `/clara` sans barre finale, et tous les liens relatifs (pages, icône, manifeste) partaient à la racine en 404 (journaux Vercel). `/henri` et `/clara` redirigent donc vers `/henri/` et `/clara/` (`middleware.js`). Ils ne portent que la mascotte, les couleurs et le prénom déjà présent dans l'adresse. Leur adresse porte `?v=2` : à changer en `?v=3` si une icône change, sinon l'iPad garde l'ancienne.
- **Sans `CODE_PARENT`, tout le site répond 503** « Site en cours de configuration ».

## 5. Sauvegarde en ligne : le local fait foi, la base suit et réconcilie

- **Le local d'abord** : chaque module garde son état dans `localStorage`, clé `<enfant>.<module>` (par exemple `henri.tables`), sous try/catch. Les réglages : `<enfant>.reglages`.
- `commun/synchro-page.js` suit les modules du catalogue (`commun/modules.js`) : tous ceux de l'enfant sur le portail, le seul module de la page ailleurs (`<html data-module="tables">`) ; un module marqué `synchro: false` (le planisphère de Louise, qui range son état sous plusieurs clés) est ignoré. Il enveloppe le `sauver` de l'objet global du module (champ `objet` du catalogue : `Tables`, `Zoom`, `CibleEtat`) : chaque sauvegarde locale part aussi au service (`PUT /api/progression?enfant=&module=`) ; et quand un module publie son résumé (événement `kr:resume`), son état local part aussi. Au chargement, il tire l'état distant, **fusionne**, renvoie le résultat, et recharge la page une fois si l'état distant apportait du progrès ou un résumé plus récent (nouvel appareil, icône refaite), sauf pendant un exercice. Un nouveau module n'y ajoute rien : sa ligne au catalogue suffit.
- **La fusion** (`lib/fusion.js`, recopiée à l'identique dans `commun/sync.js`) : pour chaque fait, la version la plus avancée (`prochain` le plus récent, sinon la boîte la plus haute) ; union des jours joués et des jours de réussite ; maximum des familles ouvertes ; union des records. Pour le zoom (`fusionZoom`) : chaque carte de Leitner comme un fait, maximum des étapes ouvertes, union des jours, grand voyage vu sur l'un ou l'autre. Pour les hélicoptères (`fusionHelicopteres`) : les cartes comme le zoom, étapes faites, tampons et objets du carnet réunis (date la plus ancienne), pour chaque modèle de l'expérience la liste de mesures la plus remplie, et un choix (langue, mission, hypothèse) jamais effacé par un état qui ne l'a pas. Un module sans règle propre : le nouvel état remplace l'ancien. **Pour tous les modules, le résumé du portail le plus récent (`ecritLe`) l'emporte** (`fusionResume`). Deux appareils joués hors ligne se réconcilient sans rien perdre. **Toute modification de la fusion se fait dans les deux fichiers**, et `test/fusion.test.js` vérifie qu'ils donnent le même résultat.
- **Hors ligne** : rien ne bloque ; l'envoi est retenté plus tard (événement `online`, ou toutes les minutes).
- **Remise à zéro** (coin parent) : efface le local et l'état en ligne (`DELETE`) ; un autre appareil qui garde l'ancien état local le renverra, donc remettre à zéro sur chaque appareil.

## 6. Voix : des fichiers fabriqués d'avance, la voix de l'appareil en secours

- **Pourquoi** : la qualité des voix installées sur l'iPad varie ; des fichiers fabriqués d'avance sonnent pareil partout, marchent hors ligne une fois en cache, et ne coûtent qu'une fois.
- **Fabrication** : `uv run commun/outils/voix.py tables` énumère toutes les phrases que l'app peut dire (`node commun/outils/phrases.js` : questions, faits complets et astuces des tables en français, phrases du cadre et consignes en anglais, voyage du zoom et hélicoptères dans leurs deux langues, nombre cible en anglais et en français), fabrique celles qui manquent avec **Gemini TTS** (modèle `gemini-3.8-flash-tts`, voix **Sulafat** en français et en anglais britannique, même outil que les films Avest), et écrit `commun/voix/index.json` (texte vers fichier). Clé : `GOOGLE_GEMINI_API_KEY` dans l'environnement (chez Louis, `~/.claude/shared/.env`). Coût : environ 0,50 $ pour les 1 162 phrases du module des tables, une seule fois.
- **Nom des fichiers** : empreinte du modèle, de la voix, des consignes, de la langue et du texte. Changer de voix produit d'autres fichiers ; c'est ce qui permet le cache d'un an (`vercel.json`). `index.json`, lui, n'est jamais figé.
- **Lecture** : `KR.lireSuite([{ texte, langue }])` cherche chaque phrase dans l'index et la joue par Web Audio ; si une phrase manque ou qu'un fichier échoue, la voix de l'appareil (`speechSynthesis`, fr-FR ou en-GB) prend le relais. **Le texte à dire doit être exactement celui de `phrases.js`** : une phrase nouvelle ou modifiée dans le code n'a pas de fichier tant qu'on n'a pas relancé `voix.py`.

## 7. Déploiement

- **Déployer** : `bash outils/deployer.sh`, depuis le clone de Louis (compte Vercel de Louis). Le script envoie une copie sans historique git : en plan gratuit, Vercel bloque un dépôt privé dont le dernier commit n'est pas de l'auteur du compte (cas d'un commit de Louise). Le domaine `nos-revisions.vercel.app` suit chaque déploiement de production.
- **Pas de déploiement automatique au push** : le plan gratuit de Vercel ne l'accepte pas pour les commits de Louise sur un dépôt privé (voir `TODO.md`).
- `.vercelignore` écarte les tests, les captures et les outils lourds du déploiement.
- **Variables Vercel** : `CODE_PARENT` (Louis) ; `KV_REST_API_URL`, `KV_REST_API_TOKEN` et les autres `KV_*` (posées par l'intégration Upstash, marquées sensibles, donc illisibles en local : les essais locaux utilisent une base factice).
- **GitHub Pages** (`louisepasq.github.io/revisions/`) sert encore l'ancienne version publique : à couper quand le dépôt passera en privé.

## 8. Le portail : un catalogue fixe et un résumé publié par chaque module, pour ne jamais modifier `portail.js`

Le portail en cahiers par matière (D-19, rendu de référence `design-system/archive/2026-11-01_accueil/2-cahiers.html`) ne connaît l'intérieur d'aucun module et n'en charge aucun moteur. Il lit deux choses : le catalogue, fixe, et le résumé que chaque module tient à jour dans son état.

**Ce que montre le portail** (`commun/portail.js`, vues dans l'adresse : rien, `#matiere-<id>`, `#semaine`) :

- le bandeau : la mascotte et sa bulle (la toucher la lit à voix haute), « Hello, {prénom}! », la semaine comptée sur tous les modules (`resume.jours`) ; toucher la semaine ouvre « My week » ;
- la carte « Today » (`planDuJour`, règle détaillée plus bas) : la première activité porte le seul bouton plein, Start, à droite ; les suivantes sont sous « Then » ; un module découvert pour la première fois porte la pastille « New! ». Rien de dû et rien de fait : « Today, you choose. » ; plafond de la journée atteint, ou tout fait : « All done. See you tomorrow! » ;
- un cahier par matière, les cinq toujours (D-19) ; une matière sans activité est un cahier « Coming soon » qu'on ne touche pas ; sous la couverture, une jauge par activité, jamais une moyenne ;
- la page d'une matière : Back, le titre sur le motif du cahier, une grande carte par module (phrase de progrès, « monté aujourd'hui » en or vif, jauge, badge « Today ») ;
- « My week » : la semaine en grand, puis une rangée de jauges par matière ;
- le coin parent, en français : la phrase `parent` de chaque résumé, les crédits d'un module (`noteParent`), puis langue, voix, sons, sauvegarde et remise à zéro.

**La partie fixe : une ligne par module dans `commun/modules.js`.**

```js
window.Catalogue = {
  tables: {
    titre: { en: 'Times tables', fr: 'Les tables' },  // court, sans « My »
    matiere: 'maths',          // maths | francais | hg | sciences | anglais
    icone: 'grille',           // symbole i-<nom> du sprite de kit.js
    page: 'tables.html',       // relative au dossier de l'enfant
    enfants: ['henri', 'clara'],
    etat: 'actif',             // actif | bientot
    objet: 'Tables',           // facultatif : l'objet global qui porte charger et sauver
  },
};
```

Champs facultatifs de plus : `synchro: false` (état hors de `<enfant>.<module>`, ignoré par la sauvegarde en ligne), `noteParent` (clé de `textes.js` montrée sous le bilan dans le coin parent), `libre: true` (un jeu qu'on choisit, le nombre cible : hors du « Today » une fois découvert, D-22). Les matières (`window.Matieres`) donnent l'ordre de l'emploi du temps, l'icône et le motif de la couverture ; leurs noms sont dans `textes.js` (`mat_<id>`, `mat_<id>_court`). L'ordre des lignes du catalogue est l'ordre des modules dans leur cahier ; `enfants` remplace la liste `data-modules` de l'ancienne page.

**La partie vivante : `resume`, écrit par le module, dans `localStorage['<enfant>.<module>'].resume`.**

```js
{
  version: 1,
  ecritLe: '2026-11-04T16:42:10.000Z',  // posé par le kit ; le plus récent gagne à la synchronisation
  progres: {
    avancement: 0.73,          // 0 à 1, ne redescend jamais (le kit garde le plus haut publié) ; null si le module n'en a pas
    phrase: { en: '105 stamps · 15 gold', fr: '105 tampons · 15 en or' },  // 28 caractères au plus
    aujourdhui: { en: '+6 stamps', fr: '+6 tampons' },  // monté aujourd'hui, ou null
    jour: '2026-11-04',        // le jour auquel `aujourdhui` se rapporte ; ignoré le lendemain
  },
  du: {                        // ce que le module propose pour le « Today », ou null
    des: '2026-11-04',         // à partir de quand c'est dû ; le portail compare à la date du jour
    nature: 'revision',        // revision | seance | decouverte
    phrase: { en: '12 cards come back', fr: '12 cartes reviennent' },
    minutes: 5,                // durée honnête, de 2 à 8
    lien: 'tables.html',       // facultatif : une page du site, sinon la page du catalogue
  },
  fini: {                      // la dernière séance finie (écran de fin atteint), ou null (D-22)
    jour: '2026-11-04',
    nature: 'revision',        // ce que le résumé proposait à l'ouverture : revision | seance | decouverte
    minutes: 5,
  },
  jours: ['2026-10-30', '2026-11-04'],   // jours pratiqués (une réponse suffit), les 14 derniers au plus
  parent: 'Les tables : 15 multiplications sur 36 sont devenues automatiques. …',  // français, coin parent
}
```

- **Publier** : `KR.publierResume(module, resume)` (`commun/kit.js`) pose `version` et `ecritLe`, garde l'avancement au plus haut déjà publié, range le résumé dans l'état local et prévient la sauvegarde en ligne. Il rend le résumé complet : le module le recopie dans son état en mémoire (`etat.resume = KR.publierResume(...)`), sinon son prochain `sauver` l'effacerait. À appeler à l'ouverture du module et en fin de séance (les tables et le zoom le font dans leur `accueil()` et leur `fin()`).
- **Le portail calcule, le module déclare** : dû ou pas (`du.des` comparé à aujourd'hui), séance finie aujourd'hui (`fini.jour`), pratiqué aujourd'hui pour la semaine (`jours`), au programme ou pas. Un module dont la séance est finie aujourd'hui calcule son `du` pour demain ; une réponse seule ne suffit pas (D-22, point 10) : les tables et le zoom rangent `seanceFinie: { jour, nature }` dans leur état à l'écran de fin (`finirSeance` de leur moteur), le nombre cible `decouvert` (le jour de la première cible atteinte). Ces champs sont facultatifs et n'entrent pas dans `etatNeuf`, pour qu'un état enregistré se relise à l'identique (`test/progression.test.js`).
- **Un résumé publié avant D-22** n'a pas de `fini` : le portail retombe alors sur l'ancienne règle (pratiqué aujourd'hui, donc fait) jusqu'à la prochaine ouverture du module, qui republie son résumé.
- **Un module sans résumé** s'affiche quand même, sans jauge ni phrase. S'il a un `objet` (il sait publier un résumé), il est proposé d'office dans le « Today » en découverte de cinq minutes, marquée « New! » (D-22, point 2) ; le planisphère, sans `objet`, reste dehors.

**La règle du « Today »** (`planDuJour` de `commun/portail.js`, testée dans `test/portail.test.js` ; maquette de D-19, corrigée par D-22 sur la relecture `revues/2026-11-01_relecture-today.md`) :

1. **Le plafond porte sur la journée entière** : trois activités et quinze minutes, ce qui est déjà fini aujourd'hui compris (`fini.jour` = aujourd'hui, avec ses minutes). Sa matière compte comme vue pour le premier passage. Quand le plafond est atteint, ou que tout est fait : « All done. See you tomorrow! ». L'enfant qui en veut plus ouvre un cahier, librement.
2. **Ce qui est proposé** : un `du` dont la date est arrivée, et dont la séance n'est pas finie aujourd'hui ; un module jamais ouvert qui a un `objet`, en découverte « New! ».
3. **Tri** : révisions, puis séances, puis découvertes (un jeu libre après les autres) ; à égalité, la plus ancienne date due, puis l'ordre du catalogue.
4. **Premier passage** : une activité par matière ; **second passage** s'il reste de la place.
5. **Au plus une découverte par jour** (D-22, point 3), finie ou proposée : les modules arrivent un par un (les tables le premier jour, le voyage le deuxième…).
6. **Un jeu libre** (`libre: true`, le nombre cible) : il ne publie pas de `du` une fois découvert, reste hors du « Today » et ne prend pas de place quand il est joué. Tant qu'il n'est pas découvert (jamais ouvert, ou aucune cible atteinte), il n'est proposé que le lundi et le jeudi (`JOURS_JEU_LIBRE`), au plus deux fois par semaine (D-22, point 6) ; le jour de sa découverte, la partie gagnée garde sa place dans le plafond et compte comme la découverte du jour.
7. Le reste attend demain, sans rien perdre ; jamais de retard ni de « tu as manqué » affichés.
- **Ce qu'un résumé ne porte jamais** : un pourcentage écrit, un rang, une comparaison, une série, un compte à rebours, une perte.
- **Lecture prudente** : le portail ignore un champ mal formé sans faire tomber le reste (`nettoyerResume`, testé dans `test/portail.test.js`). Les résumés des tables et du zoom sont testés dans `test/resume.test.js`.
- **Textes** : les phrases des résumés vivent dans `commun/textes.js` (clés `res_*`, jamais lues à voix haute, donc écartées par `commun/outils/phrases.js`) ; celles du portail dans le bloc `/* accueil */`.

## 9. Langues : l'anglais britannique par défaut, le français là où l'apprentissage l'exige (D-21)

- **Par défaut, l'anglais britannique** (voix en-GB) : portail, boutons, mascotte, consignes d'exercice, explications d'un coup refusé, voix. Les phrases sont courtes et les mots simples : Henri commence à lire l'anglais, et le bouton Listen lit tout. Le réglage de langue du coin parent (`<enfant>.reglages.langue`, `en` par défaut) peut passer le cadre en français ; le nombre cible et les consignes des tables le suivent.
- **Tables** : les énoncés des multiplications (les quatre types de questions, Oui et Non, la correction, les faits dits) et les astuces restent en français, à l'écrit comme à voix haute (fr-FR) ; les consignes autour (`tables_*` et `astuce_de` dans `commun/textes.js`) suivent la langue du cadre.
- **Géographie** (`modules/zoom/`) : l'enfant choisit au premier lancement, anglais ou français, sur deux grosses cartes à drapeau ; le choix est rangé dans l'état du module (`<enfant>.zoom`, champ facultatif `langue`), se change depuis l'accueil du module, et passe par la sauvegarde en ligne (la fusion garde le champ). Le contenu (noms de lieux, consignes, repères, phrases dites) suit ce choix ; le cadre du module (Back, Listen, Skip, mascotte) reste celui de l'app. La progression est commune aux deux langues. Un état enregistré sans `langue` se charge sans rien perdre, et le choix s'affiche au lancement suivant (`test/progression.test.js`).
- **Hélicoptères** (`modules/helicopteres/`, D-24 point 5) : même mécanique que la géographie (champ facultatif `langue` dans `<enfant>.helicopteres`, choix au premier lancement, changeable depuis l'accueil du module), le français proposé en premier à Henri ; sous chaque commande du cockpit, le nom dans l'autre langue (l'anglais sous le français). Le cadre (Back, Listen, Next) reste celui de l'app.
- **Coin parent** : toujours en français (`t(cle, valeurs, 'fr')`), comme la page du code parent ; la page du code d'un enfant est en anglais (`middleware.js`).
- **Voix** : toute phrase dite est collectée par `commun/outils/phrases.js` dans sa langue (`en` ou `fr`) ; une phrase sans fichier est dite par la voix de l'appareil jusqu'à la prochaine fabrication.
- **Un module futur** part en anglais ; le français n'y entre que pour une matière qui l'exige (la dictée, l'orthographe). Le planisphère de Louise n'est pas concerné.
