import { useFocusEffect, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { File } from 'expo-file-system';
import { useCallback, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { hora12 } from '@/aviso-calc';
import { reprogramar } from '@/avisos';
import {
  Config, copiaAutomatica, elegirCarpeta, elegirRespaldo, enviarCopia, exportarCsv, guardarConfig, guardarCopia,
  hayCarpeta, leerArchivo, leerConfig, listarCopias,
} from '@/backup';
import { confirm, notify } from '@/feedback';
import { ArrowCounterClockwiseIcon, FileCsvIcon, FloppyDiskIcon, FolderSimpleIcon, ShareNetworkIcon } from '@/icons';
import type { T } from '@/idioma';
import { aplicarTablas, cuando, Frecuencia, MESES, Respaldo } from '@/respaldo';
import { space } from '@/theme';
import { useColors, useT, useTema } from '@/tema';
import { animar, Appear, Body, Button, Card, Header, Label, Row, Screen, Segment, Small, Sub, Tap, Toggle } from '@/ui';

// vento-2026-11-08.json -> "8 nov 2026"
const fechaDe = (nombre: string, t: T) => {
  const [y, m, d] = nombre.replace('vento-', '').replace('.json', '').split('-').map(Number);
  return `${d} ${t(MESES[m - 1])} ${y}`;
};

function Accion({ icon, titulo, detalle, onPress }: { icon: React.ReactNode; titulo: string; detalle: string; onPress: () => void }) {
  return (
    <Tap onPress={onPress} label={titulo} style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.sm }}>
      <View style={{ width: 28, alignItems: 'center' }}>{icon}</View>
      <View style={{ flex: 1 }}><Label>{titulo}</Label><Small>{detalle}</Small></View>
    </Tap>
  );
}

