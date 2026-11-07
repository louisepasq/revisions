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

## Ce qui reste à faire

- **Sur l'iPad d'Henri** : l'essai lui-même ; l'impression du gabarit depuis l'app posée sur l'écran d'accueil (`window.print()` ; à défaut, le bouton « Le fichier » enregistre le SVG, qu'on imprime depuis Fichiers) ; garder le doigt sur une commande au cockpit ; vérifier à la règle que le gabarit sort à l'échelle (le trait de 5 cm).
- **Les voix** : relancer la fabrication (`uv run commun/outils/voix.py tables`) ; d'ici là, la voix de l'appareil lit tout.
- **Au musée** : vérifier que l'Écureuil exposé a bien ses trois pales et son rotor de queue visibles (une source secondaire, airhistory.net, le dit maquette d'apprentis), la place du manche, et y prendre les photos qui pourraient illustrer les cartes.
- Les écrans de parole et de fin existent maintenant dans quatre modules (tables, zoom, nombre cible, hélicoptères), chacun avec ses classes : à remonter dans `commun/kit.css` en un seul composant ; `KR.drapeau` (nouveau dans le kit) peut remplacer les drapeaux recopiés dans `modules/zoom/zoom.js`.
