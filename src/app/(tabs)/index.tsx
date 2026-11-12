import { useFocusEffect, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { hoy, listDeudores, listPedidos, PedidoRow, porPrepararPorProducto } from '@/db';
import { inicioSemana, sumarDias } from '@/fecha';
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
  const [prep, setPrep] = useState<{ nombre: string; unidades: number; costo: number; venta: number }[]>([]);
  const [semana, setSemana] = useState<'todo' | 'esta' | 'pasada'>('todo');
  const [mes, setMes] = useState(true);
  const [deudores, setDeudores] = useState<{ nombre: string; debe: number }[]>([]);
  const [idx, setIdx] = useState(0); // which of the mascot's messages is showing
  const desde = mes ? hoy().slice(0, 8) + '01' : '';
  const lunes = inicioSemana(hoy());
  const [prepDesde, prepHasta] = semana === 'esta' ? [lunes, sumarDias(lunes, 6)] : semana === 'pasada' ? [sumarDias(lunes, -7), sumarDias(lunes, -1)] : ['', '9999-12-31'];

  useFocusEffect(useCallback(() => {
    listPedidos(db).then(setRows);
    listDeudores(db).then(setDeudores);
    porPrepararPorProducto(db, prepDesde, prepHasta).then(setPrep);
  }, [db, prepDesde, prepHasta]));

  const rango = rows.filter((r) => r.fecha >= desde);
  const sum = (f: (r: PedidoRow) => number) => rango.reduce((a, r) => a + f(r), 0);
  const vendido = sum((r) => r.total);
  const cobrado = sum((r) => r.pagado);
  const ganancia = vendido - sum((r) => r.costo);
  const porCobrar = rows.filter((r) => r.pagado < r.total).sort((a, b) => (b.total - b.pagado) - (a.total - a.pagado));
  const porEntregar = rows.filter((r) => !r.entregado);
  const invertir = prep.reduce((a, p) => a + p.costo, 0);
  const cobrar = prep.reduce((a, p) => a + p.venta, 0);
  const mesDesde = hoy().slice(0, 8) + '01';
  const mensajes = mensajesInicio({
    pedidos: rows.length, deudores, porEntregar: porEntregar.length,
    gananciaMes: rows.filter((r) => r.fecha >= mesDesde).reduce((a, r) => a + r.total - r.costo, 0),
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
        {porEntregar.length > 0 && (
          <>
            <Seccion titulo={t('Por preparar')} />
            <Row style={{ gap: space.sm, flexWrap: 'nowrap' }}>
              <Chip block label={t('Todo')} on={semana === 'todo'} onPress={() => { animar(); setSemana('todo'); }} />
              <Chip block label={t('Esta semana')} on={semana === 'esta'} onPress={() => { animar(); setSemana('esta'); }} />
              <Chip block label={t('Semana pasada')} on={semana === 'pasada'} onPress={() => { animar(); setSemana('pasada'); }} />
            </Row>
            {prep.length === 0 ? <Small>{t('Nada por preparar en este rango.')}</Small> : (
              <>
                <View style={{ backgroundColor: colors.primary, borderRadius: 24, padding: space.md, gap: space.xs }}>
                  <Label color={colors.onPrimary}>{t('Invertir')}</Label>
                  <Money value={invertir} kind="title" color={colors.onPrimary} />
                  <Small color={colors.onPrimary}>{t('Vas a cobrar {monto}', { monto: money(cobrar) })}</Small>
                </View>
                {prep.map((p, i) => (
                  <Appear key={p.nombre} delay={i * 60}>
                    <View style={{ backgroundColor: colors.surface, borderRadius: 24, padding: space.md, gap: space.xs }}>
                      <Row>
                        <View style={{ flex: 1 }}><Sub lines={1}>{`${p.nombre} ×${p.unidades}`}</Sub></View>
                        <Sub color={colors.primary}>{money(p.costo)}</Sub>
                      </Row>
                      <Small color={colors.muted}>
                        {t('Costo {c} c/u · venta {v} c/u = {total}', { c: money(Math.round(p.costo / p.unidades)), v: money(Math.round(p.venta / p.unidades)), total: money(p.venta) })}
                      </Small>
                    </View>
                  </Appear>
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}
