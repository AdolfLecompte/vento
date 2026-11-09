import type { SQLiteDatabase } from 'expo-sqlite';

// Nequi/Daviplata are transfers too; old payments saved with those names still display.
export const MEDIOS = ['Efectivo', 'Transferencia'];

export type Producto = { id: number; nombre: string; costo: number; precio: number; categoria: string | null };
export type Cliente = { id: number; nombre: string; telefono: string | null };
export type PedidoRow = {
  id: number;
  fecha: string;
  entregado: number;
  cliente: string;
  total: number;
  costo: number;
  pagado: number;
};
export type ItemRow = {
  id: number;
  producto: string;
  cantidad: number;
  costo_unit: number;
  precio_unit: number;
};
export type PagoRow = { id: number; monto: number; medio: string; fecha: string };

export const hoy = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

export async function migrate(db: SQLiteDatabase) {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS clientes(id INTEGER PRIMARY KEY, nombre TEXT NOT NULL, telefono TEXT);
    CREATE TABLE IF NOT EXISTS productos(id INTEGER PRIMARY KEY, nombre TEXT NOT NULL, costo INTEGER NOT NULL, precio INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS pedidos(id INTEGER PRIMARY KEY, cliente_id INTEGER NOT NULL REFERENCES clientes(id), fecha TEXT NOT NULL, entregado INTEGER NOT NULL DEFAULT 0);
    CREATE TABLE IF NOT EXISTS pedido_items(id INTEGER PRIMARY KEY, pedido_id INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE, producto_id INTEGER NOT NULL REFERENCES productos(id), cantidad INTEGER NOT NULL, costo_unit INTEGER NOT NULL, precio_unit INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS pagos(id INTEGER PRIMARY KEY, pedido_id INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE, monto INTEGER NOT NULL, medio TEXT NOT NULL, fecha TEXT NOT NULL);
  `);
  // v3: settings (key/value) and indexes: every order row sums its items and payments, so look them up by order.
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS ajustes(clave TEXT PRIMARY KEY, valor TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS ix_items_pedido ON pedido_items(pedido_id);
    CREATE INDEX IF NOT EXISTS ix_pagos_pedido ON pagos(pedido_id);
    CREATE INDEX IF NOT EXISTS ix_pedidos_cliente ON pedidos(cliente_id);
  `);
  // v2: product categories. Older databases get the column added once.
  const cols = await db.getAllAsync<{ name: string }>('PRAGMA table_info(productos)');
  if (!cols.some((c) => c.name === 'categoria')) await db.execAsync('ALTER TABLE productos ADD COLUMN categoria TEXT');
}

const PEDIDO_SELECT = `
  SELECT p.id, p.fecha, p.entregado, c.nombre AS cliente,
    COALESCE((SELECT SUM(cantidad*precio_unit) FROM pedido_items WHERE pedido_id=p.id),0) AS total,
    COALESCE((SELECT SUM(cantidad*costo_unit) FROM pedido_items WHERE pedido_id=p.id),0) AS costo,
    COALESCE((SELECT SUM(monto) FROM pagos WHERE pedido_id=p.id),0) AS pagado
  FROM pedidos p JOIN clientes c ON c.id=p.cliente_id`;

export const listPedidos = (db: SQLiteDatabase) =>
  db.getAllAsync<PedidoRow>(`${PEDIDO_SELECT} ORDER BY p.id DESC`);

export const getPedido = (db: SQLiteDatabase, id: number) =>
  db.getFirstAsync<PedidoRow>(`${PEDIDO_SELECT} WHERE p.id=?`, id);

export const listItems = (db: SQLiteDatabase, pedido: number) =>
  db.getAllAsync<ItemRow>(
    `SELECT i.id, pr.nombre AS producto, i.cantidad, i.costo_unit, i.precio_unit
     FROM pedido_items i JOIN productos pr ON pr.id=i.producto_id WHERE i.pedido_id=? ORDER BY i.id`,
    pedido,
  );

export const listPagos = (db: SQLiteDatabase, pedido: number) =>
  db.getAllAsync<PagoRow>('SELECT id, monto, medio, fecha FROM pagos WHERE pedido_id=? ORDER BY id', pedido);

export const listProductos = (db: SQLiteDatabase) =>
  db.getAllAsync<Producto>('SELECT * FROM productos ORDER BY nombre');

export const listClientes = (db: SQLiteDatabase) =>
  db.getAllAsync<Cliente>('SELECT * FROM clientes ORDER BY nombre');

// Per-product profit since `desde` (ISO date, '' = everything).
export const gananciaPorProducto = (db: SQLiteDatabase, desde: string) =>
  db.getAllAsync<{ nombre: string; unidades: number; ganancia: number }>(
    `SELECT pr.nombre, SUM(i.cantidad) AS unidades, SUM(i.cantidad*(i.precio_unit-i.costo_unit)) AS ganancia
     FROM pedido_items i JOIN productos pr ON pr.id=i.producto_id JOIN pedidos p ON p.id=i.pedido_id
     WHERE p.fecha >= ? GROUP BY pr.id ORDER BY ganancia DESC`,
    desde,
  );

export type Linea = { producto_id: number; nombre: string; cantidad: number; costo_unit: number; precio_unit: number };
export type Borrador = {
  clienteId: number | null;
  clienteNuevo: string;
  lineas: Linea[];
  entregado: boolean;
  pago: { monto: number; medio: string } | null; // only when creating
};

// Saves a whole order at once (new or edited): either everything is written or nothing.
export async function guardarPedido(db: SQLiteDatabase, b: Borrador, editId?: number): Promise<number> {
  let id = editId ?? 0;
  await db.withTransactionAsync(async () => {
    let cliente = b.clienteId;
    if (cliente === null) cliente = (await db.runAsync('INSERT INTO clientes(nombre) VALUES(?)', b.clienteNuevo.trim())).lastInsertRowId;
    if (editId) {
      await db.runAsync('UPDATE pedidos SET cliente_id=?, entregado=? WHERE id=?', cliente, b.entregado ? 1 : 0, editId);
      await db.runAsync('DELETE FROM pedido_items WHERE pedido_id=?', editId);
    } else {
      id = (await db.runAsync('INSERT INTO pedidos(cliente_id, fecha, entregado) VALUES(?,?,?)', cliente, hoy(), b.entregado ? 1 : 0)).lastInsertRowId;
    }
    for (const l of b.lineas) {
      await db.runAsync(
        'INSERT INTO pedido_items(pedido_id, producto_id, cantidad, costo_unit, precio_unit) VALUES(?,?,?,?,?)',
        id, l.producto_id, l.cantidad, l.costo_unit, l.precio_unit,
      );
    }
    if (b.pago && b.pago.monto > 0) {
      await db.runAsync('INSERT INTO pagos(pedido_id, monto, medio, fecha) VALUES(?,?,?,?)', id, b.pago.monto, b.pago.medio, hoy());
    }
  });
  return id;
}

// Deleting a client also deletes their orders (and, by cascade, items and payments).
export async function borrarCliente(db: SQLiteDatabase, id: number) {
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM pedidos WHERE cliente_id=?', id);
    await db.runAsync('DELETE FROM clientes WHERE id=?', id);
  });
}

