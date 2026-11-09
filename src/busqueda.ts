// Search that ignores case and accents, and matches every word of the query anywhere in the fields (pure).
export const normalizar = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();

export function coincide(consulta: string, ...campos: (string | number | null | undefined)[]) {
  const q = normalizar(consulta);
  if (!q) return true;
  const pajar = normalizar(campos.filter((c) => c != null).join(' '));
  return q.split(' ').every((palabra) => pajar.includes(palabra));
}
