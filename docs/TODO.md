# À faire dans « Nos révisions », par ordre d'importance

Mis à jour le 01/11/2026. Chaque entrée dit qui la porte. Une idée des parents ou des enfants s'ajoute ici le jour même, avec sa date.

## Ce qui attend Louis

- **Poser le code parent dans Vercel** (variable `CODE_PARENT`, production). Tant qu'elle manque, le site répond « en cours de configuration ». Commande, à lancer dans le Terminal du Mac ; elle demande le code et le garde secret :

  ```bash
  cd ~/Projects/Louis-Kids-Revisions && vercel env add CODE_PARENT production
  ```

  Ensuite, `vercel deploy --prod` (ou le demander à Claude).

## Ce qui attend Louise

- **Passer le dépôt `louisepasq/revisions` en privé**, et couper GitHub Pages, qui montre encore l'ancienne version publique avec les prénoms. Sur GitHub : Settings, puis General, Danger Zone, « Change visibility » ; puis Settings, Pages, « Unpublish site ».
- **Brancher Vercel au dépôt**, pour que chaque push sur `main` déploie tout seul. À faire avec Louis : dans le projet Vercel `revisions`, Settings, puis Git, connecter `louisepasq/revisions`. GitHub demande alors à Louise d'autoriser l'app Vercel sur son compte.
- **Le planisphère** : passer à 56 px et au mode anglais, et migrer les clés de stockage : c'est fait (01/11). À elle de dire si elle veut qu'il devienne l'étage « Terre » du zoom de géographie.

## À décider (parents)

- **Les trois ajouts audio proposés par le spécialiste** (`revues/2026-11-01_relecture-audio.md`) : le mode « écoute et réponds », l'enfant qui dit le fait à voix haute après une erreur, et le diagnostic et le défi silencieux. Ce dernier point s'écarte de D-11 : c'est aux parents de trancher.
- **Le zoom de géographie, de l'univers à la région** (idée de Louis du 01/11) : périmètre recommandé dans `revues/2026-11-01_relecture-zoom-geographie.md`. Deux corrections à la liste de départ : la Durance est une rivière, et Cannes n'est ni préfecture ni sous-préfecture (dans les Alpes-Maritimes, c'est Grasse). Le village peut être posé sur la carte ; l'école et la maison sont à laisser de côté.
- **Une petite API d'IA dans l'app** (question de Louis du 01/11) : analyse et reco dans le bilan de la session du 01/11 ; à reprendre ici une fois tranché.

## Retours des enfants

- **Henri, 01/11 : il voit mal son progrès après quelques séances.** Il faut une récompense immédiate et une progression bien visible, comme dans Duolingo ou Simply Piano. Priorité haute : à confier à `designer-apps-enfants`, avec l'avis du relecteur pédagogique.
- **Henri, 01/11 : un widget sur l'écran d'accueil de l'iPad**, qui dit où il en est et ce qu'il doit faire aujourd'hui. Priorité 2. Une web app ne peut pas créer de widget iOS : il faudrait une petite app native, ou l'app Scriptable qui lirait la progression en ligne. À instruire.

## Prochains modules

- **Dictée** : décidée (D-14), pas encore construite. D'abord demander aux maîtresses leur façon de faire : la forme de la dictée, les codes de correction, la liste de mots de la semaine.
- **Retour de Claude sur une photo** : après la dictée, par une fonction Vercel qui garde la clé.
- **Tables** : le défi d'une minute, « Découvrir une famille », « Practise it » depuis la grille.
- **Spelling** : la dictée anglaise, avec le même moteur.
