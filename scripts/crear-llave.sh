#!/usr/bin/env bash
# Creates YOUR signing key, once, in ~/.vento/vento-release.jks. Run it with: npm run llave
# It checks the password BEFORE calling keytool (Java refuses accents and ñ only at the very end, after all the questions).
# The name you give goes into the certificate of every APK, publicly. The password never leaves this terminal.
# Unattended (for tests): VENTO_KEYSTORE, VENTO_NOMBRE and VENTO_PASSWORD skip the questions.
set -euo pipefail

KEYSTORE="${VENTO_KEYSTORE:-$HOME/.vento/vento-release.jks}"
fallo() { echo "✗ $1" >&2; exit 1; }

[ -e "$KEYSTORE" ] && fallo "Ya existe una llave en $KEYSTORE. No la sobrescribo: si la pierdes no se puede recuperar. Bórrala a mano solo si estás seguro."
command -v keytool >/dev/null || fallo "No encuentro keytool (viene con Java: instala un JDK)."

NOMBRE="${VENTO_NOMBRE-}"
if [ -z "${VENTO_NOMBRE+x}" ]; then read -rp "Nombre para el certificado (público; Enter para poner solo «Vento»): " NOMBRE; fi
case "$NOMBRE" in *[,=+\"\\\<\>#\;]*) fallo "El nombre no puede llevar , = + \" \\ < > # ;" ;; esac
CN="${NOMBRE:-Vento}"

PASS="${VENTO_PASSWORD-}"
if [ -z "$PASS" ]; then
  read -rsp "Contraseña (12 o más caracteres, SIN tildes ni ñ): " PASS; echo
  read -rsp "Repite la contraseña: " REPETIDA; echo
  [ "$PASS" = "$REPETIDA" ] || fallo "Las dos contraseñas no coinciden. No se creó nada."
fi
[ "${#PASS}" -ge 12 ] || fallo "La contraseña es muy corta (mínimo 12 caracteres). No se creó nada."
export LC_ALL=C
case "$PASS" in *[!\ -~]*) fallo "La contraseña tiene un carácter que Java no acepta (tilde, ñ, emoji...). Usa solo letras sin tilde, números y símbolos normales. No se creó nada." ;; esac

mkdir -p "$(dirname "$KEYSTORE")"
chmod 700 "$(dirname "$KEYSTORE")"
VENTO_NEW_PASS="$PASS" keytool -genkeypair -storetype PKCS12 -keystore "$KEYSTORE" -storepass:env VENTO_NEW_PASS \
  -alias vento -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=$CN, O=Vento"
chmod 600 "$KEYSTORE"

echo
echo "✓ Llave creada en $KEYSTORE (certificado: CN=$CN, O=Vento)"
echo "  Ahora haz DOS cosas: 1) copia ese archivo a un lugar seguro fuera de este disco (USB, gestor de contraseñas)"
echo "                       2) guarda la contraseña. Sin cualquiera de las dos no podrás actualizar Vento."
