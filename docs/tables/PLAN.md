# Tables de multiplication : plan de l'appli

Le module des tables du site « Nos révisions » : une petite appli web, ludique et sonore, pour que deux enfants (un en CM1, une en CM2) apprennent leurs tables sur iPad. Publiée sur GitHub Pages depuis ce dépôt, comme les autres modules.

**Statut au 01/11/2026** : recherche faite, décisions arrêtées (section 4), maquette des écrans faite (`archive/mockup_ecrans_2026-11-01.html`), rien n'est encore codé. Prochaine étape : aligner la maquette sur le système de design commun, puis coder.

Provenance de chaque affirmation : **[source]** lu à la source le 01/11/2026 ; **[recherche]** étude citée, non relue en entier ; **[brief GPT]** repris d'un brief rédigé avec ChatGPT le 01/11/2026 ; **[appréciation]** avis de conception.

## 1. Ce que l'école attend : les tables sont dues en fin de CE2, le CM les automatise et les chronomètre

- **[source]** Programme de cycle 3 en vigueur : arrêté du 10 avril 2025, BO n° 16 du 17 avril 2025, une annexe par niveau, applicable en CM1 depuis la rentrée 2025 et en CM2 depuis la rentrée 2026 (article 3 de l'arrêté).
- **[source]** La maîtrise des tables jusqu'à 9 est attendue en fin de cycle 2 ; au cours moyen, on consolide et on automatise. Le livret d'accompagnement CM1 d'Eduscol : les automatismes y portent « principalement [sur] les faits numériques et les procédures de calcul ».
- **[source]** L'évaluation nationale de début de CM2 donne **1 minute** pour compléter le plus de produits possible sans les poser : le résultat doit sortir de mémoire, pas se reconstruire.
- **[source]** Le CM2 ajoute des procédures appuyées sur les tables : multiplier par 10, 100, 1 000 ; 4 x 30, 90 x 20 ; distributivité simple ; diviser par 4 ou 8 ; multiplier par 5 et par 25.

## 2. Comment les apprendre : par familles, en se rappelant activement, souvent, la justesse avant la vitesse

- **[source] Par familles de propriétés, pas dans l'ordre des tables** (fiche d'intervention Eduscol de début de CM2) :
  - les faciles d'abord : x 0 (rend nul), x 1 (neutre), x 10 (lien avec l'écriture des nombres, sans la règle « on ajoute un zéro », fausse sur les décimaux), x 5 (moitié de x 10) ;
  - x 2 (les doubles), puis x 4 et x 8 (doubles des doubles) ;
  - x 3 (« le double plus une fois »), puis x 6 (double de x 3) ;
  - x 9 appuyé sur x 10 (4 x 9 = 40 - 4) ;
  - x 7 en dernier, appuyé sur x 6 ou x 8.
- **[source] La commutativité divise le travail par deux** : une fois x 0, x 1, x 10 et la symétrie retirés, il reste **36 résultats** à mémoriser vraiment (produits de 2 à 9). **[brief GPT]** Nuance : 7 x 8 et 8 x 7 se suivent quand même séparément dans l'appli, l'un pouvant sortir plus vite que l'autre.
- **[source] Les carrés servent de repères** (3 x 3 ... 8 x 8), à revoir régulièrement.
- **[source] Quatre types de questions** : le produit (5 x 4 = ?) ; le facteur manquant (7 x ? = 56) ; les décompositions (? x ? = 48) ; multiple et diviseur (48 est-il un multiple de 6 ?).
- **[source] Montrer ce qui est su** : Eduscol propose d'entourer sur la table de Pythagore les produits maîtrisés, pour que l'enfant voie ce qu'il lui reste.
- **[source] Rebrassage par boîtes de Leitner** (livret CM1) : un résultat raté revient vite, un résultat réussi revient de plus en plus tard.
- **[recherche] Se rappeler bat réciter** : sur les tables de 3 et 4, l'entraînement par cartes a donné une meilleure fluidité, à court et à long terme, que la récitation à voix haute (Ophuis-Cox, Catrysse et Camp, 2023, 48 élèves).
- **[brief GPT] La justesse avant la vitesse** : le chrono n'arrive qu'une fois les réponses justes. **[source]** Eduscol le veut ensuite quotidien, avec un temps qui se réduit, présenté « comme un nouveau défi pour l'élève et non pas comme une source d'inquiétude ».
- **[brief GPT] Un résultat n'est pas « su » après trois bonnes réponses d'affilée** dans la même séance : il faut qu'il ressorte juste et vite à des jours différents.
- **[source] Les résultats qui résistent le plus** : 7 x 4, 3 x 9, 6 x 7, 8 x 7, 9 x 7, 9 x 8, et le facteur manquant (7 x ? = 56, ? x 9 = 81).

## 3. Conception : deux mascottes, une grille qui se colorie, cinq minutes par jour

**[appréciation]** pour toute la section, sauf mention.

### Profils : une mascotte par enfant, aucun prénom

