import { test, expect, type Page, type TestInfo } from '@playwright/test';
import { mockApi, login, product } from './fixtures';

test.beforeEach(async ({ page }) => mockApi(page));

async function capture(page: Page, info: TestInfo, name: string) {
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBeTruthy();
  const path = info.outputPath(`${name}.png`);
  await page.screenshot({ path, fullPage: true });
  await info.attach(name, { path, contentType: 'image/png' });
}
async function signIn(page: Page) {
  await page.goto('/sign-in');
  await page.getByPlaceholder('nombre@correo.com').fill(login.email);
  await page.getByPlaceholder('Tu contraseña').fill(login.password);
  await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
  await expect(page.getByText('Hola, Cliente', { exact: true })).toBeVisible();
}

test('Octubre: catálogo público, validación y detalle a 320 y 412 px sin desborde', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  for (const width of [320, 412]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Ver nuestros servicios' })).toBeVisible();
    await capture(page, info, `inicio-${width}`);
    await page.getByRole('button', { name: 'Ver nuestros servicios' }).click();
    await expect(page.getByRole('button', { name: 'Ver Corte de prueba' })).toBeVisible();
    await capture(page, info, `servicios-${width}`);
    await page.getByRole('button', { name: 'Ver Corte de prueba' }).click();
    await expect(page.getByRole('heading', { name: 'Corte de prueba', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Agendar cita', exact: true }).click();
    await expect(page).toHaveURL(/sign-in/);
    await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
    await expect(page.getByText('Escribe tu correo electrónico.', { exact: true })).toBeVisible();
    await capture(page, info, `acceso-validacion-${width}`);
    await page.goto('/products');
    await expect(page.getByRole('button', { name: 'Ver Shampoo de prueba' })).toBeVisible();
    await capture(page, info, `productos-${width}`);
  }
  expect(errors).toEqual([]);
});

test('Octubre: sesión, carrito con cantidades y cierre actualizan las pantallas', async ({ page }, info) => {
  await signIn(page);
  await page.goto('/products');
  await page.getByRole('button', { name: 'Ver Shampoo de prueba' }).click();
  await page.getByRole('button', { name: 'Agregar al carrito', exact: true }).click();
  await page.getByRole('button', { name: 'Ver carrito', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Quitar Shampoo de prueba' })).toBeVisible();
  await capture(page, info, 'carrito');
  await page.getByRole('button', { name: '+', exact: true }).click();
  await expect(page.getByText(new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(product.price) * 2), { exact: true }).first()).toBeVisible();
  await capture(page, info, 'carrito-dos-unidades');
  await page.getByRole('button', { name: 'Continuar compra', exact: true }).click();
  await expect(page).toHaveURL(/checkout/);
  await capture(page, info, 'compra');
  await page.goto('/profile');
  await capture(page, info, 'perfil');
  await page.getByRole('button', { name: 'Cerrar sesión', exact: true }).click();
  await expect.poll(() => page.evaluate(() => sessionStorage.getItem('estetica.client.session'))).toBeNull();
  await page.goto('/cart');
  await expect(page.getByRole('button', { name: 'Quitar Shampoo de prueba' })).toHaveCount(0);
});

test('Octubre: agenda selecciona horario y confirma solo con respuesta del servidor simulado', async ({ page }, info) => {
  await signIn(page);
  await page.goto('/booking?service=2');
  await expect(page.getByText('Corte de prueba', { exact: true }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Confirmar mi cita', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: /^\d{4}-\d{2}-\d{2}$/ }).first().click();
  await expect(page.getByRole('button', { name: '11:00 disponible', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /12:00/ })).toBeDisabled();
  await page.getByRole('button', { name: '11:00 disponible', exact: true }).click();
  await capture(page, info, 'agenda');
  await page.getByRole('button', { name: 'Confirmar mi cita', exact: true }).click();
  await expect(page).toHaveURL(/booking-confirmed/);
  await capture(page, info, 'cita-confirmada-api-simulada');
});
