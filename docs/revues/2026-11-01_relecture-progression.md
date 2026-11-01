# Relecture pédagogique de la progression des tables : l'album à tampons, à cinq conditions

Relecteur : `relecteur-pedagogique` (professeur des écoles en CM1 et CM2, formateur), le 01/11/2026.

Documents lus :

- `docs/design-system/archive/2026-11-01_progression/README.md`, les trois pages HTML et leurs captures PNG (route, album, pot) ;
- `simulation.js` et `simulation.json` du même dossier ;
- `docs/DECISIONS.md`, de D-09 à D-11 bis ;
- `modules/tables/moteur.js` et `modules/tables/seance.js`.

Marquage de chaque point :

- **[programme]** document officiel ou Eduscol lu aujourd'hui ;
- **[recherche]** étude citée ;
- **[pratique]** usage de classe, mon expérience ;
- **[code]** lu dans le moteur ou mesuré en le faisant tourner.

## En bref : l'album est le bon choix, mais l'or doit rester un vrai « par cœur »

- **L'album à tampons est la mécanique qui colle le mieux à l'apprentissage réel**, parce que son unité (un jour de plus où le fait est retrouvé juste) est une trace de mémorisation, pas une trace d'activité. Je soutiens la recommandation du designer.
- **Le risque de sur-justification est faible ici, à une condition qui dépend des parents** : qu'aucun tampon ni aucune carte dorée ne s'échange jamais contre quelque chose (écran, argent, cadeau). C'est la récompense *attendue et tangible* qui abîme la motivation, pas une trace symbolique qui informe l'enfant de ses progrès.
- **La couche qui ne redescend jamais est juste pour les tampons**, qui racontent des jours réussis, donc des faits vrais pour toujours. Elle devient fausse si l'or continue d'affirmer « tu le sais par cœur » après des erreurs répétées. Il faut garder l'or, sans rien retirer, mais ajouter le signe neutre « on le revoit demain ».
- **Le demi-tampon se comprend à 9 ans, mais il contredit ce que dit la maîtresse** : Eduscol fait enseigner que « connaître 7 × 2, c'est connaître 2 × 7 ». Je recommande la variante du designer (un tampon plein par jour), avec l'or qui demande « les deux sens ».
- **La règle d'ouverture des familles ne doit pas changer pour la route** : elle doit rester calculée sur l'état réel, pas sur la couche qui ne redescend jamais, parce que ×4 et ×8 s'appuient sur des doubles réellement sus.
- **Deux réglages du moteur sont à corriger avant de coder** :
  - l'or peut aujourd'hui tomber au bout de quatre jours d'affilée, sur un fait qui n'était pas prévu ce jour-là ;
  - rien ne limite le nombre de faits nouveaux par jour, alors qu'un album pousse à enchaîner les séances.

## Ce qui est juste et doit rester

