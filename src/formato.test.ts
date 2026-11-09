import assert from 'node:assert/strict';
import { test } from 'node:test';
import { miles, money, num } from './formato.ts';

test('miles y money separan con punto', () => {
  assert.equal(miles(1500), '1.500');
  assert.equal(miles(1234567), '1.234.567');
  assert.equal(money(0), '$0');
  assert.equal(money(-2500), '-$2.500');
});

test('num: solo digitos, vacio es 0 y tiene tope de 9 digitos', () => {
  assert.equal(num('1.500'), 1500);
  assert.equal(num('abc'), 0);
  assert.equal(num(''), 0);
  assert.equal(num('12345678901234567890'), 123456789); // cut, never a number past MAX_SAFE_INTEGER
  assert.ok(Number.isSafeInteger(num('9'.repeat(40))));
});
