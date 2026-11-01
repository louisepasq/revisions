# Nos révisions : consignes pour Claude

Le site de révisions d'Henri (CM1) et de Clara (CM2), fait par Louise et Louis, publié sur GitHub Pages (`louisepasq.github.io/revisions/`). Un push sur `main` met le site à jour.

- **Le dispositif d'ensemble** (une app par enfant, principes, modules) : [`docs/DISPOSITIF.md`](docs/DISPOSITIF.md). Le détail d'un module vit dans `docs/<module>/`.
- **Le système de design commun** : `docs/design-system/`, le kit dans `commun/`. Tout module le réutilise. Ce qui a été fait avant lui (portail, planisphère) n'est pas une contrainte de design : on vise les meilleures pratiques des apps pour enfants (décision de Louis du 01/11/2026).

## Les parents ne sont ni enseignants ni designers : faire relire par des spécialistes

Consigne de Louis du 01/11/2026. Avant de construire un module, et dès qu'un choix pédagogique ou d'interface paraît douteux, ou qu'une idée des parents surprend, faire relire par :

- **`relecteur-pedagogique`** (`.claude/agents/`) : programmes de cycle 3 en vigueur, méthode, adaptation à l'âge ;
- **`designer-apps-enfants`** (`.claude/agents/`) : interface, harmonie avec le système de design, accessibilité.

Pas systématiquement, mais sans hésiter. Leurs relectures se rangent dans `docs/revues/`, datées. Leurs propositions arrivent aux parents comme des propositions, à accepter ou non ; elles ne s'appliquent pas d'office.

## Conventions

- HTML, CSS et JavaScript sans bibliothèque ni build ; Safari sur iPad d'abord.
- Une app par enfant : `henri/` et `clara/`, chacune avec son portail ; le code commun dans `commun/` et `modules/`.
- La progression reste sur l'iPad (`localStorage`, clé préfixée par l'enfant et le module) ; aucune clé d'API dans le site, qui est public.
