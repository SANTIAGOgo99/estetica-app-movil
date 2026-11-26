import assert from 'node:assert/strict';
import { test } from 'node:test';
import { decodeSlots } from '../src/features/appointments/model.ts';

test('respuesta real sin personal muestra el mensaje y no ofrece reservas', () => {
  const message = 'No hay personal disponible para ese servicio, fecha y duración.';
  assert.deepEqual(decodeSlots({ available_slots: [], message }), { slots: [], message });
});

test('lista de disponibles conserva el instante del servidor y acepta disponibilidad implícita', () => {
  const slot = { time: '11:00', appointment_date: '2026-11-27 11:00:00' };
  const result = decodeSlots({ available_slots: [slot] });
  assert.equal(result.slots[0].available, true);
  assert.equal(result.slots[0].date, slot.appointment_date);
  assert.equal(decodeSlots({ available_slots: [{ ...slot, available: false }] }).slots[0].available, false);
});

test('all_slots sigue siendo la fuente completa y no oculta horarios ocupados', () => {
  const slot = { time: '11:00', appointment_date: '2026-11-27 11:00:00', available: false };
  assert.equal(decodeSlots({ all_slots: [slot], available_slots: [] }).slots[0].available, false);
  assert.deepEqual(decodeSlots({ all_slots: [], available_slots: [slot] }).slots, []);
});

test('rechaza respuestas corruptas y no inventa horas ni disponibilidad', () => {
  const slot = { time: '11:00', appointment_date: '2026-11-27 11:00:00' };
  for (const response of [
    {}, { available_slots: null }, { all_slots: null, available_slots: [] },
    { all_slots: [slot] }, { available_slots: [{ ...slot, available: 'true' }] },
    { available_slots: [{ time: '11:00' }] },
  ]) assert.throws(() => decodeSlots(response));
});
