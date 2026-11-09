// Newest first. The first entry's version must match `version` in app.json (checked by changelog.test.ts).
// Every entry is written in both languages and must have the same number of changes in each.
import type { Lang } from './idioma.ts';

export type Textos = { titulo: string; cambios: string[] };
export type Entrada = { version: string; fecha: string } & Record<Lang, Textos>;

export const CHANGELOG: Entrada[] = [
  {
    version: '1.1.0',
    fecha: '2026-11-08',
    es: {
      titulo: 'Historial aparte, icono nuevo y arreglos',
      cambios: [
        'El historial de pedidos terminados tiene su propia pantalla: se abre con el botón Historial de Pedidos, y Pedidos muestra solo lo que sigue abierto.',
        'Los botones de filtro ocupan toda la línea en vez de quedarse pegados a la izquierda.',
        'Nuevo icono de la app: el nombre VENTO, en lugar de la billetera.',
        'El aviso de versiones nuevas ahora busca en el repositorio correcto de GitHub.',
      ],
    },
    en: {
      titulo: 'Separate history, new icon and fixes',
      cambios: [
        'The history of finished orders has its own screen: open it with the History button in Orders, and Orders now shows only what is still open.',
        'The filter buttons fill the whole line instead of hugging the left edge.',
        'New app icon: the VENTO name, instead of the wallet.',
        'The new-version alert now looks in the right GitHub repository.',
      ],
    },
  },
  {
    version: '1.0.0',
    fecha: '2026-11-08',
    es: {
      titulo: 'Primera versión',
      cambios: [
        'Pedidos paso a paso: cliente, productos, pago y entrega, con un resumen final antes de guardar.',
        'Un pedido pagado y entregado queda cerrado y no se puede editar.',
        'Clientes con historial, teléfono opcional y filtro de quién te debe.',
        'Productos con categorías y filtro por cada categoría.',
        'Inicio con la ganancia del mes, lo que te deben y lo que falta entregar.',
        'Recordatorio diario con quién te debe y cuántos pedidos faltan por entregar; el detalle queda oculto hasta desbloquear el teléfono.',
        'Personaliza la app: elige el color, el modo claro, oscuro o automático, y una mascota (pan, bebida, billete, moneda, bolsa o cartera) que te da las noticias: te saluda en Inicio, te cuenta quién te debe, firma el recordatorio, te acompaña con frases cortas mientras anotas y sonríe cuando guardas algo.',
        'La app está en español e inglés: se elige en Apariencia o sigue el idioma del teléfono.',
        'Historial: los pedidos ya entregados y pagados salen de Pendientes y quedan aparte, agrupados por día como los movimientos de un banco.',
        'Cambia la fecha de un pedido al crearlo o al editarlo.',
        'Buscador en pedidos, clientes y productos.',
        'Inicio separa la ganancia de lo cobrado y te dice cuánto falta para llegar a lo vendido.',
        'Aviso cuando hay una versión nueva en GitHub, con descarga directa (se puede apagar).',
        'Copias de seguridad en una carpeta llamada vento, con copia automática diaria, semanal o mensual y aviso cuando se hace.',
        'Restaurar una copia guardada, otro archivo del teléfono, y exportar tus ventas para Excel o Google Sheets.',
      ],
    },
    en: {
      titulo: 'First version',
      cambios: [
        'Step-by-step orders: client, products, payment and delivery, with a final summary before saving.',
        'An order that is paid and delivered is closed and cannot be edited.',
        'Clients with history, an optional phone number and a filter for who owes you.',
        'Products with categories and a filter for each category.',
        'Home with the month\'s profit, what you are owed and what is left to deliver.',
        'Daily reminder with who owes you and how many orders are left to deliver; the details stay hidden until you unlock the phone.',
        'Make the app yours: pick the color, light, dark or automatic mode, and a mascot (bread, drink, banknote, coin, bag or wallet) that gives you the news: it greets you on Home, tells you who owes you, signs the reminder, walks you through forms with short lines and smiles when you save something.',
        'The app is in Spanish and English: choose it in Appearance or let it follow your phone\'s language.',
        'History: orders that are delivered and paid leave Pending and live apart, grouped by day like a bank\'s movements.',
        'Change an order\'s date when you create or edit it.',
        'Search in orders, clients and products.',
        'Home separates profit from what you have collected and tells you how much is left to reach what you sold.',
        'A notice when there is a new version on GitHub, with a direct download (it can be turned off).',
        'Backups in a folder called vento, with an automatic daily, weekly or monthly backup and a notice when it is made.',
        'Restore a saved backup or another file from your phone, and export your sales for Excel or Google Sheets.',
      ],
    },
  },
];
