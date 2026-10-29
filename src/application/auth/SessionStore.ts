export type SessionSnapshot = Readonly<{
  token: string | null;
  restoring: boolean;
  notice: string | null;
}>;

const initial: SessionSnapshot = Object.freeze({ token: null, restoring: true, notice: null });

/** Singleton: todas las pantallas comparten una única fuente de sesión. */
export class SessionStore {
  private static instance: SessionStore | undefined;
  private snapshot: SessionSnapshot = initial;
  private readonly listeners = new Set<() => void>();
  private constructor() {}

  static getInstance(): SessionStore {
    return this.instance ??= new SessionStore();
  }

  getSnapshot = (): SessionSnapshot => this.snapshot;
  getServerSnapshot = (): SessionSnapshot => initial;

  /** Observer: suscribir, notificar y cancelar. React consume esta suscripción. */
  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };

  update(patch: Partial<SessionSnapshot>): void {
    const next = { ...this.snapshot, ...patch };
    if (next.token === this.snapshot.token && next.restoring === this.snapshot.restoring && next.notice === this.snapshot.notice) return;
    this.snapshot = Object.freeze(next);
    for (const listener of [...this.listeners]) listener();
  }
}
