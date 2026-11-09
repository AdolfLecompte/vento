import { useFocusEffect, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { FlatList, ScrollView, View } from 'react-native';
import { listProductos, Producto } from '@/db';
import { CaretRightIcon } from '@/icons';
import { space } from '@/theme';
import { Vacio } from '@/Mascota';
import { coincide } from '@/busqueda';
import { useColors, useT } from '@/tema';
import { animar, Appear, Buscador, Card, Chip, Fab, Header, money, Pill, ProductoIcono, Row, Screen, Small, Sub, Tap } from '@/ui';

const SIN = 'Sin categoría';

export default function Productos() {
  const colors = useColors();
  const db = useSQLiteContext();
  const router = useRouter();
  const t = useT();
  const [rows, setRows] = useState<Producto[]>([]);
  const [filtro, setFiltro] = useState('');
  const [q, setQ] = useState('');
  useFocusEffect(useCallback(() => { listProductos(db).then(setRows); }, [db]));

  // One filter per category that exists, plus "Sin categoría" if some product has none.
  const cats = [...new Set(rows.map((r) => r.categoria).filter((c): c is string => !!c))].sort();
  const hayVacios = rows.some((r) => !r.categoria);
  const activo = filtro === SIN ? hayVacios : cats.includes(filtro); // a filter whose category vanished resets itself
  const f = activo ? filtro : '';
  const shown = rows.filter((r) => (!f || (f === SIN ? !r.categoria : r.categoria === f)) && coincide(q, r.nombre, r.categoria));

  return (
    <Screen>
      <Header title={t('Productos')} />
      <FlatList
        data={shown}
        keyExtractor={(p) => String(p.id)}
        contentContainerStyle={{ padding: space.lg, paddingTop: space.sm, gap: space.sm, paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={{ gap: space.md, marginBottom: space.sm }}>
            <Buscador value={q} onChange={setQ} placeholder={t('Buscar por nombre o categoría')} />
            {cats.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }} keyboardShouldPersistTaps="handled">
                <Chip label={t('Todos')} on={!f} onPress={() => { animar(); setFiltro(''); }} />
                {[...cats, ...(hayVacios ? [SIN] : [])].map((c) => <Chip key={c} label={c === SIN ? t('Sin categoría') : c} on={f === c} onPress={() => { animar(); setFiltro(f === c ? '' : c); }} />)}
              </ScrollView>
            )}
          </View>
        }
        ListEmptyComponent={<Vacio texto={q.trim() ? t('No encontré nada con «{q}».', { q: q.trim() }) : rows.length ? t('No hay productos en esta categoría.') : t('Toca el + para crear tu primer producto.')} />}
        renderItem={({ item: p, index }) => (
          <Appear delay={Math.min(index, 8) * 40}>
            <Tap onPress={() => router.push(`/producto/${p.id}`)} label={p.nombre}>
              <Card>
                <Row>
                  <ProductoIcono />
                  <View style={{ flex: 1, gap: 4 }}>
                    <Sub>{p.nombre}</Sub>
                    <Small>{t('Me cuesta {costo} · lo vendo en {precio}', { costo: money(p.costo), precio: money(p.precio) })}</Small>
                    <Row>
                      <Pill label={t('gana {monto}', { monto: money(p.precio - p.costo) })} bg={colors.soft} fg={colors.primaryPressed} />
                      {p.categoria ? <Pill label={p.categoria} bg={colors.line} fg={colors.muted} /> : null}
                    </Row>
                  </View>
                  <CaretRightIcon size={18} color={colors.muted} />
                </Row>
              </Card>
            </Tap>
          </Appear>
        )}
      />
      <Fab label={t('Nuevo producto')} onPress={() => router.push('/producto/nuevo')} />
    </Screen>
  );
}
