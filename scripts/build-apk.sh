#!/bin/sh
# Builds a release APK on this machine (needs JDK 17+ and the Android SDK), signs it with your own key
# (scripts/sign-apk.sh) and leaves it in dist/vento-<version>.apk.
# VENTO_DEBUG_SIGN=1 skips your key and keeps Expo's public debug key: only for trying the build, never to publish.
set -e
[ "$VENTO_DEBUG_SIGN" = 1 ] || ./scripts/sign-apk.sh --check # fail now, not after five minutes of building
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
else ./scripts/sign-apk.sh android/app/build/outputs/apk/release/app-release.apk "$SALIDA"; fi
echo "Ready: $SALIDA"
