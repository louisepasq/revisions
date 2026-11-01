# Système de design « Nos révisions » v2 : gros boutons qui s'enfoncent, une teinte par enfant, la mascotte seulement au retour

**Statut au 01/11/2026** : v2 en service, issue du panel de design du même jour (direction « Gros jeu tactile », corrigée et enrichie des trois autres). La vitrine de référence est [`archive/2026-11-01_panel/5-synthese.html`](archive/2026-11-01_panel/5-synthese.html), et le pourquoi de chaque choix est dans [`archive/2026-11-01_panel/README.md`](archive/2026-11-01_panel/README.md). Le code vit dans `commun/` ; le premier module construit dessus est celui des tables (`modules/tables/`).

## Principes : ce qui tient à l'âge de 8 à 10 ans

- **Une chose par écran** : le fait à retenir est le plus gros objet ; rien ne bouge pendant la réflexion.
- **La main droite agit** : pavé et bouton principal à droite en paysage, en bas en portrait ; Back en haut à gauche, Listen en haut à droite, toujours nommés sous l'icône.
- **Le corps récompense, l'erreur ne punit pas** : rebond et étincelles sur le juste ; surligneur et astuce sur l'erreur ; jamais de rouge, jamais de croix, même en icône (Effacer est une flèche retour).
- **La mascotte n'existe pas pendant la réflexion** : elle apparaît au portail, au retour d'une réponse (aide, fête) et en fin de séance. Sur iPhone, elle devient un médaillon.
- **Aucun chrono visible** hors du futur défi d'une minute ; le temps de réponse se mesure en silence.
- **Deux langues, deux bulles** : le cadre suit la langue réglée pour l'enfant (anglais par défaut, `commun/textes.js`) ; le contenu scolaire reste en français. La mascotte parle dans une bulle blanche, l'astuce est dans une bulle dorée qui porte son nom.
- **Accessibilité** : cibles de 56 px au moins, texte de 16 px au moins, aucun survol, `prefers-reduced-motion` respecté, contrastes de 4,5:1 mesurés dans la vitrine. Seule exception : les cases de la grille sur iPhone (100 cases dans 370 points), qui servent à regarder.

## Jetons : une base crème, une teinte en sept nuances par enfant, un mode soir qui réécrit les valeurs

Tout est dans `commun/kit.css`, en variables CSS sur `:root`.

| Famille | Jetons | Rôle |
|---|---|---|
| Base | `--encre`, `--encre-douce`, `--toile`, `--carte`, `--trait`, `--trait-fort`, `--pointille`, `--neutre` | texte, fonds, contours, inactif en pointillé |
| Juste | `--juste-100` à `--juste-900`, `--sur-juste` | la seule couleur d'état : le vert du juste |
| Or | `--or-clair`, `--or-vif`, `--or-relief`, `--or-fonce` | « par cœur » (calme) et « monté aujourd'hui » (vif) |
| Erreur | `--surligneur`, `--astuce-fond`, `--astuce-trait` | la bonne réponse surlignée, la bulle de l'astuce |
| Enfant | `--e-50` à `--e-900`, `--sur-e`, `--e-relief` | 50 et 100 fonds, 200 traits, 300 « presque », 500 décor seulement, 700 action, 900 texte |
| Forme | `--r-s`, `--r-m`, `--r-l`, `--relief` (5 px) | rayons, relief des boutons |
| Polices | `--f-jeu` (Baloo 2), `--f-texte` (Andika) | chiffres et boutons ; lecture |

- **Le thème de l'enfant** se pose par `data-enfant="henri"` (Lagon, Moussi) ou `data-enfant="clara"` (Prune, Pooh Bear) sur `<html>`.
- **Le mode soir** suit `prefers-color-scheme: dark` : mêmes noms, valeurs réécrites ; la toile devient nuit, la teinte s'éclaircit, le texte sur bouton passe au sombre.
- **Les polices** sont hébergées dans `commun/polices/` (woff2, sous-ensemble latin, licences OFL à côté) : l'app marche sans réseau.
- **Typographie** : Baloo 2 800 pour les chiffres de la question seulement, 700 pour titres, boutons et touches ; Andika 700 pour les consignes, 400 pour les textes et astuces.

## Composants : classes de `kit.css`, comportements de `kit.js`

