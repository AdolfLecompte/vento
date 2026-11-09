import { useFocusEffect, useRouter } from 'expo-router';
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
import { Buscador, Header, Label, miles, money, Row, Screen, Small } from '@/ui';

// Every order that is delivered and paid, grouped by day like the movements of a banking app.
export default function Historial() {
  const db = useSQLiteContext();
  const router = useRouter();
  const t = useT();
  const [rows, setRows] = useState<PedidoRow[]>([]);
  const [q, setQ] = useState('');
  useFocusEffect(useCallback(() => { listPedidos(db).then(setRows); }, [db]));

  const secciones = useMemo(() => {
    const hoyS = hoy();
    const lista = rows.filter((r) => completo(r.total, r.pagado, !!r.entregado)
      && coincide(q, r.cliente, r.productos, r.fecha, corta(r.fecha, t), r.total, miles(r.total)));
    return agruparPorDia(lista).map((g) => ({ titulo: etiquetaDia(g.fecha, hoyS, t), total: g.total, data: g.items }));
  }, [rows, q, t]);

  return (
    <Screen bottom>
      <Header title={t('Historial')} onBack={() => router.back()} />
      <SectionList
        sections={secciones}
        keyExtractor={(r) => String(r.id)}
        keyboardShouldPersistTaps="handled"
        stickySectionHeadersEnabled={false}
        contentContainerStyle={{ padding: space.lg, paddingTop: space.sm, paddingBottom: space.xl }}
        ListHeaderComponent={
          <View style={{ gap: space.sm, marginBottom: space.sm }}>
            <Small>{t('Entregados y pagados')}</Small>
            <Buscador value={q} onChange={setQ} placeholder={t('Buscar por cliente, producto o fecha')} />
          </View>
        }
        renderSectionHeader={({ section }) => (
          <Row style={{ paddingTop: space.md, paddingBottom: space.sm }}>
            <View style={{ flex: 1 }}><Label>{section.titulo}</Label></View>
            <Small>{money(section.total)}</Small>
          </Row>
        )}
        renderItem={({ item, index }) => <View style={{ marginBottom: space.sm }}><PedidoCard r={item} index={index} /></View>}
        ListEmptyComponent={<Vacio texto={q.trim() ? t('No encontré nada con «{q}».', { q: q.trim() }) : t('Aquí aparecen los pedidos que ya entregaste y te pagaron.')} />}
      />
    </Screen>
  );
}