- **Pooh Bear**, petit ours jaune au t-shirt rouge (CM2) et **Moussi**, petite souris grise (CM1), dessinés d'après les deux doudous (vidéos du 01/11/2026) : ours jaune pâle au museau clair, nez brun, sourcils arqués, t-shirt rouge sans inscription ; souris grise en bouclette, grandes oreilles rondes doublées de crème, museau pointu, gros nez noir.
- Chaque mascotte est l'icône de l'app de son enfant (section 3 bis), et le niveau CM1 ou CM2 est rattaché à l'app.
- Dessin original (SVG), sans copier celui d'un personnage existant : le dépôt est public.

### Écrans

- **La grille** : la table de Pythagore 10 x 10, chaque case se colore à mesure que le résultat est acquis (gris, bronze, argent, or). C'est la récompense centrale et la carte de ce qui reste.
- **Entraînement du jour** (environ 5 minutes) : rappels dus aujourd'hui, mélange des quatre types de questions, reprise des erreurs à la fin. Pavé numérique géant. Régularité affichée en jours faits dans la semaine (décision du 01/11/2026), pas en série qui retombe à zéro. « Rapide ! » reste, discret.
- **Découvrir une famille** : on débloque les familles dans l'ordre de la section 2, chacune avec son astuce animée et sa représentation en rectangle (7 x 8, c'est 7 rangées de 8).
- **Défi 1 minute** : le format de l'évaluation nationale, contre son propre record seulement, ouvert une fois la justesse installée.
- **À voix haute** (option, **[brief GPT]**) : l'appli lit la question, l'enfant répond à l'oral, avec repli sur le pavé si la reconnaissance hésite. Utile en voiture. À tester sur l'iPad avant de le promettre (section 5).
- **Coin parent** : des phrases plutôt que des chiffres, par exemple « 12 multiplications sont devenues automatiques cette semaine, 4 restent fragiles : 7 x 8, 9 x 7, 6 x 7, 8 x 4 ».

### Moteur

- **Un suivi par résultat** : juste ou faux, temps de réponse, dates. Un résultat passe au niveau suivant quand il sort juste et en moins de 3 secondes (seuil à ajuster) à des jours différents.
- **Les résultats acquis reviennent de temps en temps**, à une semaine puis à un mois, pour vérifier qu'ils tiennent.
- **Diagnostic au premier lancement** : une minute de questions place chaque enfant dans les boîtes, pour ne pas faire refaire la table de 2 à qui la sait ; le temps de réponse est mesuré en silence, **sans chrono visible** (décision du 01/11/2026, sur proposition du relecteur pédagogique).

### Erreurs : corriger sans punir, puis faire redire

**[brief GPT]**, cohérent avec Eduscol, qui demande d'expliciter la stratégie pour retrouver un résultat oublié.

1. Correction neutre : « 7 x 8 = 56 », sans croix rouge.
2. L'astuce de la famille : « 7 x 4 = 28, et le double fait 56 ».
3. L'enfant retape la bonne réponse sans aide.
4. La question revient quelques questions plus loin, puis aux séances suivantes.
5. Une confusion qui se répète (56 et 54) déclenche des questions qui opposent les deux résultats.

### Son

- Bruitages produits par le navigateur (Web Audio : tintement pour une bonne réponse, son doux pour une erreur, fanfare pour un record), sans fichier ni droit d'auteur.
- Voix française du navigateur pour lire les questions, **coupée par défaut** dans les tables (décision du 01/11/2026). Bouton muet.

### Technique

- Un seul `index.html`, sans bibliothèque ni build, publié sur GitHub Pages. Pensé pour l'iPad en paysage et en portrait.
- **Progression gardée sur l'iPad**, aucun serveur. **L'appli s'ajoute à l'écran d'accueil** : Safari efface les données d'un site qu'on n'a pas ouvert depuis sept jours, une appli posée sur l'écran d'accueil n'a pas cette limite (à vérifier sur l'iPad).

## 3 bis. Accès : une app par enfant sur l'écran d'accueil, toutes servies par un seul site

Demande de Louis du 01/11/2026 : un lien par enfant, posé sur l'écran d'accueil de l'iPad avec sa mascotte en icône, pour que chacun ait « sa petite app ». Le site de révisions de Louise existe déjà (`louisepasq.github.io/revisions/`, un portail par enfant, le planisphère dans `henri/`).

- **[source] iPadOS 26 ouvre en web app, par défaut, tout site ajouté à l'écran d'accueil** depuis le bouton Partager (un interrupteur « Ouvrir comme app web » le désactive) ; l'icône et le nom viennent de `apple-touch-icon` et du manifeste (Heise, MacRumors).
- **[source] Une web app de l'écran d'accueil a son propre stockage, séparé de Safari**, par conception de WebKit ; et son compteur de sept jours avance avec ses jours d'utilisation, pas avec le calendrier. Conséquence : la progression vit dans l'app de l'écran d'accueil ; ouvrir le même lien dans Safari repart de zéro.
- **[appréciation] Tout doit vivre sur le même site**, sinon un module d'un autre site s'ouvre dans une feuille Safari par-dessus l'app de l'enfant, avec un autre stockage. D'où le choix du 01/11/2026 : tout vit dans ce dépôt, `louisepasq/revisions`.

