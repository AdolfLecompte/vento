import Constants from 'expo-constants';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { abrirDescarga, avisarActualizaciones, buscarActualizacion, cancelarDescarga, descargarEInstalar, guardarAvisar, REPO, versionActual } from '@/actualizaciones';
import { getAjuste, setAjuste } from '@/db';
import type { Release } from '@/version';
import { confirm, notify } from '@/feedback';
import { CHANGELOG } from '@/changelog';
import { space } from '@/theme';
import { useColors, useTema } from '@/tema';
import { ArrowsClockwiseIcon } from '@/icons';
import { Appear, Bar, Button, Card, Header, Label, Pill, Row, Screen, Small, Sub, Toggle } from '@/ui';

export default function Novedades() {
  const colors = useColors();
  const { lang, t } = useTema();
  const router = useRouter();
  const db = useSQLiteContext();
  const actual = Constants.expoConfig?.version;
  const [avisar, setAvisar] = useState(true);
  const [buscando, setBuscando] = useState(false);
  const [progreso, setProgreso] = useState<number | null>(null); // null = not downloading
  const { actualizar } = useLocalSearchParams<{ actualizar?: string }>(); // set by the "new version" alert on Home
  useEffect(() => { avisarActualizaciones(db).then(setAvisar); }, [db]);

  // Download inside the app with a progress bar; if it fails, fall back to the browser like before.
  // The first time, say what Android is about to ask (permission to install apps from Vento) so the system dialog is no surprise.
  const instalar = async (release: Release) => {
    if ((await getAjuste(db, 'instalar_aviso', '0')) !== '1') {
      if (!(await confirm(t('Android te va a pedir permiso para instalar apps desde Vento'), 'Continuar', t('Es normal: se pide una sola vez y confirmas cada instalación. Si no te lo pide, actívalo en Ajustes → Apps → Vento → Instalar apps desconocidas.')))) return;
      await setAjuste(db, 'instalar_aviso', '1');
    }
    setProgreso(0);
    try { await descargarEInstalar(release, setProgreso); } catch {
      notify(t('No se pudo descargar aquí. Te abro el enlace en el navegador.'), 'aviso');
      abrirDescarga(release);
    }
    setProgreso(null);
  };

  const comprobar = async (directo = false) => {
    if (buscando || progreso !== null) return;
    setBuscando(true);
    const r = await buscarActualizacion(db, true);
    setBuscando(false);
    if (!r || r.estado === 'error') return notify(t('No pude comprobarlo. Revisa tu conexión.'), 'aviso');
    if (r.estado === 'sin-versiones') return notify(t('Todavía no hay versiones publicadas.'));
    if (r.estado === 'al-dia' || !r.release) return notify(t('Ya tienes la última versión ({version})', { version: versionActual() }));
    const { release } = r;
    if (directo || await confirm(t('Hay una versión nueva: Vento {version}', { version: release.version }), 'Descargar', release.notas.trim() || undefined, 'Más tarde')) instalar(release);
  };
  useEffect(() => { if (actualizar === '1') queueMicrotask(() => comprobar(true)); }, [actualizar]); // eslint-disable-line react-hooks/exhaustive-deps -- once, when opened from the alert
  return (
    <Screen bottom>
      <Header title={t('Novedades')} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={{ padding: space.lg, paddingTop: space.sm, gap: space.md, paddingBottom: 48 }}>
        {REPO && (
          <Appear>
            <Card>
              <Sub>{t('Actualizaciones')}</Sub>
              <Small>{t('Vento le pregunta a GitHub si hay una versión nueva. No envía ningún dato tuyo.')}</Small>
              <Row>
                <View style={{ flex: 1 }}><Label>{t('Avisarme cuando haya una versión nueva')}</Label></View>
                <Toggle value={avisar} onChange={(v) => { setAvisar(v); guardarAvisar(db, v); }} label={t('Avisarme cuando haya una versión nueva')} />
              </Row>
              {progreso === null
                ? <Button kind="soft" label={buscando ? t('Buscando…') : t('Buscar actualizaciones')} icon={<ArrowsClockwiseIcon size={22} color={colors.primary} weight="bold" />} onPress={() => comprobar()} />
                : (
                  <View style={{ gap: space.sm }}>
                    <Row><View style={{ flex: 1 }}><Label>{t('Descargando… {n} %', { n: Math.round(progreso * 100) })}</Label></View></Row>
                    <Bar value={progreso} />
                    <Button kind="soft" label={t('Cancelar')} onPress={cancelarDescarga} />
                  </View>
                )}
            </Card>
          </Appear>
        )}
        {CHANGELOG.map((e, i) => (
          <Appear key={e.version} delay={i * 60}>
            <Card>
              <Row>
                <View style={{ flex: 1 }}><Sub>{t('Versión {version}', { version: e.version })}</Sub></View>
                {e.version === actual && <Pill label={t('instalada')} bg={colors.soft} fg={colors.primaryPressed} />}
              </Row>
              <Small>{e[lang].titulo} · {e.fecha}</Small>
              <View style={{ gap: space.sm, marginTop: space.xs }}>
                {e[lang].cambios.map((c) => (
                  <Row key={c} style={{ alignItems: 'flex-start', flexWrap: 'nowrap' }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary, marginTop: 8 }} />
                    <View style={{ flex: 1 }}><Label>{c}</Label></View>
                  </Row>
                ))}
              </View>
            </Card>
          </Appear>
        ))}
      </ScrollView>
    </Screen>
  );
}
