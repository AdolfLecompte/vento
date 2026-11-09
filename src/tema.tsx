import * as SystemUI from 'expo-system-ui';
import { useSQLiteContext } from 'expo-sqlite';
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance, useColorScheme } from 'react-native';
import { leerEstilo, setAjuste } from '@/db';
import { crearT, idiomaDelSistema, Lang, PreferenciaIdioma, resolverIdioma, T } from '@/idioma';
import { MascotaId } from '@/mascotas';
import { ACENTOS, AcentoId, Paleta, paleta, Preferencia } from '@/paleta';

type Prefs = { modo: Preferencia; acento: AcentoId; mascota: MascotaId; idioma: PreferenciaIdioma };
type Tema = Prefs & {
  colors: Paleta;
  oscuro: boolean;
  lang: Lang; // the language actually in use (the 'auto' preference already resolved)
  t: T;
  elegir: <K extends keyof Prefs>(clave: K, valor: Prefs[K]) => void;
};

const Ctx = createContext<Tema | null>(null);

// Colour, light/dark mode and mascot, kept in the settings table. Everything below reads it through context,
// so changing it repaints the whole app in place.
export function TemaProvider({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();
  const sistema = useColorScheme();
  const [prefs, setPrefs] = useState<Prefs | null>(null);

  useEffect(() => { leerEstilo(db).then(setPrefs); }, [db]);

  const oscuro = prefs?.modo === 'oscuro' || (prefs?.modo === 'auto' && sistema === 'dark');
  const hexAcento = (ACENTOS.find((a) => a.id === prefs?.acento) ?? ACENTOS[0]).hex;
  const colors = useMemo(() => paleta(hexAcento, oscuro ? 'oscuro' : 'claro'), [hexAcento, oscuro]);
  const lang = resolverIdioma(prefs?.idioma ?? 'auto', idiomaDelSistema());
  const t = useMemo(() => crearT(lang), [lang]);

  // Tell Android which mode the app is in, so the keyboard, system bars and dialogs match it ('auto' = follow the phone).
  useEffect(() => {
    if (prefs) Appearance.setColorScheme(prefs.modo === 'auto' ? 'auto' : prefs.modo === 'oscuro' ? 'dark' : 'light');
  }, [prefs?.modo]); // eslint-disable-line react-hooks/exhaustive-deps -- only the mode matters here

  // the window behind the app (overscroll, keyboard resize) must not flash the wrong colour
  useEffect(() => { SystemUI.setBackgroundColorAsync(colors.bg).catch(() => {}); }, [colors.bg]);

  if (!prefs) return null;
  const elegir: Tema['elegir'] = (clave, valor) => {
    setPrefs((p) => p && { ...p, [clave]: valor }); // from the latest value: several calls in a row (a restore) must all stick
    setAjuste(db, clave === 'modo' ? 'tema_modo' : clave === 'acento' ? 'tema_acento' : clave === 'idioma' ? 'idioma' : 'mascota', String(valor)).catch(() => {});
  };
  return <Ctx.Provider value={{ ...prefs, colors, oscuro, lang, t, elegir }}>{children}</Ctx.Provider>;
}

export function useTema() {
  const t = useContext(Ctx);
  if (!t) throw new Error('useTema needs TemaProvider above it');
  return t;
}
export const useColors = () => useTema().colors;
export const useT = () => useTema().t;
