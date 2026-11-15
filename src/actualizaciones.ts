import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import type { SQLiteDatabase } from 'expo-sqlite';
import { Linking } from 'react-native';
import pkg from '../package.json';
import { getAjuste, setAjuste } from '@/db';
import { consultar, esMasNueva, Release, repoDe, Resultado } from '@/version';

// The only thing the app ever asks the internet: "is there a newer release of this project on GitHub?".
// It sends nothing about the user. The repository is the one in package.json.
export const REPO = repoDe(pkg.repository.url);
const DIA = 864e5;

export const versionActual = () => Constants.expoConfig?.version ?? '0.0.0';

export const avisarActualizaciones = async (db: SQLiteDatabase) => (await getAjuste(db, 'act_auto', '1')) === '1';
export const guardarAvisar = (db: SQLiteDatabase, v: boolean) => setAjuste(db, 'act_auto', v ? '1' : '0');

// The newer version the last check found ('' = none), so Settings can show it without asking again.
export async function versionDisponible(db: SQLiteDatabase) {
  const v = await getAjuste(db, 'act_disponible', '');
  return v && esMasNueva(v, versionActual()) ? v : '';
}

// Checks GitHub. Automatic checks run at most once a day and only if the user didn't turn them off;
// `forzar` is the "check now" button. A failed check (offline) is not remembered, so it is retried next time.
export async function buscarActualizacion(db: SQLiteDatabase, forzar = false): Promise<Resultado | null> {
  if (!REPO) return null;
  if (!forzar) {
    if (!(await avisarActualizaciones(db))) return null;
    if (Date.now() - Number(await getAjuste(db, 'act_ultima', '0')) < DIA) return null;
  }
  const r = await consultar(REPO, versionActual());
  if (r.estado !== 'error') {
    await setAjuste(db, 'act_ultima', String(Date.now()));
    await setAjuste(db, 'act_disponible', r.estado === 'nueva' && r.release ? r.release.version : '');
  }
  return r;
}

// Opens the APK link in the browser, which downloads it; tapping the download installs the update over the old app
// (it only installs because it is signed with the same key). Fallback when the in-app download fails.
export const abrirDescarga = (r: Release) => Linking.openURL(r.apk ?? r.pagina);

// Downloads the APK into the cache reporting progress (0..1) and hands it to Android's installer, which asks the user to
// confirm. Android refuses an update not signed with the same key, so no checksum is verified here (hashing 50 MB in
// JavaScript is slow). Resolves false if the user cancelled; any other failure throws so the caller can fall back to the browser.
let descarga: FileSystem.DownloadResumable | null = null;
let cancelada = false;
export const cancelarDescarga = () => { cancelada = true; descarga?.cancelAsync().catch(() => {}); };

export async function descargarEInstalar(r: Release, onProgreso: (fraccion: number) => void) {
  if (!r.apk) throw new Error('This release has no APK');
  cancelada = false;
  const destino = `${FileSystem.cacheDirectory}vento-${r.version}.apk`;
  // Old downloads (about 50 MB each) are no longer needed once a newer one is coming.
  for (const n of await FileSystem.readDirectoryAsync(FileSystem.cacheDirectory!)) if (/^vento-.*\.apk$/.test(n)) await FileSystem.deleteAsync(`${FileSystem.cacheDirectory}${n}`, { idempotent: true });
  descarga = FileSystem.createDownloadResumable(r.apk, destino, {}, (p) =>
    onProgreso(p.totalBytesExpectedToWrite > 0 ? p.totalBytesWritten / p.totalBytesExpectedToWrite : 0));
  let res;
  try { res = await descarga.downloadAsync(); } catch (e) { if (cancelada) return false; throw e; } finally { descarga = null; }
  if (cancelada) return false;
  if (!res || res.status !== 200) throw new Error(`Download failed (${res?.status})`);
  await IntentLauncher.startActivityAsync('android.intent.action.INSTALL_PACKAGE', {
    data: await FileSystem.getContentUriAsync(destino),
    flags: 1, // FLAG_GRANT_READ_URI_PERMISSION: the installer may read our cache file
    type: 'application/vnd.android.package-archive',
  });
  return true;
}
