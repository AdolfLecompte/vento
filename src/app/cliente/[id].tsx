import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { borrarCliente, Cliente, pedidosDeCliente, PedidoRow } from '@/db';
import { confirm, notify } from '@/feedback';
import { TrashIcon } from '@/icons';
import { PedidoCard } from '@/PedidoCard';
import { space } from '@/theme';
import { Guia } from '@/Mascota';
import { useColors, useT } from '@/tema';
import { fraseCliente } from '@/voz';
import { Appear, Avatar, Body, Button, Card, Field, Header, Label, Money, Row, Screen, Small, Sub } from '@/ui';

// `/cliente/nuevo` creates a client; `/cliente/<id>` edits one and shows their history.
export default function ClienteScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const esNuevo = id === 'nuevo';
  const db = useSQLiteContext();
  const router = useRouter();
  const t = useT();
  const [c, setC] = useState<Cliente | null>(null);
  const [pedidos, setPedidos] = useState<PedidoRow[]>([]);
  const [nombre, setNombre] = useState('');
  const [tel, setTel] = useState('');

  const load = useCallback(async () => {
    if (esNuevo) return;
    const cli = await db.getFirstAsync<Cliente>('SELECT * FROM clientes WHERE id=?', Number(id));
    setC(cli);
    setNombre(cli?.nombre ?? ''); setTel(cli?.telefono ?? '');
    setPedidos(await pedidosDeCliente(db, Number(id)));
  }, [db, id, esNuevo]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const crear = async () => {
    if (!nombre.trim()) return notify(t('Escribe el nombre del cliente'), 'aviso');
    await db.runAsync('INSERT INTO clientes(nombre, telefono) VALUES(?,?)', nombre.trim(), tel.trim() || null);
    notify(t('Listo, guardé al cliente'));
    router.dismissTo('/clientes');
  };

  if (esNuevo) {
    return (
      <Screen bottom>
        <Header title={t('Nuevo cliente')} onBack={() => router.back()} />
        <ScrollView contentContainerStyle={{ padding: space.lg, paddingTop: space.sm, gap: space.md }} keyboardShouldPersistTaps="handled">
          <Guia frase={fraseCliente(!!nombre.trim(), t)} n={(nombre.trim() ? 1 : 0) + (tel.trim() ? 1 : 0)} />
          <Card>
            <Field label={t('Nombre')} placeholder={t('Ej. María Pérez')} value={nombre} onChangeText={setNombre} autoFocus />
            <Field label={t('Teléfono (opcional)')} placeholder={t('Ej. 300 123 4567')} keyboardType="phone-pad" value={tel} onChangeText={setTel} />
          </Card>
          <Button label={t('Guardar cliente')} onPress={crear} />
        </ScrollView>
      </Screen>
    );
  }

  if (!c) return null;
  const comprado = pedidos.reduce((a, p) => a + p.total, 0);
  const debe = pedidos.reduce((a, p) => a + Math.max(0, p.total - p.pagado), 0);
  const cambio = nombre.trim() !== c.nombre || (tel.trim() || null) !== (c.telefono || null);

  const guardar = async () => {
    if (!nombre.trim()) return notify(t('El nombre no puede quedar vacío'), 'aviso');
    await db.runAsync('UPDATE clientes SET nombre=?, telefono=? WHERE id=?', nombre.trim(), tel.trim() || null, c.id);
    await load(); notify(t('Listo, actualicé al cliente'));
  };
  const borrar = async () => {
    const msg = pedidos.length ? t('Se borran también sus {n} pedidos y su historial. No se puede deshacer.', { n: pedidos.length }) : undefined;
    if (!(await confirm(t('¿Borrar a {nombre}?', { nombre: c.nombre }), 'Borrar', msg))) return;
    await borrarCliente(db, c.id);
    notify(t('Listo, borré al cliente'), 'borrar');
    router.dismissTo('/clientes');
  };

  return (
    <Screen bottom>
      <Header title={c.nombre} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={{ padding: space.lg, paddingTop: space.sm, gap: space.md, paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
        <Appear>
          <Row>
            <View style={{ flex: 1, backgroundColor: colors.primary, borderRadius: 24, padding: space.md, gap: 2 }}>
              <Small color={colors.onPrimarySuave}>{t('Ha comprado')}</Small>
              <Money value={comprado} color={colors.onPrimary} />
            </View>
            <View style={{ flex: 1, backgroundColor: debe > 0 ? colors.dueSoft : colors.surface, borderRadius: 24, padding: space.md, gap: 2 }}>
              <Small color={debe > 0 ? colors.due : colors.muted}>{t('Debe')}</Small>
              <Money value={debe} color={debe > 0 ? colors.due : colors.ink} />
            </View>
          </Row>
        </Appear>

        <Appear delay={60}>
          <Card>
            <Row><Avatar name={nombre || c.nombre} size={40} /><Label>{t('Datos del cliente')}</Label></Row>
            <Field label={t('Nombre')} value={nombre} onChangeText={setNombre} />
            <Field label={t('Teléfono (opcional)')} keyboardType="phone-pad" value={tel} onChangeText={setTel} />
            {cambio && <Button label={t('Guardar cambios')} onPress={guardar} />}
          </Card>
        </Appear>

        <Sub>{t('Historial')}</Sub>
        {pedidos.length === 0 && <Body color={colors.muted}>{t('Todavía no tiene pedidos.')}</Body>}
        {pedidos.map((p, i) => <PedidoCard key={p.id} r={p} index={i} />)}

        <Button kind="ghost" label={t('Borrar cliente')} icon={<TrashIcon size={20} color={colors.primary} />} onPress={borrar} />
      </ScrollView>
    </Screen>
  );
}
