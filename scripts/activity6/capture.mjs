import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

const out = resolve(process.env.ACTIVITY6_OUT || 'docs/evidence/actividad6-rendimiento');
if (!process.argv.includes('--android-only')) {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1500, height: 1100 }, deviceScaleFactor: 1 });
    await page.goto(pathToFileURL(resolve(out, 'results.html')).href);
    await page.screenshot({ path: resolve(out, 'results.png'), fullPage: true, timeout: 60000 });
    await page.locator('svg').screenshot({ path: resolve(out, 'p95-budget.png'), timeout: 60000 });
  } finally { await browser.close(); }
}

if (process.argv.includes('--android') || process.argv.includes('--android-only')) {
  const adb = 'C:/Users/LENOVO/AppData/Local/Android/Sdk/platform-tools/adb.exe';
  const result = spawnSync(adb, ['shell', 'uiautomator', 'dump', '/sdcard/activity6-public-ui.xml'], { encoding: 'utf8', timeout: 30000, windowsHide: true });
  if (result.status !== 0) throw Error('No se pudo verificar la pantalla pública Android.');
  const xml = spawnSync(adb, ['shell', 'cat', '/sdcard/activity6-public-ui.xml'], { encoding: 'utf8', timeout: 30000, windowsHide: true }).stdout;
  // No conservar el árbol completo ni capturar si falta la comprobación de pantalla anónima.
  if (!xml.includes('Ver nuestros servicios') || !xml.includes('Iniciar sesión')) throw Error('No se comprobó inicio anónimo. No se captura la pantalla.');
  const shot = spawnSync(adb, ['exec-out', 'screencap', '-p'], { timeout: 30000, windowsHide: true, maxBuffer: 12 * 1024 * 1024 });
  if (shot.status !== 0) throw Error('No se pudo capturar Android.');
  writeFileSync(resolve(out, 'android-inicio-apk-liberado.png'), shot.stdout);
  const state = JSON.parse(readFileSync(resolve(out, 'android-status.json')));
  state.publicHomeScreenshot = 'android-inicio-apk-liberado.png';
  state.publicHomeVerifiedAt = new Date().toISOString();
  writeFileSync(resolve(out, 'android-status.json'), JSON.stringify(state, null, 2) + '\n');
}
