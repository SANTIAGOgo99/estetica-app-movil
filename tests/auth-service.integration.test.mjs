import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { test } from 'node:test';
import { AuthService } from '../src/application/auth/AuthService.ts';
import { SessionStore } from '../src/application/auth/SessionStore.ts';
import { HttpLoginGateway } from '../src/infrastructure/auth/HttpLoginGateway.ts';
import { createTokenRepository } from '../src/infrastructure/auth/TokenRepositoryFactory.ts';

test('Clean integrada: HTTP → caso de uso → Repository → Singleton → Observer', async t => {
  const token = `e30.${Buffer.from(JSON.stringify({ role: 'client', exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url')}.test`;
  const server = createServer(async (req, res) => {
    let raw = ''; for await (const part of req) raw += part;
    const input = JSON.parse(raw);
    res.setHeader('Content-Type', 'application/json');
    if (req.url !== '/api/auth/login' || input.email !== 'cliente@example.com' || input.password !== 'correcta') {
      res.statusCode = 401; return res.end(JSON.stringify({ error: 'rechazado' }));
    }
    res.end(JSON.stringify({ role: 'client', token }));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  let saved = null;
  const repository = createTokenRepository({ kind: 'persistent', storage: {
    readToken: async () => saved,
    saveToken: async value => { saved = value; },
    removeToken: async () => { saved = null; },
  } });
  const store = SessionStore.getInstance(); store.update({ token: null, restoring: true, notice: null });
  const states = [];
  const unsubscribe = store.subscribe(() => states.push(store.getSnapshot().token));
  t.after(unsubscribe);
  const gateway = new HttpLoginGateway(() => `http://127.0.0.1:${server.address().port}/api`);
  const service = new AuthService(repository, gateway, store);
  await assert.rejects(service.signIn('cliente@example.com', 'incorrecta'), /incorrectos/);
  assert.equal(saved, null);
  await service.signIn(' cliente@example.com ', 'correcta');
  assert.equal(saved, token);
  assert.equal(SessionStore.getInstance().getSnapshot().token, token);
  assert.ok(states.includes(token));
  store.update({ token: null });
  await service.restore();
  assert.equal(store.getSnapshot().token, token);
  await service.signOut();
  assert.equal(saved, null); assert.equal(states.at(-1), null);
});
