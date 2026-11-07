# Module « Les hélicoptères » : le premier projet de science d'Henri, sept étapes autour de son Écureuil H125, un carnet de pilote passé avec Moussi

Construit le 07/11/2026 sur le plan validé par Louis (D-23, D-24) et sa demande du même jour sur le carnet de pilote (D-25). Le pourquoi est dans [`docs/helicopteres/PLAN.md`](../../docs/helicopteres/PLAN.md) et la relecture des experts dans [`docs/revues/2026-11-07_relecture-helicopteres.md`](../../docs/revues/2026-11-07_relecture-helicopteres.md). Henri seul : `henri/helicopteres.html`, cahier de sciences.

## Architecture : six fichiers, sans bibliothèque ni build, les boîtes de Leitner du zoom

| Fichier | Rôle | Dépend de |
|---|---|---|
| `contenu.js` | `window.HeliContenu` : les sept étapes et leurs objets, les parties, les trois commandes (nom français et anglais), les missions, les écrans de chaque étape, la scène radio, les records, la sortie, le carnet, les 22 cartes de Leitner, les étiquettes (`UI`) ; `toutesLesPhrases(lg)` rend tout ce que le module peut dire | rien |
| `dessins.js` | `window.HeliDessins` : dessins originaux en SVG (l'Écureuil vu de côté et de dessus, la pale en coupe, le compteur de tours, les commandes, Moussi en tenue de pilote, les objets et les tampons du carnet, le gabarit A4 en millimètres, le manuel, les comparaisons) | rien |
| `moteur.js` | `window.Helico` : l'état (`<enfant>.helicopteres`), les étapes qui s'ouvrent, les séances de cartes, le carnet (tampons, objets), les mesures de l'expérience. **Réutilise le moteur du zoom** (`Zoom.enregistrer`, `jour`, `ajouterJours`, `joursDeLaSemaine`, `finirSeance`) : une carte est rangée sous `'<carte>|q'` | `modules/zoom/moteur.js`, `contenu.js` |
| `resume.js` | `window.HeliResume` : le résumé publié pour le portail (contrat de `docs/ARCHITECTURE.md`, section 8) | `moteur.js`, `commun/textes.js` |
| `helicopteres.js`, `helicopteres.css` | l'interface : langue, accueil, étapes, cockpit, atelier, cartes, carnet | le kit et les fichiers ci-dessus |
| `henri/helicopteres.html` | page fine, `data-module="helicopteres"`, charge `modules/zoom/moteur.js` avant le module | |

**L'état** : `{ version, etapes: { id: jour }, cartes: { '<carte>|q': { boite, vu, prochain, justesJours, erreurs, debut } }, jours, brevet: { commande: jour }, objets: { objet: jour }, tampons, mission, couleur, conception, parties, trouves, experience: { hypothese, verifs, mesures: { court|moyen|long: [dixièmes] }, conclusion } }`, plus deux champs facultatifs hors de `etatNeuf` : `langue` (`fr` ou `en`) et `seanceFinie`. Un état sans langue se relit tel quel et le choix s'affiche au lancement suivant ; un champ inconnu est gardé (`normaliser`, testé). **Sauvegarde en ligne** : la ligne du catalogue (`objet: 'Helico'`) suffit ; la fusion propre `fusionHelicopteres` (dans `lib/fusion.js` et `commun/sync.js`, testée dans `test/fusion.test.js`) réunit étapes, tampons et objets (date la plus ancienne), garde la carte la plus avancée et, pour chaque modèle de l'expérience, la liste de mesures la plus remplie : rien de gagné ne se perd d'un appareil à l'autre.

## Le parcours : sept étapes dans l'ordre de D-24

1. **Mon hélicoptère** : l'H125 de la famille Écureuil, ses cinq parties (on les touche, Moussi dit à quoi chacune sert), le choix de la mission (secours, police, feux de forêt, tourisme) et de la couleur, reprise partout ensuite.
2. **Comment il vole** : d'abord la question « pour monter, le rotor tourne-t-il plus vite ? » (conception initiale gardée), puis les pales qui poussent l'air, le rotor à vitesse presque constante, l'inclinaison des pales, le collectif, le rotor de queue, avancer ; enfin le retour à la réponse d'Henri.
3. **Le cockpit** : la scène vue de côté (arbre et tour fixes comme repères), le collectif à gauche, le manche à droite, les pédales en bas, chaque nom anglais sous le nom français ; on garde le doigt sur une commande, l'hélicoptère bouge tant qu'on tient, la flèche est de la couleur de la commande ; le compteur de tours ne bouge jamais, la pale en coupe s'incline, la vue de dessus s'allume pour les pédales et le manche sur le côté ; le sol arrête la descente. Déroulé : une commande à la fois, puis **Henri apprend à Moussi** (Moussi hésite, se trompe de commande et lui demande de montrer, D-25), puis le vol libre. Sans animation (`prefers-reduced-motion`), un appui fait un pas et la flèche reste affichée.
4. **L'atelier**, verrouillé jusqu'aux trois premières étapes faites, jamais sur un score : le manuel illustré (sept pages), le gabarit A4 (trois modèles, pales de 6, 8 et 10 cm, corps et pied identiques) imprimé par `window.print()` ou enregistré en SVG ; puis l'expérience : la question, l'hypothèse, la liste « une seule chose change », le test des deux modèles lâchés ensemble, trois mesures par modèle (au chronomètre de l'app, une personne lâche et l'autre touche, ou tapées au pavé, en dixièmes de seconde), une barre par modèle avec la durée du milieu, le rappel de l'hypothèse, le lien avec l'autorotation. Aucune vitesse calculée.
5. **Qui décide où on vole** : trois scènes radio où Henri joue la tour (décoller à l'aéroport, se poser dans un champ, l'âge du brevet de pilote).
6. **Records et drones**, en comparaisons dessinées (l'Everest, la voiture sur l'autoroute, un rond pour cent hélicoptères), puis le drone.
7. **La sortie** au Musée de l'Aviation de Saint-Victoret, présentée comme une sortie en famille, sans horaires : la liste des parties à trouver sur l'Écureuil, cochée sur place par un parent, puis « Nous y sommes allés ! ».

Chaque étape finie donne un objet pour le carnet (écusson de la mission, autocollant de l'Écureuil, ailes de pilote, trombone doré, casque radio, médaille de l'Everest, billet du musée). Une étape faite se rejoue depuis l'accueil.

## Le carnet de pilote (D-25)

Un livret à deux pages, celle d'Henri (son nom dans la case du pilote, l'écusson de sa mission) et celle de Moussi en tenue de pilote. **Un tampon par commande maîtrisée** : les deux cartes de la commande (son effet, et Moussi qui demande la bonne commande) en boîte 3 ou plus. Le tampon s'abat avec un son (`KR.son('tampon')`) sur les deux pages, une seule fois (`tampons`), et ne s'enlève jamais, même si une carte redescend. Rien ne s'échange, rien n'ouvre l'atelier, aucun score ni chrono affiché.

