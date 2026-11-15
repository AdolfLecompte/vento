import assert from 'node:assert/strict';
import { test } from 'node:test';
import { bloqueado, completo, estadoDe, ganancia, total } from './calc.ts';

const items = [
  { cantidad: 2, costo: 1000, precio: 1500 },
  { cantidad: 3, costo: 500, precio: 800 },
];

test('total y ganancia', () => {
  assert.equal(total(items), 5400);
  assert.equal(ganancia(items), 5400 - 3500);
});

test('estados sin pagar, parcial y pagado (incluye sobrepago)', () => {
  assert.equal(estadoDe(total(items), 0), 'sin pagar');
  assert.equal(estadoDe(total(items), 2000), 'parcial');
  assert.equal(estadoDe(total(items), 5400), 'pagado');
  assert.equal(estadoDe(total(items), 6000), 'pagado');
});

test('precio editado en el pedido cambia la ganancia', () => {
  assert.equal(ganancia([{ cantidad: 1, costo: 1000, precio: 900 }]), -100);
});

test('pedido cerrado solo si esta pagado Y entregado', () => {
  assert.equal(bloqueado(1000, 1000, true), true);
  assert.equal(bloqueado(1000, 1500, true), true);
  assert.equal(bloqueado(1000, 1000, false), false);
  assert.equal(bloqueado(1000, 500, true), false);
  assert.equal(bloqueado(0, 0, true), false);
});

test('completo: entregado y pagado, aunque el total sea 0; bloqueado exige ademas que haya algo', () => {
  assert.equal(completo(1000, 1000, true), true);
  assert.equal(completo(1000, 999, true), false);
  assert.equal(completo(1000, 1000, false), false);
  assert.equal(completo(0, 0, true), true); // a free order still moves to the history
  assert.equal(bloqueado(0, 0, true), false); // ...but can still be edited
});

test('deuda: solo lo entregado cuenta, y nunca es negativa', async () => {
  const { deuda } = await import('./calc.ts');
  assert.equal(deuda({ total: 10000, pagado: 0, entregado: 0 }), 0); // not handed over yet: nothing is owed
  assert.equal(deuda({ total: 10000, pagado: 4000, entregado: 1 }), 6000);
  assert.equal(deuda({ total: 10000, pagado: 15000, entregado: 1 }), 0); // overpaid never goes negative
  assert.equal(deuda({ total: 10000, pagado: 10000, entregado: true }), 0);
});

test('resumen: ganancia realizada solo de lo entregado, lo esperado aparte, y cobrado topado al total', async () => {
  const { resumen } = await import('./calc.ts');
  const r = resumen([
    { total: 10000, costo: 6000, pagado: 10000, entregado: 1 }, // delivered and paid
    { total: 10000, costo: 5000, pagado: 3000, entregado: 1 }, // delivered, 3000 paid
    { total: 20000, costo: 12000, pagado: 20000, entregado: 0 }, // prepaid but not delivered: not collected "from the delivered"
    { total: 8000, costo: 4000, pagado: 9000, entregado: 1 }, // overpaid by 1000
  ]);
  assert.deepEqual(r, { pedidos: 4, entregados: 3, ganancia: 4000 + 5000 + 4000, gananciaPendiente: 8000, vendidoEnt: 28000, cobradoEnt: 10000 + 3000 + 8000 });
  assert.deepEqual(resumen([]), { pedidos: 0, entregados: 0, ganancia: 0, gananciaPendiente: 0, vendidoEnt: 0, cobradoEnt: 0 });
});
