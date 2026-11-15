import assert from 'node:assert/strict';
import { test } from 'node:test';
import { base } from './db-memoria.ts';
import { borrarCliente, getPedido, guardarPedido, lineasParaRepetir, listClientesConDeuda, listDeudores, listPorEntregar, migrate, porPrepararPorProducto, type Linea } from './db.ts';

async function nueva() {
  const { sq, db } = base();
  await migrate(db as never);
  sq.exec(`
    INSERT INTO clientes(id,nombre) VALUES (1,'Ana'),(2,'Beto');
    INSERT INTO productos(id,nombre,costo,precio,categoria) VALUES (1,'Arepas',1000,1500,NULL),(2,'Jugo',500,900,NULL);
  `);
  const filas = (sql: string) => sq.prepare(sql).all().map((r) => ({ ...r })) as Record<string, number>[];
  return { sq, db: db as never, filas };
}
const linea = (producto_id: number, cantidad: number, costo_unit: number, precio_unit: number): Linea =>
  ({ producto_id, nombre: 'x', cantidad, costo_unit, precio_unit });

test('deuda: un pedido pagado de mas no descuenta lo que el cliente debe en otro', async () => {
  const { sq, db } = await nueva();
  sq.exec(`
    INSERT INTO pedidos VALUES (1,1,'2026-11-01',1),(2,1,'2026-11-02',1),(3,2,'2026-11-02',0);
    INSERT INTO pedido_items VALUES (1,1,1,1,1000,1000),(2,2,2,1,500,800),(3,3,2,1,500,800);
    INSERT INTO pagos VALUES (1,1,1500,'Efectivo','2026-11-01');
  `);
  assert.deepEqual(await listDeudores(db), [{ nombre: 'Ana', debe: 800 }]); // not 300, and Beto's undelivered order is not a debt
});

test('por entregar: cuenta pedidos sin entregar por cliente, mayor primero', async () => {
  const { sq, db } = await nueva();
  sq.exec(`INSERT INTO pedidos VALUES (1,1,'2026-11-01',0),(2,1,'2026-11-02',0),(3,2,'2026-11-03',0),(4,2,'2026-11-04',1);`);
  assert.deepEqual(await listPorEntregar(db), [{ nombre: 'Ana', n: 2 }, { nombre: 'Beto', n: 1 }]);
});

test('guardarPedido: crea cliente nuevo, lineas y pago, y los totales cuadran', async () => {
  const { db, filas } = await nueva();
  const id = await guardarPedido(db, { clienteId: null, clienteNuevo: '  Cami ', fecha: '2026-11-08', lineas: [linea(1, 2, 1000, 1500)], entregado: false, pago: { monto: 1000, medio: 'Efectivo' } });
  assert.equal(filas("SELECT nombre FROM clientes WHERE nombre='Cami'").length, 1); // trimmed
  const p = await getPedido(db, id);
  assert.deepEqual([p?.total, p?.costo, p?.pagado, p?.cliente], [3000, 2000, 1000, 'Cami']);
});

test('guardarPedido: si una linea falla se deshace todo, tambien el cliente nuevo', async () => {
  const { db, filas } = await nueva();
  await assert.rejects(guardarPedido(db, { clienteId: null, clienteNuevo: 'Fantasma', fecha: '2026-11-08', lineas: [linea(999, 1, 1, 1)], entregado: false, pago: null }));
  assert.equal(filas("SELECT 1 FROM clientes WHERE nombre='Fantasma'").length, 0);
  assert.equal(filas('SELECT 1 FROM pedidos').length, 0);
});

test('guardarPedido: editar reemplaza las lineas y deja los pagos como estaban', async () => {
  const { db } = await nueva();
  const id = await guardarPedido(db, { clienteId: 1, clienteNuevo: '', fecha: '2026-11-08', lineas: [linea(1, 2, 1000, 1500)], entregado: false, pago: { monto: 1000, medio: 'Efectivo' } });
  await guardarPedido(db, { clienteId: 2, clienteNuevo: '', fecha: '2026-11-08', lineas: [linea(2, 1, 500, 900)], entregado: true, pago: null }, id);
  const p = await getPedido(db, id);
  assert.deepEqual([p?.total, p?.pagado, p?.cliente, p?.entregado], [900, 1000, 'Beto', 1]);
});

test('borrarCliente: se lleva sus pedidos, lineas y pagos y respeta a los demas', async () => {
  const { db, filas } = await nueva();
  await guardarPedido(db, { clienteId: 1, clienteNuevo: '', fecha: '2026-11-08', lineas: [linea(1, 1, 1000, 1500)], entregado: false, pago: { monto: 500, medio: 'Efectivo' } });
  await guardarPedido(db, { clienteId: 2, clienteNuevo: '', fecha: '2026-11-08', lineas: [linea(2, 1, 500, 900)], entregado: false, pago: null });
  await borrarCliente(db, 1);
  assert.deepEqual(filas('SELECT id FROM clientes'), [{ id: 2 }]);
  assert.equal(filas('SELECT 1 FROM pedidos').length, 1);
  assert.equal(filas('SELECT 1 FROM pedido_items').length, 1);
  assert.equal(filas('SELECT 1 FROM pagos').length, 0);
});

