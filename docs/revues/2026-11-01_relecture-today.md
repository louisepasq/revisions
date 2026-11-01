# Relecture du « Today » : la règle est juste pour 9 et 10 ans, mais le code la recalcule après chaque activité et le premier jour reste vide

Relecture du 01/11/2026 par `relecteur-pedagogique` (professeur des écoles en CM1 et CM2, formateur). Lu : `CLAUDE.md`, `docs/DECISIONS.md`, `docs/DISPOSITIF.md`, `docs/design-system/archive/2026-11-01_accueil/README.md`, la fonction `planDuJour` de `commun/portail.js` (et celle de `maquette.js`), `commun/modules.js`, `modules/tables/resume.js`, `modules/zoom/resume.js`, `modules/cible/etat.js`, `modules/cible/moteur.js`, `modules/cible/cible.js`, `test/portail.test.js` et `docs/revues/2026-11-01_relecture-cible.md`. Aucun fichier existant n'a été modifié.

**Conclusion en trois lignes**

1. La règle (trois activités, quinze minutes, une matière à la fois, révisions d'abord) est bonne pour Henri et Clara et doit rester ; le code la suit fidèlement, sauf sur un point : le plafond se recalcule après chaque activité, donc à six modules et plus le « Today » ne finit jamais.
2. Nombre cible : le laisser hors du « Today », écarter pour Henri les cibles d'un seul calcul, garder la voix et le badge, mais corriger la bulle de fin qui contredit le badge quand un indice a été pris.
3. Le premier jour, le « Today » est vide et un module nouveau n'y entre pas tant qu'on ne l'a pas ouvert : à corriger par une découverte proposée d'office, une seule par jour.

Marquage : **[programme]** texte officiel ou Eduscol lu à la source ; **[recherche]** étude citée ; **[pratique]** usage de classe, mon appréciation ; **[code]** lu dans le dépôt.

## 1. La règle du « Today » : juste pour l'âge, avec un écart de code qui la vide de son sens à quinze modules

### Ce qui est juste et doit rester

- **Quinze minutes par jour, en trois morceaux de cinq** : c'est la bonne dose à 9 et 10 ans, après une journée de classe. La ressource Eduscol sur le calcul demande des « temps spécifiques quotidiens » pour le calcul mental, avec des activités « proposées quotidiennement » ([Le calcul aux cycles 2 et 3, Eduscol](https://eduscol.education.fr/document/15400/download)) : le format court et quotidien est exactement celui-là. **[programme]** La recherche sur la pratique espacée va dans le même sens : à temps égal, répartir vaut mieux que concentrer ([Cepeda et al., 2006](https://doi.org/10.1037/0033-2909.132.3.354) ; [Kang, 2016](https://doi.org/10.1177/2372732215624708)). **[recherche]**
- **Un plafond qui se voit** (« 3 things · 15 min ») : un enfant de cet âge accepte mieux un travail dont il voit la fin. C'est ce qui évite la négociation du soir. **[pratique]**
- **Les révisions d'abord** : c'est le bon ordre, parce qu'il protège ce qui est déjà su avant d'ajouter du neuf, et qu'une révision est souvent réussie, donc un bon démarrage. Une nuance de formulation seulement : « la mémoire n'attend pas » est trop fort ; une révision faite avec un jour de retard reste efficace, ce qui compte est de répartir, pas le jour exact (Cepeda, ci-dessus). Rien à changer dans le code. **[recherche]**
- **Une matière à la fois au premier passage** : de la variété sans éparpillement, et aucune matière n'écrase les autres. **[pratique]**
- **« Le reste attend demain, sans rien perdre »** : les boîtes de Leitner des tables et du voyage le permettent, une carte due reste due. Ne jamais afficher de retard ni de « tu as manqué » : conforme à D-10. **[code]**
- **Le portail calcule, le module déclare** : la règle est au même endroit pour tous les modules, c'est sain. **[code]**

Le code (`planDuJour` de `commun/portail.js`) reprend à l'identique celui de la maquette : filtre de ce qui est dû et pas fait aujourd'hui, tri révision, séance, découverte puis date due puis ordre du catalogue, premier passage par matière, second passage, arrêt à trois activités ou quinze minutes. **[code]**

### Proposition 1 (la plus importante) : compter dans le plafond ce qui a déjà été fait aujourd'hui. À valider par les parents.

- **Ce qui est codé** : `planDuJour` retire les modules faits aujourd'hui, puis remplit à nouveau trois places et quinze minutes avec ce qui reste. Le plafond porte donc sur ce qui reste à faire, pas sur la journée. Un enfant qui finit ses trois activités voit arriver les trois suivantes, et ainsi de suite tant qu'il reste des modules dus. Le test `Today : quinze minutes au plus, le reste attend demain` ne le voit pas, puisqu'il n'a aucun module fait ce jour-là. **[code]**
- **Pourquoi ça ne se voit pas encore** : aujourd'hui, seuls les tables et le voyage publient quelque chose de dû (le nombre cible publie `du: null`, le planisphère n'a pas de résumé), donc le « Today » n'a jamais plus de deux activités. L'écart apparaîtra avec le troisième module qui publie un `du`. **[code]**
- **Pourquoi c'est gênant** : « Peu et souvent » (`DISPOSITIF.md`, principe 2) et « ce qui ne rentre pas attend demain » deviennent faux ; l'écran « All done. See you tomorrow! » n'arrive plus, alors que c'est lui qui donne le sentiment d'avoir fini, et qui permet au parent de dire « c'est fait pour aujourd'hui ». **[pratique]**
- **Ce que je propose** : les modules pratiqués aujourd'hui et qui ont un `du` occupent leur place et leurs minutes dans le plafond du jour (trois places et quinze minutes pour la journée entière). Quand le plafond est atteint : « All done. See you tomorrow! ». L'enfant qui en veut plus ouvre un cahier, librement : c'est du bonus, pas du dû. Un jeu libre (`du: null`, comme le nombre cible) ne consomme pas de place. Ajouter le test correspondant.

