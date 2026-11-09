import type { SQLiteDatabase } from 'expo-sqlite';
import { getAjuste } from '@/db';
import { crearT, esPreferenciaIdioma, idiomaDelSistema, resolverIdioma } from '@/idioma';

// For code that runs outside React (notifications, exports): read the saved language and build a translator.
export async function traductor(db: SQLiteDatabase) {
  const pref = await getAjuste(db, 'idioma', 'auto');
  return crearT(resolverIdioma(esPreferenciaIdioma(pref) ? pref : 'auto', idiomaDelSistema()));
}
