# Relecture du 01/11/2026 : l'app des tables tient sa promesse visuelle, mais son moteur peut bloquer un enfant lent et ennuyer une enfant qui sait déjà

Relecteurs : `designer-apps-enfants` et `relecteur-pedagogique`, en une seule passe. Matière relue : les captures de `modules/tables/captures/` aux trois formats, le code (`modules/tables/tables.js`, `moteur.js`, `seance.js`, `commun/kit.js`, `commun/textes.js`, et `commun/portail.js` pour le coin parent), la synthèse de design (`docs/design-system/archive/2026-11-01_panel/5-synthese.html`), `docs/tables/PLAN.md` et `docs/DISPOSITIF.md`. Aucun fichier de l'app n'a été modifié.

Repères de provenance :

- **[mesuré]** : vérifié par un script node qui charge `moteur.js` et `seance.js` et simule des enfants (scripts dans le scratchpad de la session, non versionnés) ;
- **[rendu]** : vu sur les captures ;
- **[programme]** : texte officiel ou Eduscol ; ici toujours **repris de `PLAN.md`, qui cite ses sources, sans relecture de la source aujourd'hui** ;
- **[pratique]** : expérience de classe et d'apps pour cet âge, appréciation.

Ce qui a été vérifié en premier : **les cent astuces de `Tables.astuce` sont arithmétiquement exactes** [mesuré]. Chaque produit, double, moitié, « moins » et « plus » cité a été recalculé : zéro erreur. Les réserves sur les astuces (point 6) portent sur le choix de la stratégie, pas sur les calculs.

## Les points, du plus important au plus secondaire

### 1. Le seuil de 3 secondes, mesuré jusqu'au Check, peut bloquer un enfant pour toujours à « Starting »

**Ce qu'on voit.** `enregistrer` (moteur.js) ne fait monter un résultat au-delà de la boîte 2 que s'il est juste **et** donné en 3 secondes au plus (`RAPIDE_MS = 3000`). Le temps part de l'affichage de la question et s'arrête au Check (`debutQ` dans tables.js) : il comprend la lecture, la frappe de deux chiffres sur le pavé et l'appui sur Check. Or la boîte 2 est encore du bronze « Starting » (`couleur` : argent à partir de 3).

[mesuré] Simulation sur trente jours : un enfant qui répond **toujours juste en 3,5 secondes** (CM1 ou CM2) reste à **0 sur 36 « by heart »**, sans une seule case argent ; la famille du 7 ne s'ouvre jamais (`majFamilles` exige la boîte 3) ; et le coin parent écrit « No shaky facts at the moment », puisque `resume` (portail.js) ne liste que les résultats ratés, jamais les lents. Le même enfant à 2,5 secondes a ses 36 résultats en or au 25e jour.

**Pourquoi c'est un problème pour l'enfant.** Il fait tout juste, chaque jour, et sa grille ne bouge plus : c'est exactement le scénario qui fait décrocher à 9 ans [pratique]. Les parents, eux, ne voient rien d'anormal dans le coin parent. Le PLAN dit « juste et en moins de 3 secondes (seuil à ajuster) » : le seuil n'a pas encore été ajusté, et il pèse trop lourd parce qu'il conditionne aussi l'argent et le déblocage des familles.

**Correction proposée.**

- Mesurer la latence de rappel au **premier chiffre tapé**, pas au Check : c'est elle qui dit si le résultat sort de mémoire ; la frappe dépend de l'aisance sur le pavé.
- Séparer les deux marches : **argent = juste à deux jours différents**, sans condition de temps ; **or = juste et rapide à des jours différents**. Le temps garde son rôle pour l'or, conforme à la décision « la justesse avant la vitesse ».
- Calibrer le seuil par enfant : par exemple la médiane de ses propres temps sur les faits ×1 et ×10, plus une marge, bornée entre 3 et 5 secondes.
- Faire apparaître dans le coin parent les résultats **justes mais lents** (« 6 résultats justes mais encore lents : 7 × 8, … »).

**Fichiers** : `modules/tables/moteur.js` (`RAPIDE_MS`, `enregistrer`, `majFamilles`), `modules/tables/tables.js` (mesure de `ms`), `commun/portail.js` (`resume`).

### 2. Après le diagnostic, une enfant qui sait ses tables lit « 0 of 36 by heart », puis révise 1 × 1 pendant trois semaines

**Ce qu'on voit.**