### Proposition 2 : au plus une découverte par jour dans le « Today ». À valider par les parents.

- **Ce qui est codé** : les découvertes passent après les révisions et les séances, mais rien ne limite leur nombre ; avec la proposition 3 (section 3), le premier jour proposerait trois découvertes d'un coup (diagnostic des tables, grand voyage, nombre cible). **[code]**
- **Ce que je propose** : une seule découverte par jour dans le « Today » ; les autres attendent demain. Les modules arrivent ainsi un par un, ce qui donne à chacun son moment, laisse au parent le temps d'être à côté la première fois, et suit la même logique que D-20 (au plus quatre faits nouveaux par jour). **[pratique]**
- **À surveiller, sans rien coder maintenant** : à quinze modules, si trois matières ont chaque jour une révision, une découverte peut attendre plusieurs jours. Si ça arrive, réserver la troisième place à une découverte en attente. Pas avant d'avoir vu le cas.

### Proposition 3 (secondaire) : quand toutes les tables sont en or et que rien n'est dû, ne plus proposer une séance chaque jour. À valider par les parents.

- **Ce qui est codé** : `modules/tables/resume.js` publie chaque jour une séance (`nature: 'seance'`) quand aucune carte ne revient, même quand les 36 cartes sont dorées. Le voyage, lui, publie alors la date de la prochaine révision. **[code]**
- **Ce que je propose** : faire comme le voyage une fois l'album entièrement en or : proposer la prochaine révision prévue, plus une séance d'entretien de temps en temps (deux fois par semaine). Tant que l'album n'est pas complet, la séance quotidienne est juste : c'est le choix « Peu et souvent » du module, et les automatismes se construisent par une pratique quotidienne (Eduscol, ci-dessus). **[programme]** Sans ce réglage, à quinze modules, les tables occuperaient une place tous les jours pour un travail devenu inutile. **[pratique]**

### Proposition 4 (secondaire) : une séance n'est « faite » qu'une fois finie. À valider par les parents.

- **Ce qui est codé** : les tables et le voyage marquent le jour comme pratiqué dès la première réponse enregistrée (`enregistrer` et `noterJour` dans leurs moteurs). Le résumé n'étant republié qu'à l'ouverture et en fin de séance, un enfant qui répond à une question puis revient à l'accueil garde le module dans son « Today » ; mais s'il rouvre le module et en ressort, le résumé recalculé à l'ouverture le dit fait pour aujourd'hui, et il quitte le « Today ». **[code]**
- **Ce que je propose** : le module ne sort du « Today » qu'après une séance finie (par exemple un champ « séance finie aujourd'hui » dans l'état, que le résumé lit pour décaler `du.des` au lendemain). Le tampon de la semaine peut, lui, rester posé dès la première réponse : il récompense d'être venu. Point de détail, à traiter seulement s'il gêne à l'usage.

