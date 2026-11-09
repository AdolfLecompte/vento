import assert from 'node:assert/strict';
import { test } from 'node:test';
import { crearT } from './idioma.ts';
import { armarAviso, esIdAviso, hora12, idAviso, proximasFechas } from './aviso-calc.ts';

const $ = (n: number) => `$${n}`;
const es = crearT('es');

test('hora12 formatea en 12 horas', () => {
  assert.equal(hora12(0, es), '12:00 a. m.');
  assert.equal(hora12(18 * 60 + 30, es), '6:30 p. m.');
  assert.equal(hora12(12 * 60, es), '12:00 p. m.');
});

test('proximasFechas salta hoy si la hora ya paso', () => {
  const ahora = new Date(2026, 10, 8, 19, 0); // 7:00 p. m.
  const f = proximasFechas(18 * 60, ahora, 3);
  assert.equal(f.length, 3);
  assert.equal(f[0].getDate(), 9);
  assert.equal(f[0].getHours(), 18);
  assert.equal(proximasFechas(20 * 60, ahora, 1)[0].getDate(), 8);
});

test('aviso: una persona vs varias, singular y plural', () => {
  const uno = armarAviso([{ nombre: 'Ana', debe: 100 }], [], { deben: true, entregas: true }, $, es)!;
  assert.equal(uno.titulo, '1 persona te debe $100');
  assert.equal(uno.cuerpo, 'Ana: $100');
  const varios = armarAviso([{ nombre: 'Ana', debe: 100 }, { nombre: 'Beto', debe: 500 }], [], { deben: true, entregas: true }, $, es)!;
  assert.equal(varios.titulo, '2 personas te deben $600');
  assert.equal(varios.cuerpo, 'Beto: $500\nAna: $100'); // biggest debt first
});

test('aviso: con deudas y entregas rotula las dos secciones y cuenta pedidos', () => {
  const a = armarAviso(
    [{ nombre: 'Ana', debe: 100 }],
    [{ nombre: 'Pedro', n: 2 }, { nombre: 'Luz', n: 1 }],
    { deben: true, entregas: true }, $, es,
  )!;
  assert.equal(a.titulo, '1 persona te debe $100');
  assert.equal(a.cuerpo, 'Te deben\nAna: $100\nPor entregar (3)\nPedro: 2 pedidos\nLuz: 1 pedido');
});

test('aviso: solo entregas usa su propio titulo y concuerda el plural', () => {
  assert.equal(armarAviso([], [{ nombre: 'Luz', n: 1 }], { deben: true, entregas: true }, $, es)!.titulo, 'Tienes 1 pedido por entregar');
  assert.equal(armarAviso([], [{ nombre: 'Luz', n: 1 }, { nombre: 'Pedro', n: 4 }], { deben: true, entregas: true }, $, es)!.titulo, 'Tienes 5 pedidos por entregar');
});

test('aviso: con muchisimos resultados corta en 3 y suma el resto', () => {
  const muchos = Array.from({ length: 40 }, (_, i) => ({ nombre: `C${i}`, debe: 100 + i }));
  const a = armarAviso(muchos, [], { deben: true, entregas: true }, $, es)!;
  assert.equal(a.cuerpo.split('\n').length, 4); // 3 names + "y 37 personas más"
  assert.ok(a.cuerpo.endsWith('y 37 personas más'));
  assert.equal(a.titulo.startsWith('40 personas te deben'), true);
  const pedidos = Array.from({ length: 12 }, (_, i) => ({ nombre: `C${i}`, n: 2 }));
  const b = armarAviso([], pedidos, { deben: true, entregas: true }, $, es)!;
  assert.equal(b.titulo, 'Tienes 24 pedidos por entregar');
  assert.ok(b.cuerpo.endsWith('y 9 personas más'));
  assert.ok(armarAviso(muchos.slice(0, 4), [], { deben: true, entregas: true }, $, es)!.cuerpo.endsWith('y 1 persona más'));
});

test('aviso: respeta las opciones y calla si no hay nada', () => {
  const ds = [{ nombre: 'Ana', debe: 100 }];
  assert.equal(armarAviso(ds, [], { deben: false, entregas: true }, $, es), null);
  assert.equal(armarAviso([], [], { deben: true, entregas: true }, $, es), null);
  assert.equal(armarAviso(ds, [{ nombre: 'Luz', n: 1 }], { deben: false, entregas: true }, $, es)!.titulo, 'Tienes 1 pedido por entregar');
});

test('ids de aviso: uno por dia y solo los nuestros se reconocen', () => {
  assert.equal(idAviso(new Date(2026, 10, 8, 18, 0)), 'aviso-2026-11-08');
  assert.equal(esIdAviso('aviso-2026-11-08'), true);
  assert.equal(esIdAviso('prueba'), false); // the test notification must never be cancelled by a reschedule
});
