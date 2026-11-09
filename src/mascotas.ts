// The mascot the user can pick (pure data; the drawings live in Mascota.tsx).
export const MASCOTAS = [
  { id: 'pan', nombre: 'Pan' },
  { id: 'bebida', nombre: 'Bebida' },
  { id: 'billete', nombre: 'Billete' },
  { id: 'moneda', nombre: 'Moneda' },
  { id: 'bolsa', nombre: 'Bolsa' },
  { id: 'cartera', nombre: 'Cartera' },
] as const;
export type MascotaId = (typeof MASCOTAS)[number]['id'];
export const MASCOTA_INICIAL: MascotaId = 'pan';
