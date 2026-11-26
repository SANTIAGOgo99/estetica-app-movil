import { test, expect, type Page } from '@playwright/test';
import { mockApi, login } from './fixtures';

test.beforeEach(async ({ page }) => mockApi(page));

async function openBooking(page: Page) {
  await page.goto('/sign-in');
  await page.getByPlaceholder('nombre@correo.com').fill(login.email);
  await page.getByPlaceholder('Tu contraseña').fill(login.password);
  await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
  await expect(page.getByText('Hola, Cliente', { exact: true })).toBeVisible();
  await page.goto('/booking?service=2');
  await page.getByRole('button', { name: /^\d{4}-\d{2}-\d{2}$/ }).first().click();
}

test('sin personal: muestra el motivo del servidor y bloquea confirmar', async ({ page }) => {
  const message = 'No hay personal disponible para ese servicio, fecha y duración.';
  await page.route('https://api.example.test/api/appointments/slots?**', route => route.fulfill({ json: { available_slots: [], message } }));
  await openBooking(page);
  await expect(page.getByText(message, { exact: true })).toBeVisible();
  await expect(page.getByText('No pudimos interpretar los horarios disponibles.', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Confirmar mi cita', exact: true })).toBeDisabled();
});

test('disponibilidad nueva: permite elegir un horario sin enviar una reserva', async ({ page }) => {
  let reservations = 0;
  page.on('request', request => { if (request.method() === 'POST' && new URL(request.url()).pathname === '/api/appointments') reservations++; });
  await page.route('https://api.example.test/api/appointments/slots?**', route => {
    const date = new URL(route.request().url()).searchParams.get('date');
    return route.fulfill({ json: { available_slots: [{ time: '11:00', appointment_date: `${date} 11:00:00` }] } });
  });
  await openBooking(page);
  await page.getByRole('button', { name: '11:00 disponible', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Confirmar mi cita', exact: true })).toBeEnabled();
  expect(reservations).toBe(0);
});

test('contrato anterior: conserva horarios ocupados deshabilitados', async ({ page }) => {
  await openBooking(page);
  await expect(page.getByRole('button', { name: '12:00 · Ocupado', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: '11:00 disponible', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Confirmar mi cita', exact: true })).toBeEnabled();
});
