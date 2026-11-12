#!/bin/sh
# Rebuilds every icon from scripts/logo.svg (white mark on the accent green). Needs ImageMagick (magick) and rsvg-convert.
# Run from the project root: npm run icons
set -e
VERDE='#16A34A'
OUT=assets/images
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

# the mark (scripts/logo.svg, white on transparent) at the sizes below; the word VENTO no longer appears in any icon
logo() { rsvg-convert -w "$1" -h "$1" scripts/logo.svg -o "$2"; }

# adaptive icon: Android masks it (circle, squircle...) and only keeps the middle ~61% safe, so the mark is fitted in that zone
logo 600 "$TMP/m600.png"
magick "$TMP/m600.png" -background none -gravity center -extent 1024x1024 "$OUT/android-icon-foreground.png"
cp "$OUT/android-icon-foreground.png" "$OUT/android-icon-monochrome.png" # Android tints this one with the theme colour
magick -size 1024x1024 xc:"$VERDE" "$OUT/android-icon-background.png"

# full icon (store, old launchers, and the big picture of notifications): green square with the mark a bit larger
logo 720 "$TMP/m720.png"
magick -size 1024x1024 xc:"$VERDE" \( "$TMP/m720.png" -background none -gravity center -extent 1024x1024 \) -composite "$OUT/icon.png"

# splash: the mark alone (the plugin scales the picture to 200 dp)
logo 800 "$TMP/m800.png"
magick "$TMP/m800.png" -background none -gravity center -extent 1024x1024 "$OUT/splash-icon.png"

# favicon (web): the mark on the rounded green square
logo 200 "$TMP/m200.png"
magick -size 256x256 xc:none -fill "$VERDE" -draw 'roundrectangle 0,0 255,255 56,56' "$TMP/m200.png" -gravity center -composite "$OUT/favicon.png"

# status-bar icon of notifications: must be a white silhouette, so the mark as is (transparent seals)
logo 76 "$TMP/m76.png"
magick "$TMP/m76.png" -background none -gravity center -extent 96x96 "$OUT/notification-icon.png"
node scripts/mascot-icons.mjs
echo "Icons ready in $OUT"
