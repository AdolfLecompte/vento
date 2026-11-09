import { useFocusEffect, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { FlatList, View } from 'react-native';
import { CaretRightIcon } from '@/icons';
import { space } from '@/theme';
import { Vacio } from '@/Mascota';
import { useColors, useT } from '@/tema';
import { animar, Appear, Avatar, Card, Chip, Fab, Header, money, Pill, Row, Screen, Small, Sub, Tap } from '@/ui';

type Fila = { id: number; nombre: string; pedidos: number; debe: number };

export default function Clientes() {
  const colors = useColors();
  const db = useSQLiteContext();
  const router = useRouter();
  const t = useT();
  const [rows, setRows] = useState<Fila[]>([]);
  const [soloDeben, setSoloDeben] = useState(false);
  const load = useCallback(() => {
    db.getAllAsync<Fila>(
      `SELECT c.id, c.nombre, COUNT(t.id) AS pedidos, COALESCE(SUM(MAX(0, t.total - t.pagado)),0) AS debe FROM clientes c
       LEFT JOIN (SELECT p.id, p.cliente_id,
         COALESCE((SELECT SUM(cantidad*precio_unit) FROM pedido_items WHERE pedido_id=p.id),0) AS total,
         COALESCE((SELECT SUM(monto) FROM pagos WHERE pedido_id=p.id),0) AS pagado FROM pedidos p) t ON t.cliente_id=c.id
       GROUP BY c.id ORDER BY c.nombre`).then(setRows);
  }, [db]);
  useFocusEffect(load);

  const deben = rows.filter((c) => c.debe > 0);
  const shown = soloDeben ? deben : rows;

  return (
    <Screen>
      <Header title={t('Clientes')} />
      <FlatList
        data={shown}
        keyExtractor={(c) => String(c.id)}
        contentContainerStyle={{ padding: space.lg, paddingTop: space.sm, gap: space.sm, paddingBottom: 120 }}
        ListHeaderComponent={
          <Row style={{ marginBottom: space.sm }}>
            <Chip label={t('Todos')} on={!soloDeben} onPress={() => { animar(); setSoloDeben(false); }} />
            <Chip label={t('Deben ({n})', { n: deben.length })} on={soloDeben} onPress={() => { animar(); setSoloDeben(true); }} />
          </Row>
        }
        ListEmptyComponent={<Vacio texto={soloDeben ? t('Nadie te debe nada.') : t('Toca el + para agregar tu primer cliente.')} />}
        renderItem={({ item: c, index }) => (
          <Appear delay={Math.min(index, 8) * 40}>
            <Tap onPress={() => router.push(`/cliente/${c.id}`)} label={c.nombre}>
              <Card>
                <Row>
                  <Avatar name={c.nombre} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Sub>{c.nombre}</Sub>
                    <Small>{c.pedidos === 1 ? t('1 pedido') : t('{n} pedidos', { n: c.pedidos })}</Small>
                  </View>
                  {c.debe > 0 && <Pill label={t('debe {monto}', { monto: money(c.debe) })} bg={colors.dueSoft} fg={colors.due} />}
                  <CaretRightIcon size={18} color={colors.muted} />
                </Row>
              </Card>
            </Tap>
          </Appear>
        )}
      />
      <Fab label={t('Nuevo cliente')} onPress={() => router.push('/cliente/nuevo')} />
    </Screen>
  );
}
