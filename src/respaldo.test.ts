import assert from 'node:assert/strict';
import { test } from 'node:test';
import { crearT } from './idioma.ts';
import { armarRespaldo, csvVentas, cuando, delMismoDia, esCopia, horaCorta, masNuevaPrimero, nombreCopia, sobrantes, toca, validarRespaldo, type Tablas } from './respaldo.ts';

const t: Tablas = {
  clientes: [{ id: 1, nombre: 'Ana', telefono: null }],
  productos: [{ id: 1, nombre: 'Arepas "x10"', costo: 1000, precio: 1500, categoria: 'Comida' }],
  pedidos: [{ id: 1, cliente_id: 1, fecha: '2026-11-08', entregado: 0 }],
  pedido_items: [{ id: 1, pedido_id: 1, producto_id: 1, cantidad: 2, costo_unit: 1000, precio_unit: 1500 }],
  pagos: [{ id: 1, pedido_id: 1, monto: 500, medio: 'Nequi', fecha: '2026-11-08' }],
};

test('respaldo: ida y vuelta', () => {
  assert.deepEqual(validarRespaldo(armarRespaldo(t, '2026-11-08')), t);
});

test('respaldo: rechaza archivos ajenos o con tipos malos', () => {
  assert.throws(() => validarRespaldo('no es json'));
  assert.throws(() => validarRespaldo('{"app":"otra"}'));
  const mal = JSON.parse(armarRespaldo(t, 'x'));
  mal.pagos[0].monto = '500';
  assert.throws(() => validarRespaldo(JSON.stringify(mal)));
  delete mal.pagos;
  assert.throws(() => validarRespaldo(JSON.stringify(mal)));
});

test('respaldo: acepta copias viejas sin categoria', () => {
  const viejo = JSON.parse(armarRespaldo(t, 'x'));
  delete viejo.productos[0].categoria;
  assert.equal(validarRespaldo(JSON.stringify(viejo)).productos[0].categoria, null);
});

test('csv: escapa comillas y calcula total y ganancia', () => {
  const csv = csvVentas([{ pedido: 1, fecha: '2026-11-08', cliente: 'Ana', producto: 'Arepas "x10"', cantidad: 2, costo_unit: 1000, precio_unit: 1500, entregado: 1 }], es);
  assert.ok(csv.includes('"Arepas ""x10"""'));
  assert.ok(csv.endsWith(';3000;1000;sí'));
});

const es = crearT('es');
const at = (y: number, m: number, d: number, h = 12) => new Date(y, m - 1, d, h).getTime();

test('copia automatica: cuando toca segun la frecuencia', () => {
  assert.equal(toca(null, 'semana', at(2026, 11, 8)), true);
  assert.equal(toca(at(2026, 11, 8, 8), 'dia', at(2026, 11, 8, 23)), false); // same day
  assert.equal(toca(at(2026, 11, 7, 23), 'dia', at(2026, 11, 8, 7)), true); // next calendar day, only 8 hours later
  assert.equal(toca(at(2026, 11, 1), 'semana', at(2026, 11, 7)), false);
  assert.equal(toca(at(2026, 11, 1), 'semana', at(2026, 11, 8)), true);
  assert.equal(toca(at(2026, 10, 9), 'mes', at(2026, 11, 7)), false);
  assert.equal(toca(at(2026, 10, 9), 'mes', at(2026, 11, 8)), true);
});

test('copia automatica: texto de cuando fue la ultima', () => {
  const hoy = at(2026, 11, 8);
  assert.equal(cuando(at(2026, 11, 8, 1), hoy, es), 'hoy');
  assert.equal(cuando(at(2026, 11, 7, 23), hoy, es), 'ayer');
  assert.equal(cuando(at(2026, 11, 3), hoy, es), 'hace 5 días');
});

test('carpeta vento: nombres y limpieza solo de nuestras copias', () => {
  assert.equal(nombreCopia('2026-11-08'), 'vento-2026-11-08.json');
  assert.equal(esCopia('vento-2026-11-08.json'), true);
  assert.equal(esCopia('vento-2026-11-08 (1).json'), false);
  assert.equal(esCopia('notas.json'), false);
  const nombres = ['notas.json', ...Array.from({ length: 12 }, (_, i) => `vento-2026-11-${String(i + 1).padStart(2, '0')}.json`)];
  assert.deepEqual(sobrantes(nombres, 10), ['vento-2026-11-02.json', 'vento-2026-11-01.json']); // the 2 oldest; notas.json untouched
  assert.deepEqual(sobrantes(nombres.slice(0, 4), 10), []);
});

test('copias con hora: nombre, orden mezclado con el formato viejo y limpieza del mismo dia', () => {
  assert.equal(horaCorta(new Date(2026, 10, 8, 7, 5, 9)), '070509');
  assert.equal(nombreCopia('2026-11-08', '173005'), 'vento-2026-11-08-173005.json');
  assert.equal(esCopia('vento-2026-11-08-173005.json'), true);
  assert.equal(esCopia('vento-2026-11-08-1730.json'), false);
  const dia = ['vento-2026-11-08.json', 'vento-2026-11-08-090000.json', 'vento-2026-11-08-173005.json', 'vento-2026-11-07.json'];
  assert.deepEqual([...dia].sort(masNuevaPrimero), ['vento-2026-11-08-173005.json', 'vento-2026-11-08-090000.json', 'vento-2026-11-08.json', 'vento-2026-11-07.json']);
  // the new one stays, older same-day ones go, other days are untouched
  assert.deepEqual(delMismoDia([...dia, 'notas.json'], '2026-11-08', 'vento-2026-11-08-173005.json').sort(), ['vento-2026-11-08-090000.json', 'vento-2026-11-08.json']);
});
