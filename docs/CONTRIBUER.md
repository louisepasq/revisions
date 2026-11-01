# Contribuer à « Nos révisions » : Louise et Louis, chacun depuis sa session Claude

Mode d'emploi pour toute personne, ou toute session Claude, qui modifie le site. Lire d'abord [`ARCHITECTURE.md`](ARCHITECTURE.md) et [`DECISIONS.md`](DECISIONS.md).

## 1. Avant de commencer : se synchroniser, ne pas marcher sur l'autre

- `git pull --rebase` avant toute modification : Louise et Louis poussent tous les deux sur `main`.
- Un sujet en cours chez l'autre est noté dans [`TODO.md`](TODO.md) ; le lire avant de toucher au même module.
- Commits courts, un sujet par commit, message en français qui dit ce qui change et pourquoi.

## 2. Tester en local

- **La logique** (aucun serveur) :

  ```bash
  npm test
  ```

  Ce sont les tests du serveur, de la fusion, des accès, du moteur des tables et du déroulé d'une séance.
- **Le module des tables au rendu** (Playwright, avec Chrome installé) : `uv run modules/tables/test_parcours.py`. Il fait le parcours complet aux trois formats (iPad paysage, iPad portrait, iPhone) et range ses captures dans `modules/tables/captures/`, ignoré par git. **Regarder les captures**, pas seulement le résultat.
- **Le site complet, codes et sauvegarde compris** : lancer les deux configurations de `.claude/launch.json`, `faux-upstash` (une base factice qui parle comme Upstash) puis `nos-revisions` (`vercel dev` sur le port 3170, code parent d'essai `parent-essai-local`). Ensuite :

  ```bash
  uv run outils/essais/parcours_acces.py
  ```

  et `uv run outils/essais/parcours_voix.py`. `vercel dev` demande d'être connecté à Vercel avec un compte qui a accès au projet, et `npm install` une fois.
- **Sur le vrai iPad** : rien ne remplace un essai avec les enfants. Leurs retours se notent dans `TODO.md` le jour même.

## 3. Ajouter ou modifier un module

1. **Faire relire l'idée avant de coder** par `relecteur-pedagogique` (programme, méthode, âge), et par `designer-apps-enfants` dès qu'il y a de l'interface. Les relectures se rangent dans `docs/revues/AAAA-MM-JJ_<sujet>.md`.
2. **Écrire le plan** dans `docs/<module>/PLAN.md` : ce que l'enfant apprend, pourquoi cette méthode, les décisions.
3. **Structure du code**, comme le module des tables :
   - une logique pure et testée en node (`modules/<module>/moteur.js` et ses `*.test.js`) ;
   - une interface qui réutilise le kit (`commun/kit.css`, `commun/kit.js`, classes `kr-*`) ;
   - une page fine par enfant (`henri/<module>.html`, `clara/<module>.html`), sur le modèle de `henri/tables.html` ;
   - une carte sur le portail de l'enfant (`commun/portail.js`).
4. **Stockage** : clé `localStorage` `<enfant>.<module>`, sous try/catch. Pour la sauvegarde en ligne, charger `commun/sync.js` et `commun/synchro-page.js`, et ajouter le module à `MODULES` en tête de `synchro-page.js` (son objet global doit porter `charger` et `sauver`). Si l'état n'a pas la forme de celui des tables, ajouter sa fusion dans `lib/fusion.js` **et** dans `commun/sync.js`, avec un test.
5. **Accès** : un nouveau dossier commun est ouvert aux enfants ; un dossier propre à un enfant suit la règle de `lib/acces.js`. Vérifier avec `test/acces.test.mjs`.
6. **Textes** : le cadre (boutons, mascotte) va dans `commun/textes.js`, en français et en anglais ; le contenu scolaire reste dans sa langue, dans le module.
7. **Voix** : toute phrase que l'app dit doit apparaître dans `commun/outils/phrases.js`, avec exactement le texte que le code passe à `KR.lire`. Puis relancer la fabrication (section 4). Sans ça, la voix de l'appareil prend le relais, en moins bien.
8. **Vérifier au rendu** aux trois formats, en clair et en mode sombre, avant de pousser.

## 4. Fabriquer les voix

```bash
uv run commun/outils/voix.py tables
```

Ne fabrique que les phrases manquantes, puis réécrit `commun/voix/index.json`. Il faut la clé `GOOGLE_GEMINI_API_KEY` dans l'environnement : Louis l'a ; Louise peut utiliser la sienne. La voix (Sulafat) et les consignes de ton sont en tête de `voix.py`. Les changer fabrique de nouveaux fichiers sans écraser les anciens. Vérifier quelques fichiers à l'oreille, ou par transcription, avant de pousser.

## 5. Déployer

- **Depuis le Mac de Louis** : `bash outils/deployer.sh` (une copie sans historique git, voir `ARCHITECTURE.md`, section 7). Une session Claude de Louise pousse sur GitHub, puis demande à Louis de déployer : un push ne déploie pas.
- **Après un déploiement**, vérifier `https://nos-revisions.vercel.app` : la page de code s'affiche, et un enfant connecté retrouve sa progression.
- **Ne jamais écrire un code, une clé ou un jeton dans le dépôt, un commit ou une conversation.** Les variables se posent dans Vercel par leur propriétaire.

## 6. Conventions

- Français partout : code, commentaires, documents, messages de commit.
- Commentaires au minimum : seulement un piège qu'on ne devine pas en lisant le code.
- Cibles tactiles de 56 px au moins, texte de 16 px au moins, rien qui dépende du survol, `prefers-reduced-motion` respecté.
- Jamais de rouge ni de croix pour une erreur d'enfant ; jamais de comparaison entre les deux enfants.
- Un titre de document résume son contenu au lieu de l'annoncer.
