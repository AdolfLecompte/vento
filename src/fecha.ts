// Dates as 'YYYY-MM-DD' strings (pure, runs under `node --test`). Local time everywhere: an order made at 11 p. m. is that day's.
import type { T } from './idioma.ts';
import { MESES } from './respaldo.ts';

const dos = (n: number) => String(n).padStart(2, '0');
const partes = (iso: string) => iso.split('-').map(Number) as [number, number, number];

export const fechaISO = (d: Date) => `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;

// Format AND a real calendar day (2026-02-30 is not one).
export function esFechaISO(s: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return false;
  const [y, mo, d] = [+m[1], +m[2], +m[3]];
  const f = new Date(y, mo - 1, d);
  return f.getFullYear() === y && f.getMonth() === mo - 1 && f.getDate() === d;
}

export const sumarDias = (iso: string, n: number) => { const [y, m, d] = partes(iso); return fechaISO(new Date(y, m - 1, d + n)); };

// Monday of the week that contains `iso` (weeks start on Monday, like the calendar).
export const inicioSemana = (iso: string) => { const [y, m, d] = partes(iso); return sumarDias(iso, -((new Date(y, m - 1, d).getDay() + 6) % 7)); };

export const diasDelMes = (y: number, m: number) => new Date(y, m, 0).getDate(); // m is 1-12
export const primerDiaSemana = (y: number, m: number) => (new Date(y, m - 1, 1).getDay() + 6) % 7; // Monday = 0
export const mesMas = (y: number, m: number, n: number) => { const d = new Date(y, m - 1 + n, 1); return { y: d.getFullYear(), m: d.getMonth() + 1 }; };

export const corta = (iso: string, t: T) => { const [y, m, d] = partes(iso); return `${d} ${t(MESES[m - 1])} ${y}`; };
export const etiquetaDia = (iso: string, hoy: string, t: T) => (iso === hoy ? t('Hoy') : iso === sumarDias(hoy, -1) ? t('Ayer') : corta(iso, t));
