import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { CheckIcon } from '@/icons';
import { Mascota } from '@/Mascota';
import { DIVISAS } from '@/divisas';
import { Logo } from '@/Logo';
import { MASCOTAS } from '@/mascotas';
import { ACENTOS, Preferencia } from '@/paleta';
import { space } from '@/theme';
import type { PreferenciaIdioma } from '@/idioma';
import { useTema } from '@/tema';
import { Appear, Card, Header, Label, Option, Row, Screen, Segment, Small, Sub, Tap } from '@/ui';

// Looks: light/dark mode, accent colour and mascot. Every change applies at once and is saved.
export default function Apariencia() {
  const router = useRouter();
  const { modo, acento, mascota, idioma, divisa, colors, t, elegir } = useTema();
  const [saludo, setSaludo] = useState(0); // makes the big mascot hop when a new one is picked

  return (
    <Screen bottom>
      <Header title={t('Apariencia e idioma')} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={{ padding: space.lg, paddingTop: space.sm, gap: space.md, paddingBottom: 48 }}>
        <Appear>
          <Card style={{ alignItems: 'center', backgroundColor: colors.soft }}>
            <Mascota id={mascota} size={132} saludo={saludo} />
            <Small color={colors.onSoft}>{t('Toca a tu mascota')}</Small>
          </Card>
        </Appear>

        <Appear delay={30}>
          <Card>
            <Sub>{t('Idioma')}</Sub>
            <Segment<PreferenciaIdioma>
              value={idioma} onChange={(k) => elegir('idioma', k)}
              options={[{ k: 'auto', label: t('Automático') }, { k: 'es', label: 'Español' }, { k: 'en', label: 'English' }]}
            />
            <Small>{t('Automático sigue el idioma del teléfono.')}</Small>
          </Card>
        </Appear>

        <Appear delay={45}>
          <Card>
            <Sub>{t('Divisa')}</Sub>
            <Row style={{ alignItems: 'center', gap: space.md, flexWrap: 'nowrap' }}>
              <Logo size={72} />
              <View style={{ flex: 1 }}>
                <Segment<string> value={divisa} onChange={(k) => elegir('divisa', k)} options={DIVISAS.map((d) => ({ k: d.id, label: d.simbolo }))} />
              </View>
            </Row>
            <Small>{t('Solo cambia el símbolo del logo: los montos no se convierten.')}</Small>
          </Card>
        </Appear>

        <Appear delay={60}>
          <Card>
            <Sub>{t('Modo')}</Sub>
            <Segment<Preferencia>
              value={modo} onChange={(k) => elegir('modo', k)}
              options={[{ k: 'claro', label: t('Claro') }, { k: 'oscuro', label: t('Oscuro') }, { k: 'auto', label: t('Automático') }]}
            />
            <Small>{t('Automático sigue el modo del teléfono.')}</Small>
          </Card>
        </Appear>

        <Appear delay={120}>
          <Card>
            <Sub>{t('Color')}</Sub>
            {[ACENTOS.slice(0, 3), ACENTOS.slice(3)].map((fila, i) => (
              <Row key={i} style={{ justifyContent: 'space-between' }}>
                {fila.map((a) => {
                  const activo = a.id === acento;
                  return (
                    <Tap key={a.id} onPress={() => elegir('acento', a.id)} label={t('Color {nombre}', { nombre: t(a.nombre) })} style={{ alignItems: 'center', gap: 6, flex: 1 }}>
                      <View style={{ width: 60, height: 60, borderRadius: 30, borderWidth: 3, borderColor: activo ? colors.ink : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                        <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: a.hex, alignItems: 'center', justifyContent: 'center' }}>
                          {activo && <CheckIcon size={24} color="#FFFFFF" weight="bold" />}
                        </View>
                      </View>
                      <Label>{t(a.nombre)}</Label>
                    </Tap>
                  );
                })}
              </Row>
            ))}
          </Card>
        </Appear>

        <Appear delay={180}>
          <Card>
            <Sub>{t('Mascota')}</Sub>
            <Row style={{ flexWrap: 'wrap', justifyContent: 'space-between', rowGap: space.sm }}>
              {MASCOTAS.map((m) => (
                <View key={m.id} style={{ width: '48%' }}>
                  <Option label={t('Mascota {nombre}', { nombre: t(m.nombre) })} selected={m.id === mascota} onPress={() => { elegir('mascota', m.id); setSaludo((n) => n + 1); }}>
                    <View style={{ alignItems: 'center', gap: 4 }}>
                      <Mascota id={m.id} size={72} animada={false} />
                      <Label>{t(m.nombre)}</Label>
                    </View>
                  </Option>
                </View>
              ))}
            </Row>
          </Card>
        </Appear>
      </ScrollView>
    </Screen>
  );
}
