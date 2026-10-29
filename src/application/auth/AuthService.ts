import type { LoginGateway, TokenRepository } from '../../domain/auth/TokenRepository.ts';
import { sessionExpiry } from '../../domain/auth/session.ts';
import { validateCredentials } from '../../domain/auth/validation.ts';
import type { SessionStore } from './SessionStore.ts';

/** Casos de uso: dependen de puertos, no de React, Expo ni HTTP. */
export class AuthService {
  private revision = 0;
  private readonly repository: TokenRepository;
  private readonly gateway: LoginGateway;
  private readonly store: SessionStore;
  constructor(
    repository: TokenRepository,
    gateway: LoginGateway,
    store: SessionStore,
  ) { this.repository = repository; this.gateway = gateway; this.store = store; }

  async restore(): Promise<void> {
    const revision = this.revision;
    try {
      const saved = await this.repository.read();
      if (revision !== this.revision) return;
      if (saved && !sessionExpiry(saved)) await this.repository.remove();
      if (revision === this.revision) this.store.update({ token: saved && sessionExpiry(saved) ? saved : null });
    } catch {
      if (revision === this.revision) this.store.update({ token: null, notice: 'No pudimos recuperar la sesión. Inicia sesión nuevamente.' });
    } finally {
      if (revision === this.revision) this.store.update({ restoring: false });
    }
  }

  async signIn(email: string, password: string): Promise<void> {
    if (Object.keys(validateCredentials({ email, password })).length) throw new Error('Revisa tu correo y contraseña.');
    const revision = ++this.revision;
    const session = await this.gateway.login(email.trim(), password);
    if (revision !== this.revision) return;
    if (!sessionExpiry(session.token)) throw new Error('La sesión recibida no es válida o ya venció.');
    try { await this.repository.save(session.token); }
    catch { throw new Error('No pudimos guardar tu sesión. Inténtalo nuevamente.'); }
    if (revision !== this.revision) { await this.repository.remove(); return; }
    this.store.update({ token: session.token, restoring: false, notice: null });
  }

  async signOut(): Promise<void> {
    ++this.revision;
    this.store.update({ token: null, restoring: false, notice: null });
    try { await this.repository.remove(); }
    catch {
      this.store.update({ notice: 'Se cerró la sesión, pero no se pudo limpiar el almacenamiento. Inténtalo nuevamente.' });
      throw new Error('No pudimos limpiar la sesión guardada.');
    }
  }

  async expire(): Promise<void> {
    ++this.revision;
    this.store.update({ token: null, restoring: false, notice: 'Tu sesión venció. Inicia sesión nuevamente.' });
    try { await this.repository.remove(); }
    catch { this.store.update({ notice: 'Tu sesión venció; no se pudo limpiar el almacenamiento. Inicia sesión nuevamente.' }); }
  }
}
