#!/bin/sh
# Rebuilds the app icons from assets/brand/cartera.svg (needs rsvg-convert). Run from the project root.
set -e
VERDE='#16A34A'
IMG=assets/brand/cartera.svg
OUT=assets/images
# the wallet alone, transparent: adaptive foreground, monochrome (Android tints it) and splash
rsvg-convert -w 1024 -h 1024 "$IMG" -o "$OUT/android-icon-foreground.png"
cp "$OUT/android-icon-foreground.png" "$OUT/android-icon-monochrome.png"
cp "$OUT/android-icon-foreground.png" "$OUT/splash-icon.png"
# solid green layer for the adaptive icon
printf '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024"><rect width="1024" height="1024" fill="%s"/></svg>' "$VERDE" | rsvg-convert -w 1024 -h 1024 -o "$OUT/android-icon-background.png"
# full icon (store / legacy launchers): green square with the wallet on top
sed "s|<defs>|<rect width=\"1024\" height=\"1024\" fill=\"$VERDE\"/><defs>|" "$IMG" | rsvg-convert -w 1024 -h 1024 -o "$OUT/icon.png"
# favicon: the VENTO wordmark itself (Unbounded Bold) in white on the accent green; 256 px so browsers scale it down sharply
FUENTE=node_modules/@expo-google-fonts/unbounded/700Bold/Unbounded_700Bold.ttf
magick -size 256x256 xc:none -fill "$VERDE" -draw 'roundrectangle 0,0 255,255 56,56' \
  -font "$FUENTE" -pointsize 46 -kerning 2 -fill white -gravity center -annotate 0 'VENTO' "$OUT/favicon.png"
# notifications: a white silhouette for the status bar and the brand icon as the large picture next to the text
rsvg-convert -w 96 -h 96 "$IMG" -o "$OUT/notification-icon.png"
cp "$OUT/icon.png" "$OUT/notification-large.png"
