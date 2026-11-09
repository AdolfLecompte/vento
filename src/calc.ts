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
