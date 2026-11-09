// Newest first. The first entry's version must match `version` in app.json (checked by changelog.test.ts).
// Every entry is written in both languages and must have the same number of changes in each.
import type { Lang } from './idioma.ts';

export type Textos = { titulo: string; cambios: string[] };
export type Entrada = { version: string; fecha: string } & Record<Lang, Textos>;

export const CHANGELOG: Entrada[] = [
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
        'Backups in a folder called vento, with an automatic daily, weekly or monthly backup and a notice when it is made.',
        'Restore a saved backup or another file from your phone, and export your sales for Excel or Google Sheets.',
      ],
    },
  },
];
