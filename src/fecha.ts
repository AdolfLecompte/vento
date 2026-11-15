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

// The period Home looks at: a week (Monday to Sunday), a month, or everything. `desp` moves it back (-1 = the one before).
export type Periodo = 'semana' | 'mes' | 'todo';
export function rangoPeriodo(p: Periodo, desp: number, hoy: string) {
  if (p === 'todo') return { desde: '', hasta: '9999-12-31' };
  if (p === 'semana') { const lunes = sumarDias(inicioSemana(hoy), 7 * desp); return { desde: lunes, hasta: sumarDias(lunes, 6) }; }
  const [y, m] = partes(hoy);
  const f = mesMas(y, m, desp);
  return { desde: `${f.y}-${dos(f.m)}-01`, hasta: `${f.y}-${dos(f.m)}-${dos(diasDelMes(f.y, f.m))}` };
}

export function etiquetaPeriodo(p: Periodo, desp: number, hoy: string, t: T) {
  if (p === 'todo') return t('Todo');
  if (desp === 0) return p === 'semana' ? t('Esta semana') : t('Este mes');
  if (desp === -1) return p === 'semana' ? t('Semana pasada') : t('Mes pasado');
  const { desde, hasta } = rangoPeriodo(p, desp, hoy);
  const [y, m, d] = partes(desde), [y2, m2, d2] = partes(hasta);
  const anio = y === partes(hoy)[0] ? '' : ` ${y}`;
  return p === 'mes' ? `${t(MESES[m - 1])}${anio || ` ${y}`}` : `${d} ${t(MESES[m - 1])} – ${d2} ${t(MESES[m2 - 1])}${y2 === partes(hoy)[0] ? '' : ` ${y2}`}`;
}
