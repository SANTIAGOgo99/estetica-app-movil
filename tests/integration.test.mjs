import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createServer } from 'node:http';
import { apiRequest } from '../src/features/api/client.ts';
import { decodeCatalog } from '../src/features/catalog/model.ts';
import { requestLogin } from '../src/features/auth/client.ts';
import { reserveAppointment } from '../src/features/appointments/client.ts';

// Servidor HTTP local de contrato. No sustituye API + PostgreSQL de staging.
test('HU01/HU02/HU08: cliente → HTTP → decodificador; errores y conflicto', async t => {
  const received = [];
  const server = createServer(async (req, res) => {
    let raw = '';
    for await (const chunk of req) raw += chunk;
    received.push({ path: req.url, method: req.method, auth: req.headers.authorization, body: raw && JSON.parse(raw) });
    res.setHeader('Content-Type', 'application/json');
    if (req.url === '/api/auth/login') return res.end(JSON.stringify({ role: 'client', token: 'test-only-token' }));
    if (req.url === '/api/services/active') return res.end(JSON.stringify([{ id: 2, name: 'Corte', price: '250', duration_minutes: 45 }]));
    if (req.url === '/api/appointments') {
      res.statusCode = 409;
      return res.end(JSON.stringify({ message: 'Horario ocupado' }));
    }
    res.statusCode = 500;
    res.end(JSON.stringify({ stack: 'private', message: 'database password' }));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const previous = process.env.EXPO_PUBLIC_API_URL;
  const base = `http://127.0.0.1:${server.address().port}/api`;
  process.env.EXPO_PUBLIC_API_URL = base;
  t.after(async () => {
    if (previous === undefined) delete process.env.EXPO_PUBLIC_API_URL;
    else process.env.EXPO_PUBLIC_API_URL = previous;
    await new Promise(resolve => server.close(resolve));
  });
  assert.deepEqual(await requestLogin(base, ' cliente@example.com ', ' clave '), { token: 'test-only-token' });
  assert.deepEqual(received[0].body, { email: 'cliente@example.com', password: ' clave ' });
  const items = decodeCatalog(await apiRequest('/services/active'));
  assert.equal(items[0].price, 250);
  assert.equal(received[1].auth, undefined);
  await assert.rejects(reserveAppointment('test-only-token', '2026-11-01 11:00:00', 2), /ocupado/);
  assert.equal(received[2].auth, 'Bearer test-only-token');
  assert.deepEqual(received[2].body, { service_id: 2, appointment_date: '2026-11-01 11:00:00' });
  await assert.rejects(apiRequest('/fallo'), error => !error.message.includes('password'));
});

// HU01-I02: contrato local completo de sesión y perfil, sin base de datos real.
test('HU01-I02: login HTTP, restauración, perfil autorizado y retirada de sesión', async t => {
  const { readFileSync } = await import('node:fs');
  const { restoreSession, sessionExpiry } = await import('../src/features/auth/session.ts');
  const { decodeProfile } = await import('../src/features/account/model.ts');
  const data = JSON.parse(readFileSync(new URL('./fixtures/mobile.json', import.meta.url), 'utf8'));
  const claims = Buffer.from(JSON.stringify({ role: 'client', exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url');
  const token = `e30.${claims}.test`;
  const server = createServer(async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    if (req.url === '/api/auth/login') {
      let raw = ''; for await (const chunk of req) raw += chunk;
      const body = JSON.parse(raw);
      if (body.email !== data.login.email || body.password !== data.login.password) {
        res.statusCode = 401; return res.end(JSON.stringify({ error: 'Usuario no encontrado' }));
      }
      return res.end(JSON.stringify({ role: 'client', token }));
    }
    if (req.url === '/api/users/profile' && req.headers.authorization === `Bearer ${token}`) return res.end(JSON.stringify(data.profile));
    res.statusCode = 401; res.end(JSON.stringify({ error: 'Sin sesión' }));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const previous = process.env.EXPO_PUBLIC_API_URL;
  const base = `http://127.0.0.1:${server.address().port}/api`;
  process.env.EXPO_PUBLIC_API_URL = base;
  t.after(async () => {
    if (previous === undefined) delete process.env.EXPO_PUBLIC_API_URL; else process.env.EXPO_PUBLIC_API_URL = previous;
    await new Promise(resolve => server.close(resolve));
  });
  await assert.rejects(requestLogin(base, data.login.email, data.login.invalidPassword), /incorrectos/);
  let saved = (await requestLogin(base, data.login.email, data.login.password)).token;
  assert.ok(sessionExpiry(saved));
  assert.equal(await restoreSession(async () => saved, async () => { saved = null; }), token);
  assert.equal(decodeProfile(await apiRequest('/users/profile', { token: saved })).email, data.profile.email);
  saved = null;
  await assert.rejects(apiRequest('/users/profile', { token: saved }), /sesión venció/);
});