- [rendu] Fin du diagnostic : « Great, I know where to start! », puis l'accueil du module affiche **« 0 of 36 by heart »** : un résultat juste et rapide au diagnostic ne va qu'en boîte 3 (argent).
- [mesuré] Le diagnostic compte 23 questions, rangées famille par famille, du ×5 au 7 × 7. En une minute, un enfant à 3 secondes par question en voit 20, un enfant à 4 secondes en voit 15 : **les familles du 9 et du 7 ne sont presque jamais testées**, et restent fermées.
- [mesuré] Les résultats non testés des familles ouvertes arrivent comme « nouveaux », quatre par séance, **dans l'ordre lexical de `tousLesFaits`** : 1 × 1, 1 × 2, 1 × 3… Le diagnostic exclut les ×1 (`a > 1`), donc ils arrivent tous. Pour une enfant qui sait tout, les séances des jours 1 à 20 comptent de 5 à 13 questions sur 20 en ×1 ou ×10.
- [rendu] Fin de la première séance de Clara : « 6 squares went up », dont **« 1 × 2 Starting » et « 1 × 1 Starting »**, puis « Tomorrow, **1 × 2** comes back to see you. » Question à choix : « 4 est-il dans la table de 1 ? ».

**Pourquoi c'est un problème pour l'enfant.** Le diagnostic avait un seul but, écrit dans le PLAN : « ne pas faire refaire la table de 2 à qui la sait ». Clara (CM2), qui sait ses tables, reçoit le message inverse : l'app la prend pour une débutante et la félicite pour 1 × 1. À 10 ans, c'est vexant et ennuyeux, et l'ennui est la première cause d'abandon d'une app de révision [pratique]. Les tables sont attendues en fin de CE2, le CM les automatise [programme, repris de PLAN.md § 1] : le temps de Clara doit aller aux 36 résultats de 2 à 9, et surtout aux plus résistants (7 × 4, 6 × 7, 8 × 7, 9 × 8…).

**Correction proposée.**

- **Diagnostic entrelacé** : une question par famille, tour après tour (×5, ×2, ×4, ×3, ×9, ×7, puis on recommence), pour qu'une minute couvre toutes les familles, même à 4 ou 5 secondes par question. Arrêt d'une famille dès deux échecs.
- **Une famille réussie au diagnostic est acquise en bloc** : ses résultats non testés passent « vus » en boîte 2, et les ×1 et ×10 en boîte 3 dès que la famille des faciles est réussie. Ils reviendront par l'espacement, sans encombrer les séances.
- **Ordre des nouveaux** : par famille, puis par difficulté connue (les résultats qui résistent en dernier dans leur famille), jamais par ordre lexical.
- **Pas de ×1 dans les questions « multiple » et « décomposition »**, et pas de ×1 parmi les cases montées affichées en fin de séance.
- **Fin du diagnostic qui valorise** : « You already know 18 of them! » (le nombre de résultats justes), avant « Let's go ».

**Fichiers** : `modules/tables/moteur.js` (`questionsDiagnostic`, `appliquerDiagnostic`, `seance`, `question`), `modules/tables/tables.js` (`terminer`, `fin`), `commun/textes.js` (`diag_fin`).

### 3. Un résultat devient « by heart » le jour même du diagnostic

**Ce qu'on voit.** [rendu] Sur la grille de Clara après une seule séance, le jour du diagnostic : 5 × 7, 7 × 5 et 5 × 5 en or « Up today ». [mesuré] `appliquerDiagnostic` met un résultat rapide en boîte 3 sans noter le jour dans `justesJours` ; à la séance qui suit, le même jour, une réponse rapide le fait monter en boîte 4, l'or.

**Pourquoi c'est un problème.** Le PLAN l'a décidé : un résultat n'est « su » que s'il ressort juste et vite **à des jours différents** [programme : Eduscol, rebrassage espacé, repris de PLAN.md § 2]. Ici, deux réponses à dix minutes d'intervalle suffisent. L'or perd sa valeur, et un résultat mal ancré sort trop tôt des séances.

**Correction proposée.** Dans `appliquerDiagnostic`, ajouter le jour du diagnostic à `justesJours` des résultats justes. Une ligne, et un test dans `moteur.test.js`.

**Fichier** : `modules/tables/moteur.js`.

### 4. Une erreur sur « 7 × ? = 56 » ou sur « 57 est-il dans la table de 7 ? » reçoit la correction d'un produit

