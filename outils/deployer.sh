#!/bin/bash
# Déploie le site en production sur Vercel (projet « revisions », compte de Louis).
# Une copie sans historique git est envoyée : en plan gratuit, Vercel bloque un dépôt privé
# dont le dernier commit n'est pas de l'auteur du compte, ce qui arriverait après un commit de Louise.
# Usage : bash outils/deployer.sh   (depuis n'importe où ; il faut être connecté à Vercel avec le compte de Louis)
set -euo pipefail
racine="$(cd "$(dirname "$0")/.." && pwd)"
copie="$(mktemp -d)"
trap 'rm -rf "$copie"' EXIT
rsync -a --exclude .git --exclude node_modules --exclude '.env*' "$racine/" "$copie/"
test -f "$copie/.vercel/project.json" || { echo "Projet Vercel non lié : lancer « vercel link --project revisions » dans $racine"; exit 1; }
(cd "$copie" && vercel deploy --prod --yes)
code=$(curl -s -o /dev/null -w '%{http_code}' https://nos-revisions.vercel.app/henri/)
echo "nos-revisions.vercel.app/henri/ répond $code (401 attendu : la page de code)"
