import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtempSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readFile } from 'node:fs/promises';
import { releaseProject, validatePreviewConfig, validateEasProject } from '../scripts/release-config.mjs';
import { downloadApk, validatePreviewBuild } from '../scripts/release-artifact.mjs';

const sha = 'a'.repeat(40);
const build = () => ({ id: '6953a647-0856-4125-afca-f40b1d20539d', status: 'FINISHED',
  platform: 'ANDROID', distribution: 'INTERNAL', buildProfile: 'preview',
  app: { id: releaseProject.id }, appIdentifier: releaseProject.androidPackage, gitCommitHash: sha,
  artifacts: { buildUrl: 'https://expo.dev/artifacts/eas/example.apk' } });

test('CD: conserva identidad existente, perfil APK y URL efectiva del builder', async () => {
  const app = JSON.parse(await readFile(new URL('../app.json', import.meta.url), 'utf8')).expo;
  const eas = JSON.parse(await readFile(new URL('../eas.json', import.meta.url), 'utf8'));
  assert.equal(validatePreviewConfig(app, eas, releaseProject.apiUrl).android.buildType, 'apk');
  for (const mutate of [a => { a.extra.eas.projectId = 'otro'; }, a => { a.owner = 'otra-cuenta'; },
    a => { a.android.package = 'otro.paquete'; }]) {
    const changed = structuredClone(app); mutate(changed);
    assert.throws(() => validatePreviewConfig(changed, eas, releaseProject.apiUrl), /identidad/);
  }
  for (const mutate of [e => { e.build.preview.android.buildType = 'app-bundle'; },
    e => { e.build.preview.distribution = 'store'; }, e => { e.cli.requireCommit = false; },
    e => { e.build.preview.env.EXPO_PUBLIC_API_URL = 'https://otro.example/api'; }]) {
    const changed = structuredClone(eas); mutate(changed);
    assert.throws(() => validatePreviewConfig(app, changed, releaseProject.apiUrl));
  }
  assert.throws(() => validatePreviewConfig(app, eas, undefined), /RELEASE_API_URL/);
});

test('CD: la consulta remota debe confirmar cuenta, slug e ID existentes', () => {
  const project = { id: releaseProject.id, account: releaseProject.owner, slug: releaseProject.slug,
    fullName: `@${releaseProject.owner}/${releaseProject.slug}` };
  assert.equal(validateEasProject({ project }).id, releaseProject.id);
  for (const key of ['id', 'account', 'slug', 'fullName'])
    assert.throws(() => validateEasProject({ project: { ...project, [key]: 'otro' } }));
});

test('CD: no acredita builds en cola, otro commit/proyecto, AAB ni URLs ajenas', () => {
  assert.equal(validatePreviewBuild([build()], sha).projectId, releaseProject.id);
  for (const patch of [{ status: 'IN_QUEUE' }, { gitCommitHash: 'b'.repeat(40) },
    { app: { id: 'otro' } }, { appIdentifier: 'otro.paquete' }, { platform: 'IOS' },
    { buildProfile: 'production' }, { distribution: 'STORE' },
    { artifacts: { buildUrl: 'https://expo.dev/artifacts/eas/example.aab' } },
    { artifacts: { buildUrl: 'https://otro.example/app.apk' } }])
    assert.throws(() => validatePreviewBuild({ ...build(), ...patch }, sha));
  assert.throws(() => validatePreviewBuild([], sha));
  assert.throws(() => validatePreviewBuild([build(), build()], sha));
});

test('CD: descarga local controlada y rechazo de HTML/errores, sin red ni builds', async t => {
  const dir = mkdtempSync(join(tmpdir(), 'actividad5-apk-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const bytes = Uint8Array.from([80, 75, 3, 4, 1, 2, 3]);
  const path = join(dir, 'fixture.apk');
  const result = await downloadApk('https://example.test/fixture.apk', path, async () => new Response(bytes));
  assert.equal(result.bytes, bytes.length);
  assert.equal(result.sha256, 'e8b35476d2bd55232509d060f0e3b56737376d1848289eea711e974396ef2311');
  assert.deepEqual(new Uint8Array(readFileSync(path)), bytes);
  assert.equal(existsSync(`${path}.part`), false);
  await assert.rejects(downloadApk('https://example.test/error', join(dir, 'error.apk'),
    async () => new Response('error', { status: 503 })), /HTTP 503/);
  await assert.rejects(downloadApk('https://example.test/html', join(dir, 'html.apk'),
    async () => new Response('<html>no es APK</html>')), /cabecera/);
  assert.equal(existsSync(join(dir, 'html.apk')), false);
});
