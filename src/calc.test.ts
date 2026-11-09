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
