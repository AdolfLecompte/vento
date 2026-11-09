#!/bin/sh
# Rebuilds every icon from the VENTO wordmark (Unbounded Bold, white on the accent green). Needs ImageMagick (magick).
# Run from the project root: npm run icons
set -e
VERDE='#16A34A'
OUT=assets/images
FUENTE=node_modules/@expo-google-fonts/unbounded/700Bold/Unbounded_700Bold.ttf
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

# the word cropped tight, white on transparent: one line (splash, favicon) and two stacked lines (app icon).
# Stacked, the letters are much bigger inside the small circle a phone shows, so they stay readable at 48 px.
magick -background none -fill white -font "$FUENTE" -pointsize 300 -kerning 6 label:'VENTO' -trim +repage "$TMP/una.png"
magick -background none -fill white -font "$FUENTE" -pointsize 300 -kerning 6 -gravity center -interline-spacing 20 label:'VEN\nTO' -trim +repage "$TMP/dos.png"
magick -background none -fill white -font "$FUENTE" -pointsize 300 label:'V' -trim +repage "$TMP/v.png"

# adaptive icon: Android masks it (circle, squircle...) and only keeps the middle ~61% safe, so the word is fitted in that zone
magick "$TMP/dos.png" -resize 560x560 -background none -gravity center -extent 1024x1024 "$OUT/android-icon-foreground.png"
cp "$OUT/android-icon-foreground.png" "$OUT/android-icon-monochrome.png" # Android tints this one with the theme colour
magick -size 1024x1024 xc:"$VERDE" "$OUT/android-icon-background.png"

# full icon (store, old launchers, and the big picture of notifications): green square with the word a bit larger
magick -size 1024x1024 xc:"$VERDE" \( "$TMP/dos.png" -resize 640x640 -background none -gravity center -extent 1024x1024 \) -composite "$OUT/icon.png"
cp "$OUT/icon.png" "$OUT/notification-large.png"

# splash: the single-line word, almost as wide as the picture (the plugin scales the picture to 200 dp)
magick "$TMP/una.png" -resize 920x -background none -gravity center -extent 1024x1024 "$OUT/splash-icon.png"

# favicon (web): the word on the rounded green square
magick -size 256x256 xc:none -fill "$VERDE" -draw 'roundrectangle 0,0 255,255 56,56' \
  -font "$FUENTE" -pointsize 46 -kerning 2 -fill white -gravity center -annotate 0 'VENTO' "$OUT/favicon.png"

# status-bar icon of notifications: must be a white silhouette, so just the V
magick "$TMP/v.png" -resize 68x68 -background none -gravity center -extent 96x96 "$OUT/notification-icon.png"
echo "Icons ready in $OUT"
