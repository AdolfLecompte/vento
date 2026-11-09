import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { ReactNode, useCallback, useEffect, useState } from 'react';
import { BackHandler, ScrollView, View } from 'react-native';
import { bloqueado, ganancia, total as totalDe } from '@/calc';
import { FechaCampo } from '@/Calendario';
import { Borrador, Cliente, getPedido, guardarPedido, hoy, Linea, listClientes, listProductos, MEDIOS, Producto } from '@/db';
import { corta, esFechaISO } from '@/fecha';
import { notify } from '@/feedback';
import { CheckCircleIcon, MinusIcon, PlusIcon, TrashIcon } from '@/icons';
import { space } from '@/theme';
import { Guia } from '@/Mascota';
import { useColors, useT } from '@/tema';
import { fraseAsistente } from '@/voz';
import {
  animar, Appear, Avatar, Bar, Body, Button, Card, Chip, Field, Header, Label, money, MoneyField, Option, Row, RoundBtn,
  Screen, Segment, Small, Sub, Tap, Title,
} from '@/ui';

type Pago = 'no' | 'todo' | 'parte';
const PASOS = 4;

// Client chosen in step 1, shown on top of every later step.
function Banner({ nombre, onPress }: { nombre: string; onPress: () => void }) {
  const colors = useColors();
  const t = useT();
  return (
    <Tap onPress={onPress} label={t('Cambiar cliente')}>
      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: space.sm }}>
        <Avatar name={nombre} size={36} />
        <View style={{ flex: 1 }}><Small>{t('Pedido de')}</Small><Sub lines={1}>{nombre}</Sub></View>
        <Label color={colors.primary}>{t('Cambiar')}</Label>
      </Card>
    </Tap>
  );
}

// A block of the final summary, with a shortcut back to the step where it was filled in.
function Bloque({ titulo, onCambiar, children }: { titulo: string; onCambiar: () => void; children: ReactNode }) {
  const colors = useColors();
  const t = useT();
  return (
    <Card>
      <Row>
        <View style={{ flex: 1 }}><Label color={colors.muted}>{titulo}</Label></View>
        <Tap onPress={onCambiar} label={t('Cambiar {titulo}', { titulo })}><Label color={colors.primary}>{t('Cambiar')}</Label></Tap>
      </Row>
      {children}
    </Card>
  );
}

