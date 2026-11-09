// Pure backup format + CSV (no React Native imports, so it runs under `node --test`).
import type { T } from './idioma.ts';
type Cell = string | number | null;
export type Fila = Record<string, Cell>;
export type Tablas = Record<'clientes' | 'productos' | 'pedidos' | 'pedido_items' | 'pagos', Fila[]>;

// Insert order matters: parents before children (foreign keys).
export const COLUMNAS: Record<keyof Tablas, string[]> = {
  clientes: ['id', 'nombre', 'telefono'],
  productos: ['id', 'nombre', 'costo', 'precio', 'categoria'],
  pedidos: ['id', 'cliente_id', 'fecha', 'entregado'],
  pedido_items: ['id', 'pedido_id', 'producto_id', 'cantidad', 'costo_unit', 'precio_unit'],
  pagos: ['id', 'pedido_id', 'monto', 'medio', 'fecha'],
};
const TEXTO = new Set(['nombre', 'telefono', 'categoria', 'fecha', 'medio']);
// Optional text: null is fine, and backups made before the column existed simply lack it.
const OPCIONAL = new Set(['telefono', 'categoria']);
const MAL = 'Ese archivo no es una copia de Vento';

// The marker stays 'compraventa' (the app's first name) so backups made before the rename still restore.
export const armarRespaldo = (t: Tablas, fecha: string) =>
  JSON.stringify({ app: 'compraventa', version: 1, fecha, ...t });

// The file is untrusted input: check shape and types before it touches the database.
export function validarRespaldo(texto: string): Tablas {
  let o: Record<string, unknown>;
  try { o = JSON.parse(texto); } catch { throw new Error(MAL); }
  if (!o || o.app !== 'compraventa' || o.version !== 1) throw new Error(MAL);
  const out = {} as Tablas;
  for (const [tabla, cols] of Object.entries(COLUMNAS) as [keyof Tablas, string[]][]) {
    const filas = o[tabla];
    if (!Array.isArray(filas)) throw new Error(MAL);
    for (const f of filas) {
      if (!f || typeof f !== 'object') throw new Error(MAL);
      for (const c of cols) {
        const v = (f as Fila)[c];
        const ok = TEXTO.has(c)
          ? typeof v === 'string' || (OPCIONAL.has(c) && (v === null || v === undefined))
          : Number.isSafeInteger(v);
        if (!ok) throw new Error(MAL);
      }
    }
    out[tabla] = (filas as Fila[]).map((f) => Object.fromEntries(cols.map((c) => [c, f[c] ?? null])));
  }
  return out;
}

export type Venta = {
  pedido: number; fecha: string; cliente: string; producto: string;
  cantidad: number; costo_unit: number; precio_unit: number; entregado: number;
};

const esc = (v: Cell) => {
  const s = String(v ?? '');
  return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

// ';' separator and BOM: Spanish-locale Excel opens it in columns with the right accents.
// Column names, looked up in the translations.
export const CABECERAS_CSV = ['pedido', 'fecha', 'cliente', 'producto', 'cantidad', 'costo', 'precio', 'total', 'ganancia', 'entregado'];

export function csvVentas(rows: Venta[], t: T) {
  const head = CABECERAS_CSV.map((h) => t(h));
  const body = rows.map((r) => [
    r.pedido, r.fecha, r.cliente, r.producto, r.cantidad, r.costo_unit, r.precio_unit,
    r.cantidad * r.precio_unit, r.cantidad * (r.precio_unit - r.costo_unit), r.entregado ? t('sí') : t('no'),
  ]);
  return '﻿' + [head, ...body].map((l) => l.map(esc).join(';')).join('\r\n');
}

// The two database calls the backup needs. expo-sqlite's SQLiteDatabase fits this, and so does the Node
// adapter used in the tests, which is how the real SQL gets exercised without a phone.
export type Db = {
  getAllAsync<T>(sql: string): Promise<T[]>;
  runAsync(sql: string, params: Cell[]): Promise<unknown>;
  withTransactionAsync(fn: () => Promise<void>): Promise<void>;
};

export async function leerTablas(db: Db): Promise<Tablas> {
  const t = {} as Tablas;
  for (const tabla of Object.keys(COLUMNAS) as (keyof Tablas)[]) {
    t[tabla] = await db.getAllAsync<Fila>(`SELECT ${COLUMNAS[tabla].join(',')} FROM ${tabla} ORDER BY id`);
  }
  return t;
}

// Replaces everything in one transaction: if any row is rejected (e.g. an item pointing at a missing order),
// SQLite rolls back and the current data stays exactly as it was.
export async function aplicarTablas(db: Db, t: Tablas) {
  const tablas = Object.keys(COLUMNAS) as (keyof Tablas)[];
  try {
    await db.withTransactionAsync(async () => {
      for (const tabla of [...tablas].reverse()) await db.runAsync(`DELETE FROM ${tabla}`, []);
      for (const tabla of tablas) {
        const cols = COLUMNAS[tabla];
        for (const f of t[tabla]) {
          await db.runAsync(`INSERT INTO ${tabla}(${cols.join(',')}) VALUES(${cols.map(() => '?').join(',')})`, cols.map((c) => f[c]));
        }
      }
    });
  } catch {
    throw new Error('La copia está dañada o incompleta. No se cambió nada.');
  }
}

// ---- Files in the "vento" folder and the automatic schedule (pure) ----
export type Frecuencia = 'dia' | 'semana' | 'mes';
const DIAS_ENTRE: Record<Frecuencia, number> = { dia: 1, semana: 7, mes: 30 };

// Calendar-day number in local time, so a copy made at 11 p. m. doesn't count as "today" the next morning.
const dia = (ms: number) => { const d = new Date(ms); return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5); };

export const toca = (ultima: number | null, f: Frecuencia, ahora: number) =>
  ultima === null || dia(ahora) - dia(ultima) >= DIAS_ENTRE[f];

export const cuando = (ultima: number, ahora: number, t: T) => {
  const n = dia(ahora) - dia(ultima);
  return n <= 0 ? t('hoy') : n === 1 ? t('ayer') : t('hace {n} días', { n });
};

export const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

// vento-2026-11-08-173005.json (date + time, so a new copy never overwrites a good one); the old
// date-only name still counts as ours.
export const nombreCopia = (fecha: string, hora = '') => `vento-${fecha}${hora ? `-${hora}` : ''}.json`;
export const esCopia = (nombre: string) => /^vento-\d{4}-\d{2}-\d{2}(-\d{6})?\.json$/.test(nombre);
export const horaCorta = (d: Date) => [d.getHours(), d.getMinutes(), d.getSeconds()].map((n) => String(n).padStart(2, '0')).join('');

// Newest first. The extension is ignored so "vento-DATE" sorts before "vento-DATE-HHMMSS".
const clave = (n: string) => n.replace(/\.json$/, '');
export const masNuevaPrimero = (a: string, b: string) => (clave(a) < clave(b) ? 1 : clave(a) > clave(b) ? -1 : 0);

// Older copies from the same day as `nuevo`: delete them only once `nuevo` is written and validated.
export const delMismoDia = (nombres: string[], fecha: string, nuevo: string) =>
  nombres.filter((n) => esCopia(n) && n !== nuevo && n.startsWith(`vento-${fecha}`));

// Names to delete so only the newest `max` copies stay. Anything that isn't one of our copies is never touched.
export const sobrantes = (nombres: string[], max = 10) => nombres.filter(esCopia).sort(masNuevaPrimero).slice(max);
