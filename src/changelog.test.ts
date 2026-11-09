import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { CHANGELOG } from './changelog.ts';

test('la version mas reciente del changelog coincide con app.json', () => {
  const { version } = JSON.parse(readFileSync(new URL('../app.json', import.meta.url), 'utf8')).expo;
  assert.equal(CHANGELOG[0].version, version);
});

test('cada entrada esta completa en espanol e ingles', () => {
  for (const e of CHANGELOG) {
    assert.ok(e.es.titulo && e.en.titulo, `${e.version}: falta el titulo`);
    assert.ok(e.es.cambios.length > 0);
    assert.equal(e.en.cambios.length, e.es.cambios.length, `${e.version}: distinto numero de cambios`);
    assert.ok([...e.es.cambios, ...e.en.cambios].every((c) => c.trim().length > 0));
  }
});
