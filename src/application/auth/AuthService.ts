import type { LoginGateway, TokenRepository } from '../../domain/auth/TokenRepository.ts';
import { sessionExpiry } from '../../domain/auth/session.ts';
import { validateCredentials } from '../../domain/auth/validation.ts';
import type { SessionStore } from './SessionStore.ts';

/** Casos de uso: dependen de puertos, no de React, Expo ni HTTP. */
export class AuthService {
  private revision = 0;
  private renewing: Promise<string | null> | null = null;
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
      if (saved && !sessionExpiry(saved) && this.gateway.refresh) {
        const refresh = await this.repository.readRefresh?.();
        if (refresh) {
          const session = await this.gateway.refresh(refresh);
          if (revision !== this.revision) return;
          if (!sessionExpiry(session.token)) throw Error('La sesión renovada no es válida.');
          await this.persist(session);
          if (revision === this.revision) this.store.update({ token: session.token, notice: null });
          return;
        }
      }
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
    try { await this.persist(session); }
    catch { throw new Error('No pudimos guardar tu sesión. Inténtalo nuevamente.'); }
    if (revision !== this.revision) { await this.repository.remove(); return; }
    this.store.update({ token: session.token, restoring: false, notice: null });
  }

  async signOut(): Promise<void> {
    ++this.revision;
    this.store.update({ token: null, restoring: false, notice: null });
    const refresh = await this.repository.readRefresh?.().catch(() => null);
    try { await this.removeAll(); }
    catch {
      this.store.update({ notice: 'Se cerró la sesión, pero no se pudo limpiar el almacenamiento. Inténtalo nuevamente.' });
      throw new Error('No pudimos limpiar la sesión guardada.');
    }
    if (refresh && this.gateway.logout) await this.gateway.logout(refresh).catch(() => undefined);
  }

  private async persist(session: { token: string; refreshToken?: string }) {
    try {
      await this.repository.save(session.token);
      if (session.refreshToken) await this.repository.saveRefresh?.(session.refreshToken);
      else await this.repository.removeRefresh?.();
    } catch (error) { await this.removeAll().catch(() => undefined); throw error; }
  }
  private async removeAll() {
    const results = await Promise.allSettled([this.repository.remove(), this.repository.removeRefresh?.()]);
    if (results.some(result => result.status === 'rejected')) throw Error('No se pudo limpiar la sesión.');
  }
  async refreshIfCurrent(rejectedToken: string): Promise<string | null> {
    const current = this.store.getSnapshot().token;
    if (current !== rejectedToken) return current && sessionExpiry(current) ? current : null;
    if (this.renewing) return this.renewing;
    if (!this.gateway.refresh) return null;
    const revision = this.revision;
    this.renewing = (async () => {
      try {
        const refresh = await this.repository.readRefresh?.();
        if (!refresh) return null;
        const session = await this.gateway.refresh!(refresh);
        if (revision !== this.revision) return this.store.getSnapshot().token;
        if (!sessionExpiry(session.token)) return null;
        await this.persist(session);
        if (revision !== this.revision) return null;
        this.store.update({ token: session.token, notice: null });
        return session.token;
      } catch { return null; }
      finally { this.renewing = null; }
    })();
    return this.renewing;
  }

  async expireIfCurrent(rejectedToken: string): Promise<void> {
    // Una respuesta atrasada de otra sesión no debe cerrar la sesión nueva.
    if (this.store.getSnapshot().token !== rejectedToken) return;
    await this.expire();
  }

  async expire(): Promise<void> {
    ++this.revision;
    this.store.update({ token: null, restoring: false, notice: 'Tu sesión venció. Inicia sesión nuevamente.' });
    try { await this.removeAll(); }
    catch { this.store.update({ notice: 'Tu sesión venció; no se pudo limpiar el almacenamiento. Inicia sesión nuevamente.' }); }
  }
}
