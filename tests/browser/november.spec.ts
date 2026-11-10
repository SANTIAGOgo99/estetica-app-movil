import { test, expect, type Page } from '@playwright/test';
import { mockApi, login } from './fixtures';

const evidence = 'docs/evidence/noviembre-2026';
test.beforeEach(async ({ page }) => mockApi(page));

async function capture(page: Page, name: string) {
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBeTruthy();
  await page.screenshot({ path: `${evidence}/${name}.png`, fullPage: true });
}
async function signIn(page: Page) {
  await page.goto('/sign-in');
  await page.getByPlaceholder('nombre@correo.com').fill(login.email);
  await page.getByPlaceholder('Tu contraseña').fill(login.password);
  await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
  await expect(page.getByText('Hola, Cliente', { exact: true })).toBeVisible();
}
async function registrationFields(page: Page) {
  await page.goto('/register');
  await page.getByLabel('Nombre completo', { exact: true }).fill('Cliente de Prueba');
  await page.getByLabel('Correo electrónico', { exact: true }).fill('cliente@example.com');
  await page.getByLabel('Teléfono', { exact: true }).fill('5550000000');
  await page.getByLabel('Contraseña', { exact: true }).fill('Prueba123!');
  await page.getByLabel('Confirmar contraseña', { exact: true }).fill('Prueba123!');
}

test('NOV-01: visitante ve solo Inicio, Servicios y Productos a 320 y 412 px', async ({ page }) => {
  for (const width of [320, 412]) {
    await page.setViewportSize({ width, height: 844 });
    for (const path of ['/', '/services', '/products']) {
      await page.goto(path);
      for (const name of ['Inicio', 'Servicios', 'Productos'])
        await expect(page.getByRole('button', { name, exact: true })).toBeVisible();
      for (const name of ['Citas', 'Perfil', 'Abrir carrito'])
        await expect(page.getByRole('button', { name, exact: true })).toHaveCount(0);
      await expect(page.getByRole('button', { name: /^Ver carrito/ })).toHaveCount(0);
      await capture(page, `publico-${path === '/' ? 'inicio' : path.slice(1)}-${width}`);
    }
  }
});

test('NOV-02: sesión muestra accesos privados y cerrar sesión los retira', async ({ page }) => {
  await signIn(page);
  for (const name of ['Citas', 'Perfil', 'Abrir carrito'])
    await expect(page.getByRole('button', { name, exact: true })).toBeVisible();
  await capture(page, 'sesion-footer-privado');
  await page.getByRole('button', { name: 'Productos', exact: true }).click();
  await expect(page.getByRole('button', { name: /^Ver carrito/ })).toBeVisible();
  await page.getByRole('button', { name: 'Perfil', exact: true }).click();
  await page.getByRole('button', { name: 'Cerrar sesión', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Perfil', exact: true })).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => sessionStorage.getItem('estetica.client.session'))).toBeNull();
  await page.getByRole('button', { name: 'Inicio', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Iniciar sesión', exact: true })).toBeVisible();
  await capture(page, 'sesion-cerrada');
});

test('NOV-03: abrir una URL privada sin sesión no revela datos ni consulta el perfil', async ({ page }) => {
  let privateRequests = 0;
  page.on('request', req => { if (/\/users\/profile|\/appointments\/my/.test(req.url())) privateRequests++; });
  for (const path of ['/profile', '/appointments', '/cart', '/checkout']) {
    await page.goto(path);
    await expect(page.getByRole('button', { name: 'Iniciar sesión', exact: true })).toBeVisible();
    await expect(page.getByText('cliente@example.com', { exact: true })).toHaveCount(0);
  }
  expect(privateRequests).toBe(0);
  await capture(page, 'ruta-privada-protegida');
});

test('NOV-04: aviso público y lectura en registro conservan campos y no premarcan consentimiento', async ({ page }) => {
  await page.goto('/privacy');
  await expect(page.getByRole('heading', { name: 'Aviso de privacidad', exact: true })).toBeVisible();
  await capture(page, 'aviso-privacidad');
  await registrationFields(page);
  const consent = page.getByRole('checkbox', { name: 'Acepto el aviso de privacidad para crear mi cuenta' });
  await expect(consent).not.toBeChecked();
  await page.getByRole('button', { name: 'Leer aviso de privacidad', exact: true }).click();
  await expect(page.getByText('Quién utiliza tus datos', { exact: true })).toBeVisible();
  await expect(consent).not.toBeChecked();
  await page.getByRole('button', { name: 'Ocultar aviso de privacidad', exact: true }).click();
  await expect(page.getByLabel('Nombre completo', { exact: true })).toHaveValue('Cliente de Prueba');
  await consent.scrollIntoViewIfNeeded();
  await capture(page, 'registro-consentimiento-desmarcado');
});

test('NOV-05: sin consentimiento no hay POST; al aceptar se envía la versión del aviso', async ({ page }) => {
  const requests: Record<string, unknown>[] = [];
  await page.route('https://api.example.test/api/auth/register', async route => {
    requests.push(route.request().postDataJSON());
    await route.fulfill({ status: 201, json: { user: { id: 999, role: 'client' } } });
  });
  await registrationFields(page);
  await page.getByRole('button', { name: 'Crear cuenta', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('aviso de privacidad');
  expect(requests).toHaveLength(0);
  await capture(page, 'registro-bloqueado-sin-consentimiento');
  await page.getByRole('checkbox').click();
  await page.getByRole('button', { name: 'Crear cuenta', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Tu cuenta está lista' })).toBeVisible();
  expect(requests).toHaveLength(1);
  expect(requests[0].privacy_consent).toEqual({ accepted: true, version: '2026-11-10' });
  expect(requests[0].role).toBeUndefined();
  await capture(page, 'registro-confirmado-api-simulada');
});

test('NOV-06: un 401 retira sesión y accesos; al volver a entrar muestra la explicación', async ({ page }) => {
  await signIn(page);
  await page.route('https://api.example.test/api/users/profile', route => route.fulfill({ status: 401, json: { error: 'Token inválido' } }));
  await page.goto('/profile');
  await expect.poll(() => page.evaluate(() => sessionStorage.getItem('estetica.client.session'))).toBeNull();
  await expect(page.getByRole('button', { name: 'Perfil', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Tu sesión venció');
  await capture(page, 'sesion-rechazada-401');
});

test('NOV-07: un 500 permite reintentar sin cerrar sesión ni mostrar detalles del servidor', async ({ page }) => {
  await signIn(page);
  await page.route('https://api.example.test/api/users/profile', route => route.fulfill({ status: 500, json: { error: 'database password PRIVATE', stack: 'PRIVATE' } }));
  await page.goto('/profile');
  await expect(page.getByRole('alert')).toContainText('No se pudo completar');
  await expect(page.getByText(/PRIVATE/)).toHaveCount(0);
  expect(await page.evaluate(() => sessionStorage.getItem('estetica.client.session'))).toBeTruthy();
  await capture(page, 'fallo-servidor-sin-exponer-datos');
  await page.unroute('https://api.example.test/api/users/profile');
  await page.getByRole('button', { name: 'Actualizar perfil', exact: true }).click();
  await expect(page.getByText('cliente@example.com', { exact: true }).first()).toBeVisible();
});
