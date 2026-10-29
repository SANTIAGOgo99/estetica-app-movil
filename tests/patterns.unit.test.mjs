import assert from 'node:assert/strict';
import { test, beforeEach } from 'node:test';
import { SessionStore } from '../src/application/auth/SessionStore.ts';
import { AuthService } from '../src/application/auth/AuthService.ts';
import { createTokenRepository, MemoryTokenRepository, PersistentTokenRepository } from '../src/infrastructure/auth/TokenRepositoryFactory.ts';

const store = SessionStore.getInstance();
const token = (exp = Math.floor(Date.now() / 1000) + 3600) => `e30.${Buffer.from(JSON.stringify({ role: 'client', exp })).toString('base64url')}.test`;
beforeEach(() => store.update({ token: null, restoring: true, notice: null }));

test('Singleton: la misma instancia y estado se comparten entre consumidores', () => {
  const other = SessionStore.getInstance();
  assert.equal(store, other);
  store.update({ notice: 'compartido' });
  assert.equal(other.getSnapshot().notice, 'compartido');
  assert.ok(Object.isFrozen(other.getSnapshot()));
});

test('Observer: notifica cambios, evita avisos repetidos y permite cancelar', () => {
  let first = 0, second = 0;
  const unsubscribe = store.subscribe(() => first++);
  const unsubscribeOther = store.subscribe(() => second++);
  store.update({ restoring: false });
  store.update({ restoring: false });
  assert.equal(first, 1); assert.equal(second, 1);
  unsubscribe();
  store.update({ notice: 'sesión vencida' });
  assert.equal(first, 1); assert.equal(second, 2);
  unsubscribeOther();
});

test('Factory y Repository: dos implementaciones cumplen el mismo contrato', async () => {
  let saved = null;
  const storage = { readToken: async () => saved, saveToken: async value => { saved = value; }, removeToken: async () => { saved = null; } };
  const persistent = createTokenRepository({ kind: 'persistent', storage });
  const memory = createTokenRepository({ kind: 'memory' });
  assert.ok(persistent instanceof PersistentTokenRepository);
  assert.ok(memory instanceof MemoryTokenRepository);
  for (const repository of [persistent, memory]) {
    assert.equal(await repository.read(), null);
    await repository.save('token-de-prueba');
    assert.equal(await repository.read(), 'token-de-prueba');
    await repository.remove();
    assert.equal(await repository.read(), null);
  }
  assert.throws(() => createTokenRepository({ kind: 'inexistente' }), /compatible/);
});

test('Caso de uso: validación antes de red, persistencia antes de avisar y cierre', async () => {
  const repository = createTokenRepository({ kind: 'memory' });
  const value = token(); let calls = 0;
  const service = new AuthService(repository, { login: async email => { calls++; assert.equal(email, 'cliente@example.com'); return { token: value }; } }, store);
  await assert.rejects(service.signIn('incorrecto', ''), /Revisa/);
  assert.equal(calls, 0);
  await service.signIn(' cliente@example.com ', 'clave');
  assert.equal(await repository.read(), value);
  assert.equal(store.getSnapshot().token, value);
  await service.signOut();
  assert.equal(await repository.read(), null);
  assert.equal(store.getSnapshot().token, null);
});

test('Caso de uso: restaurar vigente, eliminar vencida y avisar error de lectura', async () => {
  const repository = createTokenRepository({ kind: 'memory' });
  const service = new AuthService(repository, { login: async () => { throw Error('No debe consultar red'); } }, store);
  const valid = token(); await repository.save(valid); await service.restore();
  assert.equal(store.getSnapshot().token, valid);
  await repository.save(token(1)); await service.restore();
  assert.equal(await repository.read(), null); assert.equal(store.getSnapshot().token, null);
  const broken = new AuthService({ ...repository, read: async () => { throw Error('disco'); } }, {}, store);
  await broken.restore();
  assert.match(store.getSnapshot().notice, /recuperar/);
  assert.equal(store.getSnapshot().restoring, false);
});

test('Caso de uso: token inválido o fallo al guardar no conceden acceso', async () => {
  const memory = createTokenRepository({ kind: 'memory' });
  const invalid = new AuthService(memory, { login: async () => ({ token: 'invalido' }) }, store);
  await assert.rejects(invalid.signIn('cliente@example.com', 'clave'), /válida/);
  assert.equal(store.getSnapshot().token, null);
  const broken = new AuthService({ save: async () => { throw Error('disco'); } }, { login: async () => ({ token: token() }) }, store);
  await assert.rejects(broken.signIn('cliente@example.com', 'clave'), /guardar/);
  assert.equal(store.getSnapshot().token, null);
});

test('Caso de uso: cerrar mientras responde el login no restaura la sesión', async () => {
  let resolve;
  const repository = createTokenRepository({ kind: 'memory' });
  const service = new AuthService(repository, { login: () => new Promise(done => { resolve = done; }) }, store);
  const pending = service.signIn('cliente@example.com', 'clave');
  await service.signOut(); resolve({ token: token() }); await pending;
  assert.equal(await repository.read(), null);
  assert.equal(store.getSnapshot().token, null);
});

test('Caso de uso: la expiración avisa al Observer y retira la persistencia', async () => {
  const repository = createTokenRepository({ kind: 'memory' });
  const service = new AuthService(repository, { login: async () => ({ token: token() }) }, store);
  await service.signIn('cliente@example.com', 'clave');
  await service.expire();
  assert.equal(await repository.read(), null);
  assert.equal(store.getSnapshot().token, null);
  assert.match(store.getSnapshot().notice, /venció/);
});
