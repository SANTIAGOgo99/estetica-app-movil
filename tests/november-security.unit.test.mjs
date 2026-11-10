import assert from 'node:assert/strict';
import { test } from 'node:test';
import { normalizeApiUrl } from '../src/infrastructure/http/apiUrl.ts';
import { requestLogin } from '../src/infrastructure/auth/requestLogin.ts';
import { apiRequest } from '../src/features/api/client.ts';
import { subscribeUnauthorized } from '../src/features/api/unauthorized.ts';
import { registerClient } from '../src/features/auth/registration.ts';
import { PRIVACY_NOTICE_VERSION } from '../src/features/privacy/notice.ts';
import { AuthService } from '../src/application/auth/AuthService.ts';
import { SessionStore } from '../src/application/auth/SessionStore.ts';
import { createTokenRepository } from '../src/infrastructure/auth/TokenRepositoryFactory.ts';

test('HTTPS: rechaza destinos inseguros antes de transmitir contraseña o token', async () => {
  let calls = 0;
  const fetcher = async () => { calls++; throw Error('No debe transmitir'); };
  const previous = process.env.EXPO_PUBLIC_API_URL;
  try {
    for (const base of ['http://backend.example/api', 'ftp://backend.example/api', 'https://usuario:clave@backend.example/api', 'https://backend.example/api?token=private']) {
      process.env.EXPO_PUBLIC_API_URL = base;
      await assert.rejects(apiRequest('/users/profile', { token: 'private' }, fetcher), /HTTPS/);
      await assert.rejects(requestLogin(base, 'cliente@example.com', 'private', fetcher), /HTTPS/);
    }
    assert.equal(calls, 0);
    assert.equal(normalizeApiUrl('http://127.0.0.1:3000/api', true), 'http://127.0.0.1:3000/api');
    assert.throws(() => normalizeApiUrl('http://127.0.0.1:3000/api', false), /HTTPS/);
  } finally {
    if (previous === undefined) delete process.env.EXPO_PUBLIC_API_URL;
    else process.env.EXPO_PUBLIC_API_URL = previous;
  }
});

test('401: identifica el token rechazado; 403 y 500 conservan la sesión', async t => {
  process.env.EXPO_PUBLIC_API_URL = 'https://backend.example/api';
  const rejected = [];
  const unsubscribe = subscribeUnauthorized(value => rejected.push(value));
  t.after(unsubscribe);
  for (const status of [401, 403, 500]) {
    await assert.rejects(apiRequest('/users/profile', { token: 'session-a' }, async () => new Response('{}', { status })));
  }
  await assert.rejects(apiRequest('/services/active', {}, async () => new Response('{}', { status: 401 })));
  assert.deepEqual(rejected, ['session-a']);
});

test('401 atrasado no elimina una sesión nueva; el vigente elimina almacenamiento y acceso', async () => {
  const repository = createTokenRepository({ kind: 'memory' });
  const store = SessionStore.getInstance();
  const service = new AuthService(repository, {}, store);
  await repository.save('session-new');
  store.update({ token: 'session-new', restoring: false, notice: null });
  await service.expireIfCurrent('session-old');
  assert.equal(store.getSnapshot().token, 'session-new');
  assert.equal(await repository.read(), 'session-new');
  await service.expireIfCurrent('session-new');
  assert.equal(store.getSnapshot().token, null);
  assert.equal(await repository.read(), null);
  assert.match(store.getSnapshot().notice, /venció/);
});

test('consentimiento: no crea cuenta sin aceptación o con otra versión del aviso', async () => {
  process.env.EXPO_PUBLIC_API_URL = 'https://backend.example/api';
  let calls = 0;
  const input = { name: 'Cliente Prueba', email: 'cliente@example.com', phone: '5550000000', password: 'Prueba123!' };
  const fetcher = async () => { calls++; return new Response('{"user":{"id":3,"role":"client"}}'); };
  for (const consent of [{ privacyAccepted: false, privacyVersion: PRIVACY_NOTICE_VERSION }, { privacyAccepted: true, privacyVersion: 'anterior' }, {}]) {
    await assert.rejects(registerClient({ ...input, ...consent }, fetcher), /aviso de privacidad/);
  }
  assert.equal(calls, 0);
  await registerClient({ ...input, privacyAccepted: true, privacyVersion: PRIVACY_NOTICE_VERSION }, async (_url, options) => {
    assert.deepEqual(JSON.parse(options.body).privacy_consent, { accepted: true, version: PRIVACY_NOTICE_VERSION });
    return fetcher();
  });
  assert.equal(calls, 1);
});
