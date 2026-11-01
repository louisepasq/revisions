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

  Ce sont les tests du serveur, de la fusion, des accès, du portail (catalogue, « Today », résumés publiés) et des moteurs des modules.
- **Le portail au rendu** : `uv run commun/test_portail.py` (Henri et Clara, peu de données et état riche, aux trois formats ; captures dans `commun/captures/`).
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
   - une page fine par enfant (`henri/<module>.html`, `clara/<module>.html`), sur le modèle de `henri/tables.html`, avec `data-module="<module>"` sur `<html>` et `commun/modules.js` chargé avant `commun/sync.js`.
4. **Le brancher au portail : une ligne au catalogue et un résumé, `commun/portail.js` ne change pas.**
   - Une ligne dans `commun/modules.js` : titre court en `{ en, fr }`, matière, icône du sprite de `kit.js` (en ajouter une au sprite au besoin), page, enfants, état (`actif` ou `bientot`), et `objet` si son objet global porte `charger` et `sauver`.
   - Le module publie son résumé par `etat.resume = KR.publierResume('<module>', resume)` à son ouverture et en fin de séance : progrès, ce qui est dû, jours pratiqués, phrase pour le coin parent. Contrat, règles et exemple : `ARCHITECTURE.md`, section 8 ; modèles : `modules/tables/resume.js` et `modules/zoom/resume.js`, testés dans `test/resume.test.js`.
   - Vérifier au rendu : `uv run commun/test_portail.py`, en regardant les captures de `commun/captures/`.
5. **Stockage** : clé `localStorage` `<enfant>.<module>`, sous try/catch. La sauvegarde en ligne suit le catalogue (`commun/synchro-page.js` n'a rien à apprendre) ; un état rangé ailleurs se déclare `synchro: false`. Si l'état n'a pas la forme de celui des tables, ajouter sa fusion dans `lib/fusion.js` **et** dans `commun/sync.js`, avec un test ; le résumé, lui, se fusionne déjà pour tous les modules (le plus récent gagne).
6. **Accès** : un nouveau dossier commun est ouvert aux enfants ; un dossier propre à un enfant suit la règle de `lib/acces.js`. Vérifier avec `test/acces.test.mjs`.
7. **Textes** : le cadre (boutons, mascotte) va dans `commun/textes.js`, en français et en anglais. Un module part en anglais britannique, consignes comprises (D-21) ; le français n'y entre que pour une matière qui l'exige. Règle complète : `ARCHITECTURE.md`, section 9.
8. **Voix** : toute phrase que l'app dit doit apparaître dans `commun/outils/phrases.js`, avec exactement le texte que le code passe à `KR.lire`. Puis relancer la fabrication (section 4). Sans ça, la voix de l'appareil prend le relais, en moins bien.
9. **Vérifier au rendu** aux trois formats, en clair et en mode sombre, avant de pousser.

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

## 7. Travailler avec des agents sans brûler de tokens

Le 01/11/2026, cinq agents ont tourné de 20 à 26 minutes chacun, pour 1,7 million de tokens en tout. Le gros venait de deux choses : chaque agent relisait des centaines de captures d'écran (une image coûte cher), et tous tournaient sur le modèle le plus haut. Règles qui en sortent :

- **Une petite modification se fait sans agent** : une formulation, un libellé, un réglage. Un agent démarre en relisant tout le contexte, c'est son coût fixe.
- **Un seul agent par groupe de fichiers** : deux chantiers qui touchent les mêmes fichiers (l'accueil, les textes) vont dans le même brief, pas dans deux agents successifs.
- **Les contrôles mécaniques restent aux parcours** (débordement, cibles de 56 px, erreurs, rouge) ; l'agent ne regarde que les captures des écrans qu'il a changés, de préférence en planche (plusieurs écrans réduits sur une image), et un seul format en grand.
- **Il ne relance que le parcours du module qu'il touche** ; la suite complète tourne une fois, avant de déployer.
- **Le modèle suit le travail** : une traduction, un renommage ou une mise à jour de doc sur un modèle intermédiaire (Sonnet) ; le haut de gamme pour le design, la pédagogie et le moteur.
