// Colour palettes (pure, so it runs under `node --test`). One accent colour + light/dark mode give every token.

export type Modo = 'claro' | 'oscuro';
export type Preferencia = Modo | 'auto'; // 'auto' follows the phone's setting

export const ACENTOS = [
  { id: 'verde', nombre: 'Verde', hex: '#16A34A' },
  { id: 'azul', nombre: 'Azul', hex: '#2563EB' },
  { id: 'morado', nombre: 'Morado', hex: '#7C3AED' },
  { id: 'rosa', nombre: 'Rosa', hex: '#DB2777' },
  { id: 'naranja', nombre: 'Naranja', hex: '#EA580C' },
  { id: 'turquesa', nombre: 'Turquesa', hex: '#0D9488' },
] as const;
export type AcentoId = (typeof ACENTOS)[number]['id'];

// Saved settings come from the database: anything unknown falls back to the default instead of crashing.
export const esAcento = (x: string): x is AcentoId => ACENTOS.some((a) => a.id === x);
export const esPreferencia = (x: string): x is Preferencia => x === 'claro' || x === 'oscuro' || x === 'auto';

const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const hex = (c: number[]) => '#' + c.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');

// `t` is how much of `b` goes into `a` (0 = a, 1 = b).
export const mezcla = (a: string, b: string, t: number) => {
  const x = rgb(a), y = rgb(b);
  return hex(x.map((v, i) => v + (y[i] - v) * t));
};

export const alfa = (h: string, a: number) => `rgba(${rgb(h).join(',')},${a})`;

const luz = (h: string) => {
  const [r, g, b] = rgb(h).map((v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
// WCAG contrast ratio: 1 (same colour) to 21 (black on white).
export const contraste = (a: string, b: string) => {
  const [hi, lo] = [luz(a), luz(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

// Moves `c` towards `hacia` until it reads on `fondo` (small text on a tinted chip).
const legible = (c: string, fondo: string, hacia: string, min = 4.5) => {
  let r = c;
  for (let t = 0.05; contraste(r, fondo) < min && t <= 1; t += 0.05) r = mezcla(c, hacia, t);
  return r;
};

const mejorSobre = (fondo: string, a: string, b: string) => (contraste(a, fondo) >= contraste(b, fondo) ? a : b);

export function paleta(acento: string, modo: Modo) {
  if (modo === 'claro') {
    const bg = '#FFFFFF';
    const ink = mezcla('#000000', acento, 0.12);
    const primary = acento;
    const onPrimary = contraste('#FFFFFF', primary) >= 3 ? '#FFFFFF' : ink; // white whenever it reads, as designed
    const soft = mezcla(bg, acento, 0.12);
    return {
      bg, ink, primary, onPrimary, soft,
      surface: mezcla(bg, acento, 0.05),
      line: mezcla(bg, acento, 0.13),
      onSoft: legible(acento, soft, '#000000'), // small text on soft chips
      primaryPressed: mezcla(acento, '#000000', 0.2),
      muted: mezcla(ink, bg, 0.38),
      onPrimarySuave: mezcla(onPrimary, primary, 0.15), // secondary text on a primary-coloured card
      warn: '#B45309', warnSoft: '#FEF3C7', due: '#C2410C', dueSoft: '#FFEDD5',
      scrim: 'rgba(0,0,0,0.45)', thumb: '#FFFFFF',
    };
  }
  const bg = mezcla('#0B0B0B', acento, 0.06);
  const ink = mezcla('#F4F4F4', acento, 0.08);
  // lighten the accent until it reads on the dark background (it is used for small text too)
  let primary = acento;
  for (let t = 0.05; contraste(primary, bg) < 4.5 && t <= 0.8; t += 0.05) primary = mezcla(acento, '#FFFFFF', t);
  const sup = mezcla(mezcla(bg, '#FFFFFF', 0.07), acento, 0.05);
  const soft = mezcla(bg, acento, 0.25);
  return {
    bg, ink, primary, soft,
    onSoft: legible(primary, soft, '#FFFFFF'),
    onPrimary: mejorSobre(primary, '#FFFFFF', '#0B0B0B'),
    surface: sup,
    line: mezcla(bg, '#FFFFFF', 0.16),
    primaryPressed: mezcla(primary, '#000000', 0.15),
    muted: mezcla(ink, bg, 0.38),
    onPrimarySuave: mezcla(mejorSobre(primary, '#FFFFFF', '#0B0B0B'), primary, 0.15),
    warn: '#FCD34D', warnSoft: '#3A2E0F', due: '#FDBA74', dueSoft: '#3B2314',
    scrim: 'rgba(0,0,0,0.6)', thumb: '#FFFFFF',
  };
}
export type Paleta = ReturnType<typeof paleta>;

// Payment-state pill colours for the current palette.
export const pagoColores = (c: Paleta) => ({
  'sin pagar': { bg: c.dueSoft, fg: c.due },
  parcial: { bg: c.warnSoft, fg: c.warn },
  pagado: { bg: c.soft, fg: c.onSoft },
}) as const;