**Ce qu'on voit.** `montrerRevoir` (tables.js) affiche toujours « a × b = **produit** », surligne le produit et fait retaper le produit (`S.retaper` compare à `q.a * q.b`), quel que soit le type de question :

- **facteur manquant** : l'enfant a cherché le 8 ; on lui surligne 56 et on lui fait taper 56 ;
- **multiple** : l'enfant a répondu « Oui » à « 57 est-il dans la table de 7 ? » ; l'écran ne dit jamais « Non », ne montre pas 57, affiche « 7 × 8 = 56 » et lui fait taper 56. Le pavé remplace en plus les boutons Oui et Non ([rendu] il apparaît déjà sur l'écran « juste » d'une question Oui/Non) ;
- **décomposition** : la correction donne une seule réponse (« 3 × 8 = 24 ») alors que 4 × 6 aussi était juste.

**Pourquoi c'est un problème.** La correction doit répondre à la question posée : l'enfant ne relie pas « 56 » à son erreur sur le 8, et ne comprend pas pourquoi 57 était faux. Le facteur manquant fait partie des résultats qui résistent le plus [programme, repris de PLAN.md § 2] : c'est là que la correction doit être la plus nette.

**Correction proposée.** Une correction par type :

- manquant : « 7 × **8** = 56 », le 8 surligné, et l'enfant retape le 8 dans la même mise en page « 7 × ? = 56 » ;
- multiple : « **Non** : 7 × 8 = 56 et 7 × 9 = 63, 57 est entre les deux », sans retape, et la question revient plus loin avec les boutons Oui/Non ; garder les boutons à l'écran sur l'écran « juste » au lieu du pavé ;
- décomposition : « Par exemple 3 × 8 = 24, ou 4 × 6 = 24 », retape d'une décomposition au choix.

**Fichiers** : `modules/tables/seance.js` (`repondre`, `retaper`), `modules/tables/tables.js` (`montrerRevoir`, `montrerJuste`, `retaper`).

### 5. La décomposition se contourne en tapant « 1 × 24 », et son Check change de case au lieu de vérifier

**Ce qu'on voit.** `verifier` accepte tout couple d'entiers dont le produit est juste, donc 1 × 24 et 24 × 1. La réponse est créditée au résultat d'origine (3 × 8) même si l'enfant a tapé autre chose. [rendu] Après le premier nombre, appuyer sur « Check » ne vérifie rien : le curseur passe dans la deuxième case (`valider` dans tables.js).

**Pourquoi c'est un problème.** Un enfant de 9 ans trouve le raccourci en deux essais, et la question n'entraîne plus rien [pratique] ; la grille monte quand même. Le bouton qui fait autre chose que ce qu'il dit crée un doute à chaque décomposition.

