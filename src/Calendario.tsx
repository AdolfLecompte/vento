import { useState } from 'react';
import { View } from 'react-native';
import { hoy } from '@/db';
import { corta, diasDelMes, mesMas, primerDiaSemana, sumarDias } from '@/fecha';
import { CaretLeftIcon, CaretRightIcon } from '@/icons';
import { MESES } from '@/respaldo';
import { space } from '@/theme';
import { useColors, useT } from '@/tema';
import { animar, Chip, Label, Row, RoundBtn, Small, Tap } from '@/ui';

const dos = (n: number) => String(n).padStart(2, '0');

// A month grid we draw ourselves (nothing native on screen). Days after `max` can't be picked.
function Calendario({ valor, max, onPick }: { valor: string; max: string; onPick: (f: string) => void }) {
  const colors = useColors();
  const t = useT();
  const [ym, setYm] = useState(() => ({ y: +valor.slice(0, 4), m: +valor.slice(5, 7) }));
  const hayMas = `${ym.y}-${dos(ym.m)}` < max.slice(0, 7);
  const huecos = primerDiaSemana(ym.y, ym.m);
  const celdas: (number | null)[] = [...Array(huecos).fill(null), ...Array.from({ length: diasDelMes(ym.y, ym.m) }, (_, i) => i + 1)];
  while (celdas.length % 7) celdas.push(null);
  const filas = Array.from({ length: celdas.length / 7 }, (_, i) => celdas.slice(i * 7, i * 7 + 7));

  return (
    <View style={{ gap: space.sm }}>
      <Row>
        <RoundBtn soft label={t('Mes anterior')} onPress={() => setYm(mesMas(ym.y, ym.m, -1))}><CaretLeftIcon size={20} color={colors.primary} weight="bold" /></RoundBtn>
        <View style={{ flex: 1, alignItems: 'center' }}><Label>{t(MESES[ym.m - 1])} {ym.y}</Label></View>
        {hayMas
          ? <RoundBtn soft label={t('Mes siguiente')} onPress={() => setYm(mesMas(ym.y, ym.m, 1))}><CaretRightIcon size={20} color={colors.primary} weight="bold" /></RoundBtn>
          : <View style={{ width: 44 }} />}
      </Row>
      <Row style={{ gap: 0 }}>
        {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d, i) => <View key={i} style={{ flex: 1, alignItems: 'center' }}><Small>{t(d)}</Small></View>)}
      </Row>
      {filas.map((fila, r) => (
        <Row key={r} style={{ gap: 0 }}>
          {fila.map((dia, c) => {
            if (dia === null) return <View key={c} style={{ flex: 1 }} />;
            const iso = `${ym.y}-${dos(ym.m)}-${dos(dia)}`;
            const futuro = iso > max, elegido = iso === valor;
            return (
              <Tap key={c} disabled={futuro} onPress={() => onPick(iso)} label={corta(iso, t)} style={{ flex: 1, alignItems: 'center', paddingVertical: 2 }}>
                <View style={{ width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: elegido ? colors.primary : 'transparent' }}>
                  <Label color={elegido ? colors.onPrimary : futuro ? colors.line : colors.ink}>{dia}</Label>
                </View>
              </Tap>
            );
          })}
        </Row>
      ))}
    </View>
  );
}

// Today / yesterday in one tap, or any earlier day from the calendar.
export function FechaCampo({ valor, onChange }: { valor: string; onChange: (f: string) => void }) {
  const t = useT();
  const [abierto, setAbierto] = useState(false);
  const hoyS = hoy();
  const esHoy = valor === hoyS, esAyer = valor === sumarDias(hoyS, -1);
  const elegir = (f: string) => { animar(); setAbierto(false); onChange(f); };
  return (
    <View style={{ gap: space.sm }}>
      <Row style={{ flexWrap: 'wrap' }}>
        <Chip label={t('Hoy')} on={esHoy && !abierto} onPress={() => elegir(hoyS)} />
        <Chip label={t('Ayer')} on={esAyer && !abierto} onPress={() => elegir(sumarDias(hoyS, -1))} />
        <Chip label={esHoy || esAyer ? t('Otra fecha') : corta(valor, t)} on={abierto || !(esHoy || esAyer)} onPress={() => { animar(); setAbierto(!abierto); }} />
      </Row>
      {abierto && <Calendario valor={valor} max={hoyS} onPick={elegir} />}
    </View>
  );
}
