# Relecture du 01/11/2026 : le cadre de l'app en anglais, le contenu scolaire en français, et un module « Spelling » à part

Question des parents : Henri (CM1) et Clara (CM2) parlent français et anglais, vivent dans le sud de la France, vont à l'école en français et ont plus d'occasions de parler français. Où, dans « Nos révisions », passer à l'anglais simple ou entièrement à l'anglais, et où rester en français ?

Relecteur : `relecteur-pedagogique`, avec en plus une expérience des enfants bilingues français-anglais scolarisés en France. Repères : **[programme]** texte officiel lu ; **[recherche]** étude lue (résumé ou texte, précisé dans la liste des sources) ; **[pratique]** usage de classe et expérience.

## Sources lues le 01/11/2026

- [Spelke et Tsivkin (2001), « Language and number: a bilingual training study », Cognition 78(1), 45-88](https://pubmed.ncbi.nlm.nih.gov/11062322/) : résumé lu sur PubMed ; le texte intégral n'a pas pu être ouvert.
- [Salillas et Wicha (2012), « Early learning shapes the memory networks for arithmetic », Psychological Science 23(7)](https://scholars.uthscsa.edu/en/publications/early-learning-shapes-the-memory-networks-for-arithmetic-evidence/) : résumé lu ; texte intégral non lu ([DOI](https://doi.org/10.1177/0956797612446347)).
- [Martinez-Lincoln, Cortinas et Wicha, enseignants bilingues et faits de multiplication, Neuroscience Letters (manuscrit sur PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC4267922) : texte lu.
- [Van Rinsveld et coll. (2015), « The relation between language and arithmetic in bilinguals », Frontiers in Psychology 6:265](https://pmc.ncbi.nlm.nih.gov/articles/PMC4357777) : texte lu, sauf la fin.
- [Hoff et coll. (2012), « Dual language exposure and early bilingual development », Journal of Child Language 39(1)](https://pmc.ncbi.nlm.nih.gov/articles/PMC4323282/) : discussion lue.
- [Seymour, Aro et Erskine (2003), « Foundation literacy acquisition in European orthographies », British Journal of Psychology 94](https://discovery.dundee.ac.uk/en/publications/foundation-literacy-acquisition-in-european-orthographies/) : résumé lu.
- [Programme national anglais, « English Appendix 1: Spelling »](https://assets.publishing.service.gov.uk/media/5a7ccc06ed915d63cc65ce61/English_Appendix_1_-_Spelling.pdf) et [programme d'anglais des Key Stages 1 et 2](https://assets.publishing.service.gov.uk/media/5a7de93840f0b62305b7f8ee/PRIMARY_national_curriculum_-_English_220714.pdf) : passages sur les listes de mots et la dictée lus.
- Dans le dépôt : `docs/DISPOSITIF.md`, `docs/tables/PLAN.md`, `docs/design-system/DESIGN-SYSTEM.md`, `commun/kit.js`, et le texte du planisphère de Louise (`henri/planisphere.html`).

## 1. La règle d'ensemble : la langue du contenu commande la langue de la consigne, tout ce qui l'entoure peut passer en anglais

Une règle simple, que les parents peuvent appliquer seuls à chaque nouveau module :

- **Le cadre en anglais** : portail, boutons, navigation, mascotte, encouragements, écrans de fin. Ce sont des phrases courtes, répétées chaque jour, comprises grâce au contexte : c'est la meilleure exposition qu'une app puisse offrir, et elle ne coûte rien à l'apprentissage scolaire. **[pratique]**
- **Le contenu scolaire en français** : les questions de tables, la dictée, les explications d'erreur, les règles d'orthographe et de calcul. L'enfant sera évalué en français, avec le vocabulaire de sa classe (« participe passé », « double », « facteur manquant »). **[pratique]**, appuyé pour les tables par la recherche de la section 3.
- **Le contenu anglais en anglais** : une dictée anglaise (spelling), un mode anglais du planisphère. Jamais mélangé, dans la même séance, au contenu français équivalent. **[pratique]**

Un ordre de grandeur honnête pour les parents : **l'app ne sera qu'un petit levier pour l'anglais.** Chez les jeunes bilingues, la part de chaque langue dans ce que l'enfant entend se retrouve dans son vocabulaire et sa grammaire dans cette langue **[recherche]** (Hoff et coll., 2012 ; l'étude porte sur des enfants de 2 ans environ, l'extrapolation à 9 et 10 ans est mon appréciation). Quelques minutes par jour d'interface anglaise s'ajoutent, mais le gros de l'anglais viendra de la lecture, des livres audio, des films et des conversations. L'app peut surtout faire ce que le reste fait mal : **l'écrit anglais** (lire et orthographier), que l'école française ne travaille pas.

## 2. Ce qui est bien et doit rester

- **Le haut-parleur sur chaque bulle et chaque question** (principe 3 du système de design) : c'est ce qui rend l'anglais possible sans risque, même si un enfant lit moins bien l'anglais qu'il ne le parle. **[pratique]**
- **La voix française pour les questions des tables et la dictée**, décidée dans `docs/tables/PLAN.md` et `docs/DISPOSITIF.md` : la recherche de la section 3 la conforte.
- **La progression rangée par enfant** (`henri.reglages.*`) : un réglage de langue par enfant s'y range sans rien changer à l'architecture.
- **Pooh Bear** : un personnage dont le nom est déjà anglais, une mascotte qui parle anglais lui va naturellement.

## 3. Partie par partie, de la plus importante à la plus secondaire

### 3.1 Questions des tables, à l'écrit et à voix haute : français

**Aujourd'hui** : questions en français, voix française, astuce de correction en français. **Reco : garder le français**, et n'ouvrir l'anglais qu'en bonus plus tard, sur les seuls résultats déjà « en or ».

**Pourquoi** :

- **[recherche] Les faits numériques exacts se retrouvent mieux dans la langue où on les a appris.** Spelke et Tsivkin (2001) ont entraîné des étudiants bilingues russe-anglais à de nouveaux faits arithmétiques dans une langue, puis les ont interrogés dans les deux : les sujets « retrieved information about exact numbers more effectively in the language of training ». Les faits approximatifs et les faits non numériques (géographie, histoire), eux, passaient d'une langue à l'autre sans perte. Résumé lu, texte intégral non lu.
- **[recherche] Le lien se fixe à l'âge où l'on apprend.** Salillas et Wicha (2012), chez des adultes bilingues espagnol-anglais qui avaient appris l'arithmétique dans une seule langue : les multiplications simples présentées dans la langue d'apprentissage donnent des réponses cérébrales plus fortes et plus proches de celles des chiffres, même quand cette langue est devenue la plus faible ; les auteurs concluent que ces réseaux de mémoire se mettent en place au premier apprentissage. Résumé lu.
- **[recherche] Le lien n'est pas figé, mais il faut beaucoup de pratique pour l'assouplir.** Chez des enseignants bilingues qui enseignent depuis des années dans leur autre langue, l'avantage de la langue d'apprentissage disparaît (Martinez-Lincoln, Cortinas et Wicha, 14 adultes). Chez des élèves luxembourgeois scolarisés en allemand puis en français, les additions simples finissent par être aussi justes dans les deux langues, mais restent plus rapides en allemand, et les calculs plus complexes gardent l'avantage de la première langue de l'école jusqu'à l'âge adulte (Van Rinsveld et coll., 2015, 193 élèves de 12 à 22 ans).
- **Limite** : aucune de ces études ne porte sur des enfants de 9 et 10 ans en train d'automatiser leurs tables. L'extrapolation est la mienne, mais elle va toujours dans le même sens.

**Conséquence pour Henri et Clara** : ils ont appris leurs tables en CE2, en français. Le CM les veut automatiques et rapides, et l'évaluation nationale de début de CM2 les chronomètre en français (`docs/tables/PLAN.md`, section 1). Faire réciter « seven times eight » maintenant, c'est leur faire chercher le résultat par un chemin moins rapide au moment où l'on mesure justement la vitesse.

**Option plus tard [appréciation]** : un « défi en anglais » sur les seuls résultats en or, quand la grille est bien avancée. Il entraîne les nombres anglais à l'oral, sans gêner l'automatisation en français. Pas avant que l'évaluation de Clara soit passée.

À noter : les nombres tapés au pavé numérique ne dépendent d'aucune langue ; c'est la voix intérieure (« sept fois huit, cinquante-six ») qui porte le fait mémorisé, d'où l'enjeu de la voix lue par l'iPad et du mode « À voix haute ».

### 3.2 Dictée : français pour la dictée, et un module « Spelling » anglais à part

**Dictée française : français, sans discussion.** Orthographe, règles d'accord, vocabulaire de la classe : tout est en français. Seuls les boutons du cadre peuvent passer en anglais (« Repeat », « Next sentence »), avec la voix de la dictée qui reste française. **[pratique]**

**Spelling : oui, c'est la meilleure place pour l'anglais dans tout le site**, parce que c'est l'écrit anglais que ni l'école ni la maison ne travaillent. **[pratique]**

- **[programme]** Le programme anglais publie des listes de mots obligatoires pour les « years 3 and 4 » et « years 5 and 6 » (English Appendix 1), mélange de mots fréquents et de mots souvent mal écrits, et demande dès les years 3 et 4 d'écrire de mémoire de courtes phrases dictées par l'enseignant (programme des Key Stages 1 et 2). Henri et Clara ont l'âge des years 5 et 6, mais pour des enfants qui n'ont jamais appris à écrire l'anglais à l'école, **commencer par la liste des years 3 et 4** est plus sûr. **[appréciation]**
- **[recherche] L'orthographe anglaise est la plus difficile d'Europe à acquérir** : dans l'étude de Seymour, Aro et Erskine (2003), les débuts en lecture vont plus de deux fois moins vite en anglais que dans les langues à orthographe régulière ; le français fait aussi partie des langues difficiles. Prévoir une progression lente, des listes courtes (8 à 10 mots), et aucune comparaison avec la dictée française.
- **Format [pratique]**, celui des « spelling tests » anglais : le mot, une phrase qui le contient, le mot répété ; puis, plus tard, une courte phrase dictée. Même moteur que la dictée française, avec une voix anglaise.
- **Jamais dans la même séance que la dictée française [pratique]** : passer d'un système orthographique à l'autre en cinq minutes mélange les deux. Une séance, une langue.
- **Une liste à part pour les mots presque jumeaux [pratique]** : *address* et *adresse*, *exercise* et *exercice*, *example* et *exemple*, *apartment* et *appartement*. Ce sont les pièges propres aux bilingues ; les travailler de face, en les opposant, vaut mieux que les laisser surgir au hasard d'une dictée.

### 3.3 Interface et consignes : anglais pour le cadre, réglable par enfant ; la consigne d'exercice suit la langue du contenu

**Reco** : un réglage de langue par enfant dans le coin parent, **anglais par défaut**, qui bascule le portail, les boutons, les menus et les écrans de fin. La consigne d'un exercice (« Où se trouve la mer Baltique ? », « Écoute et écris la phrase ») reste dans la langue de son contenu.

**Pourquoi** :

- Ce vocabulaire est petit, répété, et lisible grâce au contexte et aux icônes : on comprend « Let's go » sans le lire. **[pratique]**
- Une consigne d'exercice mal comprise coûte une erreur qui n'apprend rien ; quand le contenu est français, la consigne en français évite ce bruit. **[pratique]**
- **Question à trancher par les parents** : Henri et Clara lisent-ils l'anglais, ou seulement le parlent-ils ? Les enfants bilingues scolarisés dans l'autre langue lisent souvent bien moins la langue de la maison qu'ils ne la parlent. Si c'est le cas, le cadre en anglais reste possible grâce au haut-parleur, et il devient en plus un petit entraînement à la lecture anglaise.

### 3.4 Mascotte et encouragements : anglais

**Reco** : Moussi et Pooh Bear parlent anglais, toujours. « Well done! », « Nearly! Let's look again », « Three days in a row! ».

**Pourquoi** :

- Des formules courtes, positives, chargées d'émotion et répétées chaque jour : la forme d'anglais qui s'ancre le mieux, sans aucun risque pour le contenu. **[pratique]**
- Un personnage qui parle toujours la même langue donne un repère stable, comme un parent qui parle toujours anglais à l'enfant. **[pratique]**
- **Une limite** : après une erreur, la mascotte encourage en anglais (« Nearly! »), puis la carte de correction donne l'astuce en français (« 7 x 4 = 28, et le double fait 56 »). Deux bulles distinctes, chacune dans sa langue, pas une phrase mélangée. **[pratique]**

### 3.5 Planisphère : choix de la langue, français par défaut, mode anglais une fois les noms français acquis

**Aujourd'hui** : tout en français (« l'océan Indien », « la Manche », « mer des Caraïbes »), fait par Louise.

**Reco** : garder le français par défaut, parce que c'est l'orthographe et l'article français que la classe évaluera (« l'océan Glacial Arctique »). Ajouter un interrupteur « Noms en anglais » une fois les noms français sus.

**Pourquoi c'est sans risque** : **[recherche]** dans Spelke et Tsivkin (2001), les faits non numériques, dont des faits de géographie, se retrouvaient aussi bien dans les deux langues, quelle que soit celle de l'apprentissage. Savoir où est l'océan Indien ne dépend pas de la langue ; seul le nom change.

**Points d'attention pour le mode anglais [pratique]** :

- *La Manche* se dit *the English Channel* : un bel exemple de nom qui dépend de qui le donne, à montrer aux enfants.
- *L'océan Austral* se dit *the Southern Ocean*.
- Une partie des manuels anglophones, surtout américains, compte « Australia » comme continent plutôt que l'Océanie : écrire *Oceania (Australia)* évite une contradiction avec le français.

### 3.6 Retour de Claude sur une photo : la langue du travail photographié

**Reco** : une dictée française reçoit un retour en français, avec les mots de la classe ; un spelling ou un petit texte anglais reçoit un retour en anglais. La mascotte peut ouvrir le retour d'une formule anglaise courte si l'enfant a le cadre en anglais, mais l'explication des erreurs reste dans la langue du travail.

**Pourquoi** : la règle qui permet de corriger (« le participe passé avec avoir... ») doit être formulée comme en classe, sinon le retour contredit la maîtresse. **[pratique]** Côté technique, c'est une ligne du cadre envoyé à Claude (« réponds dans la langue de la feuille »), sans rien ajouter au relais.

### 3.7 Coin parent : français

**Reco** : français, la langue de travail des parents et des documents du dépôt. Ajouter une phrase utile à leur objectif : « Cette semaine, Henri a passé 25 minutes en anglais dans l'app (spelling, planisphère, défi anglais) ». **[appréciation]**

## 4. Ce qui est faisable simplement dans le site

Tout tient dans `commun/kit.js`, sans bibliothèque ni serveur. Aujourd'hui `KR.lire(texte)` force `u.lang = 'fr-FR'` et prend la première voix française.

1. **Un réglage de langue par enfant** : `henri.reglages.langue` (`fr` ou `en`), lu par le kit au chargement, réglable dans le coin parent avec le composant interrupteur du système de design. Il ne commande que le cadre.
2. **La voix suit la langue** : `KR.lire(texte, langue)`, avec `u.lang = 'en-GB'` ou `'en-US'` et une voix filtrée sur `^en`, sinon sur `^fr`. Choisir l'anglais britannique ou américain selon l'anglais que parle la famille, et le mémoriser dans `henri.reglages.voix_en`. **À vérifier sur l'iPad** : la liste des voix anglaises installées, et le téléchargement des voix « améliorées » dans les réglages d'accessibilité, comme pour le français. Safari rend parfois une liste de voix vide au premier appel : attendre l'événement `voiceschanged` (le kit actuel a le même risque en français).
3. **Des textes à double version dans le kit, pour le cadre seulement** : un petit dictionnaire `KR.textes = { commencer: { fr: "Je commence", en: "Let's go" }, ... }` et une fonction `KR.t('commencer')` qui rend la version du réglage. Trente à cinquante phrases suffisent (portail, boutons, bulles de mascotte, encouragements, fins de séance). Chaque élément reçoit son attribut `lang="en"` ou `lang="fr"`, pour que VoiceOver le lise avec la bonne voix.
4. **Le contenu n'a pas de double version** : une question de tables, une dictée, un nom du planisphère n'existent que dans leur langue. Le mode anglais du planisphère ajoute un champ `en` à chaque entrée (`afrique: { ..., en: "Africa" }`) ; c'est le module de Louise, à lui proposer, pas à faire à sa place.
5. **Le module Spelling** réutilise le moteur de la dictée avec un paramètre de langue, et fournit d'office deux listes courtes tirées des listes officielles anglaises des years 3 et 4.
6. **Le compteur de minutes en anglais** : chaque séance enregistre sa langue de contenu dans `henri.commun.jours`, et le coin parent fait la somme de la semaine.

## 5. Questions aux parents

1. Henri et Clara lisent-ils et écrivent-ils l'anglais, ou le parlent-ils seulement ? La réponse fixe le niveau des premières listes de spelling et l'importance du haut-parleur.
2. Quel anglais parle la famille, britannique ou américain ? Il décide de la voix et de l'orthographe de référence (*colour* ou *color*).
3. Le cadre en anglais par défaut pour les deux, ou d'abord pour un seul, pour voir comment il le vit ?
4. Le mode anglais du planisphère : à proposer à Louise, puisque c'est son module.

## Synthèse

| Partie | Langue recommandée | Raison |
|---|---|---|
| Interface (portail, boutons) | Anglais, réglable par enfant | Phrases courtes et répétées, sans risque pour le contenu |
| Consignes d'exercice | Langue du contenu | Une consigne mal comprise coûte une erreur inutile |
| Mascotte et encouragements | Anglais | Formules positives et quotidiennes, l'astuce reste en français |
| Questions des tables (écrit et oral) | Français | Les faits numériques se retrouvent mieux dans la langue d'apprentissage |
| Dictée | Français | Orthographe et règles de la classe |
| Spelling | Anglais, module et séance à part | L'écrit anglais, que personne d'autre ne travaille |
| Planisphère | Choix, français par défaut | Les faits non numériques passent d'une langue à l'autre |
| Retour de Claude | Langue du travail | La règle formulée comme en classe |
| Coin parent | Français | Langue des parents, plus un compteur de minutes en anglais |
