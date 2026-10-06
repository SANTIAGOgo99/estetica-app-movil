import { AppState } from 'react-native';
import { createContext, useContext, useEffect, useRef, useState, type PropsWithChildren } from 'react';
import { requestLogin } from './client';
import { restoreSession, sessionExpiry } from './session';
import { readToken, saveToken, removeToken } from './storage';

type AuthContextValue = {
  token: string | null; restoring: boolean; notice: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};
const AuthContext = createContext<AuthContextValue | null>(null);
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('La sesión necesita AuthProvider.');
  return value;
}
export function AuthProvider({ children }: PropsWithChildren) {
  const [token, setToken] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const pending = useRef(false);
  useEffect(() => {
    let active = true;
    async function restore() {
      try {
        const saved = await restoreSession(readToken, removeToken);
        if (active) setToken(saved);

      } catch { if (active) setNotice('No pudimos recuperar la sesión. Inicia sesión nuevamente.'); }
      finally { if (active) setRestoring(false); }
    }
    void restore();
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!token) return;
    const expire = () => {
      setToken(null);
      setNotice('Tu sesión venció. Inicia sesión nuevamente.');
      void removeToken().catch(() => setNotice('Tu sesión venció; no se pudo limpiar el almacenamiento. Inicia sesión nuevamente.'));
    };
    const expiry = sessionExpiry(token);
    if (!expiry) { expire(); return; }
    const timer = setTimeout(expire, Math.min(expiry - Date.now(), 2147483647));
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active' && !sessionExpiry(token)) expire();
    });
    return () => { clearTimeout(timer); subscription.remove(); };
  }, [token]);
  async function signIn(email: string, password: string) {
    if (pending.current) return;
    pending.current = true;
    try {
      const session = await requestLogin(process.env.EXPO_PUBLIC_API_URL, email, password);
      if (!sessionExpiry(session.token)) throw new Error('La sesión recibida no es válida o ya venció.');
      try { await saveToken(session.token); }
      catch { throw new Error('No pudimos guardar tu sesión. Inténtalo nuevamente.'); }
      setNotice(null);
      setToken(session.token);
    } finally { pending.current = false; }
  }
  async function signOut() {
    await removeToken();
    setToken(null);
    setNotice(null);
  }
  return <AuthContext.Provider value={{ token, restoring, notice, signIn, signOut }}>{children}</AuthContext.Provider>;
}
