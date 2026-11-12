import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

// divisas.ts imports the JSON for Metro; here the file is read directly so the test needs no JSON import support.
const divisas: { id: string; simbolo: string; trazos: string[] }[] = JSON.parse(readFileSync(new URL('./divisas.json', import.meta.url), 'utf8'));

test('divisas: ids y simbolos unicos, con trazos de dibujo validos', () => {
  assert.ok(divisas.some((d) => d.id === 'dolar')); // the launcher icon and the default
  assert.equal(new Set(divisas.map((d) => d.id)).size, divisas.length);
  assert.equal(new Set(divisas.map((d) => d.simbolo)).size, divisas.length);
  for (const d of divisas) {
    assert.ok(d.trazos.length > 0, d.id);
    for (const t of d.trazos) assert.match(t, /^M[\d\sMLHVCZ.-]+$/, `${d.id}: ${t}`);
  }
});
