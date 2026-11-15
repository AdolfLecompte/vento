#!/bin/sh
# Builds a release APK on this machine (needs JDK 17+ and the Android SDK), signs it with your own key
# (scripts/sign-apk.sh) and leaves it in dist/vento-<version>.apk.
# VENTO_DEBUG_SIGN=1 skips your key and keeps Expo's public debug key: only for trying the build, never to publish.
set -e
if [ "$VENTO_DEBUG_SIGN" != 1 ]; then
  ./scripts/sign-apk.sh --check # fail now, not after five minutes of building
  # Ask for the key password NOW and test it against the key store, so a typo costs seconds, not the whole build.
  # sign-apk.sh picks it up from VENTO_KS_PASSWORD. Set that variable yourself to run unattended.
  KEYSTORE="${VENTO_KEYSTORE:-$HOME/.vento/vento-release.jks}"
  for intento in 1 2 3; do
    if [ -z "$VENTO_KS_PASSWORD" ]; then
      printf 'Key password: ' >&2
      stty -echo 2>/dev/null; trap 'stty echo 2>/dev/null' EXIT
      IFS= read -r VENTO_KS_PASSWORD; stty echo 2>/dev/null; printf '\n' >&2
    fi
    # Not exported: gradle and every script of a dependency would inherit it for the whole build. Only the two commands that need it get it.
    if VENTO_KS_PASSWORD="$VENTO_KS_PASSWORD" keytool -list -keystore "$KEYSTORE" -alias "${VENTO_KEY_ALIAS:-vento}" -storepass:env VENTO_KS_PASSWORD >/dev/null 2>&1; then break; fi
    echo "Wrong password ($intento/3)." >&2
    unset VENTO_KS_PASSWORD
    [ "$intento" = 3 ] && { echo "Giving up: nothing was built." >&2; exit 1; }
  done
fi
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Android/Sdk}"
VERSION=$(node -p "require('./app.json').expo.version")
CI=1 npx expo prebuild --platform android --no-install --clean
# phones only (64 and 32 bit ARM): x86 is for emulators and would double the size and the build time
sed -i 's/^reactNativeArchitectures=.*/reactNativeArchitectures=arm64-v8a,armeabi-v7a/' android/gradle.properties
# the generated wrapper gives up on a slow download after 10 s: allow two minutes
sed -i 's/networkTimeout=10000/networkTimeout=120000/' android/gradle/wrapper/gradle-wrapper.properties
(cd android && ./gradlew assembleRelease)
mkdir -p dist
SALIDA="dist/vento-$VERSION.apk"
if [ "$VENTO_DEBUG_SIGN" = 1 ]; then cp android/app/build/outputs/apk/release/app-release.apk "$SALIDA"
else VENTO_KS_PASSWORD="$VENTO_KS_PASSWORD" ./scripts/sign-apk.sh android/app/build/outputs/apk/release/app-release.apk "$SALIDA"; fi
echo "Ready: $SALIDA"
