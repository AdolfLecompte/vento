// The history groups finished orders by day, newest day first, like the movements of a banking app (pure).
export type Grupo<R> = { fecha: string; total: number; items: R[] };

export function agruparPorDia<R extends { fecha: string; total: number }>(rows: R[]): Grupo<R>[] {
  const grupos = new Map<string, Grupo<R>>();
  for (const r of rows) {
    const g = grupos.get(r.fecha) ?? { fecha: r.fecha, total: 0, items: [] };
    g.total += r.total;
    g.items.push(r); // inside a day the incoming order is kept (the list already comes newest first)
    grupos.set(r.fecha, g);
  }
  return [...grupos.values()].sort((a, b) => (a.fecha < b.fecha ? 1 : a.fecha > b.fecha ? -1 : 0));
}
