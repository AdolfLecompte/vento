import type { T } from './idioma.ts';

// What the mascot says (pure, so it runs under `node --test`). It is the voice of the app: the greeting on Home,
// the news in the reminder, and the confirmations after you create something.

export const saludoHora = (h: number, t: T) => (h < 12 ? t('Buenos días') : h < 19 ? t('Buenas tardes') : t('Buenas noches'));

export type DatosVoz = {
  pedidos: number; // how many orders exist
  deudores: { nombre: string; debe: number }[];
  porEntregar: number;
  gananciaMes: number;
  estrella: string | null; // the product that earns the most
};

// The messages Home shows one after another (tap the mascot for the next). The first one is the important news.
// Each sentence is a whole key, so English isn't a word-for-word copy of the Spanish order.
export function mensajesInicio(d: DatosVoz, dinero: (n: number) => string, t: T): string[] {
  if (d.pedidos === 0) return [t('Anota tu primer pedido y yo te ayudo a llevar las cuentas.')];
  const debe = d.deudores.filter((x) => x.debe > 0);
  const total = debe.reduce((a, x) => a + x.debe, 0);
  const n = d.porEntregar;
  let primera: string;
  if (debe.length === 0 && n === 0) primera = t('Todo al día, ¡buen trabajo!');
  else if (debe.length === 0) primera = n === 1 ? t('Falta 1 pedido por entregar.') : t('Faltan {n} pedidos por entregar.', { n });
  else {
    const quien: Record<string, string | number> = debe.length === 1 ? { nombre: debe[0].nombre, monto: dinero(debe[0].debe) } : { n: debe.length, monto: dinero(total) };
    if (n === 0) primera = debe.length === 1 ? t('{nombre} te debe {monto}.', quien) : t('{n} personas te deben {monto}.', quien);
    else if (debe.length === 1) primera = n === 1 ? t('{nombre} te debe {monto} y falta 1 pedido por entregar.', quien) : t('{nombre} te debe {monto} y faltan {p} pedidos por entregar.', { ...quien, p: n });
    else primera = n === 1 ? t('{n} personas te deben {monto} y falta 1 pedido por entregar.', quien) : t('{n} personas te deben {monto} y faltan {p} pedidos por entregar.', { ...quien, p: n });
  }
  const out = [primera];
  if (d.gananciaMes > 0) out.push(t('Este mes llevas {monto} de ganancia.', { monto: dinero(d.gananciaMes) }));
  if (d.estrella) out.push(t('Lo que más te deja es {producto}.', { producto: d.estrella }));
  return out;
}

// Short lines the mascot says while you fill something in, one per part ("Anotando…", "Ya casi…").
export const fraseAsistente = (paso: number, editando: boolean, t: T) =>
  paso === 1 ? t('¿Para quién anotamos?')
    : paso === 2 ? t('Anotando… ¿qué pidió?')
    : paso === 3 ? (editando ? t('Ya casi… ¿ya se entregó?') : t('Ya casi… ¿cómo va el pago?'))
    : t('¡Último vistazo y lo guardo!');

export const fraseCliente = (tieneNombre: boolean, t: T) => (tieneNombre ? t('¡Ya casi! Guárdalo cuando quieras.') : t('Anotando a tu cliente…'));

export const fraseProducto = (tieneNombre: boolean, tienePrecio: boolean, t: T) =>
  !tieneNombre ? t('Anotando tu producto…') : !tienePrecio ? t('Ya casi… ¿a cómo lo vendes?') : t('¡Listo! Guárdalo cuando quieras.');
