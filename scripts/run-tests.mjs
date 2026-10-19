import { spawnSync } from 'node:child_process';
import { mkdirSync, readdirSync } from 'node:fs';

const suite = process.argv[2] ?? 'regression';
const files = {
  unit: ['tests/unit.test.mjs', ...readdirSync('tests').filter(name => name.endsWith('.unit.test.mjs')).map(name => `tests/${name}`)],
  integration: ['tests/integration.test.mjs'],
  regression: readdirSync('tests').filter(name => name.endsWith('.test.mjs')).map(name => `tests/${name}`),
}[suite];
if (!files?.length) throw Error(`Suite desconocida o vacía: ${suite}`);
mkdirSync('reports', { recursive: true });
const result = spawnSync(process.execPath, [
  '--experimental-strip-types', '--test', '--test-reporter=spec', '--test-reporter-destination=stdout',
  '--test-reporter=junit', `--test-reporter-destination=reports/${suite}.xml`, ...files,
], { stdio: 'inherit' });
if (result.error) throw result.error;
process.exit(result.status ?? 1);
