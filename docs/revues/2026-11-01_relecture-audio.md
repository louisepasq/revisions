# Relecture audio du module des tables : l'oral apprend quand l'enfant cherche et dit, pas quand il écoute

Relecture du 01/11/2026, par le relecteur pédagogique (professeur des écoles en CM1 et CM2, formateur), cette fois en spécialiste de l'apprentissage par l'oral chez l'enfant. Question de Louis : comment faire de l'audio un vrai levier d'apprentissage des tables, et pas un simple habillage sonore.

Documents relus : `docs/tables/PLAN.md`, `docs/DISPOSITIF.md`, `modules/tables/README.md`, `modules/tables/tables.js` (lu, pas modifié : quelqu'un y travaille), `commun/kit.js` (les fonctions de voix), et le brief ChatGPT du papa (`brief_app_tables_multiplication_CM1.md`).

Marquage de chaque point : **[programme]** texte officiel ou Eduscol ; **[recherche]** étude citée, avec ce que j'en ai lu ; **[pratique]** usage de classe, mon expérience ; **[technique]** documentation technique lue ; **non vérifié** quand je n'ai pas pu lire la source.

## En bref : trois ajouts, une reconnaissance vocale à ne pas construire

- **L'audio aide de trois façons, à des degrés de preuve très différents.** Ce qui est solide : se rappeler un résultat bat le réentendre ou le réciter, à l'oral comme à l'écrit. Ce qui est réel mais modeste : dire un mot à voix haute le fait mieux retenir que le lire en silence, y compris entre 7 et 10 ans. Ce qui est plausible mais discuté : les tables sont stockées sous forme de phrases verbales (« sept fois huit, cinquante-six »), d'où l'intérêt d'entendre et de dire le fait en entier.
- **Les trois ajouts que je recommande, par ordre d'importance :**
  1. un mode **« Listen and answer »** (« Écoute et réponds ») sans reconnaissance vocale, utilisable en voiture : l'app pose la question, laisse un silence, puis dit le fait entier ; l'enfant doit répondre à voix haute avant elle ;
  2. **faire dire le fait à voix haute là où il est fragile** : après une erreur, et une seule fois à la découverte d'une famille, puis passer tout de suite au rappel ;
  3. **une boucle sonore propre** : le fait jamais coupé, aucune phrase anglaise entre la question et sa réponse, et le silence au diagnostic et au défi d'une minute.
- **La reconnaissance vocale n'est pas disponible dans une web app posée sur l'écran d'accueil**, d'après la documentation de WebKit et les tables de compatibilité ; elle n'existe que dans un onglet Safari, qui n'a pas le même stockage que l'app. Elle exige Siri activé et envoie probablement l'audio à Apple. **Reco : ne pas la construire**, faire un test de cinq minutes sur l'iPad pour confirmer (section 3).

## 1. Ce qui est bien et doit rester

- **La question lue dès qu'elle s'affiche, et le fait complet dit après une bonne réponse** (décision de Louis) : c'est exactement la structure « question entendue, puis réponse entendue » des interventions audio qui ont fait leurs preuves sur les tables (section 2.5). Le fait complet est la bonne unité : « neuf fois cinq, quarante-cinq », pas « quarante-cinq » seul. **[recherche]**
- **La voix dit le fait juste après une erreur**, avant que l'enfant retape : retour immédiat et correct, sans croix. **[pratique]**
- **Les questions et les astuces en français, le cadre en anglais** : un fait arithmétique se retrouve mieux dans la langue où on l'a appris (Spelke et Tsivkin, 2001, cité par `docs/DISPOSITIF.md`, **non relu** par moi). **[recherche]**
- **Le bouton « Listen »** qui relit la question ou l'astuce : il laisse l'enfant maître de la répétition. **[pratique]**
- **La voix qu'on peut couper dans le coin parent** : indispensable en voiture, chez les grands-parents, dans une pièce partagée. **[pratique]**
- **Le refus de faire du vocal le cœur de l'app** (PLAN, section 6) : la recherche ci-dessous le confirme, et la technique aussi (section 3). **[recherche]**

## 2. Ce que dit la recherche, et avec quelle force

### 2.1 Le rappel actif bat la récitation, même à voix haute

**Ce qui est établi [recherche]** : Ophuis-Cox, Catrysse et Camp (2023), *Applied Cognitive Psychology*, 37(6), 1463-1469. 48 élèves de deuxième année d'école primaire néerlandaise (7 à 8 ans), dans leur classe, sur les tables de 3 et de 4, chaque élève passant par les deux méthodes (une table chacune). Trois séances de cinq minutes réparties sur une semaine. Comparaison : des cartes individuelles (question devant, réponse derrière) contre la récitation à voix haute des tables affichées au tableau, dans l'ordre (« un fois trois, trois ; deux fois trois, six... »).

- **Résultat** : les deux méthodes progressent, mais les cartes donnent une meilleure fluidité, juste après et une semaine plus tard. Ordre de grandeur rapporté par la presse (Hechinger Report) : environ 3 résultats justes au départ, environ 6 après la récitation, environ 8 après les cartes. **Je n'ai pas pu lire l'article complet** (accès payant) : tailles d'effet et détail du test **non vérifiés**.
- **Dans quelle mesure c'est moins efficace** : la récitation n'est pas inutile (elle double le score dans cette étude), elle est moins efficace que le rappel, à temps égal. Petit échantillon, deux tables seulement, un seul pays : un résultat cohérent avec cinquante ans de recherche sur l'effet de test, pas une preuve isolée.
- **Ce qui compte pour l'app** : ce n'est pas la voix qui pose problème dans la récitation, c'est l'**absence de recherche** (la réponse est donnée par l'ordre de la table). Un mode oral qui pose les questions **mélangées** et laisse **chercher avant de donner** garde l'avantage du rappel.

### 2.2 Dire à voix haute aide à retenir : un effet réel chez l'enfant de 7 à 10 ans, mais modeste et relatif

**L'effet de production [recherche]** : un mot lu à voix haute est mieux reconnu ensuite qu'un mot lu en silence (MacLeod et coll., 2010, *Journal of Experimental Psychology: Learning, Memory, and Cognition* ; **non relu**, cité par Smith et coll., 2013).

- **Chez les enfants de l'âge d'Henri et de Clara** : Pritchard, Heron-Delaney, Malone et MacLeod (2020), *Child Development*, 91(3), 901-913. Deux expériences, 41 puis 40 enfants de 7 à 10 ans : la reconnaissance est meilleure pour les mots lus à voix haute que pour les mots lus en silence, que les deux types de mots soient mélangés ou en blocs, et pour des mots inventés comme pour des mots connus (résumé lu sur PubMed). **[recherche]**
- **Le pourquoi** : Forrin et MacLeod (2018), *Memory*, 26(4) : le bénéfice vient de deux choses, le geste de parole et le fait d'entendre **sa propre voix**. Entendre quelqu'un d'autre dire le mot aide moins que le dire soi-même (résumé et presse lus, article complet **non relu**). **[recherche]** Conséquence directe : **la voix de l'iPad qui dit le fait n'est pas l'effet de production** ; c'est l'enfant qui doit le dire.
- **Les limites, importantes** :
  - l'effet est surtout **relatif** : il vient du contraste entre ce qu'on a dit et ce qu'on a lu en silence. Quand tout est dit à voix haute, le gain se réduit. La méta-analyse de Fawcett (2013, *Acta Psychologica*, 142, 1-5) trouve un effet modéré quand on compare deux groupes (g = 0,37) sur la reconnaissance ; une mise à jour de 2014 ne le trouve pas sur le rappel libre (deux points lus dans des résumés, **non relus** à la source) ;
  - chez les plus jeunes, l'effet peut s'inverser : López Assef et coll. (2021, *Child Development*, enfants de 2 à 6 ans) trouvent que les petits retiennent mieux ce qu'ils ont entendu que ce qu'ils ont dit, les plus grands l'inverse (résumé lu). À 9 et 10 ans, on est du bon côté ; **[recherche]**
  - toutes ces études portent sur des **mots**, testés en **reconnaissance**. Aucune ne porte sur des faits arithmétiques, ni sur le rappel rapide d'un produit. Le transfert aux tables est mon appréciation, plausible, **non démontré**.
- **Ma lecture pour les parents** : faire dire le fait à voix haute est un **bonus**, à placer là où il compte (le fait fragile, le fait nouveau), pas une règle pour chaque question.

### 2.3 Répondre à l'oral, à l'écrit ou dans sa tête : le bénéfice du rappel est le même

**[recherche]** Smith, Roediger et Karpicke (2013), *Journal of Experimental Psychology: Learning, Memory, and Cognition*, 39(6), 1712-1725, quatre expériences chez des étudiants : se rappeler **dans sa tête** profite autant à la mémoire que se rappeler en tapant la réponse, y compris deux jours plus tard (résumé lu dans l'article). Les mêmes auteurs rapportent que Putnam et Roediger (2013, *Memory & Cognition*) ne trouvent **aucune différence entre répondre oralement et répondre en tapant**, ni selon la forme du test final (lu dans Smith et coll. 2013, l'article de Putnam et Roediger **non relu**). Des travaux plus récents trouvent un petit avantage à la réponse explicite pour des contenus difficiles (synthèse de recherche, **non relue** à la source).

**Ce que ça veut dire pour l'app** :

- **la reconnaissance vocale n'apporte pas de bénéfice de mémoire** par rapport au pavé ; son seul intérêt serait pratique (mains libres) ;
- **un mode oral sans vérification marche quand même**, à une condition : que l'enfant cherche vraiment avant d'entendre la réponse. Chez des étudiants volontaires, on peut le supposer ; chez un enfant de 9 ans, c'est là que dire à voix haute devient utile, parce que ça **oblige à produire une réponse** au lieu d'attendre celle de l'iPad. **[pratique]**

### 2.4 Les tables sont stockées sous forme verbale : un argument plausible, discuté depuis 2024

**[recherche]** Le modèle du triple code de Dehaene (Dehaene, 1992 ; Dehaene et Cohen, 1995 ; Dehaene, Piazza, Pinel et Cohen, 2003) distingue trois façons de se représenter un nombre : une quantité (« à peu près 50 »), les chiffres écrits (« 56 ») et les mots (« cinquante-six »). Les **faits de multiplication** y sont rangés du côté **verbal** : une table apprise par cœur serait une suite de mots qu'on retrouve comme une comptine, appuyée sur une région du cerveau du langage (le gyrus angulaire gauche). Arguments à l'appui : des patients qui perdent les multiplications et gardent les soustractions, et l'inverse (revue de 2020 lue, PMC7378795).

- **Une expérience va dans le même sens** : Lee et Kang (2002, *Cognition*, 83) : empêcher des adultes de se répéter des mots dans leur tête (en chuchotant une syllabe en boucle) ralentit les multiplications et pas les soustractions. Mais l'étude porte sur 10 adultes, et sa réplication n'a jamais retrouvé un effet aussi net (résumés lus).
- **La contestation** : une revue de 37 études publiée en 2024 dans *eNeuro* ne retrouve pas le rôle propre du gyrus angulaire dans le rappel des multiplications (résumé lu). Le modèle reste une bonne description du comportement ; sa localisation dans le cerveau est discutée.
- **Ma lecture pour les parents** : l'idée que le fait « sonne » dans la tête de l'enfant (« sept fois huit, cinquante-six ») est cohérente avec ce que voient les enseignants : on entend les élèves murmurer la phrase en cherchant. Elle justifie de faire **entendre et dire le fait entier**, toujours dans la même formulation, et en français. Elle ne justifie pas de réciter les tables dans l'ordre (2.1). **[pratique]**

### 2.5 Le format audio qui a fait ses preuves sur les tables : question, silence, réponse

**[recherche]** L'intervention dite des « problèmes enregistrés » (*Taped Problems*), étudiée depuis 2004 aux États-Unis : un enregistrement lit une multiplication, laisse un court silence (deux secondes dans l'étude que j'ai lue), puis dit la réponse. L'élève a une feuille et doit **battre l'enregistrement** en écrivant la réponse avant de l'entendre ; s'il n'y arrive pas ou se trompe, il écrit la bonne réponse en l'entendant. On allonge ou raccourcit le silence selon le niveau. Description lue dans McCallum et Schmitt (2011), *International Journal of Special Education*, 26(3), qui cite les études antérieures dont McCallum, Skinner, Turner et Saecker (2006, *School Psychology Review*, en classe entière, **non relue**).

- **Force de la preuve** : toutes ces études suivent un ou quelques élèves dans le temps, chacun servant de témoin à lui-même ; une méta-analyse (Aspiranti, McCallum et Schmitt, 2018) conclut à son efficacité sur la fluidité (titre et conclusion lus dans une notice, **chiffres non vérifiés**). C'est une preuve réelle mais plus faible qu'un essai à grands groupes.
- **Pourquoi c'est le meilleur modèle pour l'app** : il combine ce que 2.1 et 2.3 recommandent (chercher avant d'entendre) et ce que 2.4 suggère (entendre le fait entier), sans aucune reconnaissance vocale. C'est la base du mode « Listen and answer » (proposition 1).

### 2.6 Ce qui marche à 8-10 ans, en pratique de classe

**[pratique]**

- Les séances orales courtes et rythmées (le « calcul mental » du matin, ardoise levée) marchent bien à cet âge, à condition que **chaque enfant cherche** : à l'oral collectif, le plus rapide répond et les autres répètent. Chez vous, avec deux enfants dans la voiture, c'est le même piège.
- Un enfant de 9 ans supporte trois à cinq minutes d'oral concentré, pas davantage ; au-delà, il répond au hasard ou décroche.
- Le silence qui suit la question ne doit pas être vécu comme un chronomètre : on le présente comme « essaie d'aller plus vite que Moussi », jamais comme une sanction (Eduscol veut le temps présenté « comme un nouveau défi », PLAN, section 2). **[programme]**

## 3. Faisabilité sur l'iPad : la synthèse vocale oui, la reconnaissance vocale non

### 3.1 La synthèse vocale (`speechSynthesis`) : disponible, à régler

- **[technique] Disponible dans Safari sur iOS et iPadOS depuis iOS 7**, jusqu'aux versions actuelles (page caniuse « Speech Synthesis API », lue). Aucune restriction signalée pour les web apps de l'écran d'accueil (**non vérifié** par une source qui le dise explicitement : à tester).
- **[technique] Une voix chargée au premier besoin** : le kit le gère déjà (`voixDisponibles()` attend l'événement `voiceschanged`).
- **Non vérifié, à tester sur l'iPad** :
  - qu'une question lue **sans geste de l'enfant** (après le minuteur de 1,6 seconde qui enchaîne sur la question suivante) parle bien : Safari exige un geste pour la première lecture, et le kit lit dans le geste quand il le peut ;
  - que la voix française soit une voix **fr-FR** (pas une voix canadienne) et, si possible, une voix « améliorée » téléchargée dans Réglages, Accessibilité, Contenu énoncé ;
  - que la voix et le tintement de bonne réponse (Web Audio) ne se marchent pas dessus ;
  - que l'écran reste allumé pendant un mode mains libres (API Wake Lock, **non vérifiée** dans une web app de l'écran d'accueil).

### 3.2 La reconnaissance vocale (`SpeechRecognition`) : absente des web apps de l'écran d'accueil

- **[technique] Dans Safari, l'API existe sous le nom préfixé `webkitSpeechRecognition`**, en « support partiel », depuis Safari 14.1 et iOS 14.5 jusqu'aux versions actuelles (caniuse, « Speech Recognition API », lue). MDN la classe hors « Baseline », c'est-à-dire non disponible dans tous les grands navigateurs.
- **[technique] Elle n'est pas disponible dans les web apps ajoutées à l'écran d'accueil.** Deux sources :
  - la note des tables caniuse, lue sur un miroir (docs.w3cub.com, qui reproduit ces notes) : « Not available in SafariViewController and web apps added to Home Screen » ; « Siri needs to be enabled » ;
  - le ticket WebKit n° 225298 : en mai 2021, un ingénieur de WebKit confirme que l'API n'est pas disponible dans les web apps de l'écran d'accueil « pour l'instant » ; le ticket est clos en « LATER » (plus tard), sans correctif, et des développeurs relancent encore en mars 2025. Un développeur rapporte en 2024, sur les forums d'Apple, le même symptôme : la reconnaissance marche dans Safari et s'arrête une fois l'app posée sur l'écran d'accueil.
  - **Non vérifié** pour iPadOS 26.5 précisément : aucune note de version de Safari que j'ai trouvée n'annonce le changement, mais l'absence de note n'est pas une preuve. D'où le test ci-dessous.
- **[technique] Elle demande Siri activé** sur l'iPad (WebKit, annonce de Safari 14.1, lue). Sur un iPad d'enfants, Siri est souvent coupé par Temps d'écran.
- **[technique] Autorisation** : une demande d'accès au micro et à la reconnaissance vocale s'affiche au premier usage, selon les versions ; un refus ne se redemande pas tout seul (article technique d'octobre 2026, source secondaire). **Non vérifié** sur l'iPad.
- **[technique] L'audio part-il chez Apple ?** La page d'Apple sur Siri et la dictée (lue) dit que ce qui est dit est envoyé à Apple, sauf quand les réglages indiquent un traitement sur l'appareil, et que l'audio n'est pas conservé sauf si l'on accepte d'aider à améliorer Siri. La reconnaissance de Safari s'appuie sur « le même moteur que Siri » (WebKit). Rien ne dit qu'elle reste sur l'iPad. **À considérer comme un envoi à Apple**, ce qui contredit le principe du PLAN : « aucune donnée ne quitte l'iPad ».

**Verdict** : dans l'app de l'enfant, telle qu'elle est conçue (web app de l'écran d'accueil, progression dans son stockage propre), **la reconnaissance vocale n'est pas utilisable**. La faire marcher dans un onglet Safari ferait perdre la progression (stockage séparé, PLAN section 3 bis). **Reco : ne pas la construire.** Le mode oral se fait sans elle (proposition 1), et c'est sans perte pour la mémoire (section 2.3).

**Le test de cinq minutes, pour en avoir le cœur net** : une page de test de quelques lignes, posée sur le site, qui affiche si `window.SpeechRecognition || window.webkitSpeechRecognition` existe, puis, sur un bouton, lance une reconnaissance en `fr-FR` (`continuous = false`) et affiche le texte reconnu ou le code d'erreur (`not-allowed`, `service-not-allowed`). À ouvrir une fois dans Safari, une fois depuis l'écran d'accueil, avec Siri activé. Si l'écran d'accueil répond, la question se rouvre, avec la question de l'envoi à Apple à trancher par les parents.

**Écarté** : un modèle de reconnaissance embarqué dans la page (de type Whisper compilé pour le navigateur). Plusieurs dizaines de mégaoctets à télécharger, une bibliothèque et un build, contraires aux conventions du dépôt, et une fiabilité incertaine sur la voix d'un enfant de 9 ans avec un iPad de 2021. **[appréciation]**

## 4. Cahier des charges audio, du plus important au plus secondaire

Les textes du cadre sont en anglais (décision du 01/11/2026), le contenu mathématique en français. Les phrases ci-dessous donnent les deux quand le cadre parle ; la version anglaise va dans `commun/textes.js`.

### Proposition 1 : un mode « Listen and answer », question, silence, fait entier, sans reconnaissance vocale

**Aujourd'hui** : le PLAN prévoit un mode « À voix haute » avec reconnaissance vocale, « à tester ». La section 3 montre qu'elle n'est pas disponible.

**Proposé** : une troisième carte sur l'accueil du module, « Listen and answer » (« Écoute et réponds »), en deux variantes.

**a) L'app seule, mains libres** (voiture, petit-déjeuner) :

- un seul toucher pour lancer, puis rien à toucher pendant trois minutes ;
- la mascotte, en anglais : « Answer out loud, before I do! » (« Réponds à voix haute, avant moi ! ») ;
- pour chaque question, en français : « Sept fois huit ? », puis **un silence**, puis « Sept fois huit, cinquante-six. », puis une seconde de pause avant la question suivante ;
- **le silence dépend du niveau du résultat** (silence dégressif, le principe des *Taped Problems*, section 2.5) : environ 5 secondes pour un résultat gris ou bronze, 4 pour l'argent, 3 pour l'or (valeurs à ajuster à l'usage **[appréciation]**) ;
- le choix des questions : les résultats dus aujourd'hui et les fragiles d'abord, mélangés, chacun revenant une seconde fois au moins trois questions plus loin ; une vingtaine de questions en trois minutes ;
- les types de question : le produit seulement au début (« Sept fois huit ? »), puis le facteur manquant (« Sept fois combien, cinquante-six ? »), qui se dit bien à l'oral ; pas de décomposition ni de « multiple de », trop longs à l'oreille **[pratique]** ;
- **aucune note, aucune case qui monte** : l'app ne sait pas ce que l'enfant a répondu. Le mode compte comme un jour d'entraînement dans la semaine, et c'est tout. La fin : « Finished! 20 questions out loud. » (« Fini ! 20 questions à voix haute. »).

**b) Avec un parent qui pose les questions** (en voiture à l'arrêt, au coin de la table) :

- même déroulé, mais l'iPad est dans les mains du parent : la question s'affiche en grand, la voix peut être coupée (le parent lit lui-même), et deux gros boutons pour le parent, « Juste » et « Pas encore » ;
- ces réponses **comptent pour la justesse, pas pour la vitesse** : un « Juste » du parent ne fait pas passer un résultat à l'or, faute de temps de réponse fiable ; un « Pas encore » le fait revenir plus tôt, comme une erreur ;
- sur « Pas encore », le parent dit (ou l'app dit) le fait entier, et l'enfant le répète une fois.

**Pourquoi** : c'est le seul usage où l'audio fait apprendre autre chose que l'écran. Il ajoute des moments de rappel espacés hors de la séance (2.1), sous la forme verbale du fait (2.4), dans un format testé sur les tables (2.5), et sans perte de bénéfice faute de reconnaissance (2.3). **[recherche]** Il remplace le « mode mains libres » et la « conversation rapide » du brief ChatGPT, sans la technique qu'ils supposaient.

**À garder en tête** : sans vérification, un enfant peut attendre la réponse au lieu de la chercher. La consigne « avant moi » et le silence court s'en chargent en partie ; la variante avec parent reste la plus sûre. **[pratique]**

### Proposition 2 : faire dire le fait à voix haute là où il est fragile, et nulle part ailleurs par obligation

**Aujourd'hui** : sur une erreur, l'écran montre le fait juste et l'astuce, puis « À toi de le retaper ». L'enfant ne dit rien.

**Proposé** :

- **Après une erreur** : la voix dit le fait juste (« Sept fois huit, cinquante-six. »), puis la consigne devient « Dis-le à voix haute, puis retape-le. » La bonne réponse se masque au premier chiffre tapé, comme aujourd'hui. Quand la retape est juste, la voix ne redit pas le fait : c'est l'enfant qui vient de le dire.
- **À la découverte d'une famille** (« Découvrir une famille », écran à venir) : pour chaque fait nouveau, un palier « écoute et répète » **une seule fois** : la voix dit « Six fois sept, quarante-deux. », la consigne dit « À toi de le dire. », l'enfant le dit, touche « Suivant ». Puis, **tout de suite**, trois ou quatre questions de rappel sur ces faits, mélangées, au pavé. Jamais la famille récitée dans l'ordre.
- **Dans la séance ordinaire** : rien d'obligatoire. Une phrase d'aide, la première semaine seulement : « Tu peux dire la réponse tout bas en la tapant. » **[appréciation]**

**Pourquoi** : l'effet de production vaut entre 7 et 10 ans (Pritchard et coll., 2020), il vient de la voix de l'enfant et pas de celle de l'iPad (Forrin et MacLeod, 2018), et il est relatif : il compte surtout sur ce qui est dit quand le reste ne l'est pas (Fawcett, 2013). On le réserve donc au fait fragile et au fait nouveau. Le palier « écoute et répète » reste court parce que la récitation apprend moins que le rappel (Ophuis-Cox et coll., 2023), ce que le brief ChatGPT disait lui-même. **[recherche]**

**Pourquoi pas « dis-le avant de taper » à chaque question** : se rappeler dans sa tête profite autant que répondre à voix haute (Smith et coll., 2013), donc le gain serait faible ; et dire la réponse avant de la taper ajouterait une seconde au temps mesuré, ce qui fausserait le seuil de 3 secondes qui fait passer un résultat à l'or. **[recherche]**

### Proposition 3 : une boucle sonore propre, le fait jamais coupé, la voix anglaise hors de la chaîne question-réponse

**Aujourd'hui (lu dans le code, sans le modifier)** :

- `commun/kit.js` règle la voix **coupée par défaut** (`DEFAUT = { ..., voix: false }`), alors que le PLAN (section 3, « Son ») note la voix française **active par défaut** depuis la décision de Louis. Peut-être en cours de changement par la personne qui modifie `tables.js` ; à vérifier.
- Après une bonne réponse, la question suivante arrive au bout de 1,6 seconde (`DUREE_SUITE`), et chaque nouvelle lecture commence par `speechSynthesis.cancel()`. « Neuf fois cinq, quarante-cinq » dit à la vitesse 0,9 dure à peu près deux secondes (**estimation, non mesurée**) : le fait risque d'être **coupé par la question suivante**.
- La voix lit la question au diagnostic, s'il est activé.

**Proposé** :

- **Le fait n'est jamais coupé** : la question suivante attend la fin de la phrase (événement `onend` de l'énoncé), avec 1,6 seconde au minimum. Si l'enfant touche « suivant » avant, on coupe : c'est son choix.
- **L'ordre des sons après une bonne réponse** : le tintement, puis le fait en français. Pas de « Well done! » parlé par la mascotte à chaque réponse : la bulle écrite suffit, et le fait entendu est la vraie récompense. **[pratique]**
- **La voix anglaise de la mascotte ne parle qu'aux transitions** : au début d'une séance, à la fin, et dans les écrans de parole (diagnostic, fin de séance). Jamais entre une question et sa réponse, pour que la chaîne verbale du fait reste entièrement française (2.4). Sur l'écran d'erreur, le bouton « Listen » qui lit la bulle en anglais puis l'astuce en français est bien ; la lecture **automatique** ne lit que le fait juste, en français.
- **Le silence là où la voix gêne la mesure** :
  - **au diagnostic** : pas de lecture automatique. Il dure une minute et mesure ce que l'enfant sait déjà ; une seconde de voix par question réduit le nombre de questions posées et allonge les temps mesurés. Le bouton « Listen » reste ;
  - **au défi d'une minute** : pas de voix du tout, ni question ni fait. Il reproduit l'évaluation nationale, qui est écrite et silencieuse (Eduscol, PLAN section 1). **[programme]**
- **Le rythme** : vitesse 1,0 pour la question (courte, on veut un rappel rapide), 0,9 pour le fait complet ; la virgule de « sept fois huit, cinquante-six » donne la petite pause qui sépare la question de la réponse. **[appréciation]** Aucune relecture automatique d'une question laissée sans réponse : ce serait un rappel à l'ordre déguisé ; le bouton « Listen » suffit.
- **Le temps de réponse** : il part de l'affichage, comme aujourd'hui. Un enfant qui attend la fin de la voix avant de répondre perd environ une seconde. À surveiller dans le coin parent : si des résultats restent bloqués à l'argent alors que l'enfant les donne sans hésiter, relever le seuil de 3 à 4 secondes. **[appréciation]**

**Pourquoi** : la décision de Louis (question lue, fait complet dit) ne produit son effet que si l'enfant entend chaque fait **en entier, toujours dans la même formule, en français** (2.4, 2.5) ; une phrase coupée ou une voix anglaise au milieu casse précisément ce qu'on cherche à installer. Les mesures (diagnostic, défi, seuil de l'or) doivent rester comparables d'une séance à l'autre. **[recherche]** et **[pratique]**

### Proposition 4 : la voix de la mascotte en anglais, et ce qu'on fait en français

- **Garder la mascotte en anglais** pour ses bulles et ses transitions, lues par la voix en-GB (décision du 01/11/2026), avec le bouton « Listen » pour Henri qui commence à lire l'anglais.
- **Tout le contenu mathématique lu en français** : questions, faits, astuces, consignes (« Dis-le à voix haute, puis retape-le. »). C'est déjà le cas dans le code (`lang="fr"`, `KR.lire(..., 'fr')`).
- **Les deux voix ne s'enchaînent qu'avec une pause** : une demi-seconde entre la phrase anglaise et la phrase française, pour que l'enfant entende le changement de langue. **[appréciation]** Le changement de voix sur l'iPad ajoute peut-être un temps de chargement : **non vérifié**, à écouter.

### Proposition 5 : les risques de l'audio, et la parade pour chacun

- **La gêne** : à la maison quand l'autre enfant travaille, chez les grands-parents, en voiture avec d'autres passagers. Parade : la voix se coupe dans le coin parent (existe), et des écouteurs pour l'usage en pièce partagée. En classe, l'app n'est pas prévue. **[pratique]**
- **Les deux enfants dans la voiture** : le plus rapide répond, l'autre répète, et un seul a cherché. Parade : un seul enfant par séance « Listen and answer », l'autre se tait ou attend son tour ; ou la variante avec parent, qui nomme l'enfant interrogé (« Henri : sept fois huit ? »). **[pratique]**
- **Un enfant qui ne lit plus et ne fait qu'écouter** : faible pour les tables, où l'écrit tient en trois signes (7 × 8) ; mais l'évaluation nationale et les quatre types de questions d'Eduscol sont écrits. Parade : l'écran montre toujours la question écrite dans la séance ordinaire, et le défi d'une minute reste silencieux. Le risque est plus sérieux pour la dictée (section 5). **[programme]** et **[pratique]**
- **Un enfant qui attend la réponse de l'iPad au lieu de la chercher** (mode mains libres) : parade par la consigne « avant moi », le silence dégressif, et la variante avec parent. **[pratique]**
- **La lassitude de la voix de synthèse** : au bout de trois semaines, la même voix pour chaque question peut agacer. Parade : le choix de la voix française dans le coin parent, comme prévu pour la dictée. **[pratique]**

### Ce qu'on n'ajoute pas

- **La reconnaissance vocale**, tant que le test de la section 3.2 ne la montre pas disponible dans l'app de l'écran d'accueil. Et même alors, la question de l'envoi de la voix des enfants à Apple est à trancher par les parents. **[technique]**
- **La récitation des tables dans l'ordre**, à l'écoute ou à voix haute, comme mode d'entraînement (2.1). **[recherche]**
- **Une chanson ou une comptine des tables** : agréable, mais sans rappel ; c'est de la récitation en musique (l'un des auteurs de l'étude de 2023 le dit dans la presse, à titre d'avis, pas de résultat). **[pratique]**
- **La « conversation rapide » sans écran du brief ChatGPT** comme cœur de la séance : elle ne se vérifie pas sans reconnaissance, et elle sortirait l'enfant du format écrit de l'évaluation. Le mode « Listen and answer » en garde ce qui compte. **[appréciation]**
- **Une mascotte qui commente chaque réponse à voix haute** : du bruit qui allonge la séance sans rien apprendre. **[pratique]**

## 5. Ce que ça implique pour la dictée et le futur « Spelling »

- **Dans la dictée, l'audio n'est pas un levier : c'est le contenu.** Les mêmes règles techniques s'appliquent, plus strictement : ne jamais couper une phrase (enchaîner sur `onend`), une seule voix française de bonne qualité, vitesse lente, pause automatique après chaque groupe de mots (déjà prévu, `docs/DISPOSITIF.md`, section 4). **[technique]**
- **L'effet de production sert à la préparation de la dictée, pas à la dictée elle-même** : pour les mots du jour, faire **dire le mot à voix haute** avant de l'écrire en copie flash, et pour un mot raté, le dire et l'écrire de nouveau. **[recherche]** (Pritchard et coll., 2020, portait justement sur des mots lus à voix haute), transfert à l'orthographe **non démontré**.
- **Le risque « l'enfant n'écoute plus qu'avec les oreilles » est réel ici** : une dictée travaille l'image écrite du mot. L'écoute ne remplace pas la copie et la relecture du texte écrit, que le dispositif prévoit déjà. **[pratique]**
- **Pour « Spelling »** : le format des *spelling tests* anglais se prête bien à l'audio (le mot, une phrase qui le contient, le mot répété, avec la voix en-GB), et la pratique anglaise « Look, Say, Cover, Write, Check » fait **dire le mot** avant de le cacher et de l'écrire : c'est l'effet de production mis en routine. Aucune reconnaissance vocale n'est nécessaire. **[pratique]**
- **La voix anglaise doit être en-GB et de bonne qualité**, puisque l'enfant y apprend la prononciation en même temps que l'orthographe : à écouter sur l'iPad avant de lancer le module. **Non vérifié.**

## 6. Questions à trancher par les parents

1. **Le mode « Listen and answer » remplace-t-il le mode « À voix haute » avec reconnaissance du PLAN ?** Reco : oui, dans les deux variantes (app seule, avec parent), et la reconnaissance passe en « à rouvrir si le test de l'écran d'accueil réussit ».
2. **Les réponses données au parent (« Juste », « Pas encore ») comptent-elles dans la grille ?** Reco : oui pour la justesse et pour faire revenir un résultat raté, non pour la vitesse (pas de passage à l'or).
3. **Le diagnostic et le défi d'une minute restent-ils silencieux ?** Reco : oui, voix sur bouton seulement.
4. **Si la reconnaissance devenait possible un jour : accepte-t-on que la voix des enfants soit envoyée à Apple ?** Elle contredit le principe « aucune donnée ne quitte l'iPad ». Reco : non, sauf si les réglages de l'iPad montrent un traitement sur l'appareil.

## 7. À tester sur l'iPad, en plus de la liste du PLAN

- La reconnaissance vocale : page de test, dans Safari et depuis l'écran d'accueil, Siri activé (section 3.2).
- Une question lue sans geste de l'enfant, après le minuteur, dans l'app de l'écran d'accueil.
- La durée réelle de « neuf fois cinq, quarante-cinq » à la vitesse 0,9, et la question suivante qui ne la coupe pas.
- Le tintement et la voix qui ne se chevauchent pas.
- La voix fr-FR choisie, et une voix « améliorée » téléchargée.
- L'écran qui reste allumé et la voix qui continue pendant les trois minutes du mode mains libres.

## Sources

**Recherche**

- [Ophuis-Cox, Catrysse et Camp (2023), le rappel actif contre la récitation des tables, notice et résumé](https://research.ou.nl/en/publications/the-effect-of-retrieval-practice-on-fluently-retrieving-multiplic/) ; [compte rendu chiffré du Hechinger Report](https://hechingerreport.org/proof-points-flashcards-prevail-over-repetition-in-memorizing-multiplication-tables/). Article complet non relu (accès payant).
- [Pritchard, Heron-Delaney, Malone et MacLeod (2020), l'effet de production chez les enfants de 7 à 10 ans, résumé PubMed](https://pubmed.ncbi.nlm.nih.gov/31099041/)
- [Forrin et MacLeod (2018), le bénéfice d'entendre sa propre voix, PDF](https://uwaterloo.ca/memory-attention-cognition-lab/sites/default/files/uploads/files/forrinmacleodmem18.pdf). Résumé et presse lus, article non relu en entier.
- [Fawcett (2013), méta-analyse de l'effet de production entre groupes](https://doi.org/10.1016/j.actpsy.2012.10.001). Chiffre lu dans des résumés, non relu à la source.
- [López Assef et coll. (2021), l'effet de production s'inverse chez les 2 à 6 ans](https://doi.org/10.1111/cdev.13618). Résumé lu.
- [Smith, Roediger et Karpicke (2013), le rappel dans sa tête profite autant que le rappel explicite, PDF](https://learninglab.psych.purdue.edu/downloads/2013/2013_Smith_Roediger_Karpicke_JEPLMC.pdf). Résumé et introduction lus ; Putnam et Roediger (2013) lus à travers lui.
- [McCallum et Schmitt (2011), description de l'intervention « Taped Problems », PDF ERIC](https://files.eric.ed.gov/fulltext/EJ959019.pdf). Lu (introduction et procédure).
- [Revue de 2020 sur le modèle du triple code et le gyrus angulaire](https://pmc.ncbi.nlm.nih.gov/articles/PMC7378795) ; [revue critique de 2024, eNeuro](https://www.eneuro.org/content/11/4/ENEURO.0318-23.2024). Résumés lus. Lee et Kang (2002), *Cognition*, 83, B63-B68 : résumé lu dans des notices, non relu à la source.

**Technique**

- [caniuse, Speech Recognition API](https://caniuse.com/speech-recognition) et [caniuse, Speech Synthesis API](https://caniuse.com/speech-synthesis), lus ; [notes de caniuse reproduites sur docs.w3cub.com](https://docs.w3cub.com/browser_support_tables/speech-recognition), lues.
- [MDN, SpeechRecognition](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition), lu.
- [Ticket WebKit n° 225298, « Speech recognition service is not available »](https://bugs.webkit.org/show_bug.cgi?id=225298), lu.
- [WebKit, nouveautés de Safari 14.1](https://webkit.org/blog/11648/new-webkit-features-in-safari-14-1/), lu.
- [Forum des développeurs Apple, reconnaissance vocale dans une web app de l'écran d'accueil (2024)](https://developer.apple.com/forums/thread/748048), lu.
- [Apple, Siri, dictée et confidentialité](https://www.apple.com/legal/privacy/data/en/ask-siri-dictation/), lu.
