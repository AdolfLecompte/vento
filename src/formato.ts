// Money formatting and parsing (pure, so it runs under `node --test`).

// Thousands separated with '.' (es-CO), done by hand so it never depends on the device's Intl data.
export const miles = (n: number) => String(Math.abs(Math.round(n))).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
export const money = (n: number) => (n < 0 ? '-$' : '$') + miles(n);

// Digits only, at most 9 (up to 999.999.999). Longer numbers pass JS's safe-integer limit and make every backup
// fail validation, so a slip of the finger can't be allowed to get that far.
export const num = (s: string) => parseInt(s.replace(/\D/g, '').slice(0, 9), 10) || 0;
