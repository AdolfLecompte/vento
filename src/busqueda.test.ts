import assert from 'node:assert/strict';
import { test } from 'node:test';
import { coincide, normalizar } from './busqueda.ts';

test('normalizar quita acentos, mayusculas y espacios de mas', () => {
  assert.equal(normalizar('  María   PÉREZ '), 'maria perez');
  assert.equal(normalizar('Ñandú'), 'nandu');
});

test('coincide: sin texto todo coincide; con texto deben estar todas las palabras', () => {
  assert.equal(coincide('', 'cualquier cosa'), true);
  assert.equal(coincide('   ', 'cualquier cosa'), true);
  assert.equal(coincide('maria', 'María Pérez', '300'), true); // accents don't matter
  assert.equal(coincide('perez maria', 'María Pérez'), true); // order doesn't matter
  assert.equal(coincide('maria lopez', 'María Pérez'), false); // every word must appear
  assert.equal(coincide('arepa', 'Pedro', 'Arepas x10 · Jugo'), true); // looks in every field
});

test('coincide ignora campos vacios y acepta numeros', () => {
  assert.equal(coincide('30000', 'Ana', null, undefined, 30000), true);
  assert.equal(coincide('xyz', 'Ana', null, undefined), false);
});
