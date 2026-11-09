# Vento (antes Compraventa)

App Android personal (Expo + expo-sqlite, sin servidor): pedidos, pagos, entregas y ganancias. Licencia GPL-3.0.
El nombre viejo se conserva a propósito en dos sitios: la base de datos (`compraventa.db`) y el marcador de las copias (`app: 'compraventa'`). Cambiarlos dejaría sin datos a quien ya instaló la app e inservibles sus copias.

## Comandos
- Pruebas: `node --test src/` (usa `node:sqlite`; el SQL, las copias y el dinero corren sobre SQLite real).
- Tipos: `npx tsc --noEmit` · Lint: `npx expo lint`.
- Compilación de Android sin teléfono: `npx expo export --platform android`.
- Tras añadir o mover rutas, arrancar `npx expo start` un momento regenera los tipos de `typedRoutes`; si `tsc` se queja de una ruta nueva, es eso.
- Iconos: `npm run icons` (`scripts/make-icons.sh`, necesita ImageMagick) regenera TODOS los PNG de `assets/images` a partir de la palabra VENTO en Unbounded Bold, blanca sobre el verde: icono de la app y adaptativo en dos líneas (`VEN` / `TO`, mucho más legibles a 48 px que en una línea, y dentro de la zona segura de ~61 % que Android no recorta), splash y favicon en una línea, y para las notificaciones una `V` blanca (barra de estado) más el icono completo (imagen grande). Ya no hay billetera en el icono (el círculo de `Más` sigue usando un glifo de billetera de Phosphor).

## Datos
- Dinero en pesos enteros. `src/formato.ts` (`miles`, `money`, `num`) es puro; `num` corta a 9 dígitos porque un número mayor rompe la validación de las copias.
- Esquema y consultas en `src/db.ts` (`migrate`). El pedido copia costo y precio del producto y los deja editables. El estado de pago se deriva de los abonos y no se guarda.
- La deuda se cuenta **por pedido** (`MAX(0, total - pagado)`): un pedido pagado de más no descuenta lo que el cliente debe en otro. Misma regla en `listDeudores`, `clientes.tsx` y `cliente/[id].tsx`.
- Pedido **cerrado** (pagado y entregado, `bloqueado` en `src/calc.ts`): sin editar y sin quitar pagos; se reabre desmarcando la entrega. No se aceptan pagos mayores que el saldo, ni bajar el total de un pedido por debajo de lo ya pagado.
- Crear o editar un pedido (`pedido/nuevo.tsx`) es un asistente de 4 pasos que no escribe nada hasta "Guardar pedido" (`guardarPedido`, en una transacción). `?editar=<id>` lo reutiliza; los pagos extra se registran en `pedido/[id].tsx`.
- Borrar un cliente borra también sus pedidos (con aviso). `cliente/[id]` y `producto/[id]` sirven para crear (`/nuevo`) y editar.
- Ajustes en la tabla `ajustes` (clave/valor): recordatorio y copias.

## Copias de seguridad
- Pantalla `respaldos.tsx` (Más → Copias de seguridad). Van a una carpeta **vento** dentro del lugar que el usuario elige una vez con el selector de carpetas de Android (`Directory.pickDirectoryAsync`, que conserva el permiso).
- Archivo `vento-AAAA-MM-DD-HHMMSS.json`: una copia nueva nunca sobrescribe una buena. `guardarCopia` la escribe, la relee y la valida; solo entonces borra las copias anteriores del mismo día y deja las últimas 10 (solo borra nombres que cumplan `esCopia`).
- El formato, la validación, la lectura y restauración de tablas y las reglas de frecuencia son puros (`src/respaldo.ts`). `respaldo-db.test.ts` y `db.test.ts` los corren sobre SQLite real con el esquema de `migrate`, usando el adaptador de `src/db-memoria.ts`.
- Copia automática (`copiaAutomatica`, la dispara `AvisosHost`): Android no corre código a hora exacta, así que se comprueba al abrir la app (avisos "Haciendo copia…" / "Copia guardada") y al salir (notificación del sistema). Diaria = 1 día de calendario, semanal = 7, mensual = 30. Si falla, el aviso sale una vez al día.

