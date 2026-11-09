import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { CHANGELOG } from '@/changelog';
import { space } from '@/theme';
import { useColors, useTema } from '@/tema';
import { Appear, Card, Header, Label, Pill, Row, Screen, Small, Sub } from '@/ui';

export default function Novedades() {
  const colors = useColors();
  const { lang, t } = useTema();
  const router = useRouter();
  const actual = Constants.expoConfig?.version;
  return (
    <Screen bottom>
      <Header title={t('Novedades')} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={{ padding: space.lg, paddingTop: space.sm, gap: space.md, paddingBottom: 48 }}>
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
