// Currency symbols the logo can show. Only the symbol changes (no conversion): countries that share a symbol
// share an entry, so there is one "$" for dollars and pesos alike.
import lista from './divisas.json';

export type Divisa = { id: string; simbolo: string; trazos: string[] };
export const DIVISAS: Divisa[] = lista;
export const DIVISA_INICIAL = 'dolar';
export const esDivisa = (id: string) => DIVISAS.some((d) => d.id === id);
export const divisaPorId = (id: string) => DIVISAS.find((d) => d.id === id) ?? DIVISAS[0];
