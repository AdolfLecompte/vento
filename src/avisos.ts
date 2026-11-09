import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { type SQLiteDatabase } from 'expo-sqlite';
import { Platform } from 'react-native';
import { armarAviso, esIdAviso, idAviso, proximasFechas } from '@/aviso-calc';
import { getAjuste, listDeudores, listPorEntregar, setAjuste } from '@/db';
import { MASCOTA_INICIAL, MASCOTAS } from '@/mascotas';
import { traductor } from '@/traductor';
import { money } from '@/ui';

// v2: lock-screen visibility is fixed when a channel is created, so changing it needs a new id.
const CANAL = 'recordatorios-v2';
export type Aviso = { activo: boolean; minutos: number; deben: boolean; entregas: boolean };

export async function leerAviso(db: SQLiteDatabase): Promise<Aviso> {
  return {
    activo: (await getAjuste(db, 'aviso_activo', '0')) === '1',
    minutos: Number(await getAjuste(db, 'aviso_min', String(18 * 60))),
    deben: (await getAjuste(db, 'aviso_deben', '1')) === '1',
    entregas: (await getAjuste(db, 'aviso_entregas', '1')) === '1',
  };
}

export async function guardarAviso(db: SQLiteDatabase, a: Aviso) {
  await setAjuste(db, 'aviso_activo', a.activo ? '1' : '0');
  await setAjuste(db, 'aviso_min', String(a.minutos));
  await setAjuste(db, 'aviso_deben', a.deben ? '1' : '0');
  await setAjuste(db, 'aviso_entregas', a.entregas ? '1' : '0');
}

const nombreMascota = async (db: SQLiteDatabase) => {
  const id = await getAjuste(db, 'mascota', MASCOTA_INICIAL);
  const t = await traductor(db);
  return t(MASCOTAS.find((m) => m.id === id)?.nombre ?? 'Vento');
};

// What the notification would say right now (null = nothing pending). The mascot is the one giving the news.
export async function textoActual(db: SQLiteDatabase, a: Aviso) {
  const [deudores, entregas, nombre, t] = await Promise.all([listDeudores(db), listPorEntregar(db), nombreMascota(db), traductor(db)]);
  const aviso = armarAviso(deudores, entregas, a, money, t);
  return aviso && { titulo: `${nombre}: ${aviso.titulo}`, cuerpo: aviso.cuerpo };
}

// Android 13+ only shows the permission prompt once a channel exists, so create it first.
// Expo Go's native channel manager crashes (NullPointerException) and Android falls back to its default
// channel anyway, so skip it there; elsewhere failing is harmless too. Returns whether our channel exists.
async function prepararCanal(db: SQLiteDatabase) {
  if (Platform.OS !== 'android' || Constants.executionEnvironment === ExecutionEnvironment.StoreClient) return false;
  try {
    /* eslint-disable import/namespace -- re-exported enums the linter can't follow; tsc checks them */
    await Notifications.setNotificationChannelAsync(CANAL, {
      name: (await traductor(db))('Recordatorio diario'),
      importance: Notifications.AndroidImportance.DEFAULT,
      // names and debts stay hidden on the lock screen until the phone is unlocked
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PRIVATE,
    });
    /* eslint-enable import/namespace */
    return true;
  } catch { return false; }
}

export async function pedirPermiso(db: SQLiteDatabase) {
  await prepararCanal(db);
  const actual = await Notifications.getPermissionsAsync();
  return actual.granted || (await Notifications.requestPermissionsAsync()).granted;
}

// The app can't run code at notification time, so the next few days are scheduled from the data as it is now.
// It is called when the app opens and when it goes to the background, so the text matches what the user last saw.
// Calls run one at a time (quick background/active flips used to interleave and schedule duplicates), and only
// our own daily ids are cancelled, so a pending test notification survives.
let cola: Promise<unknown> = Promise.resolve();
export function reprogramar(db: SQLiteDatabase) {
  const r = cola.then(() => correr(db));
  cola = r.catch(() => {});
  return r;
}

async function correr(db: SQLiteDatabase) {
  const pendientes = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(pendientes.filter((n) => esIdAviso(n.identifier)).map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)));
  const a = await leerAviso(db);
  if (!a.activo || !(await Notifications.getPermissionsAsync()).granted) return;
  const canal = await prepararCanal(db);
  const texto = await textoActual(db, a);
  if (!texto) return;
  for (const date of proximasFechas(a.minutos, new Date())) {
    await Notifications.scheduleNotificationAsync({
      identifier: idAviso(date),
      content: { title: texto.titulo, body: texto.cuerpo },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date, channelId: canal ? CANAL : undefined },
    });
  }
}

// A test notification in a few seconds, so the user can see exactly how it will look.
export async function enviarPrueba(db: SQLiteDatabase) {
  const canal = await prepararCanal(db);
  const t = await traductor(db);
  const texto = (await textoActual(db, await leerAviso(db))) ?? { titulo: t('{nombre}: todo al día', { nombre: await nombreMascota(db) }), cuerpo: t('No hay nada pendiente por ahora.') };
  await Notifications.scheduleNotificationAsync({
    content: { title: texto.titulo, body: texto.cuerpo },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 3, channelId: canal ? CANAL : undefined },
  });
}

// An immediate system notification (used to say a background backup was made). Silent if permission isn't granted.
export async function notificarAhora(titulo: string, cuerpo: string) {
  if (!(await Notifications.getPermissionsAsync()).granted) return;
  await Notifications.scheduleNotificationAsync({ content: { title: titulo, body: cuerpo }, trigger: null });
}
