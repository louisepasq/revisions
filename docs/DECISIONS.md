# Décisions de « Nos révisions » : ce qui est tranché, par qui, et pourquoi

Le registre des décisions. **Une décision écrite ici ne se rouvre pas sans un fait nouveau** ; une proposition d'un relecteur qui la contredit arrive aux parents comme une question, jamais comme une correction. Les décisions encore ouvertes sont dans [`TODO.md`](TODO.md).

Format : numéro, date, qui, la décision, la raison, la source.

## Organisation et hébergement

- **D-01, 01/11/2026, Louis : une app par enfant, posée sur l'écran d'accueil de l'iPad, avec sa mascotte en icône.** Raison : que chacun ait « sa petite app ». Source : conversation avec Louis ; mécanique dans `ARCHITECTURE.md`, section 3.
- **D-02, 01/11/2026, Louis : un seul dépôt, `louisepasq/revisions`, où les deux parents écrivent.** Raison : tout doit vivre sur le même site pour que les modules s'ouvrent dans l'app de l'enfant. L'ancien dépôt `LouisVap/tables-multiplication` est archivé.
- **D-03, 01/11/2026, Louis : tout est servi par Vercel (compte perso de Louis), derrière des codes, avec une sauvegarde en ligne de la progression.** Raison : ne rien laisser public (prénoms, mascottes, progression), et que la progression survive à la suppression de l'icône et suive l'enfant d'un appareil à l'autre. Remplace l'hébergement GitHub Pages.
- **D-04, 01/11/2026, Louis : un code parent qui ouvre tout, et un code secret par enfant, choisi par lui, qui n'ouvre que son app.** Le code parent est posé par Louis dans Vercel ; **aucun code ne passe par une conversation ni par le dépôt** (règle de sécurité d'Avest : jamais de mot de passe dans un chat).
- **D-05, 01/11/2026, Louis : appareils visés.** L'iPad 9e génération des enfants, en paysage et en portrait ; ponctuellement les iPhone 17 et 16 Pro des parents. Les deux enfants sont droitiers : pavé et bouton principal à droite.

## Design

- **D-06, 01/11/2026, Louis : aucune contrainte de design héritée.** Le portail et le planisphère de départ ont été faits sans designer ; on vise les meilleures pratiques des apps pour enfants, avant que les enfants ne s'habituent à une interface.
- **D-07, 01/11/2026, choix délégué par Louis : la direction « Gros jeu tactile », corrigée et enrichie des trois autres directions du panel.** Raison : la plus désirable pour un enfant de 9 ans, ses défauts étant corrigeables. Source : `design-system/archive/2026-11-01_panel/README.md`.
- **D-08, 01/11/2026, Louis : les mascottes.** Moussi pour Henri (petite souris grise en bouclette, le nez au-dessus de la bouche, d'après son doudou) ; Pooh Bear pour Clara (petit ours jaune pâle au t-shirt rouge sans inscription, dessin original d'après son doudou). Retouches demandées par les enfants le 01/11 : le nez de Moussi, les bras de Pooh Bear.

## Pédagogie des tables

- **D-09, 01/11/2026, Louis, sur les fiches Eduscol : la méthode des tables.** Familles dans l'ordre d'Eduscol (faciles, ×2, ×4 et ×8, ×3 et ×6, ×9, ×7) ; quatre types de questions ; boîtes de Leitner ; la justesse avant la vitesse ; erreur sans punition, avec astuce et retapage. Source : `tables/PLAN.md`.
- **D-10, 01/11/2026, Louis, sur proposition du relecteur pédagogique : le diagnostic du premier lancement sans chrono visible ; la régularité en jours faits dans la semaine, jamais en série qui retombe à zéro ; « Rapide ! » discret.** La rapidité se mesure jusqu'au premier chiffre tapé.
- **D-11, 01/11/2026, Louis, après le premier essai : la voix est active par défaut dans les tables.** Chaque question est lue dès qu'elle s'affiche (« neuf fois cinq »), et une réponse juste fait dire le fait complet (« neuf fois cinq, quarante-cinq ») avant la question suivante. Raison : faire entrer le fait par l'oreille.
- **D-11 bis, 01/11/2026, Louis et Henri : la voix s'adapte à la rapidité.** Une réponse rapide (premier chiffre en moins de 3 secondes) veut dire que le fait est su : on ne le redit pas, on enchaîne. Une réponse hésitante, ou une erreur, fait dire le fait complet (« sept fois sept, quarante-neuf »), et l'enfant ne peut pas avancer, ni retaper, avant la fin de la phrase. Précise D-11.
- **D-12, 01/11/2026, Louis : les voix sont fabriquées d'avance par Gemini TTS, voix Sulafat, en français et en anglais.** Raison : la qualité, la même que les films Avest, sans dépendre des voix de l'iPad. Coût unique, de l'ordre de 0,50 $ pour le module des tables.

## Langue

- **D-13, 01/11/2026, Louis, sur proposition du relecteur bilingue : le cadre de l'app en anglais britannique, le contenu scolaire en français.** Le portail, les boutons, la mascotte et les fins de séance sont en anglais ; les questions, les astuces et les consignes d'exercice restent en français. Les tables restent en français parce qu'un fait arithmétique se retrouve mieux dans la langue où on l'a appris (Spelke et Tsivkin, 2001). Clara lit bien l'anglais, Henri commence. Le coin parent est en français. Source : `revues/2026-11-01_relecture-anglais.md`.

## Dictée et retour de Claude (décidés, pas encore construits)

- **D-14, 01/11/2026, Louis, sur proposition du relecteur pédagogique : la dictée se prépare avant d'être dictée.**
  - Les mots du jour sont au cœur du module.
  - L'enfant se corrige d'abord, Claude ensuite, en comparant au texte connu.
  - Trois erreurs au plus par retour.
  - La première version du retour sur photo ne porte que sur les dictées.
  - N'importe qui peut charger une dictée, en collant un texte ou à partir d'une photo.

  Source : `DISPOSITIF.md`, sections 4 et 5.

## Méthode de travail

- **D-15, 01/11/2026, Louis : les parents ne sont ni enseignants ni designers.** Dès qu'un choix paraît douteux ou qu'une idée surprend, faire relire par `relecteur-pedagogique` et `designer-apps-enfants` (`.claude/agents/`). Leurs relectures vont dans `docs/revues/`, et leurs propositions ne s'appliquent qu'avec l'accord des parents.

## Écarté, avec la raison

- **La reconnaissance vocale pour répondre à l'oral** : l'API est absente des web apps de l'écran d'accueil sur iPadOS (ticket WebKit 225298). À confirmer par un essai sur l'iPad. Source : `revues/2026-11-01_relecture-audio.md`.
- **Une clé d'API dans le site** : elle serait lisible par tous. Tout appel à un service payant passe par une fonction Vercel.
- **Le pilote, le groupe témoin et le cadrage RGPD du brief ChatGPT** : ils visent un produit pour des classes, pas deux enfants. Source : `tables/PLAN.md`, section 6.
- **Le déploiement automatique au push** : en plan gratuit, Vercel refuse un dépôt privé dont le commit n'est pas du propriétaire du compte (forums Vercel, 01/11/2026). Déploiement par `outils/deployer.sh` depuis le Mac de Louis.
- **Un service de sauvegarde séparé** (`LouisVap/revisions-api`, archivé) : fusionné dans le site quand tout est passé sur Vercel, pour n'avoir qu'une adresse et qu'un code.
