import { chromium, devices, expect } from '@playwright/test';
import { createServer } from 'node:http';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, extname, sep } from 'node:path';
import { spawnSync } from 'node:child_process';
import os from 'node:os';

const protocol = JSON.parse(readFileSync(new URL('./protocol.json', import.meta.url)));
const out = resolve(process.env.ACTIVITY6_OUT || 'docs/evidence/actividad6-rendimiento');
mkdirSync(out, { recursive: true });
mkdirSync(resolve('tmp'), { recursive: true });
const mode = process.argv[2];
const save = (name, data) => writeFileSync(resolve(out, name), JSON.stringify(data, null, 2) + '\n');
const pause = ms => new Promise(done => setTimeout(done, ms));
function command(file, args, options = {}) {
  return spawnSync(file, args, { encoding: 'utf8', windowsHide: true, timeout: 60000, ...options });
}
function git(...args) {
  const r = command('git', args);
  if (r.status !== 0) throw Error(r.stderr || String(r.error));
  return r.stdout.trim();
}
function verifySource() {
  const paths = ['src', 'assets', 'package.json', 'package-lock.json', 'app.json', 'eas.json', 'tests', 'playwright.config.ts'];
  if (git('diff', protocol.releasedCommit, '--', ...paths)) throw Error('El código evaluado difiere del commit liberado.');
  return { releasedCommit: protocol.releasedCommit, checkoutCommit: git('rev-parse', 'HEAD'), branch: git('branch', '--show-current'), sourceTreeMatchesRelease: true, comparedPaths: paths };
}
const source = verifySource();
const stamp = () => new Date().toISOString();

