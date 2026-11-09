import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { ReactNode, useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { hora12 } from '@/aviso-calc';
import { Aviso, enviarPrueba, guardarAviso, leerAviso, pedirPermiso, reprogramar, textoActual } from '@/avisos';
import { notify } from '@/feedback';
import { BellIcon, MinusIcon, PlusIcon } from '@/icons';
import { space } from '@/theme';
import { Mascota } from '@/Mascota';
import { useColors, useT, useTema } from '@/tema';
import { animar, Appear, Body, Button, Card, Chip, Header, Label, Row, RoundBtn, Screen, Small, Sub, Toggle } from '@/ui';

const VACIO: Aviso = { activo: false, minutos: 18 * 60, deben: true, entregas: true };

function Opcion({ titulo, detalle, value, onChange }: { titulo: string; detalle: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <Row>
      <View style={{ flex: 1 }}><Label>{titulo}</Label><Small>{detalle}</Small></View>
      <Toggle value={value} onChange={onChange} label={titulo} />
    </Row>
  );
}

// Mimics how the notification looks in the shade.
function Vista({ titulo, cuerpo }: { titulo: string; cuerpo: string }) {
  const { mascota, colors, t } = useTema();
  return (
    <View style={{ backgroundColor: colors.bg, borderRadius: 16, padding: space.md, flexDirection: 'row', gap: space.sm }}>
      <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <Mascota id={mascota} size={32} animada={false} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Small>{t('Vento · ahora')}</Small>
        <Label>{titulo}</Label>
        <Small color={colors.ink}>{cuerpo}</Small>
      </View>
    </View>
  );
}

export default function Recordatorios() {
  const t = useT();
  const colors = useColors();
  const db = useSQLiteContext();
  const router = useRouter();
  const [a, setA] = useState<Aviso>(VACIO);
  const [texto, setTexto] = useState<{ titulo: string; cuerpo: string } | null>(null);

  useEffect(() => { leerAviso(db).then(setA); }, [db]);
  useEffect(() => { textoActual(db, a).then(setTexto); }, [db, a]); // the preview follows the options and the real data

  const cambiar = async (n: Aviso) => {
    animar(); setA(n);
    await guardarAviso(db, n);
    try { await reprogramar(db); } catch { notify(t('No se pudieron programar los avisos'), 'aviso'); }
  };
  const activar = async (v: boolean) => {
    let permiso = !v;
    try { permiso = !v || (await pedirPermiso(db)); } catch { /* treated as denied below */ }
    if (!permiso) return notify(t('Activa las notificaciones de Vento en los ajustes del teléfono'), 'aviso');
    await cambiar({ ...a, activo: v });
    notify(v ? t('Te avisaré a las {hora}', { hora: hora12(a.minutos, t) }) : t('Apagué el recordatorio'), v ? 'ok' : 'aviso');
  };
  const opcion = (k: 'deben' | 'entregas') => (v: boolean) => {
    if (!v && !a[k === 'deben' ? 'entregas' : 'deben']) return notify(t('Deja al menos una opción encendida'), 'aviso');
    cambiar({ ...a, [k]: v });
  };
  const hora = (m: number) => cambiar({ ...a, minutos: (m + 1440) % 1440 });
  const probar = async () => {
    try {
      if (!(await pedirPermiso(db))) return notify(t('Activa las notificaciones de Vento en los ajustes del teléfono'), 'aviso');
      await enviarPrueba(db);
      notify(t('Te aviso en unos segundos. Puedes salir de la app.'));
    } catch { notify(t('No se pudo enviar la prueba'), 'aviso'); }
  };

  const ejemplo: ReactNode = texto
    ? <Vista titulo={texto.titulo} cuerpo={texto.cuerpo} />
    : <Body color={colors.muted}>{t('Ahora mismo no hay nada pendiente, así que no llegaría ningún aviso.')}</Body>;

  return (
    <Screen bottom>
      <Header title={t('Recordatorios')} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={{ padding: space.lg, paddingTop: space.sm, gap: space.md, paddingBottom: 48 }}>
        <Card>
          <Row>
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center' }}>
              <BellIcon size={24} color={colors.primary} weight="duotone" />
            </View>
            <View style={{ flex: 1 }}>
              <Sub>{t('Recordatorio diario')}</Sub>
              <Small>{t('Una notificación para que entres a la app y veas quién te debe. Los nombres y las deudas se ven al desbloquear el teléfono.')}</Small>
            </View>
            <Toggle value={a.activo} onChange={activar} label={t('Recordatorio diario')} />
          </Row>
        </Card>

        {a.activo && (
          <>
            <Appear>
              <Card>
                <Label color={colors.muted}>{t('¿A qué hora?')}</Label>
                <Row>
                  <RoundBtn soft label={t('Media hora antes')} onPress={() => hora(a.minutos - 30)}><MinusIcon size={20} color={colors.primary} weight="bold" /></RoundBtn>
                  <View style={{ flex: 1, alignItems: 'center' }}><Sub>{hora12(a.minutos, t)}</Sub></View>
                  <RoundBtn soft label={t('Media hora después')} onPress={() => hora(a.minutos + 30)}><PlusIcon size={20} color={colors.primary} weight="bold" /></RoundBtn>
                </Row>
                <Row style={{ flexWrap: 'wrap', justifyContent: 'center' }}>
                  {[8 * 60, 12 * 60, 18 * 60, 20 * 60].map((m) => <Chip key={m} label={hora12(m, t)} on={a.minutos === m} onPress={() => hora(m)} />)}
                </Row>
              </Card>
            </Appear>
            <Appear delay={60}>
              <Card>
                <Label color={colors.muted}>{t('¿Qué te muestro?')}</Label>
                <Opcion titulo={t('Quién te debe')} detalle={t('Los clientes con saldo y cuánto')} value={a.deben} onChange={opcion('deben')} />
                <Opcion titulo={t('Pedidos por entregar')} detalle={t('Cuántos faltan')} value={a.entregas} onChange={opcion('entregas')} />
              </Card>
            </Appear>
          </>
        )}

        <Appear delay={120}>
          <Card>
            <Label color={colors.muted}>{t('Así se vería hoy')}</Label>
            {ejemplo}
            <Button kind="soft" label={t('Enviarme una prueba')} onPress={probar} />
          </Card>
        </Appear>
      </ScrollView>
    </Screen>
  );
}
