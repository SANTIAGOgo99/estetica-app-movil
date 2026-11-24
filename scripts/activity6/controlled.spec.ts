import { test, expect } from '@playwright/test';
import { mockApi, login } from '../../tests/browser/fixtures';
import protocol from './protocol.json';

test('Acceso y disponibilidad con API simulada y veinte repeticiones', async ({ page }, info) => {
  await mockApi(page);
  const samples: { flow: string; repetition: number; totalMs: number; ok: boolean; budgetMs: number }[] = [];
  for (let repetition = 1; repetition <= protocol.samplesPerFlow; repetition++) {
    await page.goto('/sign-in');
    await page.evaluate(() => sessionStorage.clear());
    await page.goto('/sign-in');
    await page.getByPlaceholder('nombre@correo.com').fill(login.email);
    await page.getByPlaceholder('Tu contraseña').fill(login.password);
    let start = performance.now();
    await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
    await expect(page.getByText('Hola, Cliente', { exact: true })).toBeVisible();
    samples.push({ flow: 'mock-login', repetition, totalMs: performance.now() - start, ok: true, budgetMs: protocol.thresholds.webCatalogMs });
    await page.goto('/booking?service=2');
    await expect(page.getByText('Corte de prueba', { exact: true }).first()).toBeVisible();
    start = performance.now();
    await page.getByRole('button', { name: /^\d{4}-\d{2}-\d{2}$/ }).first().click();
    await expect(page.getByRole('button', { name: '11:00 disponible', exact: true })).toBeVisible();
    samples.push({ flow: 'mock-availability', repetition, totalMs: performance.now() - start, ok: true, budgetMs: protocol.thresholds.webNavigationMs });
    await expect(page.getByRole('button', { name: 'Confirmar mi cita', exact: true })).toBeDisabled();
    if (repetition === 1) await page.screenshot({ path: (process.env.ACTIVITY6_OUT || 'docs/evidence/actividad6-rendimiento') + '/web-mock-disponibilidad.png', fullPage: true });
    await page.evaluate(() => sessionStorage.clear());
    await page.goto('/sign-in');
  }
  await info.attach('measurements.json', { body: JSON.stringify({ scope: 'Interfaz real web móvil con respuestas API simuladas y cuenta ficticia del fixture. No mide servidor real ni Android. No se confirma ninguna cita.', samples }), contentType: 'application/json' });
});
