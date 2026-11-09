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

// A fully paid and delivered order is closed: its contents and payments can't be edited.
export const bloqueado = (tot: number, pag: number, entregado: boolean) => entregado && tot > 0 && pag >= tot;
