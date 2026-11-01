# Architecture de « Nos révisions » : un site statique sur Vercel, un middleware de codes, une petite base pour la progression

Ce document décrit comment le site est construit et pourquoi. Pour la pédagogie et les modules, voir [`DISPOSITIF.md`](DISPOSITIF.md) ; pour la façon de travailler dans le dépôt, [`CONTRIBUER.md`](CONTRIBUER.md) ; pour les décisions prises et leur raison, [`DECISIONS.md`](DECISIONS.md).

## 1. Vue d'ensemble : des pages HTML sans build, servies par Vercel derrière des codes

```
iPad (app d'Henri, app de Clara, posées sur l'écran d'accueil)
   │  https://nos-revisions.vercel.app/henri/ …
   ▼
Vercel, projet « revisions » (compte perso de Louis, équipe louispasquier-9288s-projects)
   ├─ middleware.js          vérifie le cookie d'accès sur TOUTE requête (pages, sons, API)
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
| `commun/textes.js` | Textes du cadre en français et en anglais (`Textes.t(cle)`) |
| `commun/portail.js`, `commun/portail.css` | Portail d'un enfant et coin parent (appui long sur « Grown-ups ») |
| `commun/sync.js`, `commun/synchro-page.js` | Sauvegarde en ligne côté page (section 5) |
| `commun/voix/` | Voix fabriquées d'avance (section 6) : `index.json` et les MP3 `fr/`, `en/` |
| `commun/polices/` | Baloo 2 et Andika, hébergées (licences OFL à côté) |
| `commun/outils/` | Outils de fabrication : `voix.py` et `phrases.js` (voix), générateur d'icônes |
| `modules/tables/` | Module des tables : `moteur.js` (logique pure, testée), `seance.js` (déroulé), `tables.js` et `tables.css` (interface), `README.md` |
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
- **Sans `CODE_PARENT`, tout le site répond 503** « Site en cours de configuration ».

## 5. Sauvegarde en ligne : le local fait foi, la base suit et réconcilie

- **Le local d'abord** : chaque module garde son état dans `localStorage`, clé `<enfant>.<module>` (par exemple `henri.tables`), sous try/catch. Les réglages : `<enfant>.reglages`.
- `commun/synchro-page.js` enveloppe `Tables.sauver` : chaque sauvegarde locale part aussi au service (`PUT /api/progression?enfant=&module=`). Au chargement, il tire l'état distant, **fusionne**, renvoie le résultat, et recharge la page une fois si l'état distant apportait du progrès (nouvel appareil, icône refaite), sauf pendant un exercice.
- **La fusion** (`lib/fusion.js`, recopiée à l'identique dans `commun/sync.js`) : pour chaque fait, la version la plus avancée (`prochain` le plus récent, sinon la boîte la plus haute) ; union des jours joués et des jours de réussite ; maximum des familles ouvertes ; union des records. Deux appareils joués hors ligne se réconcilient sans rien perdre. **Toute modification de la fusion se fait dans les deux fichiers**, et `test/fusion.test.js` vérifie qu'ils donnent le même résultat.
- **Hors ligne** : rien ne bloque ; l'envoi est retenté plus tard (événement `online`, ou toutes les minutes).
- **Remise à zéro** (coin parent) : efface le local et l'état en ligne (`DELETE`) ; un autre appareil qui garde l'ancien état local le renverra, donc remettre à zéro sur chaque appareil.

## 6. Voix : des fichiers fabriqués d'avance, la voix de l'appareil en secours

- **Pourquoi** : la qualité des voix installées sur l'iPad varie ; des fichiers fabriqués d'avance sonnent pareil partout, marchent hors ligne une fois en cache, et ne coûtent qu'une fois.
- **Fabrication** : `uv run commun/outils/voix.py tables` énumère toutes les phrases que l'app peut dire (`node commun/outils/phrases.js` : questions, faits complets, astuces, phrases du cadre anglais), fabrique celles qui manquent avec **Gemini TTS** (modèle `gemini-3.8-flash-tts`, voix **Sulafat** en français et en anglais britannique, même outil que les films Avest), et écrit `commun/voix/index.json` (texte vers fichier). Clé : `GOOGLE_GEMINI_API_KEY` dans l'environnement (chez Louis, `~/.claude/shared/.env`). Coût : environ 0,50 $ pour les 1 162 phrases du module des tables, une seule fois.
- **Nom des fichiers** : empreinte du modèle, de la voix, des consignes, de la langue et du texte. Changer de voix produit d'autres fichiers ; c'est ce qui permet le cache d'un an (`vercel.json`). `index.json`, lui, n'est jamais figé.
- **Lecture** : `KR.lireSuite([{ texte, langue }])` cherche chaque phrase dans l'index et la joue par Web Audio ; si une phrase manque ou qu'un fichier échoue, la voix de l'appareil (`speechSynthesis`, fr-FR ou en-GB) prend le relais. **Le texte à dire doit être exactement celui de `phrases.js`** : une phrase nouvelle ou modifiée dans le code n'a pas de fichier tant qu'on n'a pas relancé `voix.py`.

## 7. Déploiement

- **Déployer** : `bash outils/deployer.sh`, depuis le clone de Louis (compte Vercel de Louis). Le script envoie une copie sans historique git : en plan gratuit, Vercel bloque un dépôt privé dont le dernier commit n'est pas de l'auteur du compte (cas d'un commit de Louise). Le domaine `nos-revisions.vercel.app` suit chaque déploiement de production.
- **Pas de déploiement automatique au push** : le plan gratuit de Vercel ne l'accepte pas pour les commits de Louise sur un dépôt privé (voir `TODO.md`).
- `.vercelignore` écarte les tests, les captures et les outils lourds du déploiement.
- **Variables Vercel** : `CODE_PARENT` (Louis) ; `KV_REST_API_URL`, `KV_REST_API_TOKEN` et les autres `KV_*` (posées par l'intégration Upstash, marquées sensibles, donc illisibles en local : les essais locaux utilisent une base factice).
- **GitHub Pages** (`louisepasq.github.io/revisions/`) sert encore l'ancienne version publique : à couper quand le dépôt passera en privé.
