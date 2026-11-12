import assert from 'node:assert/strict';
import { test } from 'node:test';
import { crearT } from './idioma.ts';
import { fraseAsistente, fraseCliente, fraseProducto, mensajesInicio, saludoHora, type DatosVoz } from './voz.ts';

const $ = (n: number) => `$${n}`;
const es = crearT('es');
const base: DatosVoz = { pedidos: 3, deudores: [], porEntregar: 0, gananciaMes: 0 };

test('saludo segun la hora', () => {
  assert.equal(saludoHora(7, es), 'Buenos días');
  assert.equal(saludoHora(15, es), 'Buenas tardes');
  assert.equal(saludoHora(21, es), 'Buenas noches');
});

test('sin pedidos la mascota invita a empezar', () => {
  assert.deepEqual(mensajesInicio({ ...base, pedidos: 0 }, $, es), ['Anota tu primer pedido y yo te ayudo a llevar las cuentas.']);
});

test('una persona que debe se nombra; varias se cuentan; las entregas se suman a la misma frase', () => {
  assert.equal(mensajesInicio({ ...base, deudores: [{ nombre: 'Ana', debe: 800 }] }, $, es)[0], 'Ana te debe $800.');
  const varios = { ...base, deudores: [{ nombre: 'Ana', debe: 800 }, { nombre: 'Beto', debe: 200 }], porEntregar: 3 };
  assert.equal(mensajesInicio(varios, $, es)[0], '2 personas te deben $1000 y faltan 3 pedidos por entregar.');
  assert.equal(mensajesInicio({ ...base, porEntregar: 1 }, $, es)[0], 'Falta 1 pedido por entregar.');
});

test('todo al dia y los mensajes extra solo salen si hay algo que decir', () => {
  assert.deepEqual(mensajesInicio(base, $, es), ['Todo al día, ¡buen trabajo!']);
  const todo = mensajesInicio({ ...base, gananciaMes: 5000 }, $, es);
  assert.deepEqual(todo, ['Todo al día, ¡buen trabajo!', 'Este mes llevas $5000 de ganancia.']);
  assert.equal(mensajesInicio({ ...base, deudores: [{ nombre: 'Ana', debe: 0 }] }, $, es)[0], 'Todo al día, ¡buen trabajo!'); // a zero debt isn't a debt
});

test('frases mientras se llena algo: una por parte y cambian con el avance', () => {
  assert.equal(fraseAsistente(1, false, es), '¿Para quién anotamos?');
  assert.equal(fraseAsistente(2, false, es), 'Anotando… ¿qué pidió?');
  assert.equal(fraseAsistente(3, false, es), 'Ya casi… ¿cómo va el pago?');
  assert.equal(fraseAsistente(3, true, es), 'Ya casi… ¿ya se entregó?'); // editing has no payment question
  assert.equal(fraseAsistente(4, false, es), '¡Último vistazo y lo guardo!');
  for (let paso = 1; paso <= 4; paso++) assert.ok(fraseAsistente(paso, false, es).length > 0 && fraseAsistente(paso, true, es).length > 0);
  assert.notEqual(fraseCliente(false, es), fraseCliente(true, es));
  assert.equal(new Set([fraseProducto(false, false, es), fraseProducto(true, false, es), fraseProducto(true, true, es)]).size, 3);
});
