import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useMemo, useState } from 'react';
import { SectionList, View } from 'react-native';
import { coincide } from '@/busqueda';
import { completo } from '@/calc';
import { hoy, listPedidos, PedidoRow } from '@/db';
import { corta, etiquetaDia } from '@/fecha';
import { agruparPorDia } from '@/historial';
import { Vacio } from '@/Mascota';
import { PedidoCard } from '@/PedidoCard';
import { space } from '@/theme';
import { useT } from '@/tema';
import { animar, Buscador, Chip, Fab, Header, Label, miles, money, Row, Screen, Small } from '@/ui';

// "pendientes" = everything not finished yet; "historial" = delivered and paid, grouped by day like a bank's movements.
type Filtro = 'pendientes' | 'cobrar' | 'entregar' | 'historial';
const FILTROS: Filtro[] = ['pendientes', 'cobrar', 'entregar', 'historial'];

export default function Pedidos() {
  const db = useSQLiteContext();
  const router = useRouter();
  const t = useT();
  const { filtro } = useLocalSearchParams<{ filtro?: string }>();
  const f: Filtro = FILTROS.find((x) => x === filtro) ?? 'pendientes'; // the URL param is the single source of truth (Inicio links here)
  const [rows, setRows] = useState<PedidoRow[]>([]);
  const [q, setQ] = useState('');
  useFocusEffect(useCallback(() => { listPedidos(db).then(setRows); }, [db]));

  const secciones = useMemo(() => {
    const buscados = rows.filter((r) => coincide(q, r.cliente, r.productos, r.fecha, corta(r.fecha, t), r.total, miles(r.total)));
    const ok = (r: PedidoRow) => {
      const fin = completo(r.total, r.pagado, !!r.entregado);
      return f === 'historial' ? fin : f === 'cobrar' ? r.pagado < r.total : f === 'entregar' ? !r.entregado : !fin;
    };
    const lista = buscados.filter(ok);
    if (f !== 'historial') return [{ titulo: null as string | null, total: 0, data: lista }];
    const hoyS = hoy();
    return agruparPorDia(lista).map((g) => ({ titulo: etiquetaDia(g.fecha, hoyS, t) as string | null, total: g.total, data: g.items }));
  }, [rows, q, f, t]);

  const pick = (x: Filtro) => { animar(); router.setParams({ filtro: x }); };
  const vacio = q.trim() ? t('No encontré nada con «{q}».', { q: q.trim() })
    : f === 'historial' ? t('Aquí aparecen los pedidos que ya entregaste y te pagaron.')
    : rows.length ? t('Nada pendiente aquí. ¡Buen trabajo!') : t('Aún no hay pedidos. Toca el + para anotar el primero.');

  return (
    <Screen>
      <Header title={t('Pedidos')} />
      <SectionList
        sections={secciones}
        keyExtractor={(r) => String(r.id)}
        keyboardShouldPersistTaps="handled"
        stickySectionHeadersEnabled={false}
        contentContainerStyle={{ padding: space.lg, paddingTop: space.sm, paddingBottom: 120 }}
        ListHeaderComponent={
          <View style={{ gap: space.md, marginBottom: space.sm }}>
            <Buscador value={q} onChange={setQ} placeholder={t('Buscar por cliente, producto o fecha')} />
            <Row style={{ flexWrap: 'wrap' }}>
              <Chip label={t('Pendientes')} on={f === 'pendientes'} onPress={() => pick('pendientes')} />
              <Chip label={t('Por cobrar')} on={f === 'cobrar'} onPress={() => pick('cobrar')} />
              <Chip label={t('Por entregar')} on={f === 'entregar'} onPress={() => pick('entregar')} />
              <Chip label={t('Historial')} on={f === 'historial'} onPress={() => pick('historial')} />
            </Row>
          </View>
        }
        renderSectionHeader={({ section }) => section.titulo === null ? null : (
          <Row style={{ paddingTop: space.md, paddingBottom: space.sm }}>
            <View style={{ flex: 1 }}><Label>{section.titulo}</Label></View>
            <Small>{money(section.total)}</Small>
          </Row>
        )}
        renderItem={({ item, index }) => <View style={{ marginBottom: space.sm }}><PedidoCard r={item} index={index} /></View>}
        ListEmptyComponent={<Vacio texto={vacio} />}
      />
      <Fab label={t('Nuevo pedido')} onPress={() => router.push('/pedido/nuevo')} />
    </Screen>
  );
}
