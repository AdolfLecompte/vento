import { useFocusEffect, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { gananciaPorProducto, hoy, listDeudores, listPedidos, PedidoRow } from '@/db';
import { PedidoCard } from '@/PedidoCard';
import { space } from '@/theme';
import { Burbuja, Mascota } from '@/Mascota';
import type { T } from '@/idioma';
import { mensajesInicio, saludoHora } from '@/voz';
import { useColors, useT, useTema } from '@/tema';
import { animar, Appear, Bar, Body, Button, Card, Chip, Label, money, Money, Row, Screen, Small, Sub, Tap, Wordmark } from '@/ui';

const saludo = (t: T) => saludoHora(new Date().getHours(), t);

function Seccion({ titulo, onVer }: { titulo: string; onVer?: () => void }) {
  const colors = useColors();
  const t = useT();
  return (
    <Row style={{ marginTop: space.sm }}>
      <View style={{ flex: 1 }}><Sub>{titulo}</Sub></View>
      {onVer && <Tap onPress={onVer} label={t('Ver {titulo}', { titulo })}><Label color={colors.primary}>{t('Ver todo')}</Label></Tap>}
    </Row>
  );
}

export default function Inicio() {
  const colors = useColors();
  const t = useT();
  const { mascota } = useTema();
  const db = useSQLiteContext();
  const router = useRouter();
  const [rows, setRows] = useState<PedidoRow[]>([]);
  const [prods, setProds] = useState<{ nombre: string; unidades: number; ganancia: number }[]>([]);
  const [mes, setMes] = useState(true);
  const [deudores, setDeudores] = useState<{ nombre: string; debe: number }[]>([]);
  const [idx, setIdx] = useState(0); // which of the mascot's messages is showing
  const desde = mes ? hoy().slice(0, 8) + '01' : '';

  useFocusEffect(useCallback(() => {
    listPedidos(db).then(setRows);
    gananciaPorProducto(db, desde).then(setProds);
    listDeudores(db).then(setDeudores);
  }, [db, desde]));

  const rango = rows.filter((r) => r.fecha >= desde);
  const sum = (f: (r: PedidoRow) => number) => rango.reduce((a, r) => a + f(r), 0);
  const vendido = sum((r) => r.total);
  const cobrado = sum((r) => r.pagado);
  const ganancia = vendido - sum((r) => r.costo);
  const porCobrar = rows.filter((r) => r.pagado < r.total).sort((a, b) => (b.total - b.pagado) - (a.total - a.pagado));
  const porEntregar = rows.filter((r) => !r.entregado);
  const max = Math.max(1, ...prods.map((p) => p.ganancia));
  const mesDesde = hoy().slice(0, 8) + '01';
  const mensajes = mensajesInicio({
    pedidos: rows.length, deudores, porEntregar: porEntregar.length,
    gananciaMes: rows.filter((r) => r.fecha >= mesDesde).reduce((a, r) => a + r.total - r.costo, 0),
    estrella: prods[0]?.nombre ?? null,
  }, money, t);
  const ir = (filtro: string) => router.navigate({ pathname: '/pedidos', params: { filtro } });

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.md, paddingBottom: 48 }}>
        <Appear>
          <View style={{ gap: space.sm }}>
            <Wordmark size={20} />
            <Row style={{ alignItems: 'flex-end', gap: space.md, flexWrap: 'nowrap' }}>
              <Mascota id={mascota} size={76} onPress={() => setIdx((i) => i + 1)} />
              <Burbuja>
                <Label color={colors.primary}>{saludo(t)}</Label>
                <Appear key={idx % mensajes.length}><Body>{mensajes[idx % mensajes.length]}</Body></Appear>
                {mensajes.length > 1 && <Small>{t('Tócame para saber más.')}</Small>}
              </Burbuja>
            </Row>
          </View>
        </Appear>
        <Row>
          <Chip block label={t('Este mes')} on={mes} onPress={() => { animar(); setMes(true); }} />
          <Chip block label={t('Todo')} on={!mes} onPress={() => { animar(); setMes(false); }} />
        </Row>
        <Appear delay={60}>
          <View style={{ backgroundColor: colors.primary, borderRadius: 28, padding: space.lg, gap: space.xs }}>
            <Label color={colors.onPrimarySuave}>{t('Ganancia')}</Label>
            <Money kind="hero" value={ganancia} color={colors.onPrimary} />
            <Small color={colors.onPrimarySuave}>{rango.length === 1 ? t('En 1 pedido') : t('En {n} pedidos', { n: rango.length })}</Small>
          </View>
        </Appear>

        <Appear delay={120}>
          <Card>
            <Row>
              <View style={{ flex: 1 }}><Label color={colors.muted}>{t('Cobrado')}</Label></View>
              {vendido > 0 && <Label color={colors.primary}>{Math.round((cobrado / vendido) * 100)} %</Label>}
            </Row>
            <Money kind="title" value={cobrado} />
            <Bar value={vendido > 0 ? cobrado / vendido : 0} />
            <Small>
              {vendido === 0 ? t('Todavía no hay ventas en este periodo')
                : cobrado >= vendido ? t('Ya cobraste todo lo vendido ({vendido})', { vendido: money(vendido) })
                : t('Te faltan {falta} para llegar a los {vendido} vendidos', { falta: money(vendido - cobrado), vendido: money(vendido) })}
            </Small>
          </Card>
        </Appear>

        {rows.length === 0 && (
          <Appear delay={180}>
            <View style={{ gap: space.sm }}>
              <Button label={t('Crear primer pedido')} onPress={() => router.push('/pedido/nuevo')} />
            </View>
          </Appear>
        )}

        {porCobrar.length > 0 && (
          <>
            <Seccion titulo={t('Por cobrar ({n})', { n: porCobrar.length })} onVer={() => ir('cobrar')} />
            {porCobrar.slice(0, 3).map((r, i) => <PedidoCard key={r.id} r={r} index={i} />)}
          </>
        )}
        {porEntregar.length > 0 && (
          <>
            <Seccion titulo={t('Por entregar ({n})', { n: porEntregar.length })} onVer={() => ir('entregar')} />
            {porEntregar.slice(0, 3).map((r, i) => <PedidoCard key={r.id} r={r} index={i} />)}
          </>
        )}
        {prods.length > 0 && (
          <>
            <Seccion titulo={t('Lo que más te deja')} />
            <View style={{ backgroundColor: colors.surface, borderRadius: 24, padding: space.md, gap: space.md }}>
              {prods.slice(0, 3).map((p) => (
                <View key={p.nombre} style={{ gap: 4 }}>
                  <Row>
                    <View style={{ flex: 1 }}><Label lines={1}>{p.nombre}</Label></View>
                    <Small>×{p.unidades}</Small>
                    <Label>{money(p.ganancia)}</Label>
                  </Row>
                  <Bar value={p.ganancia / max} track={colors.bg} />
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}
