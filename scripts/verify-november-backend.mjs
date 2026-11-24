import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { normalizeApiUrl } from '../src/infrastructure/http/apiUrl.ts';
import { decodeCatalog } from '../src/features/catalog/model.ts';

// Solo GET: no crea usuarios, citas, pedidos ni modifica información productiva.
const local = (existsSync('.env') ? readFileSync('.env', 'utf8') : '').match(/^\s*EXPO_PUBLIC_API_URL\s*=\s*(.*?)\s*$/m)?.[1]?.replace(/^['"]|['"]$/g, '');
const base = normalizeApiUrl(process.env.EXPO_PUBLIC_API_URL || local || '', false);
const checks = await Promise.all([
  { path: '/services/active', expected: 200, catalog: true },
  { path: '/products/active', expected: 200, catalog: true },
  { path: '/users/profile', expected: 403 },
  { path: '/users/profile', expected: 401, invalidToken: true },
].map(async check => {
  const start = performance.now();
  try {
    const response = await fetch(base + check.path, {
      headers: { Accept: 'application/json', ...(check.invalidToken ? { Authorization: 'Bearer invalid-test-token' } : {}) },
      signal: AbortSignal.timeout(20000),
    });
    const body = await response.json();
    const items = check.catalog && response.ok ? decodeCatalog(body) : null;
    return {
      path: check.path, scenario: check.invalidToken ? 'token inválido' : check.catalog ? 'catálogo público real' : 'sin sesión',
      status: response.status, expected: check.expected, passed: response.status === check.expected,
      ...(items ? { count: items.length, firstPublicItem: items[0] ? { id: items[0].id, name: items[0].name, price: items[0].price } : null } : {}),
      durationMs: Math.round(performance.now() - start),
    };
  } catch {
    return { path: check.path, scenario: check.invalidToken ? 'token inválido' : 'consulta', passed: false, error: 'No se pudo verificar la respuesta o el contrato del servidor.' };
  }
}));
const result = { checkedAt: new Date().toISOString(), base, scope: 'Backend publicado; solo lectura. Sin credenciales reales. No acredita login real, escrituras, pinning ni pruebas Android.', checks };
mkdirSync('docs/evidence/noviembre-2026', { recursive: true });
writeFileSync('docs/evidence/noviembre-2026/backend.json', JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
if (checks.some(check => !check.passed)) process.exitCode = 1;