- **Le diagnostic du README est exact et précieux** [code] : l'or exige deux sens en boîte 4, le compteur « N of 36 by heart » reste à 0 deux séances, et une erreur remet la case à « Starting ». Henri a raison, l'écran actuel ne montre pas un progrès qui existe.
- **Partir de la simulation sur le vrai moteur plutôt que de chiffres inventés** est une très bonne méthode, rare dans les apps éducatives.
- **Rien à perdre, aucune série, aucune comparaison, aucun hasard, aucune monnaie** : c'est conforme à D-09 et D-10, et c'est ce qui sépare une gamification saine de celle qui épuise les enfants [pratique].
- **Une carte par paire, avec 7 × 8 et 8 × 7 sur la même carte** : c'est exactement l'idée de la commutativité telle qu'on l'enseigne [programme, voir question 4].
- **Une page de l'album par famille, dans l'ordre d'Eduscol** (doubles, doubles des doubles, double plus un, dix moins un, le 7 en dernier) : l'enfant retrouve la progression de la classe [programme].
- **La phrase des rappels de la mécanique 3**, « 18 sums came back today, and you remembered them first time », est la meilleure phrase des trois maquettes : elle félicite un acte d'apprentissage précis (retrouver de mémoire un fait au moment où il revient). C'est l'effet de test, l'un des résultats les plus solides de la psychologie de la mémoire [recherche, Roediger et Karpicke, 2006, non relu aujourd'hui].
- **Garder la table de Pythagore en bascule** : voir la proposition 6, je la renforce.

## Question 1 : chaque mécanique reflète-t-elle un vrai apprentissage ?

### L'album récompense la maîtrise, sauf sur l'or atteint trop vite

**Ce que mesure un tampon** [code] : `enregistrer` ne fait monter une boîte qu'une fois par jour et par sens, et seulement sur une réponse juste. Les boîtes 1 à 3 montent sans exigence de vitesse, la boîte 4 demande une réponse rapide (premier chiffre en moins de 3 secondes). Un tampon veut donc dire : « ce fait a été retrouvé juste, un jour de plus ». C'est une trace de mémorisation, pas de temps passé. Le quatrième tampon ajoute la fluidité, ce qui est l'attendu officiel : les tables doivent devenir des « automatismes », des résultats qui « ne devraient pas être reconstruits » [programme, fiche Eduscol de début de CM2 citée en sources].

**Le défaut : l'or peut arriver en quatre jours d'affilée, sans espacement** [code, mesuré].

- **Le README écrit que la boîte 4 demande une réponse rapide « après les intervalles de 1, 2 et 4 jours »**. Le moteur ne fait pas cela : il ne vérifie pas qu'un fait était *prévu* ce jour-là avant de le faire monter. Or `seance()` complète chaque séance avec des faits non dus (la dernière liste, triée par boîte la plus basse) jusqu'à 20 questions.
- **J'ai rejoué la simulation sur quatre graines (5, 11, 23 et 42)** :
  - entre 13 % et 25 % des montées de boîte (hors première réussite) ont lieu un jour où le fait n'était pas dû ;
  - entre 4 % et 24 % des passages à l'or se font un jour où le fait n'était pas dû.
- **Conséquence pédagogique** : une carte peut dorer après quatre jours consécutifs, ce qui n'est pas un « par cœur » au sens de la répétition espacée. Et le message « une carte ne prend qu'un tampon par jour, donc l'or demande plusieurs jours » devient vrai mais faible : plusieurs jours, oui, espacés, pas toujours.

**Proposition 1 (la plus importante pour le moteur).**

- **Écrit aujourd'hui** : une réponse rapide fait monter la boîte, quel que soit le jour.
- **Je propose** : le passage de la boîte 3 à la boîte 4 (donc l'or) n'a lieu que si le fait était dû ce jour-là (`prochain <= jour`). Les boîtes 1 à 3 peuvent continuer de monter sur les questions de complément.
- **Pourquoi** : c'est l'esprit des boîtes de Leitner de D-09, où une fiche ne change de boîte qu'à sa date de révision. L'or redevient ce que le README promet à Henri : au moins une semaine, en plusieurs passages espacés. Le changement est petit (une condition dans `enregistrer`) et ne rouvre aucune décision, il aligne le code sur D-09.
- **Source** : [code] `moteur.js`, `enregistrer` et `seance` ; [recherche] l'effet d'espacement (Cepeda et al., 2006, méta-analyse, non relue aujourd'hui).

### La route récompense le fait d'avancer dans le programme, pas de consolider

- **Son unité est la même que l'album** (un pas par tampon), donc elle repose sur de vrais apprentissages.
- **Sa métaphore pousse dans le mauvais sens** [pratique] : une route se parcourt vers l'avant, et ce que l'enfant regarde, c'est la prochaine station. Les tampons gagnés en révisant ×2 sont « derrière toi » (« And 4 steps on the road behind you »). Or les tables s'apprennent en revenant sans cesse sur les mêmes faits : Eduscol insiste sur « une fréquentation importante et une réactivation régulière » [programme]. Un enfant de 9 ans comprend vite que réviser ne fait pas avancer Moussi, et il veut « ouvrir » la famille suivante. C'est la course à la couverture, que je vois dans beaucoup d'apps : on finit des niveaux, on ne sait pas mieux.
- **Elle oblige à toucher à la règle d'ouverture**, ce qui est le vrai problème (question 5).

### Le pot récompense surtout l'activité

- **L'étoile elle-même est un vrai acte d'apprentissage** : un fait dû, retrouvé juste du premier coup.
- **Mais le pot compte du volume** : plus de séances donnent plus d'étoiles, et les étoiles des faits nouveaux réussis s'ajoutent quel que soit le fait. L'anneau des quatre jours récompense la présence, pas ce qui est su.
- **C'est le type de récompense que la méta-analyse de Deci, Koestner et Ryan trouve le plus nuisible** à la motivation propre : celle qui dépend du simple fait de s'engager dans l'activité (« engagement-contingent »), devant celle qui dépend de la performance [recherche, Deci, Koestner et Ryan, 1999].
- **Le pot ne montre pas non plus ce qui reste à apprendre** : aucune carte de ce qui est su, alors que c'est ce que demande Eduscol (question 6).
- **À garder, comme le propose le designer** : la phrase des rappels, sans le pot ni l'anneau.

## Question 2 : l'enfant risque-t-il de ne plus jouer que pour les tampons ?

### Ce que dit la recherche, sans le simplifier

- **L'expérience fondatrice** [recherche, Lepper, Greene et Nisbett, 1973] : des enfants de maternelle qui aimaient déjà dessiner dessinent moins spontanément après avoir *promis* un diplôme pour leurs dessins. Les enfants qui reçoivent le même diplôme *sans l'avoir attendu* ne perdent rien.
- **La méta-analyse de 128 expériences** [recherche, Deci, Koestner et Ryan, 1999] confirme que les récompenses attendues, liées à l'engagement, à l'achèvement ou à la performance, baissent la motivation propre, davantage chez les enfants que chez les étudiants. Elle a été contestée (Cameron et Pierce, 1994, qui trouvaient l'effet minime), et Lepper lui-même met en garde contre une lecture mécanique ; le consensus raisonnable est que l'effet existe, qu'il dépend du caractère attendu, tangible et contrôlant de la récompense.
- **Deux nuances comptent pour Henri** :
  - **l'effet porte surtout sur des activités déjà intéressantes en elles-mêmes**, ce que les tables sont rarement à 9 ans : le risque de « tuer une passion » est faible [recherche, même méta-analyse, qui ne retient l'effet que pour les tâches intéressantes ; pratique] ;
  - **une marque qui informe l'enfant de sa compétence nourrit la motivation**, alors qu'une marque qui sert à le contrôler l'abîme (théorie de l'évaluation cognitive, cadre de Deci et Ryan) [recherche]. Le tampon, tel qu'il est dessiné, est surtout une information : « tu as retrouvé 7 × 8 un jour de plus ».
- **Le cas d'école de la gamification ratée** : dans un cours gamifié par des badges obligatoires et un classement, les étudiants ont perdu en motivation et en satisfaction au fil du semestre, et ont eu de moins bonnes notes à l'examen [recherche, Hanus et Fox, 2015]. Les deux ingrédients toxiques sont absents ici (classement, obligation), et il faut que cela reste ainsi.

### Le vrai risque n'est pas l'album, c'est ce qu'on en fait autour

**Proposition 2 (la plus importante de cette relecture, et elle concerne les parents, pas le code).**

- **Écrit aujourd'hui** : « ni monnaie » dans la recommandation, côté app.
- **Je propose d'écrire une règle de famille dans `DECISIONS.md`** : aucun tampon, aucune carte dorée, aucune page médaillée ne s'échange jamais contre quelque chose, ni écran, ni argent, ni cadeau, ni privilège ; et on n'annonce pas d'avance de récompense pour une page à finir. Une fête *imprévue* quand une page se dore (un mot, un dessin, raconter à la famille) reste possible et sans risque.
- **Pourquoi** : l'app peut être parfaitement saine et devenir nuisible le jour où un parent dit « quand l'album des doubles sera doré, tu auras ta soirée film ». C'est exactement la condition de Lepper (récompense attendue, tangible) qui transforme une trace d'apprentissage en salaire.
- **Source** : [recherche] Lepper, Greene et Nisbett, 1973 ; Deci, Koestner et Ryan, 1999.

**Les autres garde-fous, du plus au moins important.**

- **Proposition 3 : ne jamais annoncer d'avance qu'une carte peut dorer aujourd'hui.**
  - **Écrit aujourd'hui** (accueil de l'album) : « 5 × 6 can turn gold today ».
  - **Je propose** : le retirer de l'accueil. L'or se découvre en fin de séance (« 2 cards turned gold! »), comme une surprise. Garder la liste « Nearly gold » dans l'album, que l'enfant ouvre s'il le veut, sans l'idée de « aujourd'hui ».
  - **Pourquoi** : comme le quatrième tampon exige la vitesse, annoncer l'enjeu met de la pression sur une question précise, et l'enfant se précipite. Eduscol demande que la réduction du temps de réponse soit « un nouveau défi pour l'élève et non pas une source d'inquiétude » [programme]. Et une récompense inattendue n'abîme pas la motivation, quand l'attendue le peut [recherche, Lepper, 1973].
- **Proposition 4 : des phrases qui parlent du fait, pas du butin.**
  - **Écrit aujourd'hui** : « +14 stamps today », « Stamps won over several days: you know them by heart now. »
  - **Je propose** : garder le chiffre, mais faire porter la phrase principale sur ce que l'enfant sait : « 5 × 6 and 2 × 9: you remembered them on four different days. They're gold! » Pour le compte de tampons, préférer « 14 sums one step closer » à « +14 stamps ».
  - **Pourquoi** : un retour qui décrit la tâche réussie aide l'enfant à apprendre, un retour centré sur la récompense ou sur la personne l'aide peu [recherche, Hattie et Timperley, 2007, déjà cité dans la relecture pédagogique du dépôt]. C'est aussi le côté « information » plutôt que « contrôle » de Deci et Ryan.
- **Proposition 5 : limiter les faits nouveaux par jour, pas par séance** [code].
  - **Écrit aujourd'hui** : `NOUVEAUX_PAR_SEANCE = 4`, et `seance()` prend quatre faits jamais vus à chaque séance, sans compter ceux du matin. Trois séances dans la journée font douze faits nouveaux.
  - **Je propose** : quatre faits nouveaux par jour au plus. Une deuxième séance le même jour reste possible, mais elle ne révise que des faits déjà vus.
  - **Pourquoi** : un album donne envie de rejouer pour avoir des tampons. La limite d'un tampon par jour et par fait protège déjà la plupart des cartes, mais pas l'ouverture de cartes neuves, qui donne un premier tampon facile. Douze faits nouveaux le même jour dépassent ce qu'un enfant de 9 ans retient d'un coup, et ils reviennent tous ensemble le lendemain [pratique, charge cognitive].
- **Prévoir la fin de l'album dès maintenant** [pratique].
  - Le jour où tout est doré, l'envie de jouer va baisser. C'est normal et c'est une réussite : le travail de mémorisation est fait.
  - Il faut alors passer à un entretien plus léger (une séance courte deux fois par semaine) et le dire à l'enfant (« Your album is complete. Moussi will check a few now and then. »), plutôt que d'inventer un deuxième album pour relancer la machine.
- **Les signes à surveiller, pour les parents** [pratique] :
  - l'enfant demande combien de tampons il aura avant de jouer ;
  - il répond au hasard très vite pour tenter l'or ;
  - il refuse une séance « parce qu'il n'y a plus de tampon à gagner ».

  Si cela arrive, on en parle avec lui, et on ne rajoute surtout pas de récompense. À noter : répondre au hasard ne paie pas, car une erreur renvoie la boîte réelle à 1 et retarde l'or de plusieurs jours [code]. La couche visuelle ne rend donc pas la précipitation gratuite.

## Question 3 : la couche qui ne redescend jamais est-elle juste ?

### Oui pour les tampons, à condition que l'or ne mente pas

- **Ce qui est juste** [pratique] :
  - un tampon raconte un événement daté (« ce jour-là, tu l'as retrouvé ») et cet événement reste vrai, comme un tampon sur un passeport ;
  - retirer un tampon après une erreur ferait de l'erreur une punition, contraire à D-09 (« erreur sans punition ») ;
  - un enfant anxieux arrête de répondre plutôt que de risquer de perdre.

  Le moteur continue de planifier sur la boîte réelle : l'apprentissage n'est pas faussé, seul l'affichage est protégé.
- **Ce qui ne va pas** : l'or n'est pas un événement, c'est une affirmation sur l'état présent (« tu le sais par cœur »). Une carte dorée sur laquelle Henri se trompe trois fois de suite lui dit une chose fausse. À 9 ans, les enfants surestiment déjà ce qu'ils savent ; un affichage qui ne montre jamais l'oubli entretient cette illusion, et le jour du contrôle en classe la surprise est mauvaise [pratique].
- **Un deuxième effet, invisible pour l'enfant** [code] : après une erreur, la boîte réelle repart à 1, et les remontées 1 → 2 → 3 ne donnent aucun tampon puisque `meilleure` est déjà plus haut. Henri retravaille la carte pendant plusieurs jours sans rien voir bouger. C'est le même plateau que celui dont il se plaint aujourd'hui, en plus petit.

**Proposition 6 : garder l'or, ajouter un signe neutre « on le revoit ».**

- **Écrit aujourd'hui** : « il faut qu'une erreur sur une carte d'or ne la ternisse pas, et qu'elle reparte simplement dans la file des révisions ».
- **Je propose** :
  - une carte dorée dont la boîte réelle est retombée garde son or et tous ses tampons ;
  - elle porte un petit signe calme, le même vocabulaire que la fin de séance (« Comes back tomorrow », une petite flèche circulaire, sans couleur d'alerte) ;
  - le signe disparaît le jour où la carte est de nouveau retrouvée juste à sa date ;
  - la fin de séance peut alors le dire : « 7 × 8 is back on track ».
- **Pourquoi** :
  - rien n'est retiré, donc aucune punition ;
  - l'enfant garde une image honnête de ce qu'il sait ;
  - la remontée après une erreur devient visible, ce qui comble le plateau décrit plus haut ;
  - c'est de l'information sur la tâche, pas un jugement [recherche, Hattie et Timperley, 2007].
- **Et le coin parent montre l'état réel** (boîte réelle et liste des faits fragiles, comme aujourd'hui avec `fragiles`), jamais `meilleure`. Les parents ont besoin de la vérité pour parler avec l'enfant et la maîtresse.

**Un détail pour le code de `meilleure`** [code] : si un fait nouveau est raté le matin puis réussi le soir dans une deuxième séance, `enregistrer` le fait passer de la boîte 1 à 2, et `meilleure` saute de 0 à 2 : deux tampons le même jour. Faire monter `meilleure` d'un cran au plus par jour et par sens, pour tenir la promesse « un tampon par jour ».

## Question 4 : le demi-tampon par sens est-il compréhensible à 9 ans ?

### Compréhensible, oui ; cohérent avec la classe, non

- **Le dessin se comprend** [pratique] : un rond à moitié plein, la moitié est connue bien avant le CM1. Henri saura le lire si on le lui montre une fois.
- **Le message, lui, contredit l'enseignement** [programme] : la fiche Eduscol des évaluations de début de CM2 demande au professeur de « présenter la commutativité de la multiplication qui légitime d'apprendre la "moitié" de la table », et précise que connaître 7 × 2, c'est connaître 2 × 7. Un demi-tampon dit à l'enfant l'inverse : « 8 × 7 est une deuxième moitié à gagner ». Je m'attends à la réaction « mais c'est pareil ! », qui est juste.
- **Le moteur a de bonnes raisons de suivre les deux sens séparément** (PLAN, section des tables : l'un peut sortir plus vite que l'autre), et je ne rouvre pas ce choix. Interroger les deux ordres est d'ailleurs un point de vigilance connu en calcul mental [pratique]. La question est seulement : faut-il le montrer à l'enfant en demi-tampons ?

**Proposition 7 : un tampon plein par jour, et l'or « dans les deux sens ».**

- **Écrit aujourd'hui** : un demi-tampon par sens, l'emplacement se remplit quand les deux sens l'ont ; repli prévu si Henri ne comprend pas.
- **Je propose de prendre le repli d'emblée, sous cette forme** :
  - les trois premiers tampons suivent le sens le plus avancé, un tampon plein par jour ;
  - le quatrième (l'or) demande les deux sens, et la carte le dit en clair : « Gold needs it both ways round: try 8 × 7 ».
  - Côté moteur, quand un sens est en boîte 3 ou plus, poser en priorité l'autre sens à sa date.
- **Pourquoi** : on garde le message de la classe (une seule carte, un seul fait) et on garde l'exigence (l'or vérifie les deux ordres), sans abstraction à expliquer.
- **Question à trancher par les parents, car elle touche une décision du PLAN** : faut-il qu'une réponse juste et rapide sur 7 × 8 fasse aussi monter 8 × 7 (jusqu'à la boîte 2 par exemple), comme le diagnostic le fait déjà pour les deux sens ? Eduscol va dans ce sens, et cela raccourcirait le chemin vers l'or. Je ne le recommande pas sans un essai : on perdrait la mesure séparée des deux sens, qui est l'intérêt du choix du PLAN.
- **L'essai avec Henri reste utile**, mais posé autrement. Lui montrer les deux versions de la carte, sans explication, et lui demander :
  - « qu'est-ce que ça veut dire ? » ;
  - « tu sais 7 × 8, est-ce que tu sais 8 × 7 ? ».

  S'il explique le demi-tampon tout seul et ne trouve pas cela injuste, la version du designer est possible.

## Question 5 : faut-il changer la règle d'ouverture des familles pour la route ?

### Non : l'ouverture doit rester calculée sur l'état réel

- **Écrit aujourd'hui** [code] : `majFamilles` ouvre la famille suivante quand 80 % des faits de la famille en cours sont en boîte 3 ou plus, sur la boîte réelle.
- **Proposé pour la route** : ouvrir quand les trois quarts des tampons du tronçon sont posés, donc sur `meilleure`, qui ne redescend jamais.
- **Pourquoi je m'y oppose** :
  - la progression d'Eduscol n'est pas un simple ordre, c'est une chaîne d'appuis : la table de 4 est le double de celle de 2, la table de 8 le double de celle de 4, la table de 6 le double de celle de 3 [programme]. Les astuces du moteur reposent sur ces appuis (« 8 × 4 = 32, et le double de 32 ») ;
  - ouvrir ×4 et ×8 sur la foi de tampons anciens, alors que des doubles ont été oubliés depuis, c'est construire sur un appui qui a cédé ;
  - la simulation montre que les deux règles ouvrent presque aux mêmes séances quand tout va bien : c'est précisément quand l'enfant oublie qu'elles divergent, et c'est là que la règle réelle protège.
- **Ce qu'on peut faire sans toucher à la règle** :
  - **fêter l'ouverture d'une famille**, qui passe aujourd'hui inaperçue : « Doubles of doubles are open! You already know ×2, so ×4 is just doubling twice. » C'est une vraie étape d'apprentissage, et elle relie la nouvelle famille à ce que l'enfant sait déjà [programme, progression par les propriétés] ;
  - **dans l'album, la page de la famille suivante peut montrer où elle en est** : « Opens when most Doubles cards have 3 stamps or more ». Ce texte reste vrai avec la règle actuelle, à condition qu'il parle de l'état réel.
- **Si un jour la route est retenue comme vue d'ensemble** : découpler Moussi de l'ouverture. Moussi avance avec les tampons ; la station s'ouvre selon la règle réelle ; si Moussi arrive avant, il attend devant une barrière qui ne se lève qu'avec les révisions. C'est honnête, et cela donne du sens aux révisions des tronçons passés.

## Question 6 : ma recommandation, et ce qu'il faut changer avant de coder

### L'album à tampons, avec la phrase des rappels, et cinq changements

Je recommande **la mécanique 2, l'album à tampons**, avec la greffe de la phrase des rappels proposée par le designer, et j'écarte le pot (activité) et la route (couverture et changement de règle).

**À changer avant de coder, dans l'ordre :**

1. **Écrire la règle de famille « un tampon ne s'échange jamais »** dans `DECISIONS.md` (proposition 2). C'est la seule protection réelle contre la sur-justification, et elle ne coûte rien.
2. **Faire dépendre l'or d'une révision à sa date** : la boîte 4 seulement si le fait était dû (proposition 1). Corriger aussi la phrase du README sur les intervalles, qui ne décrit pas le moteur actuel.
3. **Garder l'or mais montrer « Comes back tomorrow »** sur une carte dorée retombée, et la remontée en fin de séance (proposition 6) ; coin parent sur l'état réel ; `meilleure` d'un cran par jour au plus.
4. **Un tampon plein par jour, l'or demande les deux sens** (proposition 7), puis montrer les deux versions à Henri.
5. **Quatre faits nouveaux par jour, pas par séance** (proposition 5), et retirer « can turn gold today » de l'accueil (proposition 3), avec des phrases qui parlent du fait plutôt que du butin (proposition 4).

### Garder la table de Pythagore à portée de main

**Proposition 8.**

- **Écrit aujourd'hui** : l'album remplace la tuile « My grid », la grille gardée en bascule « See as a grid ».
- **Je propose** :
  - garder cette bascule, en un seul geste depuis l'album ;
  - la grille et l'album affichent les mêmes données (la couche `meilleure`, avec le même signe « on le revoit ») ;
  - pas de grille sur l'état réel à côté d'un album sur `meilleure` : l'enfant verrait une carte dorée et une case bronze pour le même fait, et ne saurait plus lequel croire, défaut déjà relevé dans la relecture de l'app des tables.
- **Pourquoi** : c'est l'outil de la classe. Eduscol propose d'« entourer sur la table de multiplication les produits des calculs que l'élève maîtrise pour qu'il puisse se représenter ce qu'il lui reste à mémoriser » [programme]. Henri retrouvera à la maison la carte que sa maîtresse utilise peut-être déjà.

### Un dernier point sur le diagnostic

Après le diagnostic d'une minute, des cartes partent avec trois tampons sur quatre (une réponse juste et rapide met les deux sens en boîte 3) [code]. C'est juste : Henri savait déjà ces faits. Mais il faut le dire ainsi, sur l'écran de la première séance et dans l'album : « You already knew these! », plutôt que de les compter dans les tampons « gagnés ». Reconnaître ce qu'on sait déjà motive, et cela évite que le premier écran gonfle un progrès qui n'a pas eu lieu dans l'app [pratique].

## Mesure faite pour cette relecture

Script de contrôle dans le scratchpad de la session, non versionné : il reprend `simulation.js` (même profil d'enfant, mêmes 20 séances) et compte, à chaque montée de boîte au-delà de la première réussite, si le fait était dû ce jour-là (`prochain <= jour`).

| Graine | Montées un jour non dû | Passages à l'or un jour non dû |
|---|---|---|
| 5 | 50 sur 244 (20 %) | 12 sur 71 (17 %) |
| 11 | 31 sur 245 (13 %) | 3 sur 69 (4 %) |
| 23 | 40 sur 252 (16 %) | 8 sur 73 (11 %) |
| 42 | 55 sur 223 (25 %) | 13 sur 54 (24 %) |

## Sources

- **[programme]** Eduscol, Évaluations nationales de début de CM2, fiche d'intervention en mathématiques « Mémoriser des faits et des procédures numériques » (2024), lue aujourd'hui. Elle contient la commutativité (« connaître le résultat de 7 x 2 c'est donc connaître le résultat de 2 x 7 »), la progression par propriétés (2, puis 4 et 8, puis 3 et 6), la réactivation régulière, la table à entourer et le temps de réponse comme défi : <https://eduscol.education.gouv.fr/sites/default/files/document/2024evaluationdebutcm2mathematiquesficheinterventionmemoriserfaitsproceduresnumeriquesv2pdf-107934.pdf>
- **[recherche]** Lepper, M. R., Greene, D. et Nisbett, R. E. (1973). Undermining children's intrinsic interest with extrinsic reward. *Journal of Personality and Social Psychology*, 28(1), 129-137. Résumé lu, article non relu en entier : <https://typeset.io/pdf/undermining-children-s-intrinsic-interest-with-extrinsic-3qn44yqiou.pdf>
- **[recherche]** Deci, E. L., Koestner, R. et Ryan, R. M. (1999). A meta-analytic review of experiments examining the effects of extrinsic rewards on intrinsic motivation. *Psychological Bulletin*, 125(6), 627-668. Résumé lu, chiffres non revérifiés dans l'article : <https://depts.washington.edu/techdocs/papers/deciExtrinsicRewardsAndIntrinsicMotivation99.pdf>
- **[recherche]** Deci, E. L., Koestner, R. et Ryan, R. M. (2001). Extrinsic rewards and intrinsic motivation in education: reconsidered once again. *Review of Educational Research*. Réponse à Cameron et Pierce (1994) : <https://www.selfdeterminationtheory.org/SDT/documents/2001_DeciKoestnerRyan.pdf>
- **[recherche]** Hanus, M. D. et Fox, J. (2015). Assessing the effects of gamification in the classroom. *Computers & Education*, 80, 152-161 : <https://dblp.org/rec/journals/ce/HanusF15>
- **[recherche]** Hattie, J. et Timperley, H. (2007). The power of feedback. *Review of Educational Research*, 77(1), 81-112 : <https://www.uky.edu/~gmswan3/575/Hattie_Timperley_2007.pdf>
- **[recherche, non vérifié aujourd'hui]** Roediger, H. L. et Karpicke, J. D. (2006), sur l'effet de test ; Cepeda, N. J. et al. (2006), méta-analyse sur l'effet d'espacement. Cités de mémoire, à relire avant de les reprendre ailleurs.
- **[code]** `modules/tables/moteur.js` (`enregistrer`, `seance`, `majFamilles`, `appliquerDiagnostic`) et `modules/tables/seance.js` (`repondre`, `retaper`), lus le 01/11/2026.