| Composant | Classes | Comportement (`window.KR`) |
|---|---|---|
| Bouton en relief | `.btn .btn-primaire`, `.btn-secondaire`, `.btn-calme`, `.inactif` | s'enfonce au toucher ; inactif en pointillé, jamais gris sur gris |
| Navigation | `.nav > .rond + .nom` | Back et Listen, nommés sous l'icône |
| Barre d'exercice | `.barre`, `.avance`, `.points-av`, `.pt.juste/.revu/.ici`, `.compte` | un point vert par juste, teinte 300 si revu avec l'astuce |
| Pavé numérique | `.pave`, `.touche`, `.effacer`, `.valider`, `.suite`, `.jauge` | `KR.pave({chiffre, effacer, valider})` ; `etat(nom, ms)`, avec `vide`, `pret` ou `suite` : Check devient Next au même endroit, la jauge avance, le pavé se grise ; clavier physique accepté |
| Choix | `.choix` | deux gros boutons à la place du pavé |
| Carte de question | `.carte-q`, `.carte-pleine`, `.fait`, `.ligne-op`, `.ligne-rep`, `.case-rep`, `.curseur` | tailles en unités de conteneur : la ligne rétrécit au lieu de déborder |
| Juste | `.carte-juste`, `.rep-verte`, `.badge-ok`, `.rapide` | vert sous l'opération, « Quick! » discret |
| À revoir | `.carte-rev`, `.surligne`, `.carte-retape` | la bonne réponse surlignée, puis « À toi de le retaper » |
| Bulles | `.bulle.parle`, `.bulle.astuce`, `.etiq`, `.bas` | voix de la mascotte ; astuce dorée |
| Mascotte | `.retour-masc`, `.medaillon-zone` | `KR.mascotte(attitude)` et `KR.medaillon(attitude)` ; attitudes `attend`, `aide`, `fete`, `repos` ; sprite SVG injecté par `KR.demarrer()`, donc `<use>` marche aussi depuis le disque |
| Semaine | `.semaine`, `.jour.fait/.passe/.auj/.avenir` | `KR.semaine(jours)` : tampon, rond plein, pointillé |
| Maîtrise | `.m-pas`, `.m-com`, `.m-pre`, `.m-or`, `.m-auj`, `.pts` | pointillé, hachures, aplat, or ; se lit sans la couleur |
| Tuile de module | `.tuile`, `.tuile.bientot`, `.mini-piste` | icône dans la teinte de l'enfant |
| Coin parent | `.voile`, `.feuille`, `.reglage`, `.segment` | `KR.appuiLong(el, fn)` ; `KR.exporter()`, `KR.importer(texte)`, `KR.effacerTout()`, `KR.telecharger()` |

Autres services de `kit.js` : `KR.son('juste'|'doux'|'fete'|'touche')` (Web Audio), `KR.lire(texte, 'fr'|'en')` (voix fr-FR ou en-GB, attend `voiceschanged`), `KR.reglages()` et `KR.regler(cle, valeur)` (clé `<enfant>.reglages` : `langue` en `en` par défaut, `voix` coupée, `sons` actifs), `KR.t()` (textes du cadre).

## Squelette d'un module : une page fine par enfant, le code écrit une fois

```html
<html lang="en" data-enfant="clara" data-module="dictee">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <link rel="stylesheet" href="../commun/kit.css">
  <main id="app"></main>
  <script src="../commun/textes.js"></script>
  <script src="../commun/kit.js"></script>
  <script src="../modules/dictee/dictee.js"></script>  <!-- appelle KR.demarrer() -->
</html>
```

Un écran d'exercice : `.ecran.ecran-fixe > .barre + .corps > (.zone + .action)`. Les formats se règlent dans `kit.css` : iPad paysage (`orientation: landscape` et 900 px ou plus) met la zone à gauche et l'action à droite ; iPad portrait les empile, pavé en bas ; l'iPhone (600 px ou moins) resserre tout, pavé 3 × 4 avec Delete et Check sur la dernière ligne. Les zones sûres passent par `env(safe-area-inset-*)`.

La progression se range sous `<enfant>.<module>` dans `localStorage` ; l'export du coin parent emporte toutes les clés de l'enfant. Les icônes d'écran d'accueil se régénèrent par `sh commun/outils/icones.sh`.