export default function PedidoWizard() {
  const colors = useColors();
  const { editar } = useLocalSearchParams<{ editar?: string }>();
  const editId = editar ? Number(editar) : undefined;
  const db = useSQLiteContext();
  const router = useRouter();
  const t = useT();
  const [paso, setPaso] = useState(editId ? 2 : 1);
  const [dir, setDir] = useState(1); // 1 = moving forward, -1 = going back: the new step slides in from that side
  const irA = useCallback((n: number) => { setDir(n >= paso ? 1 : -1); setPaso(n); }, [paso]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [prods, setProds] = useState<Producto[]>([]);
  const [q, setQ] = useState('');
  const [clienteId, setClienteId] = useState<number | null>(null);
  const [nuevo, setNuevo] = useState('');
  const [lineas, setLineas] = useState<Linea[]>([]);
  const [precios, setPrecios] = useState<number | null>(null);
  const [pago, setPago] = useState<Pago>('no');
  const [medio, setMedio] = useState(MEDIOS[0]);
  const [parte, setParte] = useState(0);
  const [entregado, setEntregado] = useState(false);
  const [fecha, setFecha] = useState(hoy); // the day of the order: today unless the user says otherwise
  const [guardando, setGuardando] = useState(false);
  const [pagadoPrevio, setPagadoPrevio] = useState(0); // what was already paid when editing

  useEffect(() => {
    listClientes(db).then(setClientes);
    listProductos(db).then(setProds);
    if (!editId) return;
    (async () => {
      const p = await getPedido(db, editId);
      if (!p) return router.back();
      if (bloqueado(p.total, p.pagado, !!p.entregado)) { notify(t('Pedido cerrado: ya está pagado y entregado'), 'aviso'); return router.back(); }
      const cid = (await db.getFirstAsync<{ cliente_id: number }>('SELECT cliente_id FROM pedidos WHERE id=?', editId))?.cliente_id ?? null;
      setClienteId(cid); setEntregado(!!p.entregado); setPagadoPrevio(p.pagado); setFecha(p.fecha);
      setLineas(await db.getAllAsync<Linea>(
        'SELECT producto_id, pr.nombre AS nombre, cantidad, costo_unit, precio_unit FROM pedido_items i JOIN productos pr ON pr.id=i.producto_id WHERE pedido_id=? ORDER BY i.id', editId));
    })();
  }, [db, editId, router, t]);

  const atras = useCallback(() => { if (paso > 1 && !(editId && paso === 2)) irA(paso - 1); else router.back(); }, [paso, editId, router, irA]);
  useEffect(() => {
    const h = BackHandler.addEventListener('hardwareBackPress', () => { atras(); return true; });
    return () => h.remove();
  }, [atras]);

  const nombreCliente = clienteId !== null ? clientes.find((c) => c.id === clienteId)?.nombre ?? '' : nuevo.trim();
  const items = lineas.map((l) => ({ cantidad: l.cantidad, costo: l.costo_unit, precio: l.precio_unit }));
  const total = totalDe(items);
  const gana = ganancia(items);
  const montoPago = pago === 'todo' ? total : pago === 'parte' ? parte : 0;
  const qty = (id: number) => lineas.find((l) => l.producto_id === id)?.cantidad ?? 0;

  const setQty = (p: Producto, n: number) => { animar(); setLineas((ls) => {
    const sin = ls.filter((l) => l.producto_id !== p.id);
    if (n <= 0) return sin;
    const actual = ls.find((l) => l.producto_id === p.id);
    return actual ? ls.map((l) => (l.producto_id === p.id ? { ...l, cantidad: n } : l))
      : [...ls, { producto_id: p.id, nombre: p.nombre, cantidad: n, costo_unit: p.costo, precio_unit: p.precio }];
  }); };
  const cambiar = (id: number, patch: Partial<Linea>) => setLineas((ls) => ls.map((l) => (l.producto_id === id ? { ...l, ...patch } : l)));

  const siguiente = () => {
    if (paso === 1 && !nombreCliente) return notify(t('Elige un cliente o escribe uno nuevo'), 'aviso');
    if (paso === 2 && !lineas.length) return notify(t('Agrega al menos un producto'), 'aviso');
    if (paso === 3 && pago === 'parte' && (parte <= 0 || parte > total)) return notify(t('Escribe cuánto pagó, sin pasarte del total'), 'aviso');
    irA(paso + 1);
  };

  const guardar = async () => {
    if (guardando) return;
    if (editId && total < pagadoPrevio) return notify(t('Ya pagó más que este total. Quita un pago antes de bajarlo.'), 'aviso');
    if (!esFechaISO(fecha) || fecha > hoy()) return notify(t('Elige un día que ya pasó o hoy'), 'aviso');
    const b: Borrador = { clienteId, clienteNuevo: nuevo, fecha, lineas, entregado, pago: !editId && montoPago > 0 ? { monto: montoPago, medio } : null };
    setGuardando(true);
    try {
      const id = await guardarPedido(db, b, editId);
      notify(editId ? t('Listo, actualicé el pedido') : t('Listo, guardé el pedido'));
      if (editId) router.back(); else router.replace(`/pedido/${id}`);
    } catch { notify(t('No se pudo guardar'), 'aviso'); setGuardando(false); }
  };

  // Step 1: choose a client, or type to search / create one.
  const texto = q.trim();
  const filtrados = clientes.filter((c) => c.nombre.toLowerCase().includes(texto.toLowerCase()));
  const existe = clientes.some((c) => c.nombre.toLowerCase() === texto.toLowerCase());
  const cats = [...new Set(prods.map((p) => p.categoria ?? ''))].sort((a, b) => (a === '' ? 1 : b === '' ? -1 : a.localeCompare(b)));

  const titulos = [t('¿Quién lo pidió?'), t('¿Qué pidió?'), editId ? t('Fecha y entrega') : t('Fecha, pago y entrega'), t('Revisa el pedido')];
  const ultimo = paso === PASOS;

  return (
    <Screen bottom>
      <Header title={editId ? t('Editar pedido') : t('Nuevo pedido')} onBack={atras} />
      <View style={{ paddingHorizontal: space.lg }}><Bar value={paso / PASOS} /></View>
      <ScrollView key={paso} contentContainerStyle={{ padding: space.lg, gap: space.md, paddingBottom: space.xl }} keyboardShouldPersistTaps="handled">
        <Appear shift={dir * 28} style={{ gap: space.md }}>
          <Guia frase={fraseAsistente(paso, !!editId, t)} n={paso} />
          <View style={{ gap: 2 }}>
            <Small>{t('Paso {paso} de {total}', { paso, total: PASOS })}</Small>
            <Title>{titulos[paso - 1]}</Title>
          </View>
          {paso > 1 && nombreCliente !== '' && <Banner nombre={nombreCliente} onPress={() => irA(1)} />}

          {paso === 1 && (
            <>
              <Field placeholder={t('Buscar o escribir un cliente nuevo')} value={q} onChangeText={setQ} />
              {texto !== '' && !existe && (
                <Option label={t('Crear {nombre}', { nombre: texto })} selected={clienteId === null && nuevo.trim() === texto} onPress={() => { setClienteId(null); setNuevo(texto); }}>
                  <Row>
                    <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
                      <PlusIcon size={22} color={colors.onPrimary} weight="bold" />
                    </View>
                    <View style={{ flex: 1 }}><Small>{t('Cliente nuevo')}</Small><Sub>{texto}</Sub></View>
                    {clienteId === null && nuevo.trim() === texto && <CheckCircleIcon size={26} color={colors.primary} weight="fill" />}
                  </Row>
                </Option>
              )}
              {filtrados.map((c) => (
                <Option key={c.id} label={c.nombre} selected={clienteId === c.id} onPress={() => { setClienteId(c.id); setNuevo(''); }}>
                  <Row>
                    <Avatar name={c.nombre} />
                    <View style={{ flex: 1 }}><Sub>{c.nombre}</Sub></View>
                    {clienteId === c.id && <CheckCircleIcon size={26} color={colors.primary} weight="fill" />}
                  </Row>
                </Option>
              ))}
              {clientes.length === 0 && texto === '' && <Body color={colors.muted}>{t('Aún no tienes clientes. Escribe el nombre arriba para crear el primero.')}</Body>}
            </>
          )}

          {paso === 2 && (
            prods.length === 0 ? (
              <View style={{ gap: space.sm }}>
                <Body color={colors.muted}>{t('Primero crea tus productos.')}</Body>
                <Button kind="soft" label={t('Ir a Productos')} onPress={() => router.navigate('/productos')} />
              </View>
            ) : (
              <>
                <Body color={colors.muted}>{t('Toca un producto para agregarlo.')}</Body>
                {cats.map((c) => (
                  <View key={c || 'sin'} style={{ gap: space.sm }}>
                    {cats.length > 1 && <Label color={colors.muted}>{c || t('Sin categoría')}</Label>}
                    {prods.filter((p) => (p.categoria ?? '') === c).map((p) => {
                      const n = qty(p.id);
                      const l = lineas.find((x) => x.producto_id === p.id);
                      return (
                        <Option key={p.id} label={p.nombre} selected={n > 0} onPress={n === 0 ? () => setQty(p, 1) : undefined}>
                          <Row>
                            <View style={{ flex: 1 }}>
                              <Sub>{p.nombre}</Sub>
                              <Small>{money(l ? l.precio_unit : p.precio)} c/u</Small>
                            </View>
                            {n === 0 ? (
                              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
                                <PlusIcon size={20} color={colors.primary} weight="bold" />
                              </View>
                            ) : (
                              <Row>
                                <RoundBtn label={t('Quitar uno')} onPress={() => setQty(p, n - 1)}>
                                  {n > 1 ? <MinusIcon size={20} color={colors.primary} weight="bold" /> : <TrashIcon size={20} color={colors.primary} />}
                                </RoundBtn>
                                <View style={{ minWidth: 24, alignItems: 'center' }}><Sub>{n}</Sub></View>
                                <RoundBtn label={t('Agregar uno')} onPress={() => setQty(p, n + 1)}><PlusIcon size={20} color={colors.primary} weight="bold" /></RoundBtn>
                              </Row>
                            )}
                          </Row>
                          {l && (
                            <View style={{ marginTop: space.sm, gap: space.sm }}>
                              <Tap onPress={() => { animar(); setPrecios(precios === p.id ? null : p.id); }} label={t('Cambiar precios')}>
                                <Label color={colors.primary}>{precios === p.id ? t('Listo') : t('Cambiar precios')}</Label>
                              </Tap>
                              {precios === p.id && (
                                <Row>
                                  <MoneyField label={t('Me cuesta')} value={l.costo_unit} onChange={(v) => cambiar(p.id, { costo_unit: v })} />
                                  <MoneyField label={t('Lo vendo en')} value={l.precio_unit} onChange={(v) => cambiar(p.id, { precio_unit: v })} />
                                </Row>
                              )}
                            </View>
                          )}
                        </Option>
                      );
                    })}
                  </View>
                ))}
              </>
            )
          )}

          {paso === 3 && (
            <>
              <Card>
                <Sub>{t('¿De qué día es el pedido?')}</Sub>
                <FechaCampo valor={fecha} onChange={setFecha} />
              </Card>
              {!editId && (
                <Card>
                  <Sub>{t('¿Ya pagó?')}</Sub>
                  <Segment<Pago> value={pago} onChange={(k) => { animar(); setPago(k); }} options={[{ k: 'no', label: t('No') }, { k: 'todo', label: t('Todo') }, { k: 'parte', label: t('Una parte') }]} />
                  {pago !== 'no' && (
                    <>
                      <Small>{t('¿Con qué pagó?')}</Small>
                      <Row>{MEDIOS.map((m) => <Chip key={m} label={t(m)} on={m === medio} onPress={() => setMedio(m)} />)}</Row>
                    </>
                  )}
                  {pago === 'parte' && <MoneyField label={t('¿Cuánto pagó?')} value={parte} onChange={setParte} />}
                </Card>
              )}
              <Card>
                <Sub>{t('¿Ya se lo entregaste?')}</Sub>
                <Segment<'si' | 'no'> value={entregado ? 'si' : 'no'} onChange={(k) => setEntregado(k === 'si')} options={[{ k: 'no', label: t('Todavía no') }, { k: 'si', label: t('Sí') }]} />
              </Card>
            </>
          )}

          {paso === 4 && (
            <>
              <Bloque titulo={t('Productos')} onCambiar={() => irA(2)}>
                {lineas.map((l) => (
                  <Row key={l.producto_id}>
                    <View style={{ flex: 1 }}><Label>{l.cantidad} × {l.nombre}</Label></View>
                    <Label>{money(l.cantidad * l.precio_unit)}</Label>
                  </Row>
                ))}
                <View style={{ height: 1, backgroundColor: colors.line }} />
                <Row><View style={{ flex: 1 }}><Sub>{t('Total')}</Sub></View><Sub>{money(total)}</Sub></Row>
                <Row><View style={{ flex: 1 }}><Label color={colors.muted}>{t('Tu ganancia')}</Label></View><Label color={colors.primary}>{money(gana)}</Label></Row>
              </Bloque>
              <Bloque titulo={t('Fecha')} onCambiar={() => irA(3)}>
                <Sub>{corta(fecha, t)}</Sub>
              </Bloque>
              {!editId && (
                <Bloque titulo={t('Pago')} onCambiar={() => irA(3)}>
                  <Sub>{pago === 'no' ? t('Todavía no ha pagado') : pago === 'todo' ? t('Pagó todo ({monto}) con {medio}', { monto: money(total), medio: t(medio) }) : t('Pagó {pagado} con {medio} · faltan {falta}', { pagado: money(parte), medio: t(medio), falta: money(total - parte) })}</Sub>
                </Bloque>
              )}
              <Bloque titulo={t('Entrega')} onCambiar={() => irA(3)}>
                <Sub>{entregado ? t('Ya se entregó') : t('Falta entregarlo')}</Sub>
              </Bloque>
            </>
          )}
        </Appear>
      </ScrollView>

      <View style={{ padding: space.lg, gap: space.sm, backgroundColor: colors.bg }}>
        {paso === 2 && lineas.length > 0 && (
          <Row><View style={{ flex: 1 }}><Small>{t('Llevas {n} productos', { n: lineas.reduce((a, l) => a + l.cantidad, 0) })}</Small></View><Sub>{money(total)}</Sub></Row>
        )}
        <Button label={ultimo ? t('Guardar pedido') : t('Continuar')} onPress={ultimo ? guardar : siguiente} />
        {ultimo && <Button kind="ghost" label={t('Volver atrás y corregir')} onPress={atras} />}
      </View>
    </Screen>
  );
}
