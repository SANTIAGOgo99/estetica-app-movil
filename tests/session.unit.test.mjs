import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { validateCredentials } from '../src/features/auth/validation.ts';
import { restoreSession, sessionExpiry } from '../src/features/auth/session.ts';
const data = JSON.parse(readFileSync(new URL('./fixtures/mobile.json', import.meta.url), 'utf8'));
const token = claims => `e30.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.test`;
for (const row of data.credentials) {
  test(`${row.id}: validación de credenciales con datos versionados`, () => {
    assert.equal(Object.keys(validateCredentials(row)).length === 0, row.valid, `Resultado inesperado para ${row.id}`);
  });
}
test('HU01-U08: vigencia y rol de la sesión', () => {
  assert.equal(sessionExpiry(token({ role: 'client', exp: 1100 }), 1000000), 1100000);
  for (const claims of [{ role: 'client', exp: 1000 }, { role: 'admin', exp: 1100 }, { role: 'client' }]) {
    assert.equal(sessionExpiry(token(claims), 1000000), null);
  }
  assert.equal(sessionExpiry('invalido', 1000000), null);
});
test('HU01-U09: restaurar vigente y retirar vencida del almacenamiento', async () => {
  const valid = token({ role: 'client', exp: 1100 });
  assert.equal(await restoreSession(async () => valid, async () => assert.fail('Sesión vigente'), 1000000), valid);
  let removed = false;
  assert.equal(await restoreSession(async () => token({ role: 'client', exp: 999 }), async () => { removed = true; }, 1000000), null);
  assert.equal(removed, true);
});
