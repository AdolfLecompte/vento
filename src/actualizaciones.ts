import Constants from 'expo-constants';
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
// (it only installs because it is signed with the same key).
export const abrirDescarga = (r: Release) => Linking.openURL(r.apk ?? r.pagina);
