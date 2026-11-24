type Listener = (rejectedToken: string) => void;
const listeners = new Set<Listener>();
let recovery: ((token: string) => Promise<string | null>) | null = null;
export function installTokenRecovery(handler: (token: string) => Promise<string | null>) {
  recovery = handler;
  return () => { if (recovery === handler) recovery = null; };
}
export async function recoverUnauthorized(token: string) { return recovery ? recovery(token) : null; }

export function subscribeUnauthorized(listener: Listener) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function notifyUnauthorized(token: string) {
  for (const listener of listeners) listener(token);
}