if (mode === 'diagnose') {
  const sdk = 'C:/Users/LENOVO/AppData/Local/Android/Sdk';
  const adb = `${sdk}/platform-tools/adb.exe`;
  const emulator = `${sdk}/emulator/emulator.exe`;
  const apk = 'output/cd-review/release-cd8bb15d/estetica-clientes-35755d883bf1-cd8bb15d-b39e-4c9a-a0be-68dad9cfa0b3.apk';
  const deviceResult = existsSync(adb) ? command(adb, ['devices', '-l']) : null;
  const avds = existsSync(emulator) ? command(emulator, ['-list-avds']) : null;
  const remote = command('git', ['ls-remote', '--heads', 'origin']);
  save('diagnostic.json', {
    recordedAt: stamp(), source, initialUntrackedFiles: git('ls-files', '--others', '--exclude-standard'),
    remote: { exitCode: remote.status, refs: remote.stdout, error: remote.stderr },
    recentCommits: git('log', '-8', '--format=%h %s'),
    runtime: { node: process.version, playwright: JSON.parse(readFileSync('node_modules/@playwright/test/package.json')).version, expo: JSON.parse(readFileSync('node_modules/expo/package.json')).version, platform: os.platform(), osRelease: os.release(), cpu: os.cpus()[0]?.model, logicalCpus: os.cpus().length, totalRamBytes: os.totalmem(), freeRamBytes: os.freemem() },
    android: { sdk, adbExists: existsSync(adb), emulatorExists: existsSync(emulator), adbExitCode: deviceResult?.status, devices: deviceResult?.stdout, avdsExitCode: avds?.status, avds: avds?.stdout, avdsError: avds?.stderr, releasedApkExists: existsSync(apk) },
    protocol,
  });
  console.log('Diagnóstico guardado.');
} else if (mode === 'api') {
  const startedAt = stamp();
  const samples = [];
  let stopped = false;
  // Intercalar endpoints y crear una conexión curl nueva por muestra.
  for (let i = 1; i <= protocol.samplesPerFlow && !stopped; i++) {
    for (const kind of ['services', 'products']) {
      const path = `/${kind}/active`;
      const body = resolve('tmp', `activity6-${kind}-response.json`);
      const r = command('curl.exe', ['--silent', '--show-error', '--proto', '=https', '--connect-timeout', '10', '--max-time', '25', '--output', body, '--write-out', '%{json}', protocol.apiBase + path]);
      let timing = {};
      try { timing = JSON.parse(r.stdout); } catch { /* Error de transporte registrado debajo. */ }
      let itemCount = null;
      let validCatalog = false;
      try { const data = JSON.parse(readFileSync(body)); validCatalog = Array.isArray(data) && data.length > 0 && data.every(x => Number.isInteger(Number(x.id)) && typeof x.name === 'string'); itemCount = Array.isArray(data) ? data.length : null; } catch { /* Sin catálogo válido. */ }
      const ms = key => Number.isFinite(timing[key]) ? timing[key] * 1000 : null;
      const row = { recordedAt: stamp(), flow: `api-${kind}`, repetition: i, path, status: timing.http_code ?? null, exitCode: r.status, ok: r.status === 0 && timing.http_code === 200 && validCatalog, validCatalog, itemCount, dnsMs: ms('time_namelookup'), connectCumulativeMs: ms('time_connect'), tlsCumulativeMs: ms('time_appconnect'), ttfbMs: ms('time_starttransfer'), totalMs: ms('time_total'), bytes: timing.size_download ?? null, httpVersion: timing.http_version ?? null, error: r.stderr.trim() || null };
      row.tcpMs = row.connectCumulativeMs === null ? null : row.connectCumulativeMs - row.dnsMs;
      row.tlsMs = row.tlsCumulativeMs === null ? null : row.tlsCumulativeMs - row.connectCumulativeMs;
      row.afterTlsToFirstByteMs = row.ttfbMs === null ? null : row.ttfbMs - row.tlsCumulativeMs;
      row.downloadMs = row.totalMs === null ? null : row.totalMs - row.ttfbMs;
      samples.push(row);
      save('api.json', { startedAt, updatedAt: stamp(), source, protocol, connectionMode: 'curl nuevo por solicitud; sin cookies ni credenciales; sin concurrencia', samples, stopped });
      console.log(`${row.flow} ${i}/${protocol.samplesPerFlow}: HTTP ${row.status}; ${row.totalMs?.toFixed(1)} ms; ok=${row.ok}`);
      if ([429, 503].includes(row.status)) { stopped = true; break; }
      await pause(protocol.apiPauseMs);
    }
  }
  save('api.json', { startedAt, completedAt: stamp(), source, protocol, samples, stopped });
} else if (mode === 'web') {
  const root = resolve('tmp/actividad6-web-live');
  if (!existsSync(resolve(root, 'index.html'))) throw Error('Primero exportar web real a tmp/actividad6-web-live.');
  const types = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.png': 'image/png', '.ttf': 'font/ttf', '.woff': 'font/woff', '.woff2': 'font/woff2', '.json': 'application/json', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon' };
  const server = createServer((req, res) => {
    const path = resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
    if (path !== root && !path.startsWith(root + sep)) { res.writeHead(403); return res.end(); }
    let file = path;
    try { if (!existsSync(file) || !extname(file)) file = resolve(root, 'index.html'); res.setHeader('Content-Type', types[extname(file)] || 'application/octet-stream'); res.setHeader('Cache-Control', 'no-store'); res.end(readFileSync(file)); }
    catch { res.writeHead(404); res.end(); }
  });
  await new Promise((done, reject) => { server.once('error', reject); server.listen(5173, '127.0.0.1', done); });
  const startedAt = stamp();
  const browser = await chromium.launch();
  const samples = [], network = [], pageErrors = [], blocked = [];
  const checkpoint = () => save('web.json', { startedAt, updatedAt: stamp(), source, protocol, browser: browser.version(), device: devices['Pixel 7'], cache: 'Contexto nuevo por repetición; rutas Playwright desactivan caché HTTP; servidor local no-store; proceso Chromium compartido.', networkCondition: 'Red real del equipo sin throttling; no equivale a radio móvil ni CPU Android.', samples, network, pageErrors, blocked });
  const browserContext = async (scope, repetition) => {
    const context = await browser.newContext({ ...devices['Pixel 7'], locale: 'es-MX', timezoneId: 'America/Mexico_City', serviceWorkers: 'block' });
    await context.route('**/*', route => {
      const request = route.request();
      if (['GET', 'HEAD', 'OPTIONS'].includes(request.method())) return route.continue();
      blocked.push({ scope, repetition, method: request.method(), path: new URL(request.url()).pathname });
      return route.abort();
    });
    const page = await context.newPage();
    page.on('pageerror', error => pageErrors.push({ scope, repetition, error: error.message }));
    page.on('response', response => {
      if (response.url().startsWith(protocol.apiBase)) network.push({ scope, repetition, method: response.request().method(), path: new URL(response.url()).pathname, status: response.status() });
    });
    page.on('requestfailed', request => { if (request.url().startsWith(protocol.apiBase)) network.push({ scope, repetition, path: new URL(request.url()).pathname, failure: request.failure()?.errorText }); });
    return { context, page };
  };
  const measure = async (page, flow, repetition, budgetMs, action, ready, screenshot) => {
    const t0 = performance.now();
    let ok = true, error = null;
    try { await action(); await ready(); } catch (e) { ok = false; error = e.message.split('\n').slice(0, 2).join(' '); }
    const totalMs = performance.now() - t0;
    const row = { recordedAt: stamp(), flow, repetition, budgetMs, totalMs, ok, error, meetsBudget: ok && totalMs < budgetMs };
    samples.push(row); checkpoint();
    if (screenshot && ok) await page.screenshot({ path: resolve(out, screenshot), fullPage: true });
    console.log(`${flow} ${repetition}: ${totalMs.toFixed(1)} ms; ok=${ok}`);
    return ok;
  };
  try {
    for (let i = 1; i <= protocol.samplesPerFlow; i++) {
      const { context, page } = await browserContext('live-open', i);
      await measure(page, 'web-open', i, protocol.thresholds.webOpenMs, () => page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded', timeout: protocol.timeoutMs }), () => expect(page.getByRole('button', { name: 'Ver nuestros servicios', exact: true })).toBeVisible({ timeout: protocol.timeoutMs }), i === 1 ? 'web-inicio.png' : null);
      await context.close();
    }
    for (let i = 1; i <= protocol.samplesPerFlow; i++) {
      for (const kind of ['services', 'products']) {
        const { context, page } = await browserContext(`live-${kind}`, i);
        let firstName;
        const ok = await measure(page, `web-${kind}`, i, protocol.thresholds.webCatalogMs,
          () => page.goto(`http://localhost:5173/${kind}`, { waitUntil: 'domcontentloaded', timeout: protocol.timeoutMs }),
          async () => { const button = page.getByRole('button', { name: /^Ver / }).filter({ hasNotText: 'carrito' }).first(); await expect(button).toBeVisible({ timeout: protocol.timeoutMs }); firstName = (await button.getAttribute('aria-label')).replace(/^Ver /, ''); },
          i === 1 ? `web-${kind}.png` : null);
        await pause(protocol.webPauseMs);
        if (ok) await measure(page, `navigation-${kind}-detail`, i, protocol.thresholds.webNavigationMs,
          () => page.getByRole('button', { name: `Ver ${firstName}`, exact: true }).click(),
          () => expect(page.getByRole('heading', { name: firstName, exact: true })).toBeVisible({ timeout: protocol.timeoutMs }),
          i === 1 ? `web-${kind}-detail.png` : null);
        await context.close();
        if (network.some(row => [429, 503].includes(row.status))) throw Error('Backend solicita detener pruebas (429/503).');
        await pause(protocol.webPauseMs);
      }
    }
  } finally { checkpoint(); await browser.close(); await new Promise(done => server.close(done)); }
} else {
  throw Error('Uso: node scripts/activity6/measure.mjs diagnose|api|web');
}
