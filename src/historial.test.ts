import assert from 'node:assert/strict';
import { test } from 'node:test';
import { agruparPorDia } from './historial.ts';

test('el historial agrupa por dia, del mas nuevo al mas viejo, y suma cada dia', () => {
  const rows = [
    { id: 5, fecha: '2026-11-07', total: 300 },
    { id: 4, fecha: '2026-11-08', total: 100 },
    { id: 3, fecha: '2026-11-08', total: 250 },
    { id: 2, fecha: '2026-10-31', total: 40 },
  ];
  const g = agruparPorDia(rows);
  assert.deepEqual(g.map((x) => [x.fecha, x.total, x.items.length]), [['2026-11-08', 350, 2], ['2026-11-07', 300, 1], ['2026-10-31', 40, 1]]);
  assert.deepEqual(g[0].items.map((i) => i.id), [4, 3]); // inside a day the incoming order is kept
});

test('sin pedidos no hay grupos', () => assert.deepEqual(agruparPorDia([]), []));
