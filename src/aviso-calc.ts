// Pure parts of the daily reminder (no React Native imports, so it runs under `node --test`).
import type { T } from './idioma.ts';

export const hora12 = (min: number, t: T) => {
  const h = Math.floor(min / 60), m = min % 60;
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? t('a. m.') : t('p. m.')}`;
};

// Next `n` moments at `min` minutes after midnight, starting today only if that time hasn't passed.
export function proximasFechas(min: number, ahora: Date, n = 7): Date[] {
  const out: Date[] = [];
  for (let d = 0; out.length < n; d++) {
    const f = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() + d, Math.floor(min / 60), min % 60, 0, 0);
    if (f.getTime() > ahora.getTime()) out.push(f);
  }
  return out;
}

// Daily reminders get an id of their own so they can be replaced without touching other notifications (e.g. a test one).
const pad = (n: number) => String(n).padStart(2, '0');
export const idAviso = (d: Date) => `aviso-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const esIdAviso = (id: string) => id.startsWith('aviso-');

export type Deudor = { nombre: string; debe: number };
export type PorEntregar = { nombre: string; n: number }; // pending deliveries per client

// The notification text. Totals go in the title; the body lists the biggest few people (money owed, or how many
// orders to deliver) and folds the rest into "and N more people", so it stays short with 3 or with 300 entries.
// Whole sentences are keys (not word pieces) so each language can order them its own way.
// null = nothing worth interrupting the user for.
export function armarAviso(
  deudores: Deudor[], entregas: PorEntregar[], op: { deben: boolean; entregas: boolean },
  dinero: (n: number) => string, t: T, max = 3,
): { titulo: string; cuerpo: string } | null {
  const mas = (resto: number) => (resto > 0 ? [resto === 1 ? t('y 1 persona más') : t('y {n} personas más', { n: resto })] : []);
  const pedidos = (n: number) => (n === 1 ? t('1 pedido') : t('{n} pedidos', { n }));
  const deben = op.deben ? deudores.filter((d) => d.debe > 0).sort((a, b) => b.debe - a.debe) : [];
  const falta = op.entregas ? entregas.filter((e) => e.n > 0).sort((a, b) => b.n - a.n) : [];
  const totalDebe = deben.reduce((a, d) => a + d.debe, 0);
  const totalPedidos = falta.reduce((a, e) => a + e.n, 0);

  const secciones: { cabecera: string; lineas: string[] }[] = [];
  if (deben.length) {
    secciones.push({
      cabecera: t('Te deben'),
      lineas: [...deben.slice(0, max).map((d) => `${d.nombre}: ${dinero(d.debe)}`), ...mas(deben.length - max)],
    });
  }
  if (falta.length) {
    secciones.push({
      cabecera: t('Por entregar ({n})', { n: totalPedidos }),
      lineas: [...falta.slice(0, max).map((e) => `${e.nombre}: ${pedidos(e.n)}`), ...mas(falta.length - max)],
    });
  }
  if (!secciones.length) return null;

  const m = dinero(totalDebe);
  const titulo = deben.length
    ? (deben.length === 1 ? t('1 persona te debe {monto}', { monto: m }) : t('{n} personas te deben {monto}', { n: deben.length, monto: m }))
    : (totalPedidos === 1 ? t('Tienes 1 pedido por entregar') : t('Tienes {n} pedidos por entregar', { n: totalPedidos }));
  // With one section the heading would repeat the title, so only label them when there are two.
  const cuerpo = secciones
    .map((sec) => (secciones.length > 1 ? [sec.cabecera, ...sec.lineas] : sec.lineas).join('\n'))
    .join('\n');
  return { titulo, cuerpo };
}
