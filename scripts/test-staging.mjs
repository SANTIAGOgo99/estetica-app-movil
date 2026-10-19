import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { requestLogin } from '../src/features/auth/client.ts';
import { sessionExpiry } from '../src/features/auth/session.ts';
import { decodeCatalog } from '../src/features/catalog/model.ts';
import { decodeProfile } from '../src/features/account/model.ts';
import { decodeAppointments } from '../src/features/appointments/model.ts';

// Contrato HTTP con staging real. Solo consulta datos y autentica una cuenta de pruebas.
// No crea cuentas/citas/pedidos ni genera carga. Variables secretas: no imprimir respuestas ni token.
mkdirSync('reports', { recursive: true });
try {
  const base = new URL(process.env.STAGING_API_URL ?? '');
  assert.equal(base.protocol, 'https:', 'STAGING_API_URL debe ser HTTPS');
  assert.equal(base.username + base.password, '', 'La URL no debe contener credenciales');
  assert.notEqual(base.hostname, 'esteticaa-backend-five.vercel.app', 'No ejecutar este flujo contra producción');
  assert.equal(process.env.STAGING_ENVIRONMENT_CONFIRMED, 'true', 'Confirmar entorno aislado con STAGING_ENVIRONMENT_CONFIRMED=true');
  assert.ok(process.env.STAGING_CLIENT_EMAIL && process.env.STAGING_CLIENT_PASSWORD, 'Configurar cuenta CLIENTE en secretos de staging');
  const request = async (path, token) => {
    const response = await fetch(base.href.replace(/\/$/, '') + path, { headers: token ? { Authorization: `Bearer ${token}` } : {}, signal: AbortSignal.timeout(15000) });
    assert.equal(response.ok, true, `HTTP ${response.status} en ${path}`);
    return response.json();
  };
  decodeCatalog(await request('/services/active'));
  decodeCatalog(await request('/products/active'));
  const { token } = await requestLogin(base.href, process.env.STAGING_CLIENT_EMAIL, process.env.STAGING_CLIENT_PASSWORD);
  assert.ok(sessionExpiry(token), 'La API debe emitir sesión de cliente vigente');
  const profile = decodeProfile(await request('/users/profile', token));
  assert.equal(profile.email.toLowerCase(), process.env.STAGING_CLIENT_EMAIL.toLowerCase(), 'El perfil debe corresponder a la cuenta de prueba');
  decodeAppointments(await request('/appointments/my', token));
  writeFileSync('reports/staging.json', JSON.stringify({ result: 'passed', scope: 'API staging: catálogos, autenticación, perfil y agenda; persistencia observada por consultas, sin inspección directa de BD', cases: 5, commit: process.env.GITHUB_SHA ?? 'local' }, null, 2));
  console.log('Staging: cinco verificaciones de contrato aprobadas; datos personales y token omitidos.');
} catch (error) {
  writeFileSync('reports/staging.json', JSON.stringify({ result: 'blocked-or-failed', scope: 'Integración real no aprobada', reason: 'Configuración incompleta o contrato no verificado; revisar variables y cuenta de pruebas sin publicar respuestas personales' }, null, 2));
  console.error('Integración staging no aprobada: revisar configuración y reporte local, sin publicar credenciales.');
  process.exitCode = 1;
}
