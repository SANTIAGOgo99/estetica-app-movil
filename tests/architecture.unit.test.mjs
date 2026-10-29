import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

function files(root) {
  return readdirSync(root, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? files(join(root, entry.name)) : [join(root, entry.name)]);
}
test('Clean: dominio y casos de uso no importan React, Expo, vistas ni adaptadores', () => {
  for (const file of [...files('src/domain'), ...files('src/application')]) {
    const imports = [...readFileSync(file, 'utf8').matchAll(/from\s+['"]([^'"]+)['"]/g)].map(match => match[1]);
    for (const source of imports) assert.doesNotMatch(source, /react|expo|features|infrastructure|composition/, `${file} importa ${source}`);
  }
});
test('Clean: infraestructura de sesión no depende de pantallas', () => {
  for (const file of files('src/infrastructure')) assert.doesNotMatch(readFileSync(file, 'utf8'), /from\s+['"][^'"]*(?:features|app\/|components)/);
});
