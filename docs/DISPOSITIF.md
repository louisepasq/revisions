# Nos révisions : une app par enfant, des modules courts, un retour bienveillant

Le site « Nos révisions » rassemble les petites apps de révision que Louise et Louis font pour Henri (CM1) et Clara (CM2). Ce fichier décrit le dispositif dans son ensemble : principes, modules, organisation. Le détail de chaque module vit dans son propre dossier de `docs/`.

Provenance : **[source]** vérifié à la source ; **[appréciation]** choix de conception, à confirmer à l'usage.

## 1. Une app par enfant, posée sur l'écran d'accueil de l'iPad

- Henri et Clara ont chacun leur lien (`/revisions/henri/`, `/revisions/clara/`), ajouté à l'écran d'accueil de l'iPad, avec leur mascotte en icône : **Moussi** pour Henri, **Pooh Bear** pour Clara.
- Tout vit sur ce site, pour que chaque module s'ouvre dans l'app de l'enfant et y garde sa progression. Détail et contraintes de l'iPad : [`tables/PLAN.md`](tables/PLAN.md), section 3 bis.
- **Appareils** : l'iPad des enfants d'abord, un iPad 9e génération (10,2 pouces, bouton d'accueil, iPadOS 26.5 au 01/11/2026, 1080 × 810 points en paysage, 810 × 1080 en portrait), dans les deux orientations ; ponctuellement les iPhone des parents (iPhone 17 et iPhone 16 Pro, 402 × 874 points, Dynamic Island), en portrait. La progression vit dans l'appareil : une séance faite sur un téléphone ne remonte pas sur l'iPad (export et import prévus dans le coin parent).
- Un seul système de design pour tous les modules (polices, couleurs de chaque enfant, composants) : `design-system/`, en cours.

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
| Dictée | Henri et Clara | Idée de Louis du 01/11/2026, décrite en section 4 |
| Retour de Claude sur une photo | Henri et Clara | Idée de Louis du 01/11/2026, décrite en section 5 |

## 4. Dictée : l'iPad dicte et attend, l'enfant écrit sur papier

**Déroulé [appréciation]**, calqué sur la dictée de classe :

1. **Lecture complète** du texte, une fois, pour le sens.
2. **Phrase par phrase** : l'iPad lit une phrase, par groupes de mots si elle est longue, puis **se met en pause tout seul**. Deux gros boutons :
   - **Répéter** : relit la phrase (ou le dernier groupe de mots) ;
   - **Phrase suivante**.
3. **Relecture finale** du texte entier, pour que l'enfant se corrige.
4. **Photo de la feuille** : l'enfant prend sa dictée en photo, et Claude la corrige (section 5).

**Réglages** : vitesse de lecture (lente par défaut), ponctuation dite ou non (« virgule », « point »), choix de la voix française de l'iPad.

**Charger une dictée : n'importe qui, sans mode adulte** (demande de Louis du 01/11/2026). Un bouton « Nouvelle dictée » dans l'app de l'enfant, ouvert à tous :

- **coller un texte** : celui de l'école, d'un livre, d'un parent ; c'est la voie de la première version, sans serveur ;
- **à partir d'une photo** : en attendant le relais de Claude (section 5), le « Texte en direct » de l'iPad permet déjà de sélectionner le texte d'une photo, de le copier et de le coller ; une fois le relais en place, l'app enverra la photo à Claude, qui rendra le texte propre.

L'app découpe seule le texte en phrases (sur la ponctuation), puis les phrases longues en groupes de mots (sur les virgules, sinon par six à huit mots), et montre le découpage avant de commencer, pour qu'on puisse le corriger. Les dictées chargées restent dans l'app pour être refaites.

**Contenus types** : les dictées de l'école, les mots de la semaine, et quelques courtes dictées du niveau de chaque enfant (mots invariables, accords, homophones) fournies d'office.

**Technique** : la synthèse vocale du navigateur (`speechSynthesis`, voix française), sans serveur. Les voix françaises « améliorées » de l'iPad, à télécharger dans les réglages d'accessibilité, sonnent nettement mieux : à vérifier sur l'iPad.

## 5. Retour de Claude sur une photo : un retour qui guide sans donner la réponse

**Le geste [appréciation]** : dans n'importe quel module, un bouton appareil photo. L'enfant photographie sa feuille (dictée, exercice, petit texte), l'envoie, et reçoit en quelques secondes un retour écrit, lu à voix haute s'il le veut.

**Le cadre du retour [appréciation]** :

- bienveillant et court, au niveau de l'enfant, qu'il tutoie ;
- il commence par ce qui est réussi ;
- pour une dictée, il souligne chaque erreur avec la règle qui permet de la corriger, et propose de la recopier ;
- pour un exercice, il montre où regarder, sans donner la réponse du premier coup ;
- **pas de conversation libre** avec l'IA : un retour par photo, sur un cadre écrit par les parents ;
- une copie de chaque retour va dans le coin parent.

**La technique : le site public ne peut pas porter la clé de Claude**

- **[source]** Le site est public (GitHub Pages) : une clé d'API écrite dans son code serait lisible par n'importe qui, et utilisable à nos frais.
- **[appréciation] Reco : un petit relais** (une fonction sur Vercel, que Louis utilise déjà) garde la clé dans une variable d'environnement, reçoit la photo, appelle Claude avec le cadre ci-dessus et renvoie le retour. Il n'accepte que les apps des enfants (un code familial) et plafonne le nombre de photos par jour.
- **Données** : la photo de la feuille part chez Anthropic pour être lue, et le relais n'en garde rien. Aucun nom de famille dans les échanges.
- Écarté : la clé dans le site (lisible par tous) ; l'envoi de la photo par WhatsApp pour un retour plus tard (le retour doit arriver pendant que l'enfant est encore devant sa feuille).

## 6. Décisions ouvertes

- Le relais pour Claude : sur Vercel, et dans quel dépôt (ce dépôt public, ou un petit dépôt privé, plus sûr pour le cadre et les réglages).
- L'ordre de construction : tables d'abord (plan et maquette prêts), dictée ensuite (simple, sans serveur), retour photo en dernier (il faut le relais).
