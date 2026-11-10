import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';

// Introspección de plugins: no genera ni edita android/ o ios/.
const run = spawnSync(process.execPath, ['node_modules/expo/bin/cli', 'config', '--type', 'introspect', '--json'], {
  encoding: 'utf8', maxBuffer: 10 * 1024 * 1024,
  env: { ...process.env, EXPO_NO_DOTENV: '1' },
});
if (run.status !== 0) { console.error(run.stderr); process.exit(run.status ?? 1); }
const config = JSON.parse(run.stdout);
const android = config._internal?.modResults?.android;
const properties = Object.fromEntries((android?.gradleProperties ?? []).filter(item => item.type === 'property').map(item => [item.key, item.value]));
const manifest = android?.manifest?.manifest;
const permissions = (manifest?.['uses-permission'] ?? []).map(item => ({ name: item.$?.['android:name'], action: item.$?.['tools:node'] ?? 'include' }));
const result = {
  checkedAt: new Date().toISOString(),
  scope: 'Introspección de configuración Expo SDK 57; no es una compilación ni una inspección de APK final.',
  release: {
    minify: properties['android.enableMinifyInReleaseBuilds'],
    shrinkResources: properties['android.enableShrinkResourcesInReleaseBuilds'],
    cleartextTraffic: manifest?.application?.[0]?.$?.['android:usesCleartextTraffic'],
  },
  permissions,
  pending: ['Compilar y firmar APK Release', 'Verificar manifest fusionado y funcionamiento en Android', 'Inspección JADX/MobSF y revisión de mapping R8', 'Pinning SHA-256 real y pruebas anti-MitM'],
};
mkdirSync('docs/evidence/noviembre-2026', { recursive: true });
writeFileSync('docs/evidence/noviembre-2026/android-config.json', JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
if (result.release.minify !== 'true' || result.release.shrinkResources !== 'true' || result.release.cleartextTraffic !== 'false') process.exitCode = 1;
