import assert from 'node:assert/strict';
import { test } from 'node:test';
import { corta, diasDelMes, esFechaISO, etiquetaDia, fechaISO, mesMas, primerDiaSemana, sumarDias } from './fecha.ts';
import { crearT } from './idioma.ts';

const es = crearT('es'), en = crearT('en');

test('fechaISO y esFechaISO: solo dias que existen en el calendario', () => {
  assert.equal(fechaISO(new Date(2026, 10, 8)), '2026-11-08');
  assert.equal(esFechaISO('2026-11-08'), true);
  assert.equal(esFechaISO('2026-02-30'), false);
  assert.equal(esFechaISO('2024-02-29'), true); // leap year
  assert.equal(esFechaISO('2026-02-29'), false);
  assert.equal(esFechaISO('8/11/2026'), false);
  assert.equal(esFechaISO(''), false);
});

test('sumarDias cruza meses y anos', () => {
  assert.equal(sumarDias('2026-11-08', -1), '2026-11-07');
  assert.equal(sumarDias('2026-03-01', -1), '2026-02-28');
  assert.equal(sumarDias('2026-01-01', -1), '2025-12-31');
  assert.equal(sumarDias('2026-12-31', 1), '2027-01-01');
});

test('calendario: dias del mes, primer dia (lunes = 0) y cambio de mes', () => {
  assert.equal(diasDelMes(2026, 2), 28);
  assert.equal(diasDelMes(2024, 2), 29);
  assert.equal(diasDelMes(2026, 11), 30);
  assert.equal(primerDiaSemana(2026, 11), 6); // 1 Nov 2026 is a Sunday
  assert.equal(primerDiaSemana(2026, 6), 0); // 1 Jun 2026 is a Monday
  assert.deepEqual(mesMas(2026, 1, -1), { y: 2025, m: 12 });
  assert.deepEqual(mesMas(2026, 12, 1), { y: 2027, m: 1 });
});

test('etiquetas: hoy, ayer y fecha corta, en los dos idiomas', () => {
  assert.equal(etiquetaDia('2026-11-08', '2026-11-08', es), 'Hoy');
  assert.equal(etiquetaDia('2026-11-07', '2026-11-08', es), 'Ayer');
  assert.equal(etiquetaDia('2026-11-02', '2026-11-08', es), '2 nov 2026');
  assert.equal(etiquetaDia('2026-11-07', '2026-11-08', en), 'Yesterday');
  assert.equal(corta('2026-08-15', en), '15 Aug 2026');
});