## 2. Les quatre questions du nombre cible : trois recommandations de la session confirmées, une bulle à corriger

### Question 1 : le jeu reste hors du « Today ». À valider par les parents.

- **Mon avis** : je confirme la recommandation : `du: null`, le jeu reste libre. Les automatismes de calcul quotidiens sont déjà portés par les tables, qui sont dans le « Today » chaque jour, et le premier passage ne prend qu'une activité de maths : le nombre cible n'y entrerait qu'en troisième place, en poussant le total à quinze minutes tous les jours. **[code]**
- **Pourquoi c'est mieux libre** : le choix renforce la motivation intrinsèque, davantage chez l'enfant que chez l'adulte ([Patall, Cooper et Robinson, 2008](https://doi.org/10.1037/0033-2909.134.2.270)). **[recherche]** Un jeu qu'Henri a apporté de sa classe et qu'il a aidé à régler est le candidat idéal pour rester un plaisir qu'on choisit. **[pratique]**
- **Ce que je propose en plus** : une seule apparition, en découverte, le jour où il arrive (section 3), pour qu'aucun des deux enfants ne l'ignore ; puis libre. Faire le point au bout de deux semaines : si un enfant ne l'ouvre jamais de lui-même, le proposer deux fois par semaine sous la forme « une cible » (cinq minutes honnêtes), jamais tous les jours.

### Question 2 : écarter pour Henri les cibles atteintes en un seul calcul. Oui. À valider par les parents.

- **Mon avis** : je confirme. Une cible faite en un calcul (4 × 5 = 20) se gagne sans chercher : l'intérêt du jeu est d'enchaîner des calculs et de garder un résultat intermédiaire en tête, ce que la ressource Eduscol appelle le calcul en ligne. **[programme]** La bulle de défi (« Moussi found a path worth 13 points ») rattrape en partie le problème, mais seulement après une victoire trop facile. **[pratique]**
- **Précision pour le code** : la condition juste n'est pas « au moins deux calculs » dans la solution d'Henri, mais « aucun calcul unique entre deux nombres de départ ne donne la cible », c'est-à-dire que la solution la plus courte du moteur (`plusCourte`) compte au moins deux étapes. C'est un filtre de tirage, qui ne touche pas aux règles de D-18. Clara garde ses cibles qui admettent le coup parfait.

### Question 3 : la lecture automatique des deux bulles en anglais. Garder. À valider par les parents.

