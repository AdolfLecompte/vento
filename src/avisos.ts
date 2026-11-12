import Constants, { ExecutionEnvironment } from 'expo-constants';
import notifee, { AlarmType, AndroidImportance, AndroidStyle, AndroidVisibility, AuthorizationStatus, TriggerType, type Notification } from 'react-native-notify-kit';
import { type SQLiteDatabase } from 'expo-sqlite';
import { Platform } from 'react-native';
import { armarAviso, esIdAviso, idAviso, proximasFechas } from '@/aviso-calc';
import { getAjuste, listDeudores, listPorEntregar, setAjuste } from '@/db';
import { esMascota, MASCOTA_INICIAL, MASCOTAS, type MascotaId } from '@/mascotas';
import { traductor } from '@/traductor';
import { money } from '@/ui';

// The picture of each mascot (assets/images/mascotas, made by `npm run icons`): the big, round image of the notification.
// Metro needs the literal path of every image, hence require().
const CARAS: Record<MascotaId, number> = {
  pan: require('../assets/images/mascotas/pan.png'),
  bebida: require('../assets/images/mascotas/bebida.png'),
  billete: require('../assets/images/mascotas/billete.png'),
  moneda: require('../assets/images/mascotas/moneda.png'),
  bolsa: require('../assets/images/mascotas/bolsa.png'),
  cartera: require('../assets/images/mascotas/cartera.png'),
};
// react-native-notify-kit is a native module, so it does not exist in Expo Go: there, notifications are simply off.
const disponible = Platform.OS === 'android' && Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;

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

const mascotaActual = async (db: SQLiteDatabase): Promise<MascotaId> => {
  const id = await getAjuste(db, 'mascota', MASCOTA_INICIAL);
  return esMascota(id) ? id : MASCOTA_INICIAL;
};
const nombreMascota = async (db: SQLiteDatabase) => {
  const id = await mascotaActual(db);
  return (await traductor(db))(MASCOTAS.find((m) => m.id === id)?.nombre ?? 'Vento');
};

// What the notification would say right now (null = nothing pending). The mascot is the sender: its name is the title
// and its picture the avatar, and the news and the details are the message.
export async function textoActual(db: SQLiteDatabase, a: Aviso) {
  const [deudores, entregas, nombre, t] = await Promise.all([listDeudores(db), listPorEntregar(db), nombreMascota(db), traductor(db)]);
  const aviso = armarAviso(deudores, entregas, a, money, t);
  return aviso && { titulo: nombre, cuerpo: `${aviso.titulo}\n${aviso.cuerpo}` };
}

// Android 13+ only shows the permission prompt once a channel exists, so create it first. Re-creating it is harmless.
// Returns whether our channel exists.
async function prepararCanal(db: SQLiteDatabase) {
  if (!disponible) return false;
  try {
    await notifee.createChannel({
      id: CANAL,
      name: (await traductor(db))('Recordatorio diario'),
      importance: AndroidImportance.DEFAULT,
      // names and debts stay hidden on the lock screen until the phone is unlocked
      visibility: AndroidVisibility.PRIVATE,
    });
    return true;
  } catch { return false; }
}

const permitido = async () => {
  const s = await notifee.getNotificationSettings();
  return s.authorizationStatus === AuthorizationStatus.AUTHORIZED || s.authorizationStatus === AuthorizationStatus.PROVISIONAL;
};

export async function pedirPermiso(db: SQLiteDatabase) {
  if (!disponible) return false;
  await prepararCanal(db);
  if (await permitido()) return true;
  await notifee.requestPermission();
  return permitido();
}

// The notification as the user sees it: the chosen mascot as a round picture, the app's mark in the status bar.
async function armar(db: SQLiteDatabase, titulo: string, cuerpo: string): Promise<Notification> {
  return {
    title: titulo,
    body: cuerpo,
    android: {
      channelId: CANAL,
      smallIcon: 'notification_icon',
      color: '#16A34A',
      largeIcon: CARAS[await mascotaActual(db)],
      circularLargeIcon: true,
      style: { type: AndroidStyle.BIGTEXT, text: cuerpo },
      pressAction: { id: 'default' }, // tapping it opens the app
    },
  };
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
  if (!disponible) return;
  const propios = (await notifee.getTriggerNotificationIds()).filter(esIdAviso);
  if (propios.length) await notifee.cancelTriggerNotifications(propios);
  const a = await leerAviso(db);
  if (!a.activo || !(await permitido()) || !(await prepararCanal(db))) return;
  const texto = await textoActual(db, a);
  if (!texto) return;
  const base = await armar(db, texto.titulo, texto.cuerpo);
  for (const date of proximasFechas(a.minutos, new Date())) {
    // inexact but doze-proof: needs no special alarm permission, and a reminder a minute late is fine
    await notifee.createTriggerNotification(
      { ...base, id: idAviso(date) },
      { type: TriggerType.TIMESTAMP, timestamp: date.getTime(), alarmManager: { type: AlarmType.SET_AND_ALLOW_WHILE_IDLE } },
    );
  }
}

// A test notification in a few seconds, so the user can see exactly how it will look.
export async function enviarPrueba(db: SQLiteDatabase) {
  if (!disponible || !(await prepararCanal(db))) return;
  const t = await traductor(db);
  const texto = (await textoActual(db, await leerAviso(db))) ?? { titulo: await nombreMascota(db), cuerpo: t('No hay nada pendiente por ahora.') };
  await notifee.createTriggerNotification(
    { ...(await armar(db, texto.titulo, texto.cuerpo)), id: 'prueba' },
    { type: TriggerType.TIMESTAMP, timestamp: Date.now() + 3000, alarmManager: { type: AlarmType.SET_AND_ALLOW_WHILE_IDLE } },
  );
}

// An immediate system notification (used to say a background backup was made). Silent if permission isn't granted.
export async function notificarAhora(titulo: string, cuerpo: string) {
  if (!disponible || !(await permitido())) return;
  const channelId = await notifee.createChannel({ id: 'general', name: 'Vento', importance: AndroidImportance.DEFAULT });
  await notifee.displayNotification({ title: titulo, body: cuerpo, android: { channelId, smallIcon: 'notification_icon', color: '#16A34A', pressAction: { id: 'default' } } });
}