export const pedidosDeCliente = (db: SQLiteDatabase, cliente: number) =>
  db.getAllAsync<PedidoRow>(`${PEDIDO_SELECT} WHERE p.cliente_id=? ORDER BY p.id DESC`, cliente);

export async function getAjuste(db: SQLiteDatabase, clave: string, def: string) {
  return (await db.getFirstAsync<{ valor: string }>('SELECT valor FROM ajustes WHERE clave=?', clave))?.valor ?? def;
}
export const setAjuste = (db: SQLiteDatabase, clave: string, valor: string) =>
  db.runAsync('INSERT INTO ajustes(clave, valor) VALUES(?,?) ON CONFLICT(clave) DO UPDATE SET valor=excluded.valor', clave, valor);

// Clients with money pending, biggest debt first (used by the reminder). Counted per order: an order paid
// too much never cancels what the same client still owes on another one.
export const listDeudores = (db: SQLiteDatabase) =>
  db.getAllAsync<{ nombre: string; debe: number }>(
    `SELECT c.nombre, SUM(MAX(0, t.total - t.pagado)) AS debe FROM clientes c
     JOIN (SELECT p.cliente_id,
       COALESCE((SELECT SUM(cantidad*precio_unit) FROM pedido_items WHERE pedido_id=p.id),0) AS total,
       COALESCE((SELECT SUM(monto) FROM pagos WHERE pedido_id=p.id),0) AS pagado FROM pedidos p) t ON t.cliente_id=c.id
     GROUP BY c.id HAVING debe > 0 ORDER BY debe DESC`,
  );

// Clients with undelivered orders and how many, most first (used by the reminder).
export const listPorEntregar = (db: SQLiteDatabase) =>
  db.getAllAsync<{ nombre: string; n: number }>(
    `SELECT c.nombre, COUNT(*) AS n FROM pedidos p JOIN clientes c ON c.id=p.cliente_id
     WHERE p.entregado=0 GROUP BY c.id ORDER BY n DESC, c.nombre`,
  );
