import { test, expect } from '@playwright/test';
import { mockApi } from './fixtures';

// Presupuesto de interfaz web móvil, no de Android/iOS ni del backend real.
for (const [hu, path, label] of [['HU02', '/services', 'Ver Corte de prueba'], ['HU04', '/products', 'Ver Shampoo de prueba']]) {
  test(`${hu}: p95 de catálogo utilizable menor de 5 segundos`, async ({ page }, info) => {
    await mockApi(page);
    const samples = [];
    for (let i = 0; i < 5; i++) {
      const start = performance.now();
      await page.goto(path);
      await expect(page.getByRole('button', { name: label })).toBeVisible();
      samples.push(performance.now() - start);
    }
    const sorted = [...samples].sort((a, b) => a - b);
    const p95 = sorted[Math.ceil(sorted.length * 0.95) - 1];
    await info.attach('medicion.json', { body: JSON.stringify({ hu, scope: 'web móvil con API simulada; primera carga y cuatro recargas', samplesMs: samples, p95Ms: p95, budgetMs: 5000 }, null, 2), contentType: 'application/json' });
    expect(p95).toBeLessThan(5000);
  });
}