## Recordatorio
- Pantalla `recordatorios.tsx` (Más → Recordatorios): interruptor, hora, qué mostrar (quién te debe / pedidos por entregar), vista previa real y "Enviarme una prueba".
- El texto lo arma `armarAviso` (`src/aviso-calc.ts`, puro): el título lleva totales ("3 personas te deben $65.000"), el cuerpo las 3 mayores deudas y los 3 con más pedidos por entregar, y el resto "y N personas más". Sin pendientes no se avisa.
- El teléfono no deja ejecutar código al disparar, así que `reprogramar` (`src/avisos.ts`) programa los próximos 7 días con los datos actuales, al abrir la app y al pasar a segundo plano (`AvisosHost`). Va en una cola de una corrida a la vez y solo cancela los ids `aviso-AAAA-MM-DD`, para no borrar la notificación de prueba.
- Canal `recordatorios-v2` con visibilidad privada en la pantalla bloqueada (Android no deja cambiar un canal ya creado, por eso el id nuevo). En Expo Go `setNotificationChannelAsync` revienta (NullPointerException nativo), así que allí no se crea.

## Diseño
- Medidas, fuentes y tipos en `src/theme.ts`; **los colores NO**: salen de `useColors()` (`src/tema.tsx`, contexto) y se calculan en `src/paleta.ts` (puro) a partir del color de acento y del modo claro/oscuro. Nunca escribir un hex en un componente; si falta un tono, se añade a `paleta()`. Con el compilador de React activo, un color global mutable se quedaría desactualizado.
- Componentes en `src/ui.tsx`, iconos Phosphor por `src/icons.ts` (nunca emojis). Lexend para el texto; el logo `Wordmark` (VENTO en Unbounded Bold) solo se usa en Inicio y Más.
- Base de tarjetas sin borde, botones píldora de 56 px, tarjeta de acento arriba en Inicio y en los detalles. Estados de pago en tonos cálidos, sin rojo (`pagoColores`).
- Nada nativo a la vista: avisos con `notify(texto, 'ok' | 'borrar' | 'aviso')` y confirmaciones con `await confirm()` (`src/feedback.tsx`), nunca `Alert`.
- Animaciones sin rebote: `Tap` encoge un 3 % y vuelve suave, sin capa gris. `Appear` hace fundido y subida (nunca `entering`, que en Android puede quedarse en el primer fotograma). `animar()` (LayoutAnimation) antes de cambios que agregan o quitan filas. `Money` cuenta hacia arriba en su propio componente para no repintar toda la pantalla.
- Pantallas de stack usan `<Screen bottom>` (espacio inferior del sistema); `Screen` sube el contenido sobre el teclado con `KeyboardAvoidingView`. Tras borrar algo, `router.dismissTo(...)` en vez de `back()`.
- Inicio enlaza a Pedidos con `?filtro=cobrar|entregar` (el parámetro es la única fuente del filtro).

## Novedades
- `src/changelog.ts` (la más nueva primero) se ve en Más → Versión. Al subir de versión: añadir la entrada arriba y cambiar `version` en `app.json`; `changelog.test.ts` falla si no coinciden.

## Apariencia (Más → Apariencia)
- Tres cosas se eligen y se guardan en `ajustes` (`tema_modo`, `tema_acento`, `mascota`): modo claro / oscuro / automático, uno de 6 colores de acento (`ACENTOS`) y una mascota (`src/mascotas.ts`: pan, bebida, billete, moneda, bolsa, cartera). Aplican al instante.
- `paleta(acento, modo)` deriva todos los tonos. `paleta.test.ts` comprueba el contraste de cada color en cada modo (texto 7:1, secundario 4,5:1, acento 3:1 en claro y 4,5:1 en oscuro, texto sobre el acento 3:1): un color nuevo en `ACENTOS` tiene que pasar esas pruebas. En modo oscuro el acento se aclara solo hasta ser legible.
- `TemaProvider` va dentro de `SQLiteProvider` (lee la BD) y fuerza el modo con `Appearance.setColorScheme` para que teclado y diálogos del sistema coincidan. `app.json` usa `userInterfaceStyle: automatic`. Los botones de navegación del sistema pueden seguir el tema del teléfono.
- `Mascota` (`src/Mascota.tsx`) dibuja el cuerpo en SVG y una cara común. Respira y parpadea solo mientras su pantalla está al frente (`useFocusEffect`): las pestañas siguen montadas y un bucle infinito en pantallas ocultas gasta batería. Salta al tocarla y no rebota. `Vacio` la usa en los estados vacíos.
- **La mascota es la voz de la app** (`src/voz.ts`, puro y con pruebas): en Inicio habla en un globo (`Burbuja`) con el saludo y la noticia; tocarla pasa al siguiente mensaje (deuda y entregas, ganancia del mes, producto estrella). El recordatorio lleva su nombre en el título ("Pan: 3 personas te deben $65.000"). Los avisos emergentes (`notify`) llevan su cara y hablan en primera persona ("Listo, guardé el pedido"); las advertencias de validación siguen neutras.
- Animaciones de Reanimated (`useAnimatedStyle`, `useAnimatedProps`) corren en otro hilo: dentro solo valores ya calculados. Llamar a una función normal (como `alfa()`) rompe con "Tried to synchronously call a Remote Function"; se calcula fuera y se captura.
- Cada mascota tiene **colores fijos propios** (pan dorado, bebida rosa, billete verde, moneda dorada, bolsa morada, cartera café): no siguen el color de acento de la app. Mientras se llena algo, `Guia` (`src/Mascota.tsx`) la muestra con una frase corta ("Anotando…", "Ya casi…") que sale de `fraseAsistente` / `fraseCliente` / `fraseProducto` en `src/voz.ts`, y salta cuando avanzas. En los avisos de "guardé…" sale con la carita feliz (`feliz`).
- Un `Pressable` se queda con el toque aunque no tenga `onPress`. Una mascota de adorno (`animada={false}`) se dibuja en un `View pointerEvents="none"`; si fuera un `Pressable`, la tarjeta que la rodea (el selector de mascotas) nunca recibiría el toque.

