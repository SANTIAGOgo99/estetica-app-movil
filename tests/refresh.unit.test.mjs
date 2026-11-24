import assert from 'node:assert/strict';
import { test } from 'node:test';
import { AuthService } from '../src/application/auth/AuthService.ts';
import { SessionStore } from '../src/application/auth/SessionStore.ts';
import { createTokenRepository } from '../src/infrastructure/auth/TokenRepositoryFactory.ts';
import { apiRequest } from '../src/features/api/client.ts';
import { installTokenRecovery, subscribeUnauthorized } from '../src/features/api/unauthorized.ts';

const jwt = (tag, exp = Math.floor(Date.now() / 1000) + 3600) => `e30.${Buffer.from(JSON.stringify({ role: 'client', exp, tag })).toString('base64url')}.test`;
test('renovación concurrente: rota una vez y guarda ambas credenciales; logout limpia las dos', async () => {
  const store = SessionStore.getInstance();
  store.update({ token: null, restoring: false, notice: null });
  const repository = createTokenRepository({ kind: 'memory' });
  const old = jwt('old'), fresh = jwt('fresh');
  let renewals = 0, revoked;
  const service = new AuthService(repository, {
    login: async () => ({ token: old, refreshToken: 'refresh-old' }),
    refresh: async value => { renewals++; assert.equal(value, 'refresh-old'); await new Promise(r => setTimeout(r, 20)); return { token: fresh, refreshToken: 'refresh-new' }; },
    logout: async value => { revoked = value; },
  }, store);
  await service.signIn('cliente@example.com', 'clave');
  assert.deepEqual(await Promise.all([service.refreshIfCurrent(old), service.refreshIfCurrent(old)]), [fresh, fresh]);
  assert.equal(renewals, 1);
  assert.equal(await repository.readRefresh(), 'refresh-new');
  assert.equal(await service.refreshIfCurrent(old), fresh);
  assert.equal(renewals, 1);
  await service.signOut();
  assert.equal(revoked, 'refresh-new');
  assert.equal(await repository.read(), null);
  assert.equal(await repository.readRefresh(), null);
});
test('restauración: un acceso vencido se renueva sin almacenar la contraseña', async () => {
  const repository = createTokenRepository({ kind: 'memory' });
  const store = SessionStore.getInstance();
  store.update({ token: null, restoring: true, notice: null });
  await repository.save(jwt('expired', 1)); await repository.saveRefresh('refresh-saved');
  const fresh = jwt('restored');
  const service = new AuthService(repository, { login: async () => { throw Error('No debe iniciar sesión'); }, refresh: async () => ({ token: fresh, refreshToken: 'rotated' }) }, store);
  await service.restore();
  assert.equal(store.getSnapshot().token, fresh);
  assert.equal(store.getSnapshot().restoring, false);
});
test('interceptor: ante 401 renueva y reintenta una sola vez; otro 401 retira la sesión', async t => {
  process.env.EXPO_PUBLIC_API_URL = 'https://backend.example/api';
  let renewals = 0, calls = 0, rejected = 0;
  const cleanup = installTokenRecovery(async token => { assert.equal(token, 'old'); renewals++; return 'fresh'; });
  const unsubscribe = subscribeUnauthorized(() => { rejected++; });
  t.after(cleanup); t.after(unsubscribe);
  const result = await apiRequest('/users/profile', { token: 'old' }, async (_url, options) => {
    calls++; assert.equal(options.headers.Authorization, calls === 1 ? 'Bearer old' : 'Bearer fresh');
    return new Response(JSON.stringify(calls === 1 ? {} : { ok: true }), { status: calls === 1 ? 401 : 200 });
  });
  assert.deepEqual(result, { ok: true }); assert.equal(renewals, 1); assert.equal(rejected, 0);
  await assert.rejects(apiRequest('/users/profile', { token: 'old' }, async () => new Response('{}', { status: 401 })));
  assert.equal(renewals, 2); assert.equal(rejected, 1);
});
