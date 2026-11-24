const KEY = 'estetica.client.session';
const REFRESH_KEY = 'estetica.client.refresh';
// En web se conserva solo durante la sesión de la pestaña; nunca contraseñas.
export async function readToken() {
  return typeof window === 'undefined' ? null : window.sessionStorage.getItem(KEY);
}
export async function saveToken(token: string) { window.sessionStorage.setItem(KEY, token); }
export async function removeToken() { window.sessionStorage.removeItem(KEY); }
export async function readRefreshToken() { return typeof window === 'undefined' ? null : window.sessionStorage.getItem(REFRESH_KEY); }
export async function saveRefreshToken(token: string) { window.sessionStorage.setItem(REFRESH_KEY, token); }
export async function removeRefreshToken() { window.sessionStorage.removeItem(REFRESH_KEY); }
