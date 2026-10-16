import assert from 'node:assert/strict';
import { test } from 'node:test';
import { validateCredentials } from '../src/features/auth/validation.ts';
import { decodeCatalog, decodeItem } from '../src/features/catalog/model.ts';
import { decodeSlots, displayedStatus } from '../src/features/appointments/model.ts';
import { needsSession, routePath } from '../src/features/interfaces/access.ts';

test('HU01: correo válido y campos obligatorios', () => {
  assert.deepEqual(validateCredentials({ email: 'cliente@example.com', password: 'clave' }), {});
  assert.ok(validateCredentials({ email: 'incorrecto', password: '' }).email);
  assert.ok(validateCredentials({ email: '', password: '' }).password);
});
test('HU02-HU05: catálogo vacío, inactivos y datos inválidos', () => {
  assert.deepEqual(decodeCatalog([]), []);
  assert.deepEqual(decodeCatalog([{ id: 1, is_active: false }]), []);
  assert.throws(() => decodeCatalog({ items: [] }));
  assert.throws(() => decodeItem({ id: 1, name: 'Servicio', price: -1 }));
  assert.equal(decodeItem({ id: 1, name: 'Servicio', price: '100.50' }).price, 100.5);
});
test('HU07: conserva ocupado y rechaza disponibilidad ambigua', () => {
  const slot = { time: '11:00', appointment_date: '2026-11-01 11:00:00', available: false };
  assert.equal(decodeSlots({ all_slots: [slot] }).slots[0].available, false);
  assert.throws(() => decodeSlots({ all_slots: [{ ...slot, available: 'false' }] }));
});
test('HU13: estado pendiente de cierre y autorización de rutas', () => {
  assert.equal(displayedStatus({ phase: 'pending_review', status: 'pending' }), 'Pendiente de cierre');
  assert.equal(needsSession('booking'), true);
  assert.equal(needsSession('services'), false);
  assert.equal(routePath('product-detail', 3), '/product-detail?id=3');
  assert.equal(routePath('https://externo.example'), '/');
});
