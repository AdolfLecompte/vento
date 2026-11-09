import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { FlatList } from 'react-native';
import { listPedidos, PedidoRow } from '@/db';
import { PedidoCard } from '@/PedidoCard';
import { space } from '@/theme';
import { Vacio } from '@/Mascota';
import { useT } from '@/tema';
import { animar, Chip, Fab, Header, Row, Screen } from '@/ui';

type Filtro = 'todos' | 'cobrar' | 'entregar';

export default function Pedidos() {
  const db = useSQLiteContext();
  const router = useRouter();
  const t = useT();
  const { filtro } = useLocalSearchParams<{ filtro?: Filtro }>();
  const f: Filtro = filtro ?? 'todos'; // the URL param is the single source of truth (Inicio links here)
  const [rows, setRows] = useState<PedidoRow[]>([]);
  useFocusEffect(useCallback(() => { listPedidos(db).then(setRows); }, [db]));

  const shown = rows.filter((r) => f === 'todos' || (f === 'cobrar' ? r.pagado < r.total : !r.entregado));
  const pick = (x: Filtro) => { animar(); router.setParams({ filtro: f === x ? 'todos' : x }); };
  return (
    <Screen>
      <Header title={t('Pedidos')} />
      <FlatList
        data={shown}
        keyExtractor={(r) => String(r.id)}
        contentContainerStyle={{ padding: space.lg, paddingTop: space.sm, gap: space.sm, paddingBottom: 120 }}
        ListHeaderComponent={
          <Row style={{ marginBottom: space.sm }}>
            <Chip label={t('Todos')} on={f === 'todos'} onPress={() => pick('todos')} />
            <Chip label={t('Por cobrar')} on={f === 'cobrar'} onPress={() => pick('cobrar')} />
            <Chip label={t('Por entregar')} on={f === 'entregar'} onPress={() => pick('entregar')} />
          </Row>
        }
        ListEmptyComponent={<Vacio texto={rows.length ? t('Nada pendiente aquí. ¡Buen trabajo!') : t('Aún no hay pedidos. Toca el + para anotar el primero.')} />}
        renderItem={({ item, index }) => <PedidoCard r={item} index={index} />}
      />
      <Fab label={t('Nuevo pedido')} onPress={() => router.push('/pedido/nuevo')} />
    </Screen>
  );
}
