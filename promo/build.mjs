// Builds index.html from src.tpl by inlining the six mascot drawings that docs/preview/index.html already holds
// (it is generated from src/Mascota.tsx), so the video always shows the mascots the app really has.
// Run from the promo folder: node build.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const preview = readFileSync('../docs/preview/index.html', 'utf8');
const svgs = Object.fromEntries([...preview.matchAll(/<svg viewBox="0 0 100 100" role="img" aria-label="(\w+)">([\s\S]*?)<\/svg>/g)]
  .map(([, nombre, dibujo]) => [nombre, `<svg class="mas" viewBox="0 0 100 100" aria-hidden="true">${dibujo}</svg>`]));
if (Object.keys(svgs).length !== 6) throw new Error(`Expected 6 mascots in docs/preview/index.html, found ${Object.keys(svgs).length}`);

const html = readFileSync('src.tpl', 'utf8').replace(/\{\{M:(\w+)\}\}/g, (_, n) => {
  if (!svgs[n]) throw new Error(`Unknown mascot ${n}`);
  return svgs[n];
});
writeFileSync('index.html', html);
console.log('index.html written');
