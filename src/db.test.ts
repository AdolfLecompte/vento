import assert from 'node:assert/strict';
import { test } from 'node:test';
import { base } from './db-memoria.ts';
import { borrarCliente, getPedido, guardarPedido, listDeudores, listPorEntregar, migrate, porPrepararPorProducto, type Linea } from './db.ts';

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

test('por preparar: solo lo sin entregar, por producto, con costo y venta, y filtra por fechas', async () => {
  const { sq, db } = await nueva();
  sq.exec(`
    INSERT INTO pedidos VALUES (1,1,'2026-11-02',0),(2,2,'2026-11-04',0),(3,1,'2026-11-05',1),(4,2,'2026-10-20',0);
    INSERT INTO pedido_items VALUES (1,1,1,2,1000,1500),(2,2,1,1,1000,1500),(3,2,2,4,500,900),(4,3,1,9,1000,1500),(5,4,2,1,500,900);
  `);
  assert.deepEqual(await porPrepararPorProducto(db, '2026-11-02', '2026-11-08'), [
    { nombre: 'Arepas', unidades: 3, costo: 3000, venta: 4500 },
    { nombre: 'Jugo', unidades: 4, costo: 2000, venta: 3600 },
  ]); // the delivered order and the old one stay out
  assert.equal((await porPrepararPorProducto(db, '', '9999-12-31')).find((p) => p.nombre === 'Jugo')?.unidades, 5);
});
