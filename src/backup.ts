import * as DocumentPicker from 'expo-document-picker';
import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { SQLiteDatabase } from 'expo-sqlite';
import { getAjuste, hoy, setAjuste } from '@/db';
import { traductor } from '@/traductor';
import {
  armarRespaldo, csvVentas, delMismoDia, esCopia, Frecuencia, horaCorta, leerTablas, masNuevaPrimero, nombreCopia, sobrantes, Tablas, toca,
  validarRespaldo, Venta,
} from '@/respaldo';

const CARPETA = 'vento';
const MAX_COPIAS = 10;

export type Config = { carpeta: string | null; auto: boolean; frecuencia: Frecuencia; ultima: number | null };

export async function leerConfig(db: SQLiteDatabase): Promise<Config> {
  const ultima = await getAjuste(db, 'backup_ultima', '');
  return {
    carpeta: (await getAjuste(db, 'backup_dir', '')) || null,
    auto: (await getAjuste(db, 'backup_auto', '0')) === '1',
    frecuencia: (await getAjuste(db, 'backup_frec', 'semana')) as Frecuencia,
    ultima: ultima ? Number(ultima) : null,
  };
}

export async function guardarConfig(db: SQLiteDatabase, c: Partial<Pick<Config, 'auto' | 'frecuencia'>>) {
  if (c.auto !== undefined) await setAjuste(db, 'backup_auto', c.auto ? '1' : '0');
  if (c.frecuencia) await setAjuste(db, 'backup_frec', c.frecuencia);
}

// The user picks a place once (Android's folder picker, which keeps the permission); we keep our copies in a
// folder called "vento" inside it, reusing it if it's already there or if the user picked one named vento.
export async function elegirCarpeta(db: SQLiteDatabase): Promise<boolean> {
  let elegida: Directory;
  try { elegida = await Directory.pickDirectoryAsync(); } catch { return false; } // cancelled
  const hijos = elegida.name === CARPETA ? [] : elegida.list();
  const vento = elegida.name === CARPETA ? elegida
    : hijos.find((x): x is Directory => x instanceof Directory && x.name === CARPETA) ?? elegida.createDirectory(CARPETA);
  await setAjuste(db, 'backup_dir', vento.uri);
  return true;
}

// null when nothing was chosen yet, or the folder was deleted / its permission was revoked.
async function carpeta(db: SQLiteDatabase): Promise<Directory | null> {
  const uri = (await leerConfig(db)).carpeta;
  if (!uri) return null;
  try { const d = new Directory(uri); d.list(); return d; } catch { return null; }
}

export const hayCarpeta = async (db: SQLiteDatabase) => (await carpeta(db)) !== null;

// Writes a new copy into vento and reads it back to prove it can be restored. Only after that are the older
// copies of the same day and the surplus ones deleted, so a failure never costs a copy that was good.
export async function guardarCopia(db: SQLiteDatabase): Promise<string> {
  const dir = await carpeta(db);
  if (!dir) throw new Error('Elige primero la carpeta donde guardar las copias');
  const nombre = nombreCopia(hoy(), horaCorta(new Date()));
  const f = dir.createFile(nombre, 'application/json');
  try {
    await f.write(armarRespaldo(await leerTablas(db), hoy()));
    validarRespaldo(await f.text()); // a copy that can't be restored is worse than none
  } catch (e) {
    try { f.delete(); } catch { /* nothing half-written left to clean */ }
    throw e;
  }
  const archivos = dir.list().filter((x): x is File => x instanceof File);
  const nombres = archivos.map((x) => x.name);
  const mismoDia = delMismoDia(nombres, hoy(), nombre);
  const viejos = new Set([...mismoDia, ...sobrantes(nombres.filter((n) => !mismoDia.includes(n)), MAX_COPIAS)]);
  for (const x of archivos) if (viejos.has(x.name)) x.delete();
  await setAjuste(db, 'backup_ultima', String(Date.now()));
  return nombre;
}

// Newest first.
export async function listarCopias(db: SQLiteDatabase): Promise<File[]> {
  const dir = await carpeta(db);
  if (!dir) return [];
  return dir.list().filter((x): x is File => x instanceof File && esCopia(x.name)).sort((a, b) => masNuevaPrimero(a.name, b.name));
}

// Called when the app opens (foreground) or leaves (background). Does nothing unless auto is on and it's due.
export async function copiaAutomatica(db: SQLiteDatabase, antes?: () => void): Promise<'hecha' | 'no-toca' | 'error'> {
  const c = await leerConfig(db);
  if (!c.auto || !c.carpeta || !toca(c.ultima, c.frecuencia, Date.now())) return 'no-toca';
  antes?.();
  try { await guardarCopia(db); return 'hecha'; } catch { return 'error'; }
}

export const leerArchivo = async (f: File): Promise<Tablas> => validarRespaldo(await f.text());

// Pick any backup file from the phone (Drive, downloads...); null if cancelled.
export async function elegirRespaldo(): Promise<Tablas | null> {
  const r = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
  if (r.canceled) return null;
  return leerArchivo(new File(r.assets[0].uri));
}

async function compartir(nombre: string, contenido: string, mime: string) {
  const f = new File(Paths.cache, nombre);
  f.create({ overwrite: true });
  await f.write(contenido); // write is async: sharing before it finishes sent an empty file
  await Sharing.shareAsync(f.uri, { mimeType: mime, dialogTitle: nombre });
}

// Send a copy anywhere (Drive, WhatsApp, e-mail) through the share sheet.
export async function enviarCopia(db: SQLiteDatabase) {
  await compartir(nombreCopia(hoy()), armarRespaldo(await leerTablas(db), hoy()), 'application/json');
}

export async function exportarCsv(db: SQLiteDatabase) {
  const rows = await db.getAllAsync<Venta>(
    `SELECT p.id AS pedido, p.fecha, c.nombre AS cliente, pr.nombre AS producto, i.cantidad, i.costo_unit, i.precio_unit, p.entregado
     FROM pedido_items i JOIN pedidos p ON p.id=i.pedido_id JOIN clientes c ON c.id=p.cliente_id JOIN productos pr ON pr.id=i.producto_id
     ORDER BY p.id, i.id`,
  );
  await compartir(`ventas-${hoy()}.csv`, csvVentas(rows, await traductor(db)), 'text/csv');
}
