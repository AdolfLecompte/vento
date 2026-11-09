import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { abrirDescarga, avisarActualizaciones, buscarActualizacion, guardarAvisar, REPO, versionActual } from '@/actualizaciones';
import { confirm, notify } from '@/feedback';
import { CHANGELOG } from '@/changelog';
import { space } from '@/theme';
import { useColors, useTema } from '@/tema';
import { ArrowsClockwiseIcon } from '@/icons';
import { Appear, Button, Card, Header, Label, Pill, Row, Screen, Small, Sub, Toggle } from '@/ui';

export default function Novedades() {
  const colors = useColors();
  const { lang, t } = useTema();
  const router = useRouter();
  const db = useSQLiteContext();
  const actual = Constants.expoConfig?.version;
  const [avisar, setAvisar] = useState(true);
  const [buscando, setBuscando] = useState(false);
  useEffect(() => { avisarActualizaciones(db).then(setAvisar); }, [db]);

  const comprobar = async () => {
    if (buscando) return;
    setBuscando(true);
    const r = await buscarActualizacion(db, true);
    setBuscando(false);
    if (!r || r.estado === 'error') return notify(t('No pude comprobarlo. Revisa tu conexión.'), 'aviso');
    if (r.estado === 'sin-versiones') return notify(t('Todavía no hay versiones publicadas.'));
    if (r.estado === 'al-dia' || !r.release) return notify(t('Ya tienes la última versión ({version})', { version: versionActual() }));
    const { release } = r;
    if (await confirm(t('Hay una versión nueva: Vento {version}', { version: release.version }), 'Descargar', release.notas.trim() || undefined, 'Más tarde')) abrirDescarga(release);
  };
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
              <Button kind="soft" label={buscando ? t('Buscando…') : t('Buscar actualizaciones')} icon={<ArrowsClockwiseIcon size={22} color={colors.primary} weight="bold" />} onPress={comprobar} />
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
