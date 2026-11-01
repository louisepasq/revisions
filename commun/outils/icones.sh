#!/bin/sh
# Régénère les icônes d'écran d'accueil (180 et 512 px) des deux apps
# à partir de icone.html, avec Chrome sans fenêtre. Usage : sh commun/outils/icones.sh
set -e
ICI="$(cd "$(dirname "$0")" && pwd)"
RACINE="$(cd "$ICI/../.." && pwd)"
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
# Chrome impose une fenêtre minimale : on rend en 512, puis sips (macOS) réduit en 180.
for enfant in henri clara; do
  "$CHROME" --headless --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
    --window-size=512,512 --virtual-time-budget=2000 \
    --screenshot="$RACINE/$enfant/icone-512.png" \
    "file://$ICI/icone.html?enfant=$enfant" 2>/dev/null
  sips -z 180 180 "$RACINE/$enfant/icone-512.png" --out "$RACINE/$enfant/icone-180.png" >/dev/null
done
echo "Icônes écrites dans henri/ et clara/"
