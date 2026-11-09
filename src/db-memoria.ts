// expo-sqlite's async API over Node's built-in SQLite, so the real schema and SQL run in `node --test` without a phone.
// Test support only: it is excluded from tsc (it needs Node types) and never imported by the app.
import { DatabaseSync } from 'node:sqlite';

// node:sqlite rows have a null prototype, which strict deepEqual refuses to match against plain objects.
const plano = (r: object) => ({ ...r });

export function base() {
  const sq = new DatabaseSync(':memory:');
  const flat = (p: unknown[]) => (Array.isArray(p[0]) ? p[0] : p) as (string | number | null)[];
  const db = {
    execAsync: async (s: string) => { sq.exec(s); },
    getAllAsync: async (s: string, ...p: unknown[]) => sq.prepare(s).all(...flat(p)).map(plano) as never[],
    getFirstAsync: async (s: string, ...p: unknown[]) => { const r = sq.prepare(s).get(...flat(p)); return (r ? plano(r) : null) as never; },
    runAsync: async (s: string, ...p: unknown[]) => { const r = sq.prepare(s).run(...flat(p)); return { lastInsertRowId: Number(r.lastInsertRowid), changes: r.changes }; },
    withTransactionAsync: async (fn: () => Promise<void>) => {
      sq.exec('BEGIN');
      try { await fn(); sq.exec('COMMIT'); } catch (e) { sq.exec('ROLLBACK'); throw e; }
    },
  };
  return { sq, db };
}