- **Mon avis** : garder. Le coût de l'indice est une information dont l'enfant a besoin avant de décider ; l'entendre en plus de la lire aide un lecteur débutant en anglais, et c'est cohérent avec D-13 (le cadre en anglais, Listen pour le lire). **[pratique]**
- **Ce que je propose en plus** : que la compréhension ne dépende pas de l'anglais. Dans la question de l'indice, afficher le coût en chiffre et en symbole, en gros (« −3 » avec l'étoile des points) à côté de « Yes, show me », comme le fait déjà la pastille de la partie en cours. Henri comprend « −3 » même s'il ne comprend pas « It costs 3 points from your score ». **[pratique]**

### Question 4 : garder le badge « Perfect move! » après un indice. Oui, mais corriger la bulle de fin. À valider par les parents.

- **Mon avis sur le badge** : je confirme. Le coup parfait est exact, le « −3 for the hint » est écrit à côté ; retirer le badge punirait l'indice deux fois et contredirait « l'erreur sans punition » (principe 3). **[pratique]**
- **L'incohérence trouvée** : `cible.js` lance le défi dès que le score est inférieur au meilleur (`defi = r.score < tirage.meilleur`). Après un coup parfait avec un indice, le score vaut 10 et le meilleur 13 : l'écran montre en même temps « Perfect move! » et « Moussi found a path worth 13 points. Want to try? », avec le chemin de Moussi à révéler. L'enfant vient de jouer ce chemin : le message est faux pour lui. **[code]**
- **Ce que je propose** : dans ce cas précis (coup parfait et indice pris), une autre bulle, du type « Perfect move! Can you do it again without a hint? », avec « Same target again » en bouton principal. C'est un défi juste : refaire seul ce qu'on a réussi avec de l'aide est exactement ce qui consolide. Pas de chemin de Moussi à montrer.

## 3. Le premier jour : le « Today » est vide et un module neuf reste invisible, à corriger par une découverte d'office

- **Ce qui est codé** : un module n'entre dans le « Today » qu'avec un résumé, et il n'en publie qu'à sa première ouverture. Le tout premier jour, aucun module n'en a : l'accueil affiche « Today, you choose. » et la mascotte « Pick a notebook! », sans bouton Start. Plus tard, chaque nouveau module (dictée, fractions…) restera hors du « Today » tant que l'enfant ne l'aura pas trouvé seul dans son cahier. **[code]** C'est conforme au contrat écrit (« Un module sans résumé […] n'entre jamais dans le Today », README de l'accueil cité par D-19) : le point est donc une question aux parents, pas une correction.
- **Est-ce gênant ?** Le premier jour, peu : un parent sera à côté. Mais un enfant qui prend l'habitude de toucher Start ne fouille pas les cahiers : un module neuf peut rester ignoré des semaines, alors que le « Today » est justement fait pour guider. Et le premier contact avec l'app serait l'écran le moins guidé de tous. **[pratique]**
- **Ce que je propose, à valider par les parents** : le portail traite un module actif du catalogue qui sait publier un résumé (ceux qui ont un `objet` : tables, nombre cible, voyage) et qui n'en a pas encore comme une découverte due aujourd'hui, de cinq minutes, avec une phrase « New! » (« Nouveau ! »). Les deux modules concernés en publient déjà une à leur ouverture (« On commence » pour les tables, le grand voyage pour le zoom) : on ne fait qu'anticiper ce qu'ils diraient. Le planisphère (sans `objet`, `synchro: false`) reste hors du « Today », comme aujourd'hui. Avec la proposition 2 (une découverte par jour), l'arrivée se fait en douceur : les tables le premier jour, le voyage le deuxième, le nombre cible le troisième, puis chaque nouveau module le jour où il est mis en ligne.

## Récapitulatif des propositions, de la plus importante à la plus secondaire, toutes à valider par les parents

1. Compter dans le plafond de trois activités et quinze minutes ce qui a déjà été fait aujourd'hui, pour que le « Today » finisse (section 1, proposition 1).
2. Proposer d'office en découverte un module neuf qui n'a pas encore de résumé, sauf le planisphère (section 3).
3. Au plus une découverte par jour dans le « Today » (section 1, proposition 2).
4. Nombre cible : corriger la bulle de fin quand le coup parfait a été fait avec un indice (section 2, question 4).
5. Nombre cible : pour Henri, ne tirer que des cibles dont la solution la plus courte compte au moins deux calculs (section 2, question 2).
6. Nombre cible : le laisser hors du « Today », sauf le jour de sa découverte ; point à deux semaines (section 2, question 1).
7. Nombre cible : garder la voix sur les deux bulles, et afficher « −3 » en gros dans la question de l'indice (section 2, question 3).
8. Garder le badge « Perfect move! » après un indice (section 2, question 4).
9. Tables entièrement en or : proposer la prochaine révision plutôt qu'une séance chaque jour (section 1, proposition 3).
10. Un module ne sort du « Today » qu'après une séance finie (section 1, proposition 4).

## Sources

- Eduscol, *Le calcul aux cycles 2 et 3* (ressources d'accompagnement, mathématiques) : <https://eduscol.education.fr/document/15400/download>, lu le 01/11/2026 (« temps spécifiques quotidiens », activités « proposées quotidiennement »).
- Cepeda, Pashler, Vul, Wixted et Rohrer (2006), *Distributed practice in verbal recall tasks: A review and quantitative synthesis*, Psychological Bulletin 132(3), 354-380 : <https://doi.org/10.1037/0033-2909.132.3.354> (résumé lu sur [PubMed](https://pubmed.ncbi.nlm.nih.gov/16719566/)).
- Kang (2016), *Spaced repetition promotes efficient and effective learning: Policy implications for instruction*, Policy Insights from the Behavioral and Brain Sciences 3(1), 12-19 : <https://doi.org/10.1177/2372732215624708> (notice lue, texte intégral non consulté).
- Patall, Cooper et Robinson (2008), *The effects of choice on intrinsic motivation and related outcomes: A meta-analysis of research findings*, Psychological Bulletin 134(2), 270-300 : <https://doi.org/10.1037/0033-2909.134.2.270> (résumé lu sur [PubMed](https://pubmed.ncbi.nlm.nih.gov/18298272/)).
