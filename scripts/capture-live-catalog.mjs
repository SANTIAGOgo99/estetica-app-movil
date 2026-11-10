import { chromium, devices, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';

const folder = 'docs/evidence/noviembre-2026';
mkdirSync(folder, { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext({ ...devices['Pixel 7'] });
const page = await context.newPage();
const errors = [];
const results = [];
page.on('pageerror', error => errors.push(error.message));
// Este recorrido nunca registra cuentas, reservas ni compras.
await page.route('**/*', route => ['GET', 'HEAD', 'OPTIONS'].includes(route.request().method()) ? route.continue() : route.abort());
try {
  for (const kind of ['services', 'products']) {
    const [response] = await Promise.all([
      page.waitForResponse(res => new URL(res.url()).pathname === `/api/${kind}/active`, { timeout: 120000 }),
      page.goto(`http://localhost:5173/${kind}`, { waitUntil: 'domcontentloaded', timeout: 120000 }),
    ]);
    expect(response.status()).toBe(200);
    const items = await response.json();
    expect(Array.isArray(items)).toBe(true);
    await expect(page.getByRole('button', { name: `Ver ${items[0].name}`, exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Citas', exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Perfil', exact: true })).toHaveCount(0);
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBeTruthy();
    await page.screenshot({ path: `${folder}/real-${kind}.png`, fullPage: true });
    results.push({ path: `/${kind}`, apiPath: `/api/${kind}/active`, status: response.status(), itemCount: items.length, screenshot: `real-${kind}.png` });
  }
  await page.goto('http://localhost:5173/');
  await expect(page.getByRole('button', { name: 'Inicio', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Abrir carrito', exact: true })).toHaveCount(0);
  await page.screenshot({ path: `${folder}/real-inicio-publico.png`, fullPage: true });
  expect(errors).toEqual([]);
  const report = { checkedAt: new Date().toISOString(), scope: 'Interfaz web móvil en Expo desarrollo, backend real y sesión anónima; solo lectura. No acredita APK Android ni operaciones autenticadas.', results, pageErrors: errors };
  writeFileSync(`${folder}/live-ui.json`, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
} finally { await browser.close(); }