## Idioma (español / inglés)
- `src/idioma.ts` (puro): el texto en español ES la clave (`t('Guardar pedido')`) y `EN` es el mapa al inglés; español no necesita tabla. Los huecos son `{nombre}` (`t('Pedido de {nombre}', { nombre })`). Frases completas, no trozos: el inglés ordena distinto, y los plurales son claves aparte ("1 pedido" / "{n} pedidos").
- En componentes: `const t = useT()` (`src/tema.tsx`; el idioma vive en el mismo contexto que el tema, preferencia `auto | es | en` guardada en `ajustes.idioma`). Fuera de React (notificaciones, CSV): `traductor(db)` (`src/traductor.ts`). Los módulos puros reciben `t` como parámetro (`armarAviso`, `mensajesInicio`, `hora12`, `cuando`, `csvVentas`...).
- `idioma.test.ts` lee el código y falla si un `t('...')` no tiene traducción, si sobra una traducción, o si los `{huecos}` no coinciden. Los textos que se piden por variable (nombres de colores y mascotas, medios de pago, meses, cabeceras del CSV, estados de pago, botones de `confirm`) se listan en `dinamicas()` de esa prueba. No escribir texto visible sin pasar por `t()`.
- Los valores guardados en la base de datos se quedan en español (`'Efectivo'`, `'Transferencia'`) para no romper copias; se traducen al mostrarlos. El formato de dinero (`$1.500`) es el mismo en los dos idiomas. Los mensajes de error de las copias son claves traducidas al mostrarlos (`notify(t(e.message))`).
- `changelog.ts` lleva cada entrada en los dos idiomas con el mismo número de cambios (lo comprueba `changelog.test.ts`).

## Mascotas: caras, colores y notificaciones
- Todas tienen ojos y boca oscuros (un tono oscuro de su propio color) con mejillas rosadas, y varios colores en su dibujo (la bebida con tapa amarilla y pajilla rayada, el billete con monedas doradas, la bolsa con banda dorada, la cartera con billete y tarjeta asomando). Se dibujan en `CUERPOS` de `src/Mascota.tsx`.
- La notificación no puede mostrar la mascota elegida: `expo-notifications` solo acepta un icono fijo definido al construir la app (`icon` y `largeIcon` del plugin en `app.json`, generados por `scripts/make-icons.sh`: una `V` blanca y el icono de la app). Por eso el nombre de la mascota va en el título. En Expo Go siempre sale el icono de Expo; el de Vento solo se ve en una versión instalada (APK).

