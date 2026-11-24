import { test, expect, type Page } from '@playwright/test';
import { mockApi, login } from './fixtures';

test.beforeEach(async ({ page }) => mockApi(page));
async function openSettings(page: Page) {
  await page.goto('/sign-in');
  await page.getByPlaceholder('nombre@correo.com').fill(login.email);
  await page.getByPlaceholder('Tu contraseña').fill(login.password);
  await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
  await expect(page.getByText('Hola, Cliente', { exact: true })).toBeVisible();
  await page.goto('/profile');
  await page.getByRole('button', { name: 'Administrar mis datos y privacidad', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Mis datos y privacidad', exact: true })).toBeVisible();
}
async function privacyApi(page: Page) {
  let marketing = false;
  await page.route('https://api.example.test/api/users/privacy', async route => {
    if (route.request().method() === 'PUT') marketing = route.request().postDataJSON().marketing_allowed;
    await route.fulfill({ json: { marketing_allowed: marketing, consent_version: '2026-11-19', consent_at: '2026-11-19T18:00:00Z' } });
  });
}
test('ARCO-01: modifica datos con confirmación y muestra la respuesta del servidor', async ({ page }) => {
  await privacyApi(page);
  let changed = false;
  await page.route('https://api.example.test/api/users/profile', async route => {
    const body = route.request().method() === 'PUT' ? route.request().postDataJSON() : null;
    if (body) { expect(body.password).toBe('Correcta123!'); expect(body.full_name).toBe('Nombre corregido'); changed = true; }
    await route.fulfill({ json: { id: 1, full_name: changed ? 'Nombre corregido' : 'Cliente de prueba', email: login.email, phone: '5550000000', role: 'client', is_active: true } });
  });
  await openSettings(page);
  await expect(page.getByRole('button', { name: 'Guardar mis datos', exact: true })).toBeDisabled();
  await page.getByLabel('Nombre completo', { exact: true }).fill('Nombre corregido');
  await page.getByLabel('Contraseña de confirmación', { exact: true }).fill('Correcta123!');
  await page.getByRole('button', { name: 'Guardar mis datos', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Tus datos se guardaron correctamente');
  await expect(page.getByLabel('Contraseña de confirmación', { exact: true })).toHaveValue('');
  await page.screenshot({ path: 'docs/evidence/liberacion-2026-11-19/datos-corregidos.png', fullPage: true });
  await page.getByRole('button', { name: '← Volver', exact: true }).click();
  await expect(page.getByText('Nombre corregido', { exact: true }).first()).toBeVisible();
});
test('ARCO-02: guarda oposición y conserva la preferencia al volver a abrir', async ({ page }) => {
  await privacyApi(page);
  await openSettings(page);
  const toggle = page.getByRole('switch', { name: 'Permitir comunicaciones promocionales' });
  await expect(toggle).not.toBeChecked();
  await toggle.click();
  await expect(page.getByRole('alert')).toContainText('preferencia');
  await expect(toggle).toBeChecked();
  await toggle.click();
  await expect(toggle).not.toBeChecked();
  await page.screenshot({ path: 'docs/evidence/liberacion-2026-11-19/oposicion-guardada.png', fullPage: true });
  await page.reload();
  await expect(page.getByRole('switch', { name: 'Permitir comunicaciones promocionales' })).not.toBeChecked();
});
test('ARCO-03: eliminación requiere confirmación y contraseña, espera al servidor y cierra sesión', async ({ page }) => {
  await privacyApi(page);
  let deleted = false;
  await page.route('https://api.example.test/api/account', async route => {
    expect(route.request().method()).toBe('DELETE');
    expect(route.request().postDataJSON()).toEqual({ password: 'Correcta123!', confirm: true });
    deleted = true;
    await route.fulfill({ json: { deleted: true } });
  });
  await openSettings(page);
  await page.getByRole('button', { name: 'Eliminar mi cuenta', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Confirmar eliminación de mi cuenta', exact: true })).toBeDisabled();
  await page.getByLabel('Contraseña de confirmación', { exact: true }).fill('Correcta123!');
  await page.getByRole('checkbox', { name: 'Confirmo eliminar mi cuenta' }).click();
  await expect(page.getByRole('button', { name: 'Confirmar eliminación de mi cuenta', exact: true })).toBeEnabled();
  await page.screenshot({ path: 'docs/evidence/liberacion-2026-11-19/confirmacion-eliminar-cuenta.png', fullPage: true });
  await page.getByRole('button', { name: 'Confirmar eliminación de mi cuenta', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Iniciar sesión', exact: true })).toBeVisible();
  expect(deleted).toBe(true);
  expect(await page.evaluate(() => sessionStorage.getItem('estetica.client.session'))).toBeNull();
});
