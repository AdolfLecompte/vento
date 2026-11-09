import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { notificarAhora, reprogramar } from '@/avisos';
import { abrirDescarga, buscarActualizacion } from '@/actualizaciones';
import { copiaAutomatica } from '@/backup';
import { getAjuste, hoy, setAjuste } from '@/db';
import { confirm, notify } from '@/feedback';
import { useT } from '@/tema';

// Keeps the app's background chores in step: on start, on return and when leaving it, it refreshes the scheduled
// reminders and makes the automatic backup if one is due. Android won't run code on an exact clock for us, so
// "due" is checked at these moments: opening the app (toasts tell you) or leaving it (a system notification does).
export function AvisosHost() {
  const db = useSQLiteContext();
  const t = useT();
  const trabajando = useRef(false);
  useEffect(() => {
    const run = (estado: 'active' | 'background') => {
      reprogramar(db).catch(() => {});
      if (trabajando.current) return;
      trabajando.current = true;
      copiaAutomatica(db, estado === 'active' ? () => notify(t('Estoy haciendo tu copia de seguridad…'), 'aviso') : undefined)
        .then(async (r) => {
          if (r === 'hecha') {
            if (estado === 'active') notify(t('Listo, guardé tu copia en la carpeta vento'));
            else await notificarAhora(t('Copia de seguridad hecha'), t('Se guardó en la carpeta vento.'));
          } else if (r === 'error' && estado === 'active' && (await getAjuste(db, 'backup_error_dia', '')) !== hoy()) {
            await setAjuste(db, 'backup_error_dia', hoy()); // tell once a day, not on every return to the app
            notify(t('No se pudo hacer la copia automática. Vuelve a elegir la carpeta en Más.'), 'aviso');
          }
        })
        .catch(() => {})
        .finally(() => { trabajando.current = false; });
    };
    run('active');
    const sub = AppState.addEventListener('change', (s) => { if (s === 'active' || s === 'background') run(s); });
    return () => sub.remove();
  }, [db, t]);

  // Once a day, when the app opens, look for a newer release on GitHub and offer it (like Mihon). Silent if offline.
  useEffect(() => {
    buscarActualizacion(db).then(async (r) => {
      if (r?.estado !== 'nueva' || !r.release) return;
      const { release } = r;
      if (await confirm(t('Hay una versión nueva: Vento {version}', { version: release.version }), 'Descargar', release.notas.trim() || undefined, 'Más tarde')) abrirDescarga(release);
    }).catch(() => {});
  }, [db, t]);
  return null;
}