## Publicar una versión
1. Subir `version` en `app.json` (y `android.versionCode`, un entero que solo sube) y añadir la entrada arriba en `src/changelog.ts` (`changelog.test.ts` falla si no coinciden).
2. `node --test src/ && npx tsc --noEmit && npx expo lint`.
3. APK: `npm run apk` (local; compila, pide la contraseña de tu llave y deja `dist/vento-<versión>.apk` firmado con ella) o `npx eas-cli build -p android --profile preview` (nube; `eas.json` ya tiene el perfil `preview` que genera APK y `production` que genera `.aab` para Play).
4. Commit, etiqueta `v<versión>` y `gh release create v<versión> dist/vento-<versión>.apk --title "Vento <versión>" --notes-file <notas>` (con `gh` instalado y `gh auth login`; o subir el APK a mano en la página de Releases).
- `npm run preview` regenera `docs/preview/index.html` y `docs/img/mascotas.png` (la imagen del README) desde los dibujos de `src/Mascota.tsx`; `preview.test.ts` falla si el HTML guardado no coincide con las mascotas (si cambias un dibujo, corre `npm run preview` y sube los dos archivos).
- `android/` y `dist/` no se versionan: `npm run apk` regenera `android/` con `expo prebuild --clean` cada vez (el límite de descarga de Gradle sube de 10 a 120 s en ese script).
- **Permisos:** `app.json` bloquea (`android.blockedPermissions`) SYSTEM_ALERT_WINDOW, el almacenamiento y el registro de push, que Expo añade por defecto y la app no usa. **INTERNET sí se permite**, solo para la comprobación de versiones nuevas en GitHub (ver Actualizaciones); el README lo dice así. Quedan además VIBRATE, RECEIVE_BOOT_COMPLETED (sin él los recordatorios se pierden al reiniciar), POST_NOTIFICATIONS, WAKE_LOCK y ACCESS_NETWORK_STATE. Verificar tras cambiar dependencias: `~/Android/Sdk/build-tools/<v>/aapt2 dump permissions dist/vento-<versión>.apk`.
- `npm run apk` verificado: APK de ~54 MB, solo arm64-v8a y armeabi-v7a, tarda ~5 min la primera vez.
- **Contraseña de la llave: solo ASCII** (sin tildes ni `ñ`): con otro carácter `keytool` falla con "Password is not ASCII" y la llave no se crea.
- **Firma del APK:** con una llave propia, `~/.vento/vento-release.jks` (alias `vento`, PKCS12), que se crea una sola vez con `npm run llave` (`scripts/crear-llave.sh`: pregunta nombre y contraseña y los valida antes de llamar a `keytool`). **Esa llave y su contraseña no se pierden ni se suben**: Android solo instala una actualización si viene firmada con la misma llave, y como los datos están solo en el teléfono, cambiarla obliga a desinstalar y perderlos (salvo copia de seguridad). `*.jks` está en `.gitignore`; la llave vive fuera del repositorio. `sign-apk.sh` pide la contraseña (o `VENTO_KS_PASSWORD` para no interactivo); `build-apk.sh` se niega a empezar si no hay llave, y `VENTO_DEBUG_SIGN=1` salta la firma propia solo para probar la compilación (la llave de depuración de Expo es pública y la misma para todas las apps: ese APK no se publica).

## Historial, búsqueda, fechas y actualizaciones
- Un pedido está **completo** (`completo` en `src/calc.ts`) cuando está entregado y pagado, aunque su total sea 0; `bloqueado` (no editable) exige además total > 0. La pestaña Pedidos muestra solo lo abierto: Todos (por cobrar y por entregar juntos), Por cobrar y Por entregar, sin los completos; un botón **Historial** en su cabecera abre la pantalla aparte `src/app/historial.tsx` (solo completos, agrupados por día con `agruparPorDia` de `src/historial.ts`, con cabecera por día como los movimientos de un banco y su propio buscador). Inicio y las demás listas no incluyen los completos en "por cobrar" ni "por entregar" por la misma regla.
- Fechas: `pedidos.fecha` es `YYYY-MM-DD` en hora local y se elige al crear o editar (`FechaCampo`/`Calendario`, dibujados por nosotros, no se puede elegir un día futuro). El pago que se anota con el pedido lleva la fecha del pedido. `src/fecha.ts` es puro y probado; las copias de seguridad rechazan fechas que no tengan ese formato.
- Búsqueda: `Buscador` (`src/ui.tsx`) en pedidos (cliente, productos, fecha y monto), clientes (nombre, teléfono) y productos (nombre, categoría). `coincide` (`src/busqueda.ts`) ignora mayúsculas y tildes y exige todas las palabras.
- **Actualizaciones** (`src/version.ts` puro y probado con un `fetch` falso; `src/actualizaciones.ts` es la parte con red): una vez al día al abrir la app (y con el botón de Más → Versión) pide `releases/latest` del repositorio de `package.json` (`repository.url`; si cambia el usuario o el nombre, se cambia ahí), compara versiones número a número y, si hay una más nueva, ofrece abrir el APK en el navegador. Solo acepta enlaces que sigan dentro de ese repositorio. Se apaga con el interruptor (ajuste `act_auto`). Un fallo de red nunca muestra error al abrir la app. Para que la actualización se instale encima, el APK nuevo tiene que ir firmado con la misma llave.
- Las filas de filtros con pocas opciones fijas (Pedidos, Clientes, Inicio) usan `<Chip block>`: ocupan toda la línea a partes iguales y el texto se encoge en vez de cortarse; los de categorías de Productos (cantidad variable) siguen en una fila con desplazamiento.
