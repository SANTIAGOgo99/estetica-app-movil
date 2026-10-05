export type ClientSession = { token: string };

export async function requestLogin(
  apiUrl: string | undefined,
  email: string,
  password: string,
  fetcher: typeof fetch = fetch,
): Promise<ClientSession> {
  if (!apiUrl) throw new Error('El servicio de acceso aún no está configurado.');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetcher(`${apiUrl.replace(/\/$/, '')}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ email: email.trim(), password }),
      signal: controller.signal,
    });
    if (response.status === 400 || response.status === 401) {
      throw new Error('Correo o contraseña incorrectos.');
    }
    if (response.status === 403) throw new Error('Tu cuenta no tiene acceso. Contacta a la estética.');
    if (response.status === 429) throw new Error('Demasiados intentos. Espera un momento e inténtalo nuevamente.');
    if (!response.ok) throw new Error('El servicio no está disponible. Inténtalo más tarde.');
    let data: unknown;
    try { data = await response.json(); }
    catch { throw new Error('El servicio devolvió una respuesta que no podemos procesar.'); }
    if (!data || typeof data !== 'object' || !('role' in data) || !('token' in data)) {
      throw new Error('El servicio devolvió una respuesta incompleta.');
    }
    if (data.role !== 'client') throw new Error('Esta aplicación es solo para clientes. Usa el sistema web para administrar.');
    if (typeof data.token !== 'string' || !data.token.trim()) throw new Error('No se recibió una sesión válida.');
    return { token: data.token };
  } catch (error) {
    if (controller.signal.aborted) throw new Error('La conexión tardó demasiado. Inténtalo nuevamente.');
    if (error instanceof TypeError) throw new Error('No pudimos conectar. Revisa tu conexión a internet.');
    throw error;
  } finally { clearTimeout(timeout); }
}