export default function Respaldos() {
  const colors = useColors();
  const db = useSQLiteContext();
  const router = useRouter();
  const t = useT();
  const [cfg, setCfg] = useState<Config | null>(null);
  const [copias, setCopias] = useState<File[]>([]);
  const [hayDir, setHayDir] = useState(false);
  const [busy, setBusy] = useState(false);
  const [ahora, setAhora] = useState(0); // read when loading, not while rendering

  const cargar = useCallback(async () => {
    const [c, l, h] = await Promise.all([leerConfig(db), listarCopias(db), hayCarpeta(db)]);
    setCfg(c); setCopias(l); setHayDir(h); setAhora(Date.now());
  }, [db]);
  useFocusEffect(useCallback(() => { cargar(); }, [cargar]));

  // One guard for every action: no double taps, friendly errors, and the screen refreshes afterwards.
  const hacer = (fn: () => Promise<void>) => async () => {
    if (busy) return;
    setBusy(true);
    try { await fn(); } catch (e) { notify(e instanceof Error ? t(e.message) : t('Algo salió mal'), 'aviso'); }
    setBusy(false);
    await cargar();
  };

  const asegurarCarpeta = async () => hayDir || elegirCarpeta(db);

  const cambiarCarpeta = hacer(async () => { if (await elegirCarpeta(db)) notify(t('Listo, guardaré tus copias en la carpeta vento')); });

  const copiarAhora = hacer(async () => {
    if (!(await asegurarCarpeta())) return;
    notify(t('Estoy haciendo tu copia de seguridad…'), 'aviso');
    await guardarCopia(db);
    notify(t('Listo, guardé tu copia en la carpeta vento'));
  });

  const auto = (v: boolean) => hacer(async () => {
    if (v && !(await asegurarCarpeta())) return;
    animar();
    await guardarConfig(db, { auto: v });
    if (!v) return notify(t('Apagué la copia automática'), 'aviso');
    notify(t('Listo, haré tu copia automática'));
    if ((await copiaAutomatica(db, () => notify(t('Estoy haciendo tu copia de seguridad…'), 'aviso'))) === 'hecha') notify(t('Listo, guardé tu copia en la carpeta vento'));
  })();

  const frecuencia = (f: Frecuencia) => hacer(async () => { await guardarConfig(db, { frecuencia: f }); })();

  const { elegir } = useTema();
  const restaurar = async (tablas: Respaldo | null) => {
    if (!tablas) return;
    const ok = await confirm(
      t('¿Restaurar esta copia?'), 'Restaurar',
      t('Trae {pedidos} pedidos, {clientes} clientes y {productos} productos. Reemplaza todo lo que tienes ahora.', { pedidos: tablas.pedidos.length, clientes: tablas.clientes.length, productos: tablas.productos.length }),
    );
    if (!ok) return;
    await aplicarTablas(db, tablas);
    // the look comes back too (old copies have none, and then nothing changes)
    (Object.keys(tablas.estilo) as (keyof typeof tablas.estilo)[]).forEach((k) => elegir(k, tablas.estilo[k] as never));
    reprogramar(db).catch(() => {}); // the reminder text depends on the data
    notify(t('Listo, restauré tu copia'));
  };

  if (!cfg) return null;
  const ultima = cfg.ultima ? `${cuando(cfg.ultima, ahora, t)}, ${hora12(new Date(cfg.ultima).getHours() * 60 + new Date(cfg.ultima).getMinutes(), t)}` : t('todavía no has hecho ninguna');

  return (
    <Screen bottom>
      <Header title={t('Copias de seguridad')} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={{ padding: space.lg, paddingTop: space.sm, gap: space.md, paddingBottom: 48 }}>
        <Appear>
          <Card>
            <Row>
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center' }}>
                <FolderSimpleIcon size={24} color={colors.primary} weight="duotone" />
              </View>
              <View style={{ flex: 1 }}>
                <Sub>{t('Carpeta «vento»')}</Sub>
                <Small>{hayDir ? t('Aquí se guardan tus copias.') : cfg.carpeta ? t('No se puede abrir la carpeta. Elígela de nuevo.') : t('Elige dónde quieres que quede, por ejemplo en Documentos.')}</Small>
              </View>
            </Row>
            <Button kind="soft" label={hayDir ? t('Cambiar de lugar') : t('Elegir dónde guardar')} onPress={cambiarCarpeta} />
          </Card>
        </Appear>

        <Appear delay={60}>
          <Button label={busy ? t('Trabajando…') : t('Hacer una copia ahora')} icon={<FloppyDiskIcon size={22} color={colors.onPrimary} weight="bold" />} onPress={copiarAhora} />
        </Appear>

        <Appear delay={120}>
          <Card>
            <Row>
              <View style={{ flex: 1 }}>
                <Sub>{t('Copia automática')}</Sub>
                <Small>{t('Última copia: {ultima}', { ultima })}</Small>
              </View>
              <Toggle value={cfg.auto} onChange={auto} label={t('Copia automática')} />
            </Row>
            {cfg.auto && (
              <>
                <Segment<Frecuencia> value={cfg.frecuencia} onChange={frecuencia} options={[{ k: 'dia', label: t('Cada día') }, { k: 'semana', label: t('Cada semana') }, { k: 'mes', label: t('Cada mes') }]} />
                <Small>{t('Se hace sola al abrir la app o al salir de ella cuando toca, y te avisa. Guardo las últimas 10.')}</Small>
              </>
            )}
          </Card>
        </Appear>

        <Appear delay={180}>
          <Card>
            <Sub>{t('Copias guardadas')}</Sub>
            {copias.length === 0 && <Small>{t('Todavía no hay copias en la carpeta.')}</Small>}
            {copias.slice(0, 5).map((f) => (
              <Row key={f.name}>
                <View style={{ flex: 1 }}><Label>{fechaDe(f.name, t)}</Label></View>
                <Tap label={t('Restaurar la copia del {fecha}', { fecha: fechaDe(f.name, t) })} onPress={hacer(async () => restaurar(await leerArchivo(f)))}>
                  <Label color={colors.primary}>{t('Restaurar')}</Label>
                </Tap>
              </Row>
            ))}
            {copias.length > 5 && <Small>y {copias.length - 5} más en la carpeta</Small>}
          </Card>
        </Appear>

        <Appear delay={240}>
          <Card>
            <Sub>{t('Otras opciones')}</Sub>
            <Accion icon={<ArrowCounterClockwiseIcon size={26} color={colors.ink} weight="duotone" />} titulo={t('Restaurar desde otro archivo')} detalle={t('Elige una copia que tengas en el teléfono')} onPress={hacer(async () => restaurar(await elegirRespaldo()))} />
            <Accion icon={<ShareNetworkIcon size={26} color={colors.ink} weight="duotone" />} titulo={t('Enviar una copia')} detalle={t('A Drive, WhatsApp o tu correo')} onPress={hacer(() => enviarCopia(db))} />
            <Accion icon={<FileCsvIcon size={26} color={colors.ink} weight="duotone" />} titulo={t('Exportar ventas')} detalle={t('Para abrir en Excel o Google Sheets')} onPress={hacer(() => exportarCsv(db))} />
          </Card>
        </Appear>
        <Body color={colors.muted}> </Body>
      </ScrollView>
    </Screen>
  );
}
