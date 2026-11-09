import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';
import { coincide } from '@/busqueda';
import { completo } from '@/calc';
import { listPedidos, PedidoRow } from '@/db';
import { corta } from '@/fecha';
import { ClockCounterClockwiseIcon } from '@/icons';
import { Vacio } from '@/Mascota';
import { PedidoCard } from '@/PedidoCard';
import { space } from '@/theme';
import { useColors, useT } from '@/tema';
import { animar, Buscador, Chip, Fab, Header, Label, miles, Row, Screen, Tap } from '@/ui';

// This screen is only what is still open: "todos" = to collect plus to deliver together. Finished orders live in /historial.
type Filtro = 'todos' | 'cobrar' | 'entregar';
const FILTROS: Filtro[] = ['todos', 'cobrar', 'entregar'];

export default function Pedidos() {
  const db = useSQLiteContext();
  const router = useRouter();
  const colors = useColors();
  const t = useT();
  const { filtro } = useLocalSearchParams<{ filtro?: string }>();
  const f: Filtro = FILTROS.find((x) => x === filtro) ?? 'todos'; // the URL param is the single source of truth (Inicio links here)
  const [rows, setRows] = useState<PedidoRow[]>([]);
  const [q, setQ] = useState('');
  useFocusEffect(useCallback(() => { listPedidos(db).then(setRows); }, [db]));

  const lista = useMemo(() => rows.filter((r) =>
    !completo(r.total, r.pagado, !!r.entregado)
    && (f === 'cobrar' ? r.pagado < r.total : f === 'entregar' ? !r.entregado : true)
    && coincide(q, r.cliente, r.productos, r.fecha, corta(r.fecha, t), r.total, miles(r.total))), [rows, q, f, t]);

  const pick = (x: Filtro) => { animar(); router.setParams({ filtro: x }); };
  const vacio = q.trim() ? t('No encontré nada con «{q}».', { q: q.trim() })
    : rows.length ? t('Nada pendiente aquí. ¡Buen trabajo!') : t('Aún no hay pedidos. Toca el + para anotar el primero.');

  return (
    <Screen>
      <Header
        title={t('Pedidos')}
        right={
          <Tap onPress={() => router.push('/historial')} label={t('Historial')} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, height: 40, paddingHorizontal: space.md, borderRadius: 20, backgroundColor: colors.soft }}>
            <ClockCounterClockwiseIcon size={20} color={colors.primary} weight="bold" />
            <Label color={colors.primary}>{t('Historial')}</Label>
          </Tap>
        }
      />
      <FlatList
        data={lista}
        keyExtractor={(r) => String(r.id)}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: space.lg, paddingTop: space.sm, gap: space.sm, paddingBottom: 120 }}
        ListHeaderComponent={
          <View style={{ gap: space.md, marginBottom: space.sm }}>
            <Buscador value={q} onChange={setQ} placeholder={t('Buscar por cliente, producto o fecha')} />
            <Row>
              <Chip block label={t('Todos')} on={f === 'todos'} onPress={() => pick('todos')} />
              <Chip block label={t('Por cobrar')} on={f === 'cobrar'} onPress={() => pick('cobrar')} />
              <Chip block label={t('Por entregar')} on={f === 'entregar'} onPress={() => pick('entregar')} />
            </Row>
          </View>
        }
        ListEmptyComponent={<Vacio texto={vacio} />}
        renderItem={({ item, index }) => <PedidoCard r={item} index={index} />}
      />
      <Fab label={t('Nuevo pedido')} onPress={() => router.push('/pedido/nuevo')} />
    </Screen>
  );
}
