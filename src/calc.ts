// Pure money math for orders. Amounts are integer pesos.
export type Item = { cantidad: number; costo: number; precio: number };
export type EstadoPago = 'sin pagar' | 'parcial' | 'pagado';

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

export const total = (items: Item[]) => sum(items.map((i) => i.cantidad * i.precio));
export const costo = (items: Item[]) => sum(items.map((i) => i.cantidad * i.costo));
export const ganancia = (items: Item[]) => total(items) - costo(items);

export function estadoDe(tot: number, pag: number): EstadoPago {
  if (pag <= 0) return 'sin pagar';
  return pag >= tot ? 'pagado' : 'parcial';
}

// Delivered and paid in full: the order is finished and moves from the pending lists to the history.
export const completo = (tot: number, pag: number, entregado: boolean) => entregado && pag >= tot;

// A finished order with something in it is also closed: its contents and payments can't be edited (a 0-peso order can).
export const bloqueado = (tot: number, pag: number, entregado: boolean) => completo(tot, pag, entregado) && tot > 0;

// What is owed on an order: only once it was delivered, and never negative (an overpaid order doesn't cancel another one).
export const deuda = (r: { total: number; pagado: number; entregado: number | boolean }) => (r.entregado ? Math.max(0, r.total - r.pagado) : 0);

type Fila = { total: number; costo: number; pagado: number; entregado: number | boolean };
// Home's cards for a set of orders: profit earned (delivered), profit still expected (not delivered yet), and how much of what
// was delivered is collected. A payment above the total counts only up to the total.
export function resumen(rows: Fila[]) {
  const ent = rows.filter((r) => r.entregado);
  const ganancia = sum(ent.map((r) => r.total - r.costo));
  const gananciaPendiente = sum(rows.filter((r) => !r.entregado).map((r) => r.total - r.costo));
  return { pedidos: rows.length, entregados: ent.length, ganancia, gananciaPendiente, vendidoEnt: sum(ent.map((r) => r.total)), cobradoEnt: sum(ent.map((r) => Math.min(r.pagado, r.total))) };
}
