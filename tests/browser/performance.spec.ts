import { test, expect } from '@playwright/test';
import { mockApi, login, performanceData } from './fixtures';

// p95 de interfaz web en viewport móvil y API simulada; no mide red/servidor real ni rendimiento nativo.
for (const [hu, path, label] of [['HU02', '/services', 'Ver Corte de prueba'], ['HU04', '/products', 'Ver Shampoo de prueba']]) {
  test(`${hu}: catálogo utilizable dentro del presupuesto`, async ({ page }, info) => {
    await mockApi(page);
    const samples = [];
    for (let i = 0; i < performanceData.samples; i++) {
      const start = performance.now();
      await page.goto(path);
      await expect(page.getByRole('button', { name: label })).toBeVisible();
      samples.push(performance.now() - start);
    }
    const sorted = [...samples].sort((a, b) => a - b);
    const p95 = sorted[Math.ceil(sorted.length * performanceData.percentile) - 1];
    await info.attach('medicion.json', { body: JSON.stringify({ hu, scope: 'interfaz web móvil; API simulada; primera carga y cuatro recargas', samplesMs: samples, p95Ms: p95, budgetMs: performanceData.budgetMs }), contentType: 'application/json' });
    expect(p95).toBeLessThan(performanceData.budgetMs);
  });
}
test('HU01: tiempo desde enviar credenciales hasta pantalla de cliente', async ({ page }, info) => {
  await mockApi(page);
  const samples = [];
  for (let i = 0; i < performanceData.samples; i++) {
    await page.goto('/');
    await page.evaluate(() => sessionStorage.clear());
    await page.goto('/sign-in');
    await page.getByPlaceholder('nombre@correo.com').fill(login.email);
    await page.getByPlaceholder('Tu contraseña').fill(login.password);
    const start = performance.now();
    await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
    await expect(page.getByText('Hola, Cliente', { exact: true })).toBeVisible();
    samples.push(performance.now() - start);
  }
  const sorted = [...samples].sort((a, b) => a - b);
  const p95 = sorted[Math.ceil(sorted.length * performanceData.percentile) - 1];
  await info.attach('medicion.json', { body: JSON.stringify({ hu: 'HU01', scope: 'envío de formulario → pantalla de cliente; web móvil y API simulada', samplesMs: samples, p95Ms: p95, budgetMs: performanceData.budgetMs }), contentType: 'application/json' });
  expect(p95).toBeLessThan(performanceData.budgetMs);
});
