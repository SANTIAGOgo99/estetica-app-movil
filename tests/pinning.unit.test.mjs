import assert from 'node:assert/strict';
import { test } from 'node:test';
import { configureApiPinning, PINNED_API_HOST, API_PUBLIC_KEY_HASHES } from '../src/infrastructure/http/pinningPolicy.ts';

test('pinning: un APK sin módulo nativo no puede continuar; Expo Go de desarrollo sí', async () => {
  const adapter = { available: () => false, initialize: async () => { throw Error('No debe iniciar'); } };
  await assert.rejects(configureApiPinning(adapter, `https://${PINNED_API_HOST}/api`, false), /instalación/);
  assert.equal(await configureApiPinning(adapter, `https://${PINNED_API_HOST}/api`, true), 'development-without-native-pinning');
});
test('pinning: la inicialización configura el host exacto y propaga un fallo nativo', async () => {
  let captured;
  const adapter = { available: () => true, initialize: async value => { captured = value; } };
  assert.equal(await configureApiPinning(adapter, `https://${PINNED_API_HOST}/api`, false), 'native-pinning');
  assert.deepEqual(captured[PINNED_API_HOST].publicKeyHashes, API_PUBLIC_KEY_HASHES);
  assert.equal(captured[PINNED_API_HOST].includeSubdomains, false);
  await assert.rejects(configureApiPinning({ ...adapter, initialize: async () => { throw Error('rechazado'); } }, `https://${PINNED_API_HOST}/api`, false), /rechazado/);
});
test('pinning: rechaza otro host y HTTP en producción antes de habilitar la red', async () => {
  let calls = 0;
  const adapter = { available: () => true, initialize: async () => { calls++; } };
  await assert.rejects(configureApiPinning(adapter, 'https://otro.example/api', false), /servidor/);
  await assert.rejects(configureApiPinning(adapter, `http://${PINNED_API_HOST}/api`, false), /HTTPS/);
  assert.equal(calls, 0);
});
