# Vento (antes Compraventa)

App Android personal (Expo + expo-sqlite, sin servidor): pedidos, pagos, entregas y ganancias. Licencia GPL-3.0.
El nombre viejo se conserva a propósito en dos sitios: la base de datos (`compraventa.db`) y el marcador de las copias (`app: 'compraventa'`). Cambiarlos dejaría sin datos a quien ya instaló la app e inservibles sus copias.

## Comandos
- Pruebas: `node --test src/` (usa `node:sqlite`; el SQL, las copias y el dinero corren sobre SQLite real).
- Tipos: `npx tsc --noEmit` · Lint: `npx expo lint`.
- Compilación de Android sin teléfono: `npx expo export --platform android`.
- Tras añadir o mover rutas, arrancar `npx expo start` un momento regenera los tipos de `typedRoutes`; si `tsc` se queja de una ruta nueva, es eso.
- Iconos: `./scripts/make-icons.sh` regenera todos los PNG desde `assets/brand/cartera.svg` (necesita `rsvg-convert`). El favicon (web) es la palabra VENTO en Unbounded Bold, blanca sobre el verde, y se dibuja con `magick` (ImageMagick); el icono del teléfono sigue siendo la cartera.

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
- La notificación no puede mostrar la mascota elegida: `expo-notifications` solo acepta un icono fijo definido al construir la app (`icon` y `largeIcon` del plugin en `app.json`, generados por `scripts/make-icons.sh`: silueta blanca de la cartera y el logo). Por eso el nombre de la mascota va en el título. En Expo Go siempre sale el icono de Expo; el de Vento solo se ve en una versión instalada (APK).
