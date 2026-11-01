# Relecture du jeu du nombre cible : les règles d'Henri tiennent, quatre questions restent aux parents

Relecture du 01/11/2026, faite par la session qui a construit l'écran, en appliquant les critères de `relecteur-pedagogique` et de `designer-apps-enfants` (`.claude/agents/`). Ce n'est pas une relecture d'un spécialiste lancé à part : si un parent a un doute sur un point, le confier à l'un des deux agents. Rendu regardé aux trois formats, pour Henri et Clara, sur les captures de `modules/cible/test_parcours.py`.

Marquage : **[pratique]** usage de classe ou d'app, appréciation ; **[design]** système de design du dépôt ; **[dépôt]** repris du dépôt sans revérification à la source.

## Ce qui est conforme et doit rester

- **Les règles de D-18 sont toutes appliquées** : cible jusqu'à 99, cinq nombres, chaque nombre une fois, résultats réutilisables, barème 1, 2, 1, 3 et coup parfait 13, ÷1 refusé, cible toujours atteignable, chrono absent par défaut et choisi par l'enfant, indice annoncé avant d'être pris. [dépôt]
- **L'erreur ne punit pas** : un coup refusé ne se joue pas, ne coûte rien, et reçoit une explication en français qui reprend les nombres du calcul (« 1 − 9 : on ne peut pas enlever 9 à 1. Commence par le plus grand nombre. »). Ni rouge, ni croix : le test le vérifie. [design]
- **Le meilleur score du moteur est présenté en défi, jamais en reproche** : « Moussi found a path worth 13 points. Want to try? », avec « Same target again » en bouton principal, et le chemin de la mascotte seulement si l'enfant le demande. Quand l'enfant a fait le meilleur score : « That's the best score possible! ». [pratique]
- **La fin du chrono ne retire rien** : l'enfant continue sans chrono ou prend une nouvelle cible ; le score ne dépend pas du temps. C'est cohérent avec D-10 (la justesse avant la vitesse). [dépôt]
- **Le geste est fait pour le doigt** : nombre, opération, nombre, sans glisser-déposer ; tuiles, opérations et boutons de 56 px au moins aux trois formats, opérations à droite en paysage, en bas en portrait et sur iPhone. [design]
- **La mascotte n'apparaît pas pendant la réflexion** : seulement au retour (refus, indice, impasse), aux feuilles et en fin de partie. [design]
- **Les résultats intermédiaires se distinguent des nombres de départ** (tuile teintée), et chaque calcul reste écrit avec ses points : l'enfant voit son chemin, ce qui est le cœur du calcul réfléchi. [pratique]

## Les questions aux parents, de la plus importante à la plus secondaire

1. **Le jeu doit-il apparaître dans « Today » ?** Aujourd'hui le résumé publie `du: null` : c'est un jeu libre, rien n'est dû. Le calcul mental gagne à être court et quotidien [pratique] ; une partie par jour dans « Today » serait un choix de parents, pas un choix technique. Reco : le laisser libre tant qu'Henri ne l'a pas essayé, puis décider avec lui.
2. **Faut-il écarter pour Henri les cibles atteintes en un seul calcul ?** Le moteur tire pour Henri toute cible atteignable : certaines se font en un calcul (4 × 5 = 20), ce qui rapporte 1 point et apprend peu. Reco : exiger au moins deux calculs pour Henri (une condition dans le tirage, sans toucher aux règles). Clara, elle, ne reçoit que des cibles qui admettent le coup parfait.
3. **La voix lit deux bulles du cadre d'elle-même** (le coût de l'indice et le défi de fin, en anglais), alors que le zoom ne lit le cadre que sur Listen. Raison : le coût d'un indice doit être compris avant de le prendre, et Henri commence l'anglais. Reco : garder, et couper si les enfants trouvent que ça parle trop.
4. **Le badge « Perfect move! » reste affiché quand un indice a été pris** (13 − 3 = 10 points). C'est exact et écrit en clair (« −3 for the hint ») ; le retirer punirait l'indice deux fois. Reco : garder.

## Écarts au système de design, justifiés

- L'écran de fin reprend `.fin-seance`, `.montee` et `.ligne-fin`, recopiées dans `cible.css` comme dans les tables et le zoom : trois copies, il est temps de les remonter dans `commun/kit.css`.
- Deux icônes (Undo, Start again) sont dessinées dans `cible.js` : le sprite du kit n'a ni flèche d'annulation ni flèche circulaire.

## À vérifier sur l'iPad, avec les enfants

- Henri comprend-il seul le geste « nombre, opération, nombre » sans glisser ? La consigne écrite (« Touche un nombre. », « Choisis une opération. ») est-elle lue ?
- Sur iPhone, l'accueil du jeu dépasse légèrement l'écran (la carte du chrono se termine sous le bord) : le bouton « Let's go » reste visible, mais à confirmer à la main.
