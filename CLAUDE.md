# Nos révisions : consignes pour Claude (sessions de Louise et de Louis)

Les apps de révision d'Henri (CM1, mascotte Moussi) et de Clara (CM2, mascotte Pooh Bear), faites par leurs parents, Louise et Louis. Chaque enfant a son app sur l'écran d'accueil de l'iPad. Tout est servi par **Vercel** (projet `revisions`, compte perso de Louis) à `https://nos-revisions.vercel.app`, derrière un code parent et un code par enfant.

## À lire avant toute modification, dans cet ordre

1. [`docs/DECISIONS.md`](docs/DECISIONS.md) : ce qui est tranché. Une décision écrite ne se rouvre pas sans un fait nouveau.
2. [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) : le stack, les fichiers, l'accès, la sauvegarde en ligne, les voix, le déploiement.
3. [`docs/CONTRIBUER.md`](docs/CONTRIBUER.md) : tester, ajouter un module, fabriquer les voix, déployer.
4. [`docs/TODO.md`](docs/TODO.md) : ce qui reste, et qui le porte.
5. Selon le sujet :
   - [`docs/DISPOSITIF.md`](docs/DISPOSITIF.md) : la pédagogie commune et les modules ;
   - `docs/<module>/PLAN.md` ;
   - `modules/<module>/README.md` ;
   - [`docs/design-system/DESIGN-SYSTEM.md`](docs/design-system/DESIGN-SYSTEM.md).

## Les règles qui tiennent sans exception

- **Les parents ne sont ni enseignants ni designers.** Avant de construire un module, et dès qu'un choix pédagogique ou d'interface paraît douteux ou qu'une idée surprend, faire relire par `relecteur-pedagogique` et `designer-apps-enfants` (`.claude/agents/`). Les relectures vont dans `docs/revues/`, et les propositions ne s'appliquent qu'avec l'accord des parents.
- **Aucun code, aucune clé, aucun jeton** dans le dépôt, un commit ou une conversation. Le code parent vit dans la variable Vercel `CODE_PARENT`, posée par Louis ; les codes des enfants sont choisis sur la page `/parents/` et rangés en empreinte dans la base.
- **Une décision prise par un parent s'écrit dans `docs/DECISIONS.md`** dans le même geste, et un retour des enfants dans `docs/TODO.md`.
- **Tester avant de pousser** :
  - `npm test` ;
  - le parcours Playwright du module touché, en regardant ses captures ;
  - pour l'accès et la sauvegarde, les essais de `outils/essais/`.
- **Le site sert de vrais enfants** : jamais de rouge ni de croix pour une erreur, jamais de comparaison entre les deux, des cibles de 56 px au moins, et le cadre en anglais britannique, le contenu scolaire en français.
- **Le planisphère (`henri/planisphere.html`) est le module de Louise** : on lui propose, on ne le refait pas sans son accord.

## Déployer

`vercel deploy --prod` depuis le clone de Louis. Une session de Louise pousse sur GitHub puis demande le déploiement, tant que Vercel n'est pas branché au dépôt (voir `docs/TODO.md`). L'ancienne adresse GitHub Pages est à couper quand le dépôt passera en privé.