Organisation proposée :

```
revisions/
  index.html                 page des parents (celle de Louise)
  commun/                    kit.css, kit.js, sons, polices : partagés
  modules/tables/tables.js   le moteur des tables, écrit une fois
  henri/                     l'app d'Henri
    index.html               son portail : ses modules
    manifest.webmanifest     nom, couleur, start_url et scope = /revisions/henri/
    icone-180.png            Moussi en icône
    planisphere.html         module existant
    tables.html              page fine qui charge modules/tables avec data-enfant="henri"
  clara/                     même chose avec Pooh Bear
```

- **Une page fine par enfant et par module, le code écrit une fois** : la duplication se limite à quelques lignes, ce que Louis accepte.
- **La progression se range par enfant et par module** (`henri.tables.*`), même si chaque app a déjà son stockage : rien ne casse si deux apps du même site partagent leurs données (point à tester).
- **L'écran « Qui joue ? » disparaît** : chaque app sait déjà quel enfant l'ouvre.
- **À prévoir dans le coin parent** : un export et un import de la progression, puisque supprimer l'icône efface tout.

## 4. Décisions arrêtées le 01/11/2026

- Une mascotte par enfant, qui sert aussi d'icône à son app. Les prénoms peuvent apparaître (le portail de Louise les affiche déjà).
- Un lien et une app par enfant sur l'écran d'accueil (section 3 bis).
- Appareil : l'iPad 9e génération des enfants, dans les deux orientations, et ponctuellement les iPhone des parents (détail dans `../DISPOSITIF.md`, section 1).
- Un seul dépôt et un seul site : `louisepasq/revisions` (le dépôt de Louise), où les deux parents écrivent ; le plan et la maquette y ont été déplacés depuis `LouisVap/tables-multiplication`, archivé.
- Diagnostic d'une minute au premier lancement : oui, sans chrono visible. Les deux enfants sont droitiers : pavé à droite en paysage.

## 5. Points à tester sur l'iPad avant de les promettre

- La reconnaissance vocale des nombres en français dans Safari, avec une voix d'enfant.
- La conservation de la progression une fois l'appli posée sur l'écran d'accueil.
- La voix française disponible pour lire les questions.
- Deux apps du même site posées sur l'écran d'accueil partagent-elles leur stockage ?
- L'icône et le nom affichés sous l'icône, depuis Safari et depuis Chrome.

## 6. Repris du brief ChatGPT, et ce qui en est écarté

Repris : la justesse avant la vitesse, le temps de réponse comme critère, les jours différents avant de dire « su », le suivi séparé de 7 x 8 et 8 x 7, la séquence de correction d'erreur, le mode à voix haute, le résumé parent en phrases, le retour des résultats acquis.

Écarté, avec la raison :

- **Le pilote, le groupe témoin et les indicateurs de succès** : le brief vise un produit pour des classes ; ici deux enfants, on regarde la grille.
- **La séance de 8 minutes à quatre phases chronométrées** : 5 minutes tiennent mieux à 8 et 10 ans, et la reprise des erreurs se fait dans le flux.
- **Le mode vocal comme cœur de l'appli** : sa fiabilité sur iPad n'est pas acquise ; il reste une option jusqu'au test.
- **La seule table de 2 à 10 sans ordre** : le brief ignore la progression par familles et les quatre types de questions d'Eduscol, qui structurent ce plan.
- **Le cadrage RGPD** : aucune donnée ne quitte l'iPad.

## Sources

- [Fiche d'intervention Eduscol, évaluations de début de CM2, « Mémoriser des faits numériques et des procédures »](https://eduscol.education.gouv.fr/sites/default/files/document/2026evaluationdebutcm2mathematiquesficheinterventionmemoriserfaitsnumeriquesprocedures-129478.pdf) (août 2026)
- [Livret d'accompagnement Eduscol, mathématiques CM1](https://eduscol.education.gouv.fr/sites/default/files/document/2026livretaccompagnementmathematiquescm1-129268.pdf) (2026)
- [Livret d'accompagnement Eduscol, mathématiques CM2](https://eduscol.education.gouv.fr/sites/default/files/document/2026-livret-accompagnement-mathematiques-cm2-128556.pdf) (2026, non relu en détail)
- [Ophuis-Cox, Catrysse et Camp (2023), le rappel actif pour apprendre les tables](https://research.ou.nl/en/publications/the-effect-of-retrieval-practice-on-fluently-retrieving-multiplic/)
- [Présentation des programmes de cycle 3, académie d'Orléans-Tours](https://pedagogie.ac-orleans-tours.fr/documents/pdf/presentation_programmes_maths_c3.pdf) (référence de l'arrêté du 10 avril 2025)
