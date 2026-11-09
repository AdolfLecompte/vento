// Update check against the GitHub releases of this project (pure, with `fetch` injected so it can be tested).

// "git+https://github.com/owner/repo.git" or "git@github.com:owner/repo" -> "owner/repo"
export const repoDe = (url: string) => {
  const m = /github\.com[/:]([^/\s]+)\/([^/\s]+?)(?:\.git)?\/?$/i.exec(url.trim());
  return m ? `${m[1]}/${m[2]}` : null;
};

const numeros = (v: string) => v.replace(/^v/i, '').split(/[-+]/)[0].split('.').map((n) => parseInt(n, 10) || 0);

export function esMasNueva(remota: string, local: string) {
  const a = numeros(remota), b = numeros(local);
  for (let i = 0; i < Math.max(a.length, b.length); i++) if ((a[i] ?? 0) !== (b[i] ?? 0)) return (a[i] ?? 0) > (b[i] ?? 0);
  return false;
}

export type Release = { version: string; notas: string; pagina: string; apk: string | null };
export type Resultado = { estado: 'nueva' | 'al-dia' | 'sin-versiones' | 'error'; release?: Release };

// GitHub ignores case in owner/repo names (the canonical spelling may differ from what package.json says).
const dentro = (url: string, prefijo: string) => url.toLowerCase().startsWith(prefijo.toLowerCase());

// The release JSON comes from the network: accept only what we expect, and only links that stay inside this repo.
export function leerRelease(json: unknown, repo: string): Release | null {
  const j = json as { tag_name?: unknown; html_url?: unknown; body?: unknown; assets?: unknown } | null;
  if (!j || typeof j.tag_name !== 'string' || typeof j.html_url !== 'string') return null;
  const pagina = j.html_url;
  if (!dentro(pagina, `https://github.com/${repo}/`)) return null;
  const assets = Array.isArray(j.assets) ? (j.assets as { name?: unknown; browser_download_url?: unknown }[]) : [];
  const apk = assets.find((a) => typeof a.name === 'string' && a.name.endsWith('.apk') && typeof a.browser_download_url === 'string'
    && dentro(a.browser_download_url, `https://github.com/${repo}/releases/download/`));
  return { version: j.tag_name.replace(/^v/i, ''), notas: typeof j.body === 'string' ? j.body : '', pagina, apk: (apk?.browser_download_url as string | undefined) ?? null };
}

export async function consultar(repo: string, versionLocal: string, fetchImpl: typeof fetch = fetch, ms = 8000): Promise<Resultado> {
  const ctl = new AbortController();
  const reloj = setTimeout(() => ctl.abort(), ms);
  try {
    const r = await fetchImpl(`https://api.github.com/repos/${repo}/releases/latest`, { headers: { Accept: 'application/vnd.github+json' }, signal: ctl.signal });
    if (r.status === 404) return { estado: 'sin-versiones' }; // no release published yet
    if (!r.ok) return { estado: 'error' };
    const release = leerRelease(await r.json(), repo);
    if (!release) return { estado: 'error' };
    return { estado: esMasNueva(release.version, versionLocal) ? 'nueva' : 'al-dia', release };
  } catch {
    return { estado: 'error' }; // offline, timeout, bad JSON: never a crash, the check just says nothing
  } finally {
    clearTimeout(reloj);
  }
}
