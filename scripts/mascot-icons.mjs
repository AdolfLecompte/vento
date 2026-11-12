// Writes assets/images/mascotas/<id>.png: each mascot's face on a soft round-ready square, used as the big picture of the
// reminder notification (the notification shows the mascot the user picked). Run by `npm run icons`; needs rsvg-convert.
import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { svgsMascotas } from './preview.mjs';

const raiz = new URL('../', import.meta.url);
const salida = fileURLToPath(new URL('assets/images/mascotas/', raiz));
mkdirSync(salida, { recursive: true });
for (const { id, dibujo } of svgsMascotas(readFileSync(new URL('src/Mascota.tsx', raiz), 'utf8'), readFileSync(new URL('src/mascotas.ts', raiz), 'utf8'))) {
  // the mascot at 80% on a light square (the notification crops it into a circle)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#F3F6F4"/><g transform="translate(10 10) scale(0.8)">${dibujo}</g></svg>`;
  const ruta = `${salida}${id}.svg`;
  writeFileSync(ruta, svg);
  const r = spawnSync('rsvg-convert', ['-w', '256', '-h', '256', ruta, '-o', `${salida}${id}.png`]);
  if (r.status !== 0) throw new Error(`rsvg-convert failed for ${id}`);
  spawnSync('rm', [ruta]);
}
console.log('Mascot pictures ready in assets/images/mascotas');
