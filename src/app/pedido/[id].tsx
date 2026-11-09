import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { bloqueado, estadoDe } from '@/calc';
import { getPedido, hoy, ItemRow, listItems, listPagos, MEDIOS, PagoRow, PedidoRow } from '@/db';
import { confirm, notify } from '@/feedback';
import { corta } from '@/fecha';
import { BankIcon, HandCoinsIcon, LockSimpleIcon, MoneyIcon, TrashIcon, TruckIcon } from '@/icons';
import { space } from '@/theme';
import { alfa, pagoColores } from '@/paleta';
import { useColors, useT } from '@/tema';
import { animar, Appear, Bar, Button, Card, Chip, Header, Label, money, Money, MoneyField, Pill, Row, RoundBtn, Screen, Small, Sub, Toggle } from '@/ui';

const MEDIO_ICON: Record<string, typeof MoneyIcon> = { Efectivo: MoneyIcon, Transferencia: BankIcon };

// Saved order: a calm summary. Editing the contents happens in the same form used to create it.
export default function PedidoDetalle() {
  const colors = useColors();
  const { id: raw } = useLocalSearchParams<{ id: string }>();
  const id = Number(raw);
  const db = useSQLiteContext();
  const router = useRouter();
  const t = useT();
  const [ped, setPed] = useState<PedidoRow | null>(null);
  const [items, setItems] = useState<ItemRow[]>([]);
  const [pagos, setPagos] = useState<PagoRow[]>([]);
  const [cobrando, setCobrando] = useState(false);
  const [medio, setMedio] = useState(MEDIOS[0]);
  const [monto, setMonto] = useState(0);

  const load = useCallback(async () => {
    const [p, i, g] = await Promise.all([getPedido(db, id), listItems(db, id), listPagos(db, id)]);
    setPed(p); setItems(i); setPagos(g);
  }, [db, id]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (!ped) return null;
  const est = estadoDe(ped.total, ped.pagado);
  const saldo = Math.max(0, ped.total - ped.pagado);
  const cerrado = bloqueado(ped.total, ped.pagado, !!ped.entregado);

  const cobrar = async () => {
    const m = monto || saldo;
    if (m <= 0) return notify(t('Escribe cuánto te pagaron'), 'aviso');
    if (m > saldo) return notify(t('Es más de lo que falta ({monto})', { monto: money(saldo) }), 'aviso');
    await db.runAsync('INSERT INTO pagos(pedido_id, monto, medio, fecha) VALUES(?,?,?,?)', id, m, medio, hoy());
    animar(); setMonto(0); setCobrando(false); load(); notify(t('Anoté el pago de {monto}', { monto: money(m) }));
  };
  const entregar = async (v: boolean) => {
    await db.runAsync('UPDATE pedidos SET entregado=? WHERE id=?', v ? 1 : 0, id);
    load(); if (v) notify(t('Anoté que ya se entregó'));
  };
  const quitarPago = async (p: PagoRow) => {
    if (!(await confirm(t('¿Quitar el pago de {monto}?', { monto: money(p.monto) }), 'Quitar'))) return;
    await db.runAsync('DELETE FROM pagos WHERE id=?', p.id); animar(); load();
  };
  const borrar = async () => {
    if (!(await confirm(t('¿Borrar el pedido de {nombre}?', { nombre: ped.cliente }), 'Borrar', t('Se borran también sus pagos.')))) return;
    await db.runAsync('DELETE FROM pedidos WHERE id=?', id);
    notify(t('Listo, borré el pedido'), 'borrar');
    router.dismissTo('/pedidos'); // explicit target: going "back" could land on a screen that no longer exists
  };

  return (
    <Screen bottom>
      <Header title={ped.cliente} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={{ padding: space.lg, paddingTop: space.sm, gap: space.md, paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
        <Appear>
          <View style={{ backgroundColor: colors.primary, borderRadius: 28, padding: space.lg, gap: space.xs }}>
            <Label color={colors.onPrimarySuave}>{t('Total')}</Label>
            <Money kind="hero" value={ped.total} color={colors.onPrimary} />
            <Small color={colors.onPrimarySuave}>{t('Ganancia {monto}', { monto: money(ped.total - ped.costo) })} · {corta(ped.fecha, t)}</Small>
            <View style={{ marginTop: space.md, gap: 6 }}>
              <Bar value={ped.total > 0 ? ped.pagado / ped.total : 0} color={colors.onPrimary} track={alfa(colors.onPrimary, 0.28)} />
              <Small color={colors.onPrimarySuave}>{saldo > 0 ? t('Pagó {pagado} · falta {falta}', { pagado: money(ped.pagado), falta: money(saldo) }) : t('Pagó todo')}</Small>
            </View>
          </View>
        </Appear>

        <Card>
          <Sub>{t('Productos')}</Sub>
          {items.map((i) => (
            <Row key={i.id}>
              <View style={{ flex: 1 }}><Label>{i.cantidad} × {i.producto}</Label></View>
              <Label>{money(i.cantidad * i.precio_unit)}</Label>
            </Row>
          ))}
        </Card>

        <Card>
          <Row>
            <View style={{ flex: 1 }}><Sub>{t('Pagos')}</Sub></View>
            <Pill label={t(est)} bg={pagoColores(colors)[est].bg} fg={pagoColores(colors)[est].fg} />
          </Row>
          {pagos.length === 0 && <Small>{t('Todavía no ha pagado.')}</Small>}
          {pagos.map((p) => {
            const I = MEDIO_ICON[p.medio] ?? BankIcon;
            return (
              <Row key={p.id}>
                <I size={24} color={colors.primary} weight="duotone" />
                <View style={{ flex: 1 }}><Label>{money(p.monto)}</Label><Small>{t(p.medio)} · {p.fecha}</Small></View>
                {!cerrado && <RoundBtn label={t('Quitar pago')} onPress={() => quitarPago(p)}><TrashIcon size={20} color={colors.muted} /></RoundBtn>}
              </Row>
            );
          })}
          {saldo > 0 && !cobrando && (
            <Button kind="soft" label={t('Registrar un pago')} icon={<HandCoinsIcon size={22} color={colors.primary} weight="bold" />} onPress={() => { animar(); setCobrando(true); }} />
          )}
          {cobrando && (
            <Appear style={{ gap: space.sm }}>
              <Small>{t('¿Con qué pagó?')}</Small>
              <Row>{MEDIOS.map((m) => <Chip key={m} label={t(m)} on={m === medio} onPress={() => setMedio(m)} />)}</Row>
              <MoneyField label={t('Monto (vacío = todo lo que falta)')} placeholder={String(saldo)} value={monto} onChange={setMonto} />
              <Button label={t('Anotar {monto}', { monto: money(monto || saldo) })} onPress={cobrar} />
            </Appear>
          )}
        </Card>

        <Card>
          <Row>
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center' }}>
              <TruckIcon size={24} color={colors.primary} weight="duotone" />
            </View>
            <View style={{ flex: 1 }}><Sub>{ped.entregado ? t('Ya se entregó') : t('Falta entregarlo')}</Sub></View>
            <Toggle value={!!ped.entregado} onChange={entregar} label={t('Entregado')} />
          </Row>
        </Card>

        {cerrado ? (
          <Card>
            <Row>
              <LockSimpleIcon size={24} color={colors.primary} weight="duotone" />
              <View style={{ flex: 1 }}><Sub>{t('Pedido cerrado')}</Sub><Small>{t('Ya está pagado y entregado. Para cambiarlo, desmarca la entrega.')}</Small></View>
            </Row>
          </Card>
        ) : (
          <Button label={t('Editar pedido')} onPress={() => router.push({ pathname: '/pedido/nuevo', params: { editar: String(id) } })} />
        )}
        <Button kind="ghost" label={t('Borrar pedido')} onPress={borrar} />
      </ScrollView>
    </Screen>
  );
}
