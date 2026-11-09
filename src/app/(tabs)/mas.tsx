import Constants from 'expo-constants';
import { useSQLiteContext } from 'expo-sqlite';
import { useFocusEffect, useRouter } from 'expo-router';
import { ReactNode, useCallback, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { hora12 } from '@/aviso-calc';
import { cuando } from '@/respaldo';
import { versionDisponible } from '@/actualizaciones';
import { Config, leerConfig } from '@/backup';
import { Aviso, leerAviso } from '@/avisos';
import { BellIcon, CaretRightIcon, PaletteIcon, FloppyDiskIcon, InfoIcon, WalletIcon } from '@/icons';
import { space } from '@/theme';
import { MASCOTAS } from '@/mascotas';
import { ACENTOS } from '@/paleta';
import { useColors, useT, useTema } from '@/tema';
import { Appear, Label, Screen, Small, Sub, Tap, Wordmark } from '@/ui';

// Mihon-style "More": centered logo, then flat rows (icon, title, subtitle) grouped under accent headings.
function Fila({ icon, titulo, detalle, onPress, right }: { icon: ReactNode; titulo: string; detalle: string; onPress?: () => void; right?: ReactNode }) {
  return (
    <Tap onPress={onPress} disabled={!onPress} label={titulo} style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: 14, paddingHorizontal: space.lg }}>
      <View style={{ width: 28, alignItems: 'center' }}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Sub>{titulo}</Sub>
        <Small>{detalle}</Small>
      </View>
      {right}
    </Tap>
  );
}

function Seccion({ children }: { children: string }) {
  const colors = useColors();
  return (
    <View style={{ paddingHorizontal: space.lg, paddingTop: space.md, paddingBottom: space.xs }}>
      <Label color={colors.primary}>{children}</Label>
    </View>
  );
}

export default function Mas() {
  const colors = useColors();
  const db = useSQLiteContext();
  const router = useRouter();
  const t = useT();
  const { modo, acento, mascota, idioma } = useTema();
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const [cfg, setCfg] = useState<Config | null>(null);
  const [ahora, setAhora] = useState(0); // read when loading, not while rendering
  const [nueva, setNueva] = useState('');
  useFocusEffect(useCallback(() => { leerAviso(db).then(setAviso); leerConfig(db).then((c) => { setCfg(c); setAhora(Date.now()); }); versionDisponible(db).then(setNueva); }, [db]));
  const copiaDetalle = cfg?.ultima
    ? (cfg.auto ? t('Última: {cuando} · automática', { cuando: cuando(cfg.ultima, ahora, t) }) : t('Última: {cuando}', { cuando: cuando(cfg.ultima, ahora, t) }))
    : cfg?.auto ? t('Automática · aún sin copias') : t('Aún sin copias · guarda tus datos');
  const ic = (I: typeof InfoIcon) => <I size={26} color={colors.ink} weight="duotone" />;
  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 48 }}>
        <Appear style={{ alignItems: 'center', gap: space.sm, paddingVertical: space.xl }}>
          <View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
            <WalletIcon size={44} color={colors.onPrimary} weight="fill" />
          </View>
          <Wordmark size={30} />
          <Small>{t('Tu libreta de ventas')}</Small>
        </Appear>
        <View style={{ height: 1, backgroundColor: colors.line }} />

        <Appear delay={80}>
          <Seccion>{t('Personalizar')}</Seccion>
          <Fila
            icon={ic(PaletteIcon)} titulo={t('Apariencia e idioma')}
            detalle={`${modo === 'auto' ? t('Automático') : modo === 'oscuro' ? t('Oscuro') : t('Claro')} · ${t(ACENTOS.find((a) => a.id === acento)?.nombre ?? '')} · ${t(MASCOTAS.find((m) => m.id === mascota)?.nombre ?? '')} · ${idioma === 'auto' ? t('Automático') : idioma === 'es' ? 'Español' : 'English'}`}
            onPress={() => router.push('/apariencia')}
            right={<CaretRightIcon size={18} color={colors.muted} />}
          />
          <View style={{ height: 1, backgroundColor: colors.line, marginTop: space.sm }} />
          <Seccion>{t('Avisos')}</Seccion>
          <Fila
            icon={ic(BellIcon)} titulo={t('Recordatorios')}
            detalle={aviso?.activo ? t('Activado · cada día a las {hora}', { hora: hora12(aviso.minutos, t) }) : t('Apagado · avisa quién te debe y qué falta entregar')}
            onPress={() => router.push('/recordatorios')}
            right={<CaretRightIcon size={18} color={colors.muted} />}
          />
          <View style={{ height: 1, backgroundColor: colors.line, marginTop: space.sm }} />
          <Seccion>{t('Tus datos')}</Seccion>
          <Fila
            icon={ic(FloppyDiskIcon)} titulo={t('Copias de seguridad')} detalle={copiaDetalle}
            onPress={() => router.push('/respaldos')}
            right={<CaretRightIcon size={18} color={colors.muted} />}
          />
          <View style={{ height: 1, backgroundColor: colors.line, marginTop: space.sm }} />
          <Seccion>{t('Acerca de')}</Seccion>
          <Fila
            icon={ic(InfoIcon)} titulo={t('Versión')} detalle={nueva ? t('{version} · hay una versión nueva ({nueva})', { version: Constants.expoConfig?.version ?? '1.0.0', nueva }) : t('{version} · toca para ver las novedades', { version: Constants.expoConfig?.version ?? '1.0.0' })}
            onPress={() => router.push('/novedades')}
            right={<CaretRightIcon size={18} color={colors.muted} />}
          />
        </Appear>
      </ScrollView>
    </Screen>
  );
}
