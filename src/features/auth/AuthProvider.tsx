import { AppState } from 'react-native';
import { createContext, useContext, useEffect, useRef, useSyncExternalStore, type PropsWithChildren } from 'react';
import { authService, sessionStore } from '../../composition/auth';
import { sessionExpiry } from '../../domain/auth/session';

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

/** Adaptador de presentación: conecta el Observer del store con React. */
export function AuthProvider({ children }: PropsWithChildren) {
  const snapshot = useSyncExternalStore(sessionStore.subscribe, sessionStore.getSnapshot, sessionStore.getServerSnapshot);
  const { token } = snapshot;
  const pending = useRef(false);
  useEffect(() => { void authService.restore(); }, []);
  useEffect(() => {
    if (!token) return;
    let timer: ReturnType<typeof setTimeout>;
    const check = () => {
      const expiry = sessionExpiry(token);
      if (!expiry) { void authService.expire(); return; }
      // Revalidar evita expirar antes de tiempo los tokens de larga duración.
      timer = setTimeout(check, Math.min(expiry - Date.now(), 2147483647));
    };
    check();
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') { clearTimeout(timer); check(); }
    });
    return () => { clearTimeout(timer); subscription.remove(); };
  }, [token]);

  async function signIn(email: string, password: string) {
    if (pending.current) return;
    pending.current = true;
    try { await authService.signIn(email, password); }
    finally { pending.current = false; }
  }
  return <AuthContext.Provider value={{ ...snapshot, signIn, signOut: () => authService.signOut() }}>{children}</AuthContext.Provider>;
}