## Les cartes de Leitner : 22 cartes, quatre nouvelles par jour

Les parties (5), comment il vole (4), chaque commande et son effet dans les deux sens (6, dont trois où Moussi demande à Henri de lui montrer), les trois idées des règles (3), les records en comparaisons et le drone (4). Une carte n'arrive qu'une fois son étape faite ; au plus quatre nouvelles par jour (D-20) ; seule la première réponse compte ; une erreur ramène en boîte 1, la carte revient trois questions plus loin. Erreur sans punition : ni rouge ni croix, la bonne réponse surlignée, Moussi l'explique (voix), Henri la retouche. La voix lit chaque question.

## Le résumé pour le portail

- **Progrès** : étapes faites et cartes sues à parts égales ; phrase « 4 étapes sur 7 · 1 tampon ».
- **Dû** : les cartes qui reviennent (révision, 5 min), sinon la prochaine étape faite dans l'app (découverte, 8 min ; l'atelier et la sortie se font hors de l'écran et ne sont jamais proposés d'office), sinon des cartes nouvelles, sinon la prochaine révision prévue. Une étape ou une séance finie aujourd'hui renvoie la suite à demain (D-22, point 10).
- Pas `libre` : les cartes dues entrent dans le « Today » comme les autres révisions.

## Langue (D-24, point 5)

