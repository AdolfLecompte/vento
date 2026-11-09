import assert from 'node:assert/strict';
import { test } from 'node:test';
import { base } from './db-memoria.ts';
import { migrate } from './db.ts';
import { aplicarTablas, armarRespaldo, leerTablas, validarRespaldo } from './respaldo.ts';

const SEMILLA = `
  INSERT INTO clientes VALUES (1,'Ana','300'),(2,'Beto',NULL);
  INSERT INTO productos(id,nombre,costo,precio,categoria) VALUES (1,'Arepas',1000,1500,'Comida'),(2,'Jugo',500,900,NULL);
  INSERT INTO pedidos VALUES (1,1,'2026-11-08',0),(2,2,'2026-11-07',1);
  INSERT INTO pedido_items VALUES (1,1,1,2,1000,1500),(2,1,2,1,500,900),(3,2,2,3,500,900);
  INSERT INTO pagos VALUES (1,1,1000,'Efectivo','2026-11-08');
`;

test('respaldo real: copiar y restaurar en otra base deja las tablas identicas', async () => {
  const a = base(); await migrate(a.db as never); a.sq.exec(SEMILLA);
  const original = await leerTablas(a.db);
  const archivo = armarRespaldo(original, '2026-11-08'); // what gets written to disk

  const b = base(); await migrate(b.db as never);
  b.sq.exec("INSERT INTO clientes VALUES (9,'Basura',NULL)"); // restoring REPLACES what was there
  await aplicarTablas(b.db, validarRespaldo(archivo));
  assert.deepEqual(await leerTablas(b.db), original);
});

test('respaldo real: una copia con referencias rotas se rechaza y no toca los datos', async () => {
  const a = base(); await migrate(a.db as never); a.sq.exec(SEMILLA);
  const antes = await leerTablas(a.db);
  const rota = JSON.parse(armarRespaldo(antes, 'x'));
  rota.pedido_items[0].pedido_id = 999; // an item whose order doesn't exist
  await assert.rejects(aplicarTablas(a.db, validarRespaldo(JSON.stringify(rota))), /dañada/);
  assert.deepEqual(await leerTablas(a.db), antes);
});

test('respaldo real: restaurar en una base vacia y con cero filas funciona', async () => {
  const a = base(); await migrate(a.db as never);
  const vacia = await leerTablas(a.db);
  const b = base(); await migrate(b.db as never); b.sq.exec(SEMILLA);
  await aplicarTablas(b.db, validarRespaldo(armarRespaldo(vacia, 'x')));
  assert.deepEqual(await leerTablas(b.db), vacia);
});
