import assert from 'node:assert/strict';
import { test } from 'node:test';
import { validateCredentials } from '../src/features/auth/validation.ts';
import { requestLogin } from '../src/features/auth/client.ts';
import { restoreSession, sessionExpiry } from '../src/features/auth/session.ts';

const reply = (status, body) => async () => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const token = claims => `${Buffer.from('{}').toString('base64url')}.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.test`;

test('rechaza correo y contraseña vacíos', () => {
  assert.deepEqual(validateCredentials({ email: ' ', password: ' ' }), { email: 'Escribe tu correo electrónico.', password: 'Escribe tu contraseña.' });
});
test('rechaza formatos de correo inválidos', () => {
  for (const email of ['cliente', 'cliente@', '@correo.com', 'cliente @correo.com']) assert.ok(validateCredentials({ email, password: 'clave' }).email);
});
test('permite credenciales existentes sin imponer reglas de registro', () => {
  assert.deepEqual(validateCredentials({ email: ' cliente@example.com ', password: 'clave' }), {});
});
test('no envía datos si falta la URL de API', async () => {
  await assert.rejects(requestLogin(undefined, 'cliente@example.com', 'clave', () => { throw new Error('No debe llamar fetch'); }), /no está configurado/);
});
test('usa el contrato real, recorta correo y conserva la contraseña', async () => {
  const fetcher = async (url, options) => {
    assert.equal(url, 'https://api.example.com/api/auth/login');
    assert.equal(options.method, 'POST');
    assert.deepEqual(JSON.parse(options.body), { email: 'cliente@example.com', password: ' clave ' });
    return new Response(JSON.stringify({ role: 'client', token: 'token-de-prueba' }), { status: 200 });
  };
  assert.deepEqual(await requestLogin('https://api.example.com/api/', ' cliente@example.com ', ' clave ', fetcher), { token: 'token-de-prueba' });
});
test('credenciales rechazadas no revelan si existe la cuenta', async () => {
  for (const status of [400, 401]) await assert.rejects(requestLogin('https://api.example.com/api', 'a@b.com', 'clave', reply(status, { error: 'Usuario no encontrado' })), /Correo o contraseña incorrectos/);
});
test('no concede acceso móvil a administradores', async () => {
  await assert.rejects(requestLogin('https://api.example.com/api', 'a@b.com', 'clave', reply(200, { role: 'admin', token: 'token-de-prueba' })), /solo para clientes/);
});
test('maneja suspensión, límite de intentos y fallo del servidor', async () => {
  for (const [status, message] of [[403, /no tiene acceso/], [429, /Demasiados intentos/], [500, /no está disponible/]]) await assert.rejects(requestLogin('https://api.example.com/api', 'a@b.com', 'clave', reply(status, {})), message);
});
test('rechaza respuesta incompleta o sin llave de acceso', async () => {
  for (const body of [{}, { role: 'client', token: '' }, null]) await assert.rejects(requestLogin('https://api.example.com/api', 'a@b.com', 'clave', reply(200, body)));
});
test('rechaza respuesta no JSON', async () => {
  await assert.rejects(requestLogin('https://api.example.com/api', 'a@b.com', 'clave', async () => new Response('HTML', { status: 200 })), /no podemos procesar/);
});
test('maneja un fallo de red', async () => {
  await assert.rejects(requestLogin('https://api.example.com/api', 'a@b.com', 'clave', async () => { throw new TypeError('Network error'); }), /Revisa tu conexión/);
});
test('acepta vencimiento futuro de cliente y rechaza vencido, malformado o de administrador', () => {
  const now = 1000000;
  assert.equal(sessionExpiry(token({ role: 'client', exp: 1100 }), now), 1100000);
  for (const value of [token({ role: 'client', exp: 1000 }), token({ role: 'admin', exp: 1100 }), token({ role: 'client' }), 'malformado']) assert.equal(sessionExpiry(value, now), null);
});


test('restaura una sesión vigente sin borrarla', async () => {
  const saved = token({ role: 'client', exp: 1100 });
  assert.equal(await restoreSession(async () => saved, async () => assert.fail('No debe borrar una sesión vigente'), 1000000), saved);
});
test('limpia sesiones vencidas o malformadas antes de permitir otro acceso', async () => {
  for (const saved of [token({ role: 'client', exp: 1000 }), 'malformado']) {
    let removed = false;
    assert.equal(await restoreSession(async () => saved, async () => { removed = true; }, 1000000), null);
    assert.equal(removed, true);
  }
});
test('no inventa una sesión si el almacenamiento está vacío', async () => {
  assert.equal(await restoreSession(async () => null, async () => assert.fail('No hay nada que limpiar')), null);
});
test('propaga fallos de almacenamiento para mostrar el aviso al cliente', async () => {
  await assert.rejects(restoreSession(async () => { throw new Error('Lectura fallida'); }, async () => {}), /Lectura fallida/);
  await assert.rejects(restoreSession(async () => 'malformado', async () => { throw new Error('Limpieza fallida'); }), /Limpieza fallida/);
});
