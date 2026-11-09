import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { MEDIOS } from './db.ts';
import { crearT, EN, resolverIdioma } from './idioma.ts';
import { MASCOTAS } from './mascotas.ts';
import { ACENTOS, pagoColores, paleta } from './paleta.ts';
import { CABECERAS_CSV, MESES } from './respaldo.ts';

const SRC = new URL('.', import.meta.url).pathname;
const archivos = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((d) => (d.isDirectory() ? archivos(join(dir, d.name)) : [join(dir, d.name)]))
    .filter((f) => /\.tsx?$/.test(f) && !/\.test\.ts$/.test(f) && !f.endsWith('idioma.ts') && !f.endsWith('db-memoria.ts'));

const sinEscapes = (s: string) => s.replace(/\\'/g, "'");

// Every text the code asks for, read straight from the source: t('...'), tr('...') and the messages the backup code throws.
function clavesDelCodigo() {
  const claves = new Set<string>();
  for (const f of archivos(SRC)) {
    const s = readFileSync(f, 'utf8');
    for (const m of s.matchAll(/\b(?:t|tr)\('((?:[^'\\\n]|\\.)*)'/g)) claves.add(sinEscapes(m[1]));
    // messages thrown by the backup code are shown to the user; other errors (a missing provider, say) are for developers
    if (/(?:backup|respaldo)\.ts$/.test(f)) for (const m of s.matchAll(/new Error\('((?:[^'\\\n]|\\.)*)'\)/g)) claves.add(sinEscapes(m[1]));
    for (const m of s.matchAll(/const MAL = '((?:[^'\\\n]|\\.)*)'/g)) claves.add(sinEscapes(m[1]));
  }
  return claves;
}

// Texts that are looked up by variable, so reading the code can't find them: they come from these lists.
const dinamicas = () => new Set<string>([
  ...ACENTOS.map((a) => a.nombre), ...MASCOTAS.map((m) => m.nombre), ...MEDIOS, ...MESES, ...CABECERAS_CSV,
  ...Object.keys(pagoColores(paleta('#16A34A', 'claro'))),
  'Borrar', 'Quitar', 'Restaurar', // the confirm button labels (confirm(title, ok): `ok` is translated by the dialog)
]);

const huecos = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');

test('idioma: todo texto del codigo tiene su traduccion al ingles', () => {
  const faltan = [...clavesDelCodigo(), ...dinamicas()].filter((k) => EN[k] === undefined);
  assert.deepEqual(faltan, []);
});

test('idioma: no sobran traducciones que nadie usa', () => {
  const usadas = new Set([...clavesDelCodigo(), ...dinamicas()]);
  assert.deepEqual(Object.keys(EN).filter((k) => !usadas.has(k)), []);
});

test('idioma: cada traduccion conserva los mismos {huecos} que el original', () => {
  const mal = Object.entries(EN).filter(([es, en]) => huecos(es) !== huecos(en)).map(([es]) => es);
  assert.deepEqual(mal, []);
});

test('idioma: ninguna traduccion queda vacia ni igual de larga por error de copia', () => {
  assert.ok(Object.values(EN).every((v) => v.trim().length > 0));
});

test('idioma: crearT rellena huecos, usa espanol como clave y cae a la clave si falta', () => {
  const es = crearT('es'), en = crearT('en');
  assert.equal(es('{n} pedidos', { n: 3 }), '3 pedidos');
  assert.equal(en('{n} pedidos', { n: 3 }), '3 orders');
  assert.equal(en('esto no esta traducido'), 'esto no esta traducido');
  assert.equal(en('Hola {x}', {}), 'Hola {x}'); // an unfilled slot stays visible instead of vanishing
});

test('idioma: automatico sigue al telefono y lo elegido gana', () => {
  assert.equal(resolverIdioma('auto', 'es-CO'), 'es');
  assert.equal(resolverIdioma('auto', 'en-US'), 'en');
  assert.equal(resolverIdioma('auto', 'fr-FR'), 'en'); // anything that isn't Spanish reads English
  assert.equal(resolverIdioma('en', 'es-CO'), 'en');
  assert.equal(resolverIdioma('es', 'en-US'), 'es');
});
