import { normalizeApiUrl } from '../http/apiUrl.ts';

export async function requestSessionAction(apiUrl: string | undefined, action: 'refresh' | 'logout', refreshToken: string, fetcher: typeof fetch = fetch) {
  if (!apiUrl) throw Error('La conexión no está configurada.');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetcher(`${normalizeApiUrl(apiUrl)}/auth/${action}`, {
      method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }), signal: controller.signal,
    });
    if (!response.ok) throw Error('No se pudo confirmar la sesión.');
    const data: unknown = await response.json();
    if (action === 'logout') return { token: '', refreshToken: '' };
    if (!data || typeof data !== 'object' || !('token' in data) || !('refreshToken' in data) || !('role' in data) ||
        data.role !== 'client' || typeof data.token !== 'string' || typeof data.refreshToken !== 'string' || data.refreshToken.length < 30)
      throw Error('No se recibió una sesión renovada válida.');
    return { token: data.token, refreshToken: data.refreshToken };
  } finally { clearTimeout(timer); }
}
