import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ACENTOS, alfa, contraste, esAcento, esPreferencia, mezcla, paleta, type Modo } from './paleta.ts';

test('mezcla, alfa y contraste: valores conocidos', () => {
  assert.equal(mezcla('#000000', '#FFFFFF', 0.5), '#808080');
  assert.equal(mezcla('#112233', '#FFFFFF', 0), '#112233');
  assert.equal(alfa('#16A34A', 0), 'rgba(22,163,74,0)');
  assert.ok(Math.abs(contraste('#000000', '#FFFFFF') - 21) < 0.01);
  assert.equal(contraste('#123456', '#123456'), 1);
});

// Every accent in both modes must keep the text readable: this is what stops a "pretty" colour from hiding things.
for (const modo of ['claro', 'oscuro'] as Modo[]) {
  for (const a of ACENTOS) {
    test(`legibilidad: ${a.nombre} en modo ${modo}`, () => {
      const c = paleta(a.hex, modo);
      assert.ok(contraste(c.ink, c.bg) >= 7, `ink/bg ${contraste(c.ink, c.bg).toFixed(2)}`);
      assert.ok(contraste(c.ink, c.surface) >= 7, 'ink/surface');
      assert.ok(contraste(c.muted, c.bg) >= 4.5, `muted/bg ${contraste(c.muted, c.bg).toFixed(2)}`);
      assert.ok(contraste(c.muted, c.surface) >= 4.5, `muted/surface ${contraste(c.muted, c.surface).toFixed(2)}`);
      assert.ok(contraste(c.primary, c.bg) >= (modo === 'claro' ? 3 : 4.5), `primary/bg ${contraste(c.primary, c.bg).toFixed(2)}`);
      assert.ok(contraste(c.onPrimary, c.primary) >= 3, `onPrimary/primary ${contraste(c.onPrimary, c.primary).toFixed(2)}`);
      // bold initials and icons on the soft chips; the old fixed green on its light green was 2.9
      assert.ok(contraste(c.primary, c.soft) >= 2.8, `primary/soft ${contraste(c.primary, c.soft).toFixed(2)}`);
      assert.ok(contraste(c.onSoft, c.soft) >= 4.5, `onSoft/soft ${contraste(c.onSoft, c.soft).toFixed(2)}`);
      assert.ok(contraste(c.due, c.dueSoft) >= 4.5 && contraste(c.warn, c.warnSoft) >= 4.5, 'estados de pago');
    });
  }
}

test('el verde de siempre no cambia el aspecto claro de antes', () => {
  const c = paleta('#16A34A', 'claro');
  assert.equal(c.bg, '#FFFFFF');
  assert.equal(c.primary, '#16A34A');
  assert.equal(c.onPrimary, '#FFFFFF');
});

test('valores guardados desconocidos no se aceptan', () => {
  assert.equal(esAcento('azul'), true);
  assert.equal(esAcento('fucsia'), false);
  assert.equal(esPreferencia('auto'), true);
  assert.equal(esPreferencia('negro'), false);
});
