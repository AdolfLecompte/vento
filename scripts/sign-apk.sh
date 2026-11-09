#!/bin/sh
# Signs an APK with YOUR key (the one in ~/.vento by default). Usage: scripts/sign-apk.sh <in.apk> <out.apk>
#        scripts/sign-apk.sh --check    only checks that the key and apksigner are there
# Create the key once with `npm run llave` (scripts/crear-llave.sh: it asks for the name and password and checks them first).
# The password must be plain ASCII (no accents or ñ): Java's PKCS12 refuses anything else with "Password is not ASCII".
# Back it up and remember the password: if you lose either, installed copies can never be updated.
set -e
KEYSTORE="${VENTO_KEYSTORE:-$HOME/.vento/vento-release.jks}"
ALIAS="${VENTO_KEY_ALIAS:-vento}"
SDK="${ANDROID_HOME:-$HOME/Android/Sdk}"
APKSIGNER="$SDK/build-tools/$(ls -1 "$SDK/build-tools" | sort -V | tail -1)/apksigner"

[ -f "$KEYSTORE" ] || { echo "No signing key at $KEYSTORE. Create it once with: npm run llave" >&2; exit 1; }
[ -x "$APKSIGNER" ] || { echo "apksigner not found in $SDK/build-tools (set ANDROID_HOME)." >&2; exit 1; }
[ "$1" = "--check" ] && exit 0

# With VENTO_KS_PASSWORD set it runs unattended; otherwise apksigner asks for the password.
if [ -n "$VENTO_KS_PASSWORD" ]; then
  "$APKSIGNER" sign --ks "$KEYSTORE" --ks-key-alias "$ALIAS" --ks-pass env:VENTO_KS_PASSWORD --out "$2" "$1"
else
  "$APKSIGNER" sign --ks "$KEYSTORE" --ks-key-alias "$ALIAS" --out "$2" "$1"
fi
"$APKSIGNER" verify "$2"