Au premier lancement, deux grosses cartes à drapeau, **le français proposé en premier** ; le choix est rangé dans l'état, passe par la sauvegarde en ligne et se change depuis l'accueil (le drapeau). Le contenu, Moussi qui parle dans les écrans et les voix suivent ce choix (fr-FR ou en-GB) ; le cadre (Back, Listen, Next, « Well done! ») reste celui de l'app, l'anglais par défaut. La progression est commune aux deux langues. Le coin parent reste en français.

## Les faits affichés et leur source

Tous vérifiés à la source le 07/11/2026 (marqués « relecture » : vérifiés par l'expert le même jour, `docs/revues/2026-11-07_relecture-helicopteres.md`, section 7). Aucun autre chiffre n'est dans l'app : `moteur.test.js` refuse un nombre qui n'est pas dans cette liste.

| Fait dans l'app | Source |
|---|---|
| L'H125 est un AS 350 B3 (famille Écureuil), fabriqué par Airbus Helicopters à Marignane ; l'AS 350 B3 du musée en est la version précédente (« le grand frère ») | relecture : EASA, fiche de certificat de type [EASA.R.008](https://www.easa.europa.eu/en/downloads/7945/en), édition 19, section 7 |
| Rotor de 375 à 405 tours par minute ; « plus de 6 tours chaque seconde » (calcul : 375 ÷ 60 = 6,25) | relecture : EASA.R.008, « Rotor Speed Limitations » |
| Trois pales ; rotor de queue à deux pales (dessin) | relecture : EASA.R.008, « Main Rotor », « Tail Rotor » |
| Jusqu'à sept personnes ; missions (secours médical, police, lutte contre les feux, transport et tourisme) ; croisière jusqu'à 252 km/h ; plus de 7 200 hélicoptères de la famille Écureuil livrés | [Airbus, page H125](https://www.airbus.com/en/products-services/helicopters/civil-helicopters/h125) |
| Collectif à gauche, à la main gauche, qui incline toutes les pales ensemble ; rotor tenu à vitesse constante (régulateur des turbines) ; manche qui penche le disque des pales dans la direction voulue ; pédales au plancher qui changent la poussée du rotor de queue (pédale droite, nez à droite) ; le rotor de queue empêche la cabine de tourner | [FAA, Helicopter Flying Handbook, chapitre 3](https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/helicopter_flying_handbook/hfh_ch03.pdf) |
| Les pales poussent l'air vers le bas, l'air pousse l'hélicoptère vers le haut | FAA, même manuel, chapitre 2 (« Newton's Third Law ») |
| L'autorotation : moteur arrêté, l'air qui monte fait tourner le rotor | FAA, même manuel, chapitre 11 |
| Le manche « dans ta main droite » | **déduit**, pas lu : la FAA place le collectif à la main gauche et le manche entre les jambes ; à confirmer au musée |
| À un aéroport avec une tour, le contrôleur dit oui ou non par radio, pour décoller et atterrir | [Règlement d'exécution (UE) n° 923/2012 (SERA)](https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:02012R0923-20231005), version consolidée du 05/10/2023 : SERA.8001 (d), SERA.8015, appendice 1 (« Cleared to land », « Cleared for take-off ») |
| Loin d'un aérodrome, un hélicoptère se pose sur une hélisurface avec l'accord de celui qui a la jouissance du terrain ; sauf pour l'assistance et le sauvetage | [Arrêté du 6 mai 1995 relatif aux aérodromes et autres emplacements utilisés par les hélicoptères](https://www.legifrance.gouv.fr/loda/id/JORFTEXT000000553582), articles 1 et 12, version en vigueur |
| Brevet de pilote (licence de pilote privé) : des leçons dans un organisme de formation, un examen théorique, 17 ans au moins | [EASA, Easy Access Rules for Aircrew](https://www.easa.europa.eu/en/document-library/easy-access-rules/online-publications/easy-access-rules-aircrew-regulation-eu-no?page=9) : FCL.200, FCL.210, FCL.215 |
| Record d'altitude : 12 442 m, Jean Boulet, 21/06/1972, Lama ; toujours le record | [FAI, 21/06/2022](https://www.fai.org/node/192885) |
| Un Écureuil AS 350 B3 posé au sommet de l'Everest (8 848 m) par Didier Delsalle le 14/05/2005, puis redécollé ; record toujours valable ; l'Everest, plus haut sommet du monde | [FAI, 14/05/2025](https://www.fai.org/node/203754) ; Airbus, page H125 |
| Record de vitesse : 400,87 km/h, Westland Lynx, 11/08/1986 (affiché « plus de 400 km/h », « un Lynx britannique ») ; record ratifié et actuel | [FAI, record n° 1842](https://www.fai.org/record/1842) ; [FAI, article du 11/08/2016](https://old.fai.org/cig-news/41805-11-august-1986-the-fai-world-record-of-john-trevor-egginton) |
| 130 km/h sur l'autoroute ; d'où « plus de trois fois » (3 × 130 = 390 < 400,87) et « presque deux fois » (252 ÷ 130 = 1,94) | [Code de la route, article R413-2](https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006074228/LEGISCTA000006177128/), en vigueur depuis le 16/08/2020 |
| Un drone : personne à bord, un pilote à distance qui le garde sous les yeux ; un petit drone (catégorie ouverte) reste à moins de 120 m du sol | [Règlement d'exécution (UE) 2019/947](https://eur-lex.europa.eu/legal-content/FR/TXT/HTML/?uri=CELEX:32019R0947), article 4, texte d'origine |
| Le Musée de l'Aviation de Saint-Victoret (musée municipal) expose un Écureuil AS 350 B3, des Alouette II et III, des Gazelle et un Dauphin | [site du musée, « Les hélicoptères »](https://musee-aviation-saint-victoret.fr/les-helicopteres/) (pages 1 et 2) |

**Écartés faute de source lue, donc absents de l'app** : le classement « hélicoptère civil le plus vendu » (GAMA) ; la vitesse du bout de pale ; le premier vol seul à 16 ans et le nombre d'heures de vol ; la visite médicale (lue seulement dans un moyen acceptable de conformité, pas dans la règle) ; le côté du rotor de queue, le sens de rotation du rotor et la place du pilote (le dessin ne les affirme pas) ; la façon dont un drone se dirige ; le Fenestron de la Gazelle ; les repères mont Blanc, TGV et avion de ligne ; les horaires du musée (exclus par le plan). Le diamètre du rotor (10,69 m, vérifié) n'est pas affiché.

## Tester

```sh
node modules/helicopteres/moteur.test.js
uv run modules/helicopteres/test_parcours.py
```

- `moteur.test.js` : deux langues partout, une vingtaine de cartes, les nombres affichés limités aux faits sourcés, pas de tiret cadratin, les phrases dites ; l'état neuf, **un état sans langue relu sans rien perdre** (et un champ inconnu gardé), un stockage abîmé ; les étapes (atelier ouvert sans aucune carte réussie) ; les séances (quatre nouvelles par jour, erreur en boîte 1 qui revient) ; le carnet (tampon jamais retiré) ; l'expérience ; le résumé. Les résumés sont aussi testés dans `test/resume.test.js`, la fusion dans `test/fusion.test.js`.
- `test_parcours.py` : aux trois formats, le choix de langue (français en premier), l'atelier verrouillé, les sept étapes, le cockpit tenu commande par commande (montée, compteur immobile, flèche de la couleur, nez qui tourne, Henri qui apprend à Moussi), le gabarit A4 imprimé (capture en média d'impression), les neuf mesures, les cartes avec une erreur, le tampon posé sur les deux pages, le passage à l'anglais, un état sans langue, le mode soir sur iPad. Échoue sur toute erreur JavaScript, tout débordement, toute cible de moins de 56 px, tout rouge ou toute croix. Captures dans `captures/` (ignoré par git et par Vercel).

## Prototype 3D (D-26) : un vol d'Écureuil en cinq missions, sur une page à part, à faire essayer à Henri

Construit le 07/11/2026 sur la demande de Louis (D-26) : « mettre la barre très haut », la 3D plutôt que la 2D. Page `henri/helicopteres-3d.html`, **hors du catalogue** : la version 2D reste le module en service et le repli. Pas encore commité ni mis en ligne.

### Les quatre critères de succès de Louis, et ce que le prototype fait pour chacun

1. **Henri apprend.** Chaque mission fait vivre une idée déjà sourcée plus bas, et Moussi la redit en une phrase au moment où Henri la vit : en décollant, « tu as levé le collectif : les pales s'inclinent et poussent plus d'air vers le bas, et le compteur de tours n'a pas bougé » ; en stationnaire, l'air poussé vers le bas qui nous porte ; vers la tour, le disque des pales qui penche ; en tournant, la poussée du rotor de queue ; à la tour, le contrôleur qui dit oui par radio. On le voit aussi : le compteur de tours monte au démarrage puis ne bouge plus, la pale en coupe s'incline avec le levier, les pales du modèle changent de pas, le disque penche avec le manche, le souffle d'air descend sous le rotor, et une flèche de la couleur de chaque commande montre son effet (bleue vers le haut ou le bas, violette au sol dans le sens du déplacement, orange en arc autour de l'hélicoptère).
2. **Il est en autonomie, sans adulte.** La voix guide, une consigne à la fois ; Listen la redit. Au bout de 7 secondes sans geste utile (9 en stationnaire), Moussi redit l'aide et un doigt animé, avec un halo de la couleur de la commande, montre où toucher ; près de la tour, c'est le bouton radio qui s'allume. Une balise dorée tourne au-dessus de la cible. Aucun échec possible : pas de crash (le sol, la tour et les bords du monde freinent sans casser), pas de score, pas de chrono, la descente toujours freinée près du sol.
3. **Il rigole de temps en temps**, toujours grâce à Moussi, jamais à ses dépens, chaque moment une fois par vol : « Wiiiii ! » quand on tourne vite ; s'il tourne longtemps, Moussi devient vert (sa tête vire au vert dans la cabine) ; en montée rapide, son casque s'envole et il le rattrape ; une mouette passe pendant le trajet vers la tour et il la salue de la main ; « Atchoum ! » dans la poussière ; « Oups, la tour ! » si on la frôle ; « On va trop loin ! » au bord du monde.
4. **Il en parle avec émerveillement.** Le moteur qu'on démarre soi-même (le rotor prend sa vitesse, le son monte) ; le premier décollage dans un nuage de poussière ; la vue de haut sur la garrigue, les pins, les cyprès, la lavande, un mas et la montagne calcaire au loin ; à la fin, la caméra se rapproche et le rotor ralentit jusqu'à l'arrêt pour qu'on voie ses trois pales ; chaque tampon s'abat avec son bruit sur la page d'Henri puis sur celle de Moussi.

### Ce que fait la page

- **Avant le vol** : le choix de la langue s'il n'a jamais été fait (le français en premier, D-24) ; le choix de la mission s'il n'y en a pas (rangé dans `mission` et `couleur`, comme à la première étape de la 2D) ; puis l'Écureuil sur l'hélisurface, la caméra qui tourne autour, Moussi qui accueille, et un gros bouton « Démarrer » : ce premier toucher lance aussi le son (règle des navigateurs).
- **L'Écureuil** : un modèle original fait en code, aucun plan ni logo du constructeur (bulle vitrée, capot de turbine, poutre de queue, dérive, empennage, rotor principal à trois pales, rotor de queue à deux pales, patins relevés), dans la couleur de la mission ; le seau d'eau pendu sous l'hélicoptère pour les feux de forêt, un projecteur pour la police. Moussi est assis dedans, à droite, en casque brun et lunettes bleues comme en 2D. Au-dessus de six tours par seconde, les pales deviennent un disque flouté au bout doré.
- **Les commandes**, à leur vraie place (D-05, D-24) : le collectif à gauche (un levier qu'on fait glisser et qui reste où on le laisse, une bande claire au milieu pour le vol stationnaire), les pédales en bas (on garde le doigt), le manche à droite (un manche qui revient au milieu quand on le lâche). Nom français et nom anglais sous chaque commande. Deux doigts sur la scène tournent la caméra autour de l'hélicoptère, pincer rapproche ; elle revient d'elle-même derrière.
- **Les cinq missions**, dans l'ordre : décoller ; rester au-dessus du H ; aller à la tour et l'appeler par radio (« Écureuil, autorisé à atterrir sur le H ») ; tourner sur place avec les pédales pour faire face au H ; s'y poser. Moussi demande « Montre-moi ! » (les phrases de D-25) pour les pédales dès le premier vol, et pour le collectif et le manche à partir du deuxième ; Henri est alors l'instructeur. Puis le moteur se coupe, le carnet s'affiche en grand, et deux boutons : « Encore un vol », « Vol libre ».
- **Le carnet** (D-25) : chaque mission réussie pose un tampon (dessiné dans `dessins.js`, `tamponVol`, une encre par mission, sans rouge) sur la page d'Henri et sur celle de Moussi, avec le son `tampon` du kit. Le carnet du module 2D les montre aussi, en une ligne « Nos vols » sur chaque page, dès qu'il y en a.

### Choix techniques

- **Three.js 0.170.0** (publié le 31/10/2024), **copié dans le dépôt** (`commun/vendor/three/three.module.min.js`, licence MIT à côté) pour marcher sans CDN derrière le code, chargé par une import map et un script module. **Aucun module complémentaire** : la caméra qui tourne autour est écrite à la main.
- **Poids ajouté** : Three.js 692 Ko (172 Ko compressé, comme Vercel le sert) ; `vol3d.js` 85 Ko (25 Ko compressé), `vol.js` 14 Ko, `vol3d.css` 17 Ko. Aucune image, aucune texture à télécharger : les textures (le H, le disque des pales, la manche à air) sont dessinées au chargement.
- **Fichiers** : `vol.js` (`window.HeliVol`, logique pure, chargée aussi par node) porte le modèle de vol, la détection des cinq missions et le carnet ; `vol3d.js` (module) la scène, le modèle, les effets, le son, l'interface, Moussi ; `vol3d.css` l'interface ; les phrases sont dans `contenu.js` (`VOL3D`, aucun chiffre, et `HC.UI` pour les étiquettes), donc collectées par `commun/outils/phrases.js` pour les voix.
- **Tenir 60 images par seconde sur un A13** : une seule lumière à ombre (le soleil, carte d'ombre de 1024 px qui suit l'hélicoptère), un ciel en dégradé, un reflet d'environnement calculé une fois, arbres, buissons, lavande et nuages en instances (quelques appels de dessin pour des centaines d'objets), poussière et souffle en points, aucun post-traitement. Résolution plafonnée à x1,5 sur un écran tactile (x2 ailleurs), et **abaissée d'elle-même** par paliers de 0,25 jusqu'à x1 si la fréquence passe sous 50 images par seconde sur deux secondes. Physique à pas fixe de 1/120 s, rendu à la fréquence de l'écran. Sans WebGL : un message et un lien vers la version 2D.
- **Le modèle de vol** (`vol.js`), simplifié mais juste dans son principe : le rotor démarre en 5 s, tourne ensuite à 390 tours par minute quoi qu'on fasse, ralentit en 9 s à la coupure ; le collectif règle la poussée (rapportée au poids : moins, égale dans la bande du milieu, plus), avec l'effet de sol près du sol ; le manche penche le disque, dont une part de poussée tire l'hélicoptère ; les pédales font tourner le nez ; traînée douce (on glisse encore un peu quand on lâche, puis on s'arrête et on reste en l'air) ; descente freinée près du sol (contact à moins de 1 m/s, petite secousse) ; jamais sous le sol, jamais dans la tour.
- **Le son** : synthétisé par Web Audio, sans fichier. Un bruit filtré modulé au passage des trois pales (trois fois les tours par seconde) et le sifflement de la turbine ; tirer le collectif alourdit le claquement et ouvre le grave, sans jamais changer la cadence. Il suit le réglage « sons » du coin parent.
- **L'état** : le même que la 2D, `localStorage['henri.helicopteres']`, avec un **champ facultatif** `vol3d: { missions: { <mission>: jour } }`. Un état sans ce champ se relit tel quel (testé), un tampon posé ne s'enlève jamais, rien n'est remis à zéro. La fusion de la sauvegarde en ligne (`lib/fusion.js` et `commun/sync.js`, testée dans `test/fusion.test.js`) réunit les tampons de vol de deux appareils, date la plus ancienne. La page reste suivie par la synchronisation (`data-module="helicopteres"`) et ne se recharge pas en plein vol (classe `exo`).
- **Simplifications assumées**, à dire si Henri pose la question : on ne couple pas le collectif et les pédales (comme la 2D) ; la bande du milieu du levier tient l'altitude, plus facile qu'en vrai ; le pas des pales est exagéré pour se voir. **Rien n'est affirmé par le texte** sur le sens de rotation du rotor, le côté du rotor de queue ou la place du pilote : le modèle doit bien les mettre quelque part, la page n'en dit rien. **Aucun fait nouveau** : les phrases ne reprennent que des faits de la table plus bas (vitesse du rotor, pales qui poussent l'air, collectif, manche, pédales et rotor de queue, tour de contrôle, trois pales).

### Fréquence d'images mesurée

Dans Chrome sur le Mac de Louis (puce M4, rendu Metal), en vol réel, pédales et manche tenus : **60 images par seconde** stables, à x1,5 sur 1080 x 810 (1620 x 1215 pixels, la résolution de l'iPad) comme à x1 aux trois formats. **Pas encore mesurée sur l'A13 de l'iPad** : ajouter `?fps` à l'adresse affiche le compteur en haut de l'écran.

### Tester

```sh
node modules/helicopteres/vol.test.js
uv run modules/helicopteres/test_parcours_3d.py
```

- `vol.test.js` (dans `npm test`) : le rotor qui ne décolle pas arrêté, puis tourne à vitesse constante quoi qu'on fasse du collectif ; la poussée qui croît avec le collectif, égale au poids au milieu, l'effet de sol ; l'inertie douce ; jamais sous le sol, même en pente, posé à moins de 1,5 m/s, jamais dans la tour ; le manche et les pédales ; les cinq missions jouées par un pilote automatique ; le carnet (un état sans `vol3d` relu sans perte, tampon jamais reposé) ; le contenu (deux langues, aucun chiffre, pas de tiret cadratin).
- `test_parcours_3d.py` : aux trois formats, la scène WebGL ; le choix de langue (français en premier) et celui de la mission ; les trois commandes tenues à la souris et leur effet ; le compteur de tours immobile ; les cinq missions jusqu'au bout, radio touchée ; le tampon sur les deux pages ; la coupure et la fiche de fin ; les voix dans la bonne langue ; l'état relu sans perte au rechargement ; le carnet 2D qui montre les tampons ; la fréquence d'images. Échoue sur toute erreur JavaScript, tout débordement, toute cible de moins de 56 px, tout rouge. Captures dans `captures-3d/` (ignoré par git et par Vercel).

### Ce qui reste à essayer sur le vrai iPad

La fréquence d'images sur l'A13 et la chaleur après dix minutes ; deux commandes tenues en même temps (multi-touch) ; le son du rotor qui démarre au premier toucher dans Safari et l'app de l'écran d'accueil ; deux doigts pour tourner la caméra sans déclencher de zoom de Safari ; la voix française de l'iPad (les voix fabriquées ne couvrent pas encore ces phrases) ; la rotation paysage et portrait en plein vol ; et surtout Henri lui-même, au regard des quatre critères (`docs/TODO.md`).

### Retirer le prototype

Supprimer `henri/helicopteres-3d.html`, `modules/helicopteres/vol3d.js`, `vol3d.css`, `vol.js`, `vol.test.js` (et sa ligne dans `npm test`), `test_parcours_3d.py`, `commun/vendor/three/` ; retirer `VOL3D` et ses étiquettes (`demarrer` à `mission`) de `contenu.js`, et `HC.VOL3D` de `moteur.test.js` ; on peut laisser `tamponVol` dans `dessins.js` et la ligne « Nos vols » du carnet 2D, qui ne s'affiche que s'il y a des tampons. **Garder le champ `vol3d` des états et sa règle de fusion** : un tampon gagné ne se perd pas.

### Propositions pour passer le reste du parcours en 3D (si le prototype convainc, D-26)

À faire relire par les deux experts avant de construire (D-15). Par ordre d'apport :

- **a) Mon hélicoptère** : le même Écureuil en vitrine qu'on fait tourner du doigt ; on touche une partie, elle s'allume et Moussi dit à quoi elle sert ; la mission et la couleur se repeignent en direct. Gros gain : on reconnaît les parties sous tous les angles, comme au musée.
- **b) Comment il vole** : le rotor au ralenti dans la scène, le souffle d'air rendu visible ; un curseur qui incline une pale en gros plan ; et l'expérience drôle du rotor de queue : on le coupe, la cabine se met à tourner sur elle-même avec Moussi dedans, on le rallume, elle s'arrête. C'est l'idée de la chaise de bureau, vécue.
- **f) Records et drones** : l'Écureuil posé au sommet de l'Everest à l'échelle, une montée jusqu'au record d'altitude avec l'Everest qui rapetisse dessous, un drone et l'hélicoptère côte à côte au-dessus de l'hélisurface (le pilote au sol, le pilote à bord).
- **e) Qui décide où on vole** : la scène radio jouée depuis la vigie de la tour, l'Écureuil de Moussi qui approche et attend le oui d'Henri.
- **c) Le cockpit** : c'est ce prototype ; une vue de l'intérieur de la cabine, par-dessus l'épaule de Moussi, en option.
- **d) L'atelier et g) la sortie** restent hors de l'écran, en vrai ; tout au plus, un modèle en papier qui tombe en tournant pour montrer le pliage, jamais à la place de la vraie mesure.

## Ce qui reste à faire

- **Sur l'iPad d'Henri** : l'essai lui-même ; l'impression du gabarit depuis l'app posée sur l'écran d'accueil (`window.print()` ; à défaut, le bouton « Le fichier » enregistre le SVG, qu'on imprime depuis Fichiers) ; garder le doigt sur une commande au cockpit ; vérifier à la règle que le gabarit sort à l'échelle (le trait de 5 cm).
- **Les voix** : relancer la fabrication (`uv run commun/outils/voix.py tables`) ; d'ici là, la voix de l'appareil lit tout.
- **Au musée** : vérifier que l'Écureuil exposé a bien ses trois pales et son rotor de queue visibles (une source secondaire, airhistory.net, le dit maquette d'apprentis), la place du manche, et y prendre les photos qui pourraient illustrer les cartes.
- Les écrans de parole et de fin existent maintenant dans quatre modules (tables, zoom, nombre cible, hélicoptères), chacun avec ses classes : à remonter dans `commun/kit.css` en un seul composant ; `KR.drapeau` (nouveau dans le kit) peut remplacer les drapeaux recopiés dans `modules/zoom/zoom.js`.