test('fecha: un pedido se puede anotar con otro dia, su pago lleva ese dia, y editar la cambia', async () => {
  const { db, filas } = await nueva();
  const id = await guardarPedido(db, { clienteId: 1, clienteNuevo: '', fecha: '2026-10-30', lineas: [linea(1, 1, 1000, 1500)], entregado: false, pago: { monto: 500, medio: 'Efectivo' } });
  assert.equal((await getPedido(db, id))?.fecha, '2026-10-30');
  assert.deepEqual(filas('SELECT fecha FROM pagos'), [{ fecha: '2026-10-30' }]);
  await guardarPedido(db, { clienteId: 1, clienteNuevo: '', fecha: '2026-11-02', lineas: [linea(1, 1, 1000, 1500)], entregado: false, pago: null }, id);
  assert.equal((await getPedido(db, id))?.fecha, '2026-11-02');
});

test('busqueda: el pedido trae los nombres de sus productos', async () => {
  const { db } = await nueva();
  const id = await guardarPedido(db, { clienteId: 1, clienteNuevo: '', fecha: '2026-11-08', lineas: [linea(1, 1, 1000, 1500), linea(2, 2, 500, 900)], entregado: false, pago: null });
  assert.equal((await getPedido(db, id))?.productos, 'Arepas · Jugo');
});

test('por preparar: todo el rango (entregado o no), pendientes aparte, costo de hoy en lo pendiente', async () => {
  const { sq, db } = await nueva();
  sq.exec(`
    INSERT INTO pedidos VALUES (1,1,'2026-11-02',0),(2,2,'2026-11-04',0),(3,1,'2026-11-05',1),(4,2,'2026-10-20',0);
    INSERT INTO pedido_items VALUES (1,1,1,2,900,1500),(2,2,1,1,900,1500),(3,2,2,4,500,900),(4,3,1,9,800,1500),(5,4,2,1,500,900);
  `);
  // Arepas cost 1000 today: the 3 pending units use it (not the 900 saved), the 9 delivered keep the 800 saved with the order.
  assert.deepEqual(await porPrepararPorProducto(db, '2026-11-02', '2026-11-08'), [
    { nombre: 'Arepas', unidades: 12, pendientes: 3, costo: 3 * 1000 + 9 * 800, venta: 18000 },
    { nombre: 'Jugo', unidades: 4, pendientes: 4, costo: 2000, venta: 3600 },
  ]); // the old order (October) stays out
  assert.equal((await porPrepararPorProducto(db, '', '9999-12-31')).find((p) => p.nombre === 'Jugo')?.unidades, 5);
});

test('deuda: la pestana Clientes, el recordatorio y la suma por pedido dan lo mismo', async () => {
  const { sq, db } = await nueva();
  sq.exec(`
    INSERT INTO clientes(id,nombre) VALUES (3,'Cris');
    INSERT INTO pedidos VALUES (1,1,'2026-11-01',1),(2,1,'2026-11-02',0),(3,2,'2026-11-03',1),(4,2,'2026-11-04',1),(5,3,'2026-11-05',0);
    INSERT INTO pedido_items VALUES (1,1,1,2,1000,1500),(2,2,1,1,1000,1500),(3,3,2,2,500,900),(4,4,2,1,500,900),(5,5,1,1,1000,1500);
    INSERT INTO pagos VALUES (1,1,1000,'Efectivo','2026-11-01'),(2,3,2000,'Efectivo','2026-11-03'),(3,2,1500,'Efectivo','2026-11-02');
  `);
  const clientes = await listClientesConDeuda(db);
  const deben = Object.fromEntries(clientes.map((c) => [c.nombre, c.debe]));
  // Ana: order 1 delivered owes 3000-1000; order 2 not delivered (fully prepaid) owes nothing. Beto: order 3 overpaid owes 0, order 4 owes 900. Cris: only an undelivered order.
  assert.deepEqual(deben, { Ana: 2000, Beto: 900, Cris: 0 });
  assert.equal(clientes.find((c) => c.nombre === 'Ana')?.pedidos, 2);
  const recordatorio = Object.fromEntries((await listDeudores(db)).map((d) => [d.nombre, d.debe]));
  assert.deepEqual(recordatorio, { Ana: 2000, Beto: 900 }); // same numbers, and nobody with 0
});

test('repetir pedido: mismo precio pactado, costo de hoy, en el mismo orden', async () => {
  const { sq, db } = await nueva();
  sq.exec(`
    INSERT INTO pedidos VALUES (1,1,'2026-11-01',1);
    INSERT INTO pedido_items VALUES (1,1,1,2,900,1400),(2,1,2,3,400,800);
    UPDATE productos SET costo=1200 WHERE id=1;
  `);
  assert.deepEqual(await lineasParaRepetir(db, 1), [
    { producto_id: 1, nombre: 'Arepas', cantidad: 2, costo_unit: 1200, precio_unit: 1400 }, // today's cost, the old price
    { producto_id: 2, nombre: 'Jugo', cantidad: 3, costo_unit: 500, precio_unit: 800 },
  ]);
  assert.deepEqual(await lineasParaRepetir(db, 99), []);
});

test('por preparar: un pedido pagado pero sin entregar cuenta como pendiente', async () => {
  const { sq, db } = await nueva();
  sq.exec(`
    INSERT INTO pedidos VALUES (1,1,'2026-11-10',0);
    INSERT INTO pedido_items VALUES (1,1,2,4,500,900);
    INSERT INTO pagos VALUES (1,1,3600,'Efectivo','2026-11-10');
  `);
  const [fila] = await porPrepararPorProducto(db, '2026-11-09', '2026-11-15');
  assert.deepEqual(fila, { nombre: 'Jugo', unidades: 4, pendientes: 4, costo: 2000, venta: 3600 });
});