**Correction proposée.** Refuser le facteur 1 quand le produit a une autre décomposition dans les tables, avec la bulle « Try without 1! » (consigne en français si l'on suit la règle de langue : « Essaie sans le 1 »). Créditer le résultat que l'enfant a réellement donné. Passer à la deuxième case dès qu'on touche celle-ci, ou automatiquement après un chiffre si aucun produit des tables ne commence par ce nombre suivi d'un autre chiffre ; Check reste en pointillé tant que les deux cases ne sont pas remplies.

**Fichiers** : `modules/tables/moteur.js` (`verifier`), `modules/tables/seance.js` (`repondre`), `modules/tables/tables.js` (`valider`, `majSaisie`).

### 6. Les astuces sont justes, mais trois sur dix passent par un détour plus dur que le résultat

**Ce qu'on voit.** [mesuré] `astuce` choisit la stratégie de la famille la plus ancienne des deux facteurs. Conséquences :

- **l'astuce « dix moins un » ne sert que pour 7 × 9 et 9 × 7** ; 6 × 9 devient « 9 × 3 = 27, et le double de 27, c'est 54 », 8 × 9 « 9 × 4 = 36, et le double de 36, c'est 72 », 4 × 9 « 9 × 2 = 18, et le double de 18 » ;
- **les carrés n'ont aucune stratégie** : « 7 × 7, c'est un carré : 49. Les carrés servent de repères. » ne dit pas comment retrouver 49, et « repères » est un mot d'adulte ;
- « 10 × 5, c'est la moitié de 10 × 10 = 100 : 50 » enchaîne « = » puis « : », difficile à lire pour un lecteur fragile ;
- 7 × 8 passe par 7 × 4 = 28, lui-même cité parmi les résultats qui résistent.

**Pourquoi c'est un problème.** Doubler 27 ou 36 de tête est plus difficile que 6 × 9 pour un enfant de CM1 ; Eduscol appuie le ×9 sur le ×10 (« 4 × 9 = 40 - 4 ») [programme, repris de PLAN.md § 2]. Et l'astuce qui suit une erreur est le seul moment où l'enfant reçoit une méthode : sur 7 × 7, il n'en reçoit pas.

**Correction proposée.**

- Priorité au ×9 dès que l'autre facteur vaut 3 ou plus : « 6 × 10 = 60, moins 6 : 54 ».
- Carrés : 6 × 6 « 6 × 5 = 30, plus 6 : 36 » ; 7 × 7 « 7 × 5 = 35, plus 7 × 2 = 14 : 49 » ; 8 × 8 « 8 × 4 = 32, et le double de 32, c'est 64 » ; garder « c'est un carré » en tête si l'on veut, sans « repères ».
- ×5 dans la même forme que les autres : « 10 × 10 = 100, et la moitié de 100, c'est 50. »
- 7 × 8 : proposer aussi « 7 × 7 = 49, plus 7 : 56 », une fois les carrés installés.
- Écrire les facteurs dans l'ordre de la question quand c'est possible (« 6 × 7 » plutôt que « 7 × 3 = 21 » pour la question 6 × 7) : l'enfant retrouve sa question dans l'astuce.

Avant de figer ces formules, **demander aux maîtresses les astuces qu'elles emploient** : une stratégie qui contredit celle de la classe embrouille [pratique], et DISPOSITIF.md le prévoit déjà pour la dictée.

**Fichier** : `modules/tables/moteur.js` (`astuce`), et un test qui garde la vérification arithmétique des cent astuces.

### 7. La ligne d'arrivée recule à chaque erreur

**Ce qu'on voit.** [rendu] « 1 of 13 », une erreur, puis « 2 of 14 ». Chaque erreur insère la question trois places plus loin (`seance.js`, `RETOUR_APRES`), et chaque retour raté en insère un nouveau, sans limite. [mesuré] Un enfant qui rate neuf questions le premier jour passe 29 questions et 9 écrans de correction, soit environ 6 à 7 minutes ; un enfant qui sait tout fait 20 questions en 2 minutes environ.

**Pourquoi c'est un problème.** Pour un enfant de 9 ans, voir le total grandir quand il se trompe se lit comme une punition, contraire au principe « l'erreur sans punition » de DISPOSITIF.md [pratique]. Les durées restent dans la cible de 5 minutes, mais l'écart entre l'enfant qui réussit et celui qui peine se fait au détriment du second.

**Correction proposée.** Garder le total initial fixe (« 1 of 13 ») et afficher les questions qui reviennent comme de petits points en plus, après la ligne, sans changer le chiffre ; limiter à un retour par résultat et par séance ; plafonner la séance à environ 26 écrans. Pour l'enfant rapide, 20 questions conviennent ; le défi d'une minute prendra le relais.

**Fichiers** : `modules/tables/seance.js` (`repondre`), `modules/tables/tables.js` (`majAvance`).

### 8. Le français et l'anglais se mélangent dans une même bulle de correction, et le coin parent parle anglais aux parents

**Ce qu'on voit.** [rendu] Sur l'écran d'erreur : « Let's look again » (anglais), puis « L'astuce de Pooh Bear » et « À toi de le retaper » (français), « Check » sur le pavé. Sur une question Oui/Non : « Quick! » au-dessus de « Oui ». C'est fidèle à la synthèse de design, qui fait le même mélange. Dans le code, `textes.js` porte des clés bilingues `a_toi_retaper`, `oui`, `non` et `presque` que `tables.js` n'utilise pas : il écrit le français en dur, ce qui laisse croire que la règle n'a pas été tranchée. Le coin parent suit la langue de l'enfant, donc il est en anglais pour Louise et Louis.

**Pourquoi c'est un problème.** La règle de la relecture du 01/11/2026 (`docs/revues/2026-11-01_relecture-anglais.md`) est claire : la consigne d'exercice suit la langue du contenu (français), la mascotte parle toujours anglais. « Trouve deux nombres », « À toi de le retaper » et « Oui/Non » sont donc bien en français. Reste une ambiguïté d'étiquette : « L'astuce de Pooh Bear » met la mascotte anglophone au-dessus d'un texte français. Et la relecture proposait « Nearly! Let's look again », dont « Nearly! » a disparu. La question ouverte de cette relecture (« les enfants lisent-ils l'anglais ou le parlent-ils seulement ? ») pèse sur la bulle du diagnostic, la plus longue phrase anglaise de l'app.

**Correction proposée.**

- Écrire la règle dans `DESIGN-SYSTEM.md` en une ligne par élément : consignes, Oui/Non, étiquette de l'astuce en français ; bulles de la mascotte, boutons du pavé et de navigation en anglais. Puis soit utiliser les clés de `textes.js` en forçant le français, soit les supprimer.
- Rétablir « Nearly! Let's look again » dans la bulle.
- Donner au coin parent sa propre langue, français par défaut, indépendante de celle de l'enfant.
- Sur l'écran d'erreur, faire lire **l'astuce** par le bouton Listen (aujourd'hui il ne lit que « 7 fois 8 égale 56 ») : c'est le texte le plus long, et le plus utile à un lecteur fragile.

**Fichiers** : `modules/tables/tables.js` (`montrerRevoir`, `question`, `brancher` de la séance), `commun/textes.js`, `commun/portail.js`, `docs/design-system/DESIGN-SYSTEM.md`.

### 9. En iPad portrait, l'accueil du module et la fin de séance laissent un quart d'écran vide en bas

**Ce qu'on voit.** [rendu] Accueil du module en portrait : environ 230 px vides sous les cartes « Coming soon ». Fin de séance en portrait : environ 270 px vides sous les boutons, tout le contenu collé en haut. En paysage, la carte violette « Today's practice » garde environ 300 px de violet vide entre la mascotte et le titre. Les écrans de question, de correction et la grille, eux, remplissent bien le portrait.

**Pourquoi c'est un problème.** Un écran tassé en haut paraît inachevé, et place les boutons « See my grid » et « Done for today » loin du pouce et du regard. Moindre gravité que les points précédents : rien n'empêche l'enfant d'avancer.

**Correction proposée.** Centrer verticalement le contenu de la fin de séance en portrait et agrandir la mascotte ; sur l'accueil du module, faire porter à la carte « Today's practice » ce qui l'attend aujourd'hui (nombre de questions, la semaine en tampons, « 7 × 8 comes back today ») au lieu du vide, ce qui remplit aussi la carte en paysage. L'accueil du module n'existe pas dans la synthèse : le faire relire comme un écran nouveau.

**Fichiers** : `modules/tables/tables.css` (règles `@media (orientation: portrait)`), `modules/tables/tables.js` (`accueil`, `fin`).

### 10. Les compteurs de la grille ne disent pas la même chose que l'accueil

**Ce qu'on voit.** [rendu] Grille de Clara : 3 étoiles « Up today », légende comptée sur 100 cases ; accueil et coin parent : « 2 of 36 ». `compteOr` ne compte que les paires de 2 à 9 dont les deux ordres sont en or, alors que la grille montre 100 cases et colore aussi les ×1 et ×10. La liste « shaky » du coin parent ne retient que les résultats ratés en séance : ni les échecs du diagnostic, ni les résultats lents (point 1) ; elle cite en revanche 1 × 4.

**Pourquoi c'est un problème.** L'enfant compte ses étoiles : trois sur la grille, deux à l'accueil, il ne comprend pas lequel croire. Les parents reçoivent une liste qui n'a pas le sens de l'exemple du PLAN (« 4 restent fragiles : 7 × 8, 9 × 7, 6 × 7, 8 × 4 »).

**Correction proposée.** Atténuer sur la grille les lignes et colonnes 1 et 10 (cases plus pâles, hors du compte) et écrire la légende sur 36, ou compter partout sur 100 : un seul dénominateur. Dans le coin parent, ne lister que des résultats de 2 à 9, y compris ceux ratés au diagnostic et ceux justes mais lents.

**Fichiers** : `modules/tables/tables.js` (`grille`), `modules/tables/moteur.js` (`compteOr`), `commun/portail.js` (`resume`).

### 11. « Est-il dans la table de… » s'écarte de la formulation d'Eduscol citée dans le PLAN

**Ce qu'on voit.** La question « multiple » dit « 48 est-il dans la table de 6 ? » ; le PLAN cite Eduscol : « 48 est-il un multiple de 6 ? » [programme, repris de PLAN.md § 2, non relu]. Le faux candidat est toujours le produit plus 1 (`question` dans moteur.js).

**Pourquoi c'est un problème.** Pour Clara en CM2, le mot « multiple » est le vocabulaire de la classe ; « dans la table de » ne l'y prépare pas. Le produit plus 1 est un leurre trop régulier : un enfant qui reconnaît un produit connu répond sans réfléchir [pratique].

**Correction proposée.** « 48 est-il un multiple de 6 ? » pour Clara, « dans la table de » pour Henri si sa maîtresse n'emploie pas encore « multiple » (à lui demander). Varier les leurres : un produit d'une table voisine (54 pour la table de 7), un nombre pair proche.

**Fichier** : `modules/tables/moteur.js` (`question`), `modules/tables/tables.js` (`question`, `aLire`).

### 12. Points secondaires

- **La bonne réponse reste visible pendant la retape** [rendu] : l'enfant recopie plus qu'il ne se rappelle. Acceptable, parce que la question revient trois questions plus loin, ce qui est le vrai rappel ; si l'on veut coller au PLAN (« retape sans aide »), masquer la ligne surlignée dès le premier chiffre tapé. `tables.js` (`montrerRevoir`).
- **« 6 squares went up » au-dessus de quatre jetons seulement** [rendu] : l'enfant compte quatre. Écrire « +2 » dans un cinquième jeton, ou afficher le nombre de jetons montrés. `tables.js` (`fin`).
- **Un Back par erreur en pleine séance** ramène à l'accueil sans demander, et la file de questions repart (déjà noté dans le README du module). Une confirmation légère (« Stop for today? ») suffit. `tables.js`.
- **Après le diagnostic, « Let's go » mène à l'accueil du module**, puis il faut retoucher « Today's practice » : enchaîner directement sur la première séance. `tables.js` (`terminer`).
- **Sur iPhone, les cases de la grille font environ 31 px** [rendu], sous les 56 px de la fiche du designer. L'iPhone est un usage ponctuel des parents : acceptable, à noter dans le système de design comme exception assumée.
- **Écart avec la synthèse à trancher par les parents** : la synthèse demandait de remplacer le Pooh Bear au t-shirt rouge par un ours sans les codes Disney ; le PLAN (§ 3) a ensuite décidé de dessiner les mascottes d'après les doudous, t-shirt rouge compris. L'app suit le PLAN. Rien à corriger tant que le dépôt et l'app restent familiaux ; à reconsidérer si l'app est un jour montrée hors de la famille, le dépôt étant public.
- **Preuve 4 bis de la synthèse (« 10 × 10 = 100 » sur l'écran juste) absente des captures** : l'ajouter au parcours `test_parcours.py` pour vérifier qu'il ne déborde pas aux trois formats.

## Ce qui est réussi et doit rester

- **Le rendu suit fidèlement la synthèse de design** [rendu] : mascotte absente pendant la réflexion, pavé sous la main droite en paysage et sous la question en portrait, Check en pointillé quand il n'y a rien à valider, Check qui devient Next au même endroit avec la jauge et le pavé désactivé, échelle de maîtrise pointillé, hachures, aplat à deux points, or à étoile, or clair calme et or vif pour le jour, semaine en tampons sans rien de barré ni de rouge, Retour et Listen nommés sous l'icône, aucun produit affiché dans la grille hors de la case touchée.
- **L'écran d'erreur est le meilleur de l'app** [rendu, pratique] : le résultat surligné, la mascotte qui aide, l'astuce, la retape, puis le retour plus loin. C'est la séquence d'Eduscol et du PLAN, sans croix ni son agressif (`doux`).
- **Les cent astuces sont exactes** [mesuré], formulées en phrases d'enfant pour la plupart, et le ×10 évite la règle « on ajoute un zéro », fausse sur les décimaux [programme, repris de PLAN.md § 2].
- **Le diagnostic sans chrono visible, avec « Skip » bien visible**, et une bulle qui dit pourquoi on le fait : la décision du 01/11/2026 est bien appliquée.
- **La récompense porte sur le progrès et la régularité** : cases qui montent, jours faits dans la semaine, « Tomorrow, 7 × 8 comes back to see you » ; aucune série qui retombe à zéro, aucune comparaison entre les enfants.
- **Le moteur est découpé proprement** (moteur, séance, interface) et testé en node : chacune des corrections ci-dessus se fait dans un fichier, avec un test.
- **La progression est sauvée après chaque réponse** : un enfant qui quitte ne perd rien de ce qu'il a fait.
- **Les quatre types de questions d'Eduscol** sont là, et n'arrivent qu'une fois le produit installé (boîte 2) : bon ordre.
