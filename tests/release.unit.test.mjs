import assert from 'node:assert/strict';
import { test } from 'node:test';
import { requiredChecks, validateRelease } from '../scripts/release-policy.mjs';
const sha = 'a'.repeat(40);
const good = () => ({ run: { head_sha: sha, head_branch: 'develop', event: 'push', path: '.github/workflows/ci.yml', status: 'completed', conclusion: 'success' }, jobs: requiredChecks.map(name => ({ name, conclusion: 'success' })), sha, branch: 'develop', target: 'preview' });
test('HU00: APK solo con las seis verificaciones correctas del mismo commit', () => {
  assert.equal(validateRelease(good()), 'preview');
  for (const name of requiredChecks) {
    const value = good(); value.jobs.find(j => j.name === name).conclusion = 'failure';
    assert.throws(() => validateRelease(value), /Falta prueba/);
  }
});
test('HU00: bloquear PR, evidencia antigua y ejecución incompleta', () => {
  for (const patch of [{ event: 'pull_request' }, { head_sha: 'b'.repeat(40) }, { conclusion: 'failure' }, { status: 'in_progress' }, { path: '.github/workflows/otro.yml' }]) {
    const value = good(); Object.assign(value.run, patch); assert.throws(() => validateRelease(value));
  }
});
test('HU00: Google Play exige aceptación nativa y staging del mismo commit en main', () => {
  const value = good(); value.branch = 'main'; value.run.head_branch = 'main'; value.target = 'play-internal';
  assert.throws(() => validateRelease(value), /aceptación/);
  value.nativeSha = sha; value.stagingSha = sha;
  assert.equal(validateRelease(value), 'production');
  value.nativeSha = 'b'.repeat(40); assert.throws(() => validateRelease(value));
});
