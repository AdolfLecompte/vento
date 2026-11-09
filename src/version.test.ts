import assert from 'node:assert/strict';
import { test } from 'node:test';
import { consultar, esMasNueva, leerRelease, repoDe } from './version.ts';

const REPO = 'dueno/vento';
const json = (cuerpo: unknown, status = 200) => (async () => new Response(JSON.stringify(cuerpo), { status })) as unknown as typeof fetch;
const release = (extra = {}) => ({
  tag_name: 'v1.1.0', html_url: `https://github.com/${REPO}/releases/tag/v1.1.0`, body: 'Novedades',
  assets: [{ name: 'vento-1.1.0.apk', browser_download_url: `https://github.com/${REPO}/releases/download/v1.1.0/vento-1.1.0.apk` }], ...extra,
});

test('repoDe saca dueno/repo de las formas habituales de la URL', () => {
  assert.equal(repoDe('git+https://github.com/dueno/vento.git'), 'dueno/vento');
  assert.equal(repoDe('https://github.com/dueno/vento'), 'dueno/vento');
  assert.equal(repoDe('git@github.com:dueno/vento.git'), 'dueno/vento');
  assert.equal(repoDe('https://gitlab.com/dueno/vento'), null);
});

test('esMasNueva compara numero a numero, no como texto', () => {
  assert.equal(esMasNueva('1.1.0', '1.0.0'), true);
  assert.equal(esMasNueva('v1.10.0', '1.9.0'), true); // 10 > 9, which a text comparison gets wrong
  assert.equal(esMasNueva('1.0.0', '1.0.0'), false);
  assert.equal(esMasNueva('1.0.0', '1.0.1'), false);
  assert.equal(esMasNueva('2.0', '1.9.9'), true);
  assert.equal(esMasNueva('1.0.0-beta', '1.0.0'), false); // a pre-release suffix never counts as newer
});

test('leerRelease acepta lo esperado y rechaza enlaces que salen del repositorio', () => {
  const r = leerRelease(release(), REPO)!;
  assert.deepEqual([r.version, r.notas, r.apk], ['1.1.0', 'Novedades', `https://github.com/${REPO}/releases/download/v1.1.0/vento-1.1.0.apk`]);
  assert.equal(leerRelease(release({ html_url: 'https://evil.example/x' }), REPO), null);
  assert.equal(leerRelease(release({ assets: [{ name: 'x.apk', browser_download_url: 'https://evil.example/x.apk' }] }), REPO)!.apk, null);
  assert.equal(leerRelease(release({ assets: [{ name: 'notas.txt', browser_download_url: `https://github.com/${REPO}/releases/download/v1.1.0/notas.txt` }] }), REPO)!.apk, null);
  assert.equal(leerRelease({ tag_name: 5 }, REPO), null);
  assert.equal(leerRelease(null, REPO), null);
});

test('leerRelease no distingue mayusculas en dueno/repo (GitHub tampoco), pero sigue rechazando otros repos', () => {
  assert.equal(leerRelease(release(), 'DUENO/Vento')?.version, '1.1.0');
  assert.ok(leerRelease(release(), 'DUENO/Vento')?.apk);
  assert.equal(leerRelease(release(), 'otro/vento'), null);
});

test('consultar: version nueva, al dia, sin versiones, y todo lo que pueda fallar', async () => {
  assert.equal((await consultar(REPO, '1.0.0', json(release()))).estado, 'nueva');
  assert.equal((await consultar(REPO, '1.1.0', json(release()))).estado, 'al-dia');
  assert.equal((await consultar(REPO, '1.0.0', json({}, 404))).estado, 'sin-versiones');
  assert.equal((await consultar(REPO, '1.0.0', json({}, 403))).estado, 'error'); // rate limited
  assert.equal((await consultar(REPO, '1.0.0', json({ tag_name: 1 }))).estado, 'error');
  assert.equal((await consultar(REPO, '1.0.0', (async () => { throw new Error('offline'); }) as unknown as typeof fetch)).estado, 'error');
});

test('consultar corta si GitHub no contesta a tiempo', async () => {
  const colgado = ((_: unknown, init?: { signal?: AbortSignal }) => new Promise((_res, rej) => init?.signal?.addEventListener('abort', () => rej(new Error('abort'))))) as unknown as typeof fetch;
  const t0 = Date.now();
  assert.equal((await consultar(REPO, '1.0.0', colgado, 50)).estado, 'error');
  assert.ok(Date.now() - t0 < 1000);
});
