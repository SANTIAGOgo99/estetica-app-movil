const KEY = 'estetica.client.session';
// En web se conserva solo durante la sesión de la pestaña; nunca contraseñas.
export async function readToken() {
  return typeof window === 'undefined' ? null : window.sessionStorage.getItem(KEY);
}
export async function saveToken(token: string) { window.sessionStorage.setItem(KEY, token); }
export async function removeToken() { window.sessionStorage.removeItem(KEY); }
