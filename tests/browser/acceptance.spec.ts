import { test, expect } from '@playwright/test';
import { mockApi, login } from './fixtures';

test.beforeEach(async ({ page }) => mockApi(page));
test('HU01: exige credenciales y permite iniciar/restaurar sesión de cliente', async ({ page }) => {
  await page.goto('/sign-in');
  await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
  await expect(page.getByText('Escribe tu correo electrónico.', { exact: true })).toBeVisible();
  await page.getByPlaceholder('nombre@correo.com').fill(login.email);
  await page.getByPlaceholder('Tu contraseña').fill(login.password);
  await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
  await expect.poll(() => page.evaluate(() => sessionStorage.getItem('estetica.client.session'))).toBeTruthy();
  await page.reload();
  await expect(page.getByText('Hola, Cliente', { exact: true })).toBeVisible();
  await page.goto('/profile');
  await page.getByRole('button', { name: 'Cerrar sesión', exact: true }).click();
  await expect.poll(() => page.evaluate(() => sessionStorage.getItem('estetica.client.session'))).toBeNull();
  await expect(page.getByRole('button', { name: 'Iniciar sesión', exact: true })).toBeVisible();
});
for (const [hu, path, name, detail] of [
  ['HU02/HU03', '/services', 'Corte de prueba', '/service-detail'],
  ['HU04/HU05', '/products', 'Shampoo de prueba', '/product-detail'],
]) {
  test(`${hu}: consulta pública, búsqueda y detalle`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByRole('button', { name: `Ver ${name}` })).toBeVisible();
    const search = page.getByPlaceholder(path === '/services' ? 'Corte, color, tratamiento…' : 'Nombre o marca…');
    await search.fill('no-existe');
    await expect(page.getByText('Sin coincidencias', { exact: true })).toBeVisible();
    await search.fill('');
    await page.getByRole('button', { name: `Ver ${name}` }).click();
    await expect(page).toHaveURL(new RegExp(detail));
    await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
    await page.getByRole('button', { name: path === '/services' ? 'Agendar cita' : 'Agregar al carrito', exact: true }).click();
    await expect(page).toHaveURL(/sign-in/);
    await expect(page.getByPlaceholder('nombre@correo.com')).toBeVisible();
  });
}
test('HU02: muestra fallo y permite reintentar el catálogo', async ({ page }) => {
  await page.route('https://api.example.test/api/services/active', route => route.fulfill({ status: 500, json: {} }));
  await page.goto('/services');
  await expect(page.getByRole('button', { name: 'Intentar nuevamente' })).toBeVisible();
  await page.unroute('https://api.example.test/api/services/active');
  await page.getByRole('button', { name: 'Intentar nuevamente' }).click();
  await expect(page.getByRole('button', { name: 'Ver Corte de prueba' })).toBeVisible();
});

test('HU01: credenciales rechazadas muestran error y no crean sesión', async ({ page }) => {
  await page.route('https://api.example.test/api/auth/login', route => route.fulfill({ status: 401, json: { error: 'Usuario no encontrado' } }));
  await page.goto('/sign-in');
  await page.getByPlaceholder('nombre@correo.com').fill(login.email);
  await page.getByPlaceholder('Tu contraseña').fill(login.invalidPassword);
  await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
  await expect(page.getByText('Correo o contraseña incorrectos.', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => sessionStorage.getItem('estetica.client.session'))).toBeNull();
});
