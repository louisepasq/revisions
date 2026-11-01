# Nos révisions : une app par enfant, des modules courts, un retour bienveillant

Le site « Nos révisions » rassemble les petites apps de révision que Louise et Louis font pour Henri (CM1) et Clara (CM2). Ce fichier décrit le dispositif dans son ensemble : principes, modules, organisation. Le détail de chaque module vit dans son propre dossier de `docs/`.

Provenance : **[source]** vérifié à la source ; **[appréciation]** choix de conception, à confirmer à l'usage.

## 1. Une app par enfant, posée sur l'écran d'accueil de l'iPad

- Henri et Clara ont chacun leur lien (`/revisions/henri/`, `/revisions/clara/`), ajouté à l'écran d'accueil de l'iPad, avec leur mascotte en icône : **Moussi** pour Henri, **Pooh Bear** pour Clara.
- Tout vit sur ce site, pour que chaque module s'ouvre dans l'app de l'enfant et y garde sa progression. Détail et contraintes de l'iPad : [`tables/PLAN.md`](tables/PLAN.md), section 3 bis.
- **Appareils** : l'iPad des enfants d'abord, un iPad 9e génération (10,2 pouces, bouton d'accueil, iPadOS 26.5 au 01/11/2026, 1080 × 810 points en paysage, 810 × 1080 en portrait), dans les deux orientations ; ponctuellement les iPhone des parents (iPhone 17 et iPhone 16 Pro, 402 × 874 points, Dynamic Island), en portrait. La progression vit dans l'appareil : une séance faite sur un téléphone ne remonte pas sur l'iPad (export et import prévus dans le coin parent).
- **Langue** (D-21 du 01/11/2026, qui remplace D-13 hors des tables ; relecture [`revues/2026-11-01_relecture-anglais.md`](revues/2026-11-01_relecture-anglais.md)) : **l'anglais britannique par défaut partout** (voix en-GB, orthographe *colour*) : cadre, consignes d'exercice, explications d'un coup refusé, mascotte et voix. Deux exceptions :
  - **les tables** : les énoncés des multiplications (les quatre types de questions, Oui et Non, la correction, les faits dits à voix haute) et les astuces restent en français, parce qu'un fait arithmétique se retrouve mieux dans la langue où on l'a appris (Spelke et Tsivkin, 2001) ; les consignes autour (« Find two numbers », « Type it again », les relances, l'étiquette « Moussi's tip ») sont en anglais ;
  - **la géographie** (« De l'univers à Éguilles ») : l'enfant choisit au début, anglais ou français ; le choix se retient et se change depuis l'accueil du module ; le contenu suit ce choix, le cadre du module reste en anglais, et la progression est commune aux deux langues.

  Le coin parent reste en français ; il garde un réglage qui peut passer le cadre de l'app en français. Un module futur part en anglais ; le français n'y entre que pour une matière qui l'exige (la dictée, l'orthographe), et l'anglais écrit sera travaillé dans un futur module « Spelling ». Clara lit bien l'anglais, Henri commence : phrases courtes, mots simples, et le bouton Listen lit tout. Le planisphère de Louise n'est pas concerné. Textes du cadre : `commun/textes.js`.
- Un seul système de design pour tous les modules (polices, couleurs de chaque enfant, composants) : `design-system/`. **En refonte depuis le 01/11/2026, sans aucune contrainte héritée** (décision de Louis : le portail et le planisphère de départ ont été faits sans designer ; on part des meilleures pratiques, avant que les enfants ne s'habituent à une interface). Les polices seront hébergées sur le site pour que l'app marche sans réseau.

## 2. Six principes pédagogiques communs à tous les modules

1. **Se rappeler plutôt que relire** : chaque module fait chercher la réponse avant de la montrer.
2. **Peu et souvent** : des séances de cinq minutes environ, une série de jours plutôt qu'une longue séance.
3. **L'erreur sans punition** : pas de croix rouge, la bonne réponse avec la façon de la retrouver, puis l'enfant la refait lui-même.
4. **Le progrès, pas la comparaison** : chaque enfant se mesure à lui-même, jamais à l'autre.
5. **Le papier garde sa place** : l'iPad dicte, pose la question, montre ; l'enfant écrit aussi à la main, et la photo de sa feuille entre dans l'app.
6. **Les parents voient** : un coin parent par app, et une copie de chaque retour de Claude.

## 3. Les modules : quatre aujourd'hui, du plus avancé au plus neuf

| Module | Pour | État au 01/11/2026 |
|---|---|---|
| Planisphère | Henri | En ligne, fait par Louise (`henri/planisphere.html`) |
| Tables de multiplication | Henri et Clara | Plan et maquette faits ([`tables/`](tables/PLAN.md)), pas encore codé |
| De l'univers à Éguilles (« My journey ») | Henri et Clara | Construit le 01/11/2026, pas encore essayé sur l'iPad : sept étapes de zoom, un contenu par enfant, boîtes de Leitner sur les cartes ([`zoom/`](zoom/PLAN.md), D-17) |
| Dictée | Henri et Clara | Idée de Louis du 01/11/2026, décrite en section 4 |
| Retour de Claude sur une photo | Henri et Clara | Idée de Louis du 01/11/2026, décrite en section 5 |

## 4. Dictée : l'iPad dicte et attend, l'enfant écrit sur papier

**Décidé le 01/11/2026, sur proposition du relecteur pédagogique** ([relecture](revues/2026-11-01_relecture-pedagogique.md), propositions 1 à 4) :

- **Préparer avant de dicter** : sur les jours qui précèdent, l'enfant repère les pièges du texte et travaille les mots difficiles en copie flash ; la dictée vient ensuite. La dictée apprend au lieu de seulement mesurer.
- **Les mots du jour au cœur du module** : une dizaine de mots par semaine, dictés chaque jour, et la phrase du jour redictée ; les mots ratés reviennent par les mêmes boîtes de Leitner que les tables.
- **L'enfant se corrige d'abord, Claude ensuite** (section 5).
- **À demander aux maîtresses avant de coder la correction** : la forme de leur dictée, leurs codes de correction, la liste de mots de la semaine. L'app ne doit pas contredire la classe.

**Déroulé de la dictée elle-même**, calqué sur la dictée de classe :

1. **Lecture complète** du texte, une fois, pour le sens.
2. **Phrase par phrase** : l'iPad lit une phrase, par groupes de mots si elle est longue, puis **se met en pause tout seul**. Deux gros boutons :
   - **Répéter** : relit la phrase (ou le dernier groupe de mots) ;
   - **Phrase suivante**.
3. **Relecture finale** du texte entier.
4. **L'enfant se relit avec une consigne précise**, puis compare lui-même sa feuille au texte juste.
5. **Photo de la feuille** : Claude compare à son tour au texte connu (section 5).

**Réglages** : voix active par défaut (c'est le module qui dicte), vitesse de lecture (lente par défaut), ponctuation dite ou non (« virgule », « point »), choix de la voix française de l'iPad.

**Charger une dictée : n'importe qui, sans mode adulte** (demande de Louis du 01/11/2026). Un bouton « Nouvelle dictée » dans l'app de l'enfant, ouvert à tous :

- **coller un texte** : celui de l'école, d'un livre, d'un parent ; c'est la voie de la première version, sans serveur ;
- **à partir d'une photo** : en attendant le relais de Claude (section 5), le « Texte en direct » de l'iPad permet déjà de sélectionner le texte d'une photo, de le copier et de le coller ; une fois le relais en place, l'app enverra la photo à Claude, qui rendra le texte propre.

L'app découpe seule le texte en phrases (sur la ponctuation), puis les phrases longues en groupes de mots (sur les virgules, sinon par six à huit mots), et montre le découpage avant de commencer, pour qu'on puisse le corriger. Les dictées chargées restent dans l'app pour être refaites.

**Contenus types** : les dictées de l'école, les mots de la semaine, et quelques courtes dictées du niveau de chaque enfant (mots invariables, accords, homophones) fournies d'office.

**Technique** : la synthèse vocale du navigateur (`speechSynthesis`, voix française), sans serveur. Les voix françaises « améliorées » de l'iPad, à télécharger dans les réglages d'accessibilité, sonnent nettement mieux : à vérifier sur l'iPad.

## 5. Retour de Claude sur une photo : un retour qui guide sans donner la réponse

**Le geste [appréciation]** : dans n'importe quel module, un bouton appareil photo. L'enfant photographie sa feuille (dictée, exercice, petit texte), l'envoie, et reçoit en quelques secondes un retour écrit, lu à voix haute s'il le veut.

**Le cadre du retour [appréciation]** :

- **première version : les dictées seulement** (décidé le 01/11/2026), parce que l'app connaît le texte juste et que Claude compare au lieu de deviner ; les exercices photographiés viendront après un essai ;
- Claude transcrit ce qu'il lit et dit quand un mot est illisible, au lieu de compter une faute ;
- bienveillant et court, au niveau de l'enfant, qu'il tutoie ; il compte les mots justes plutôt que les fautes ;
- **trois erreurs au plus** travaillées par retour, en posant d'abord une question sur le raisonnement (« qui fait l'action ? »), puis la règle, puis l'enfant recopie ;
- les premières semaines, un parent est à côté, le temps de vérifier que Claude lit bien leur écriture ;
- **pas de conversation libre** avec l'IA : un retour par photo, sur un cadre écrit par les parents ;
- une copie de chaque retour va dans le coin parent.

**La technique : le site public ne peut pas porter la clé de Claude**

- **[source]** Le code du site est envoyé au navigateur : une clé d'API écrite dedans serait lisible par quiconque ouvre la page, et utilisable à nos frais.
- **[appréciation] Reco : un petit relais** (une fonction Vercel, à côté de `api/progression`, depuis que tout le site est sur Vercel, D-03) garde la clé dans une variable d'environnement, reçoit la photo, appelle Claude avec le cadre ci-dessus et renvoie le retour. Il est protégé, comme tout le site, par le code de chaque enfant (D-04), et plafonne le nombre de photos par jour.
- **Données** : la photo de la feuille part chez Anthropic pour être lue, et le relais n'en garde rien. Aucun nom de famille dans les échanges.
- Écarté : la clé dans le site (lisible par tous) ; l'envoi de la photo par WhatsApp pour un retour plus tard (le retour doit arriver pendant que l'enfant est encore devant sa feuille).

## 6. Décisions ouvertes

- Le relais pour Claude : sur Vercel, et dans quel dépôt (ce dépôt public, ou un petit dépôt privé, plus sûr pour le cadre et les réglages).
- L'ordre de construction : tables d'abord (plan et maquette prêts), dictée ensuite (simple, sans serveur), retour photo en dernier (il faut le relais).
