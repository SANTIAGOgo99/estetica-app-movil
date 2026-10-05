import { jwtDecode } from 'jwt-decode';

// Esto controla la navegación local. La API debe verificar la firma y permisos.
export function sessionExpiry(token: string, now = Date.now()): number | null {
  try {
    const claims = jwtDecode<{ exp?: unknown; role?: unknown }>(token);
    if (claims.role !== 'client' || typeof claims.exp !== 'number' || !Number.isFinite(claims.exp)) return null;
    const expiry = claims.exp * 1000;
    return Number.isFinite(expiry) && expiry > now ? expiry : null;
  } catch { return null; }
}

export async function restoreSession(
  read: () => Promise<string | null>,
  remove: () => Promise<void>,
  now = Date.now(),
): Promise<string | null> {
  const saved = await read();
  if (!saved) return null;
  if (sessionExpiry(saved, now)) return saved;
  await remove();
  return null;
}
