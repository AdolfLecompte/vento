// The mascot the user can pick (pure data; the drawings live in Mascota.tsx). Each has a first name, the same in both languages.
export const MASCOTAS = [
  { id: 'pan', nombre: 'Miga' },
  { id: 'bebida', nombre: 'Burbuja' },
  { id: 'billete', nombre: 'Billy' },
  { id: 'moneda', nombre: 'Goldie' },
  { id: 'bolsa', nombre: 'Becky' },
  { id: 'cartera', nombre: 'Carter' },
] as const;
export type MascotaId = (typeof MASCOTAS)[number]['id'];
export const MASCOTA_INICIAL: MascotaId = 'pan';
export const esMascota = (x: string): x is MascotaId => MASCOTAS.some((m) => m.id === x);
