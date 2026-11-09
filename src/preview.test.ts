import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { generarHtml } from '../scripts/preview.mjs';

const leer = (ruta: string) => readFileSync(new URL(ruta, import.meta.url), 'utf8');

test('la pagina de previews es la que sale de las mascotas de la app (si no: npm run preview)', () => {
  assert.equal(readFileSync(new URL('../docs/preview/index.html', import.meta.url), 'utf8'), generarHtml(leer('./Mascota.tsx'), leer('./mascotas.ts')));
});

test('la pagina trae las seis mascotas con su nombre', () => {
  const html = generarHtml(leer('./Mascota.tsx'), leer('./mascotas.ts'));
  for (const n of ['Pan', 'Bebida', 'Billete', 'Moneda', 'Bolsa', 'Cartera']) assert.ok(html.includes(`<figcaption>${n}</figcaption>`), n);
  assert.equal((html.match(/<figure>/g) ?? []).length, 6);
});
