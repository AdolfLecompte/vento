import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { listProductos, Producto } from '@/db';
import { confirm, notify } from '@/feedback';
import { TrashIcon } from '@/icons';
import { space } from '@/theme';
import { Guia } from '@/Mascota';
import { useColors, useT } from '@/tema';
import { fraseProducto } from '@/voz';
import { Button, Card, Chip, Field, Header, Label, money, MoneyField, Pill, Row, Screen, Small } from '@/ui';

// `/producto/nuevo` creates a product; `/producto/<id>` edits one. Same form for both.
export default function ProductoScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const esNuevo = id === 'nuevo';
  const db = useSQLiteContext();
  const router = useRouter();
  const t = useT();
  const [cats, setCats] = useState<string[]>([]);
  const [nombre, setNombre] = useState('');
  const [cat, setCat] = useState('');
  const [costo, setCosto] = useState(0);
  const [precio, setPrecio] = useState(0);
  const [listo, setListo] = useState(esNuevo);

  useEffect(() => {
    listProductos(db).then((ps: Producto[]) => {
      setCats([...new Set(ps.map((p) => p.categoria).filter((c): c is string => !!c))].sort());
      const p = ps.find((x) => x.id === Number(id));
      if (p) { setNombre(p.nombre); setCat(p.categoria ?? ''); setCosto(p.costo); setPrecio(p.precio); }
      setListo(true);
    });
  }, [db, id]);

  const guardar = async () => {
    if (!nombre.trim()) return notify(t('Ponle un nombre al producto'), 'aviso');
    if (esNuevo) await db.runAsync('INSERT INTO productos(nombre,costo,precio,categoria) VALUES(?,?,?,?)', nombre.trim(), costo, precio, cat.trim() || null);
    else await db.runAsync('UPDATE productos SET nombre=?, categoria=?, costo=?, precio=? WHERE id=?', nombre.trim(), cat.trim() || null, costo, precio, Number(id));
    notify(esNuevo ? t('Listo, guardé el producto') : t('Listo, guardé los cambios'));
    router.dismissTo('/productos');
  };
  const borrar = async () => {
    if (!(await confirm(t('¿Borrar {nombre}?', { nombre })))) return;
    try {
      await db.runAsync('DELETE FROM productos WHERE id=?', Number(id));
      notify(t('Listo, borré el producto'), 'borrar');
      router.dismissTo('/productos');
    } catch { notify(t('Ya está en pedidos, no se puede borrar'), 'aviso'); }
  };

  if (!listo) return null;
  return (
    <Screen bottom>
      <Header title={esNuevo ? t('Nuevo producto') : t('Editar producto')} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={{ padding: space.lg, paddingTop: space.sm, gap: space.md, paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
        {esNuevo && <Guia frase={fraseProducto(!!nombre.trim(), precio > 0, t)} n={(nombre.trim() ? 1 : 0) + (precio > 0 ? 1 : 0) + (cat.trim() ? 1 : 0)} />}
        <Card>
          <Field label={t('Nombre')} placeholder={t('Ej. Arepas x10')} value={nombre} onChangeText={setNombre} autoFocus={esNuevo} />
        </Card>
        <Card>
          <Field label={t('Categoría (opcional)')} placeholder={t('Ej. Comida, Bebidas')} value={cat} onChangeText={setCat} />
          {cats.length > 0 && (
            <View style={{ gap: space.xs }}>
              <Small>{t('O elige una que ya usaste')}</Small>
              <Row style={{ flexWrap: 'wrap' }}>
                {cats.map((c) => <Chip key={c} label={c} on={c === cat.trim()} onPress={() => setCat(c === cat.trim() ? '' : c)} />)}
              </Row>
            </View>
          )}
        </Card>
        <Card>
          <Row>
            <MoneyField label={t('Me cuesta')} value={costo} onChange={setCosto} />
            <MoneyField label={t('Lo vendo en')} value={precio} onChange={setPrecio} />
          </Row>
          <Row>
            <Label color={colors.muted}>{t('Ganas por cada uno')}</Label>
            <Pill label={money(precio - costo)} bg={colors.soft} fg={colors.primaryPressed} />
          </Row>
        </Card>
        <Button label={t('Guardar producto')} onPress={guardar} />
        {!esNuevo && <Button kind="ghost" label={t('Borrar producto')} icon={<TrashIcon size={20} color={colors.primary} />} onPress={borrar} />}
      </ScrollView>
    </Screen>
  );
}
