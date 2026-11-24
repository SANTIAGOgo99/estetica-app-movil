import assert from 'node:assert/strict';
import { test } from 'node:test';
import { requiredChecks, validateRelease, validatePreviewRelease } from '../scripts/release-policy.mjs';
const sha = 'a'.repeat(40);
const good = () => ({ run: { id: 123, run_attempt: 2, head_sha: sha, head_branch: 'develop', event: 'push', path: '.github/workflows/ci.yml', status: 'completed', conclusion: 'success' }, jobs: requiredChecks.map(name => ({ name, status: 'completed', conclusion: 'success' })), sha, branch: 'develop', target: 'preview' });
test('HU00: APK solo con las seis verificaciones correctas del mismo commit', () => {
  assert.equal(validateRelease(good()), 'preview');
  for (const name of requiredChecks) {
    const value = good(); value.jobs.find(j => j.name === name).conclusion = 'failure';
    assert.throws(() => validateRelease(value), /Falta prueba/);
  }
});

test('CD: sin SHA explícitamente habilitado no se permite preview; solo develop', () => {
  const value = good();
  assert.throws(() => validatePreviewRelease(value), /habilitar/);
  value.approvedSha = sha;
  assert.equal(validatePreviewRelease(value), 'preview');
  for (const approvedSha of ['', 'b'.repeat(40)]) assert.throws(() => validatePreviewRelease({ ...value, approvedSha }));
  for (const branch of ['main', 'feature/noviembre-seguridad-privacidad'])
    assert.throws(() => validatePreviewRelease({ ...value, branch }), /develop/);
});

test('CD: workflow_call solo admite CI abierta del mismo ID e intento con seis jobs aprobados', () => {
  const value = { ...good(), approvedSha: sha, currentRunId: '123', currentRunAttempt: '2' };
  value.run.status = 'in_progress'; value.run.conclusion = null;
  assert.equal(validatePreviewRelease(value), 'preview');
  for (const patch of [{ currentRunId: '124' }, { currentRunAttempt: '1' }, { currentRunId: undefined }])
    assert.throws(() => validatePreviewRelease({ ...value, ...patch }), /incompleto/);
  for (const status of ['queued', 'waiting', 'cancelled']) {
    const changed = structuredClone(value); changed.run.status = status;
    assert.throws(() => validatePreviewRelease(changed));
  }
  for (const patch of [{ conclusion: 'skipped' }, { status: 'in_progress' }]) {
    const changed = structuredClone(value); Object.assign(changed.jobs[0], patch);
    assert.throws(() => validatePreviewRelease(changed), /prueba/);
  }
  value.jobs.push({ ...value.jobs[0] });
  assert.throws(() => validatePreviewRelease(value), /ambigua/);
});

test('CD: rechaza paths parecidos al workflow CI y ramas de evidencia distintas', () => {
  for (const patch of [{ path: '.github/workflows/ci.yml-malicioso' }, { head_branch: 'main' }]) {
    const value = good(); Object.assign(value.run, patch);
    assert.throws(() => validateRelease(value));
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
