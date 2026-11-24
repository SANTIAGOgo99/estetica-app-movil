import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { Buffer } from 'node:buffer';

const out = resolve(process.env.ACTIVITY6_OUT || 'docs/evidence/actividad6-rendimiento');
const read = name => JSON.parse(readFileSync(resolve(out, name), 'utf8').replace(/^\uFEFF/, ''));
const protocol = JSON.parse(readFileSync(new URL('./protocol.json', import.meta.url)));
const summaries = [], all = [];
const save = (name, data) => writeFileSync(resolve(out, name), JSON.stringify(data, null, 2) + '\n');
export function statistics(values) {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!sorted.length) return { n: 0, mean: null, min: null, max: null, p95: null, sdPopulation: null, coefficientVariationPct: null, range: null };
  const mean = sorted.reduce((sum, n) => sum + n, 0) / sorted.length;
  const sdPopulation = Math.sqrt(sorted.reduce((sum, n) => sum + (n - mean) ** 2, 0) / sorted.length);
  return { n: sorted.length, mean, min: sorted[0], max: sorted.at(-1), p95: sorted[Math.ceil(sorted.length * 0.95) - 1], sdPopulation, coefficientVariationPct: mean ? 100 * sdPopulation / mean : null, range: sorted.at(-1) - sorted[0] };
}
function add(flow, scope, rows, field, budget, unit = 'ms') {
  const values = rows.map(row => row[field]).filter(Number.isFinite);
  const successes = rows.filter(row => row.ok !== false && Number.isFinite(row[field]));
  const withinBudget = successes.filter(row => row[field] < budget).length;
  const stats = statistics(values);
  summaries.push({ flow, scope, unit, field, attempts: rows.length, successes: successes.length, failures: rows.length - successes.length, successPct: 100 * successes.length / rows.length, withinBudget, compliancePct: 100 * withinBudget / rows.length, budget, comparison: '<', p95MeetsBudget: stats.p95 !== null && stats.p95 < budget && successes.length === rows.length, ...stats });
  rows.forEach(row => all.push({ flow, scope, repetition: row.repetition, recordedAt: row.recordedAt ?? '', value: row[field], unit, budget, ok: row.ok !== false, withinBudget: row.ok !== false && Number.isFinite(row[field]) && row[field] < budget }));
}
if (existsSync(resolve(out, 'api.json'))) {
  const api = read('api.json');
  for (const kind of ['services', 'products']) {
    const rows = api.samples.filter(row => row.flow === `api-${kind}`);
    add(`api-${kind}-total`, 'Backend real GET público', rows, 'totalMs', protocol.thresholds.apiTotalMs);
    add(`api-${kind}-ttfb`, 'Backend real GET público', rows, 'ttfbMs', protocol.thresholds.apiTtfbMs);
  }
  save('api-phase-summary.json', ['dnsMs', 'tcpMs', 'tlsMs', 'afterTlsToFirstByteMs', 'downloadMs'].map(field => ({ field, rejectedNegativeValues: api.samples.filter(row => Number.isFinite(row[field]) && row[field] < 0).length, ...statistics(api.samples.map(row => row[field]).filter(value => value !== null && value >= 0)) })));
}
if (existsSync(resolve(out, 'web.json'))) {
  const web = read('web.json');
  for (const flow of [...new Set(web.samples.map(row => row.flow))]) {
    const rows = web.samples.filter(row => row.flow === flow);
    add(flow, 'Web móvil y backend real', rows, 'totalMs', rows[0].budgetMs);
  }
}
for (const file of ['controlled-playwright.json', 'existing-playwright.json']) {
  if (!existsSync(resolve(out, file))) continue;
  const result = read(file);
  function walk(suite) {
    for (const spec of suite.specs || []) for (const test of spec.tests || []) for (const attempt of test.results || []) for (const attachment of attempt.attachments || []) {
      if (!attachment.name.endsWith('.json') || !attachment.body) continue;
      const data = JSON.parse(Buffer.from(attachment.body, 'base64').toString());
      if (data.samples) for (const flow of [...new Set(data.samples.map(row => row.flow))]) {
        const rows = data.samples.filter(row => row.flow === flow);
        add(flow, 'Web móvil y API simulada', rows, 'totalMs', rows[0].budgetMs);
      }
      else if (data.samplesMs) add(`existing-${data.hu}`, 'Suite existente local y API simulada', data.samplesMs.map((totalMs, i) => ({ totalMs, repetition: i + 1, ok: true })), 'totalMs', data.budgetMs);
    }
    for (const child of suite.suites || []) walk(child);
  }
  for (const suite of result.suites || []) walk(suite);
}
if (existsSync(resolve(out, 'android.json'))) {
  const android = read('android.json');
  const derived = android.samples.map(row => {
    const file = `android-raw-${String(row.repetition).padStart(2, '0')}.log`;
    const raw = readFileSync(resolve(out, file), 'utf8').split('\nCPU\n')[1] || '';
    // Android toybox top fusiona S y [%CPU] en el encabezado: se separan antes de alinear columnas.
    let cpuIndex = -1;
    const values = [];
    for (const line of raw.replace(/S\[%CPU\]/g, 'S %CPU').split(/\r?\n/)) {
      const columns = line.trim().split(/\s+/);
      if (columns.includes('PID')) cpuIndex = columns.indexOf('%CPU');
      else if (/^\d+$/.test(columns[0]) && line.includes('com.santiagogo99.esteticaclientes') && cpuIndex >= 0 && Number.isFinite(Number(columns[cpuIndex]))) values.push(Number(columns[cpuIndex]));
    }
    return { ...row, idleCpuOneCorePct: values.length >= 2 ? values.at(-1) : null, ok: row.processAlive && row.launchStatus === 0 };
  });
  save('android-derived.json', { metadata: android.metadata, source: 'android.json + android-raw-NN.log; CPU recalculada por alineación de cabecera toybox. Archivos crudos intactos.', samples: derived });
  add('android-process-start', 'APK liberado en teléfono real; Activity Manager TotalTime', derived, 'totalTimeMs', protocol.thresholds.androidColdStartMs);
  add('android-pss', 'APK liberado; PSS tras espera de 5 s', derived, 'pssMiB', protocol.thresholds.androidPssMiB, 'MiB');
  add('android-idle-cpu', 'APK liberado; segunda lectura top de 1 s', derived, 'idleCpuOneCorePct', protocol.thresholds.androidIdleCpuOneCorePct, '% de un núcleo');
}
const ci = read('ci-released-commit.json');
save('historical-summary.json', ci.measurements.map(row => ({ flow: row.flow, scope: 'CI del commit liberado; API simulada; valores redondeados del log', budget: row.budgetMs, ...statistics(row.samplesMs) })));
save('summary.json', { generatedAt: new Date().toISOString(), protocol, summaries });
const quote = value => '"' + String(value ?? '').replaceAll('"', '""') + '"';
const csv = rows => { const keys = Object.keys(rows[0] || {}); return [keys.map(quote).join(','), ...rows.map(row => keys.map(key => quote(row[key])).join(','))].join('\n') + '\n'; };
writeFileSync(resolve(out, 'samples.csv'), csv(all));
writeFileSync(resolve(out, 'summary.csv'), csv(summaries));
const f = n => n === null ? 'Pendiente' : Number(n).toFixed(2);
writeFileSync(resolve(out, 'comparison.md'), '| Flujo | n | Promedio | Mínimo | Máximo | p95 | Umbral | Cumplimiento | Evaluación |\n|---|---:|---:|---:|---:|---:|---:|---:|---|\n' + summaries.map(s => `| ${s.flow} (${s.unit}) | ${s.attempts} | ${f(s.mean)} | ${f(s.min)} | ${f(s.max)} | ${f(s.p95)} | < ${s.budget} | ${f(s.compliancePct)} % | ${s.p95MeetsBudget ? 'Cumple p95' : 'No cumple'} |`).join('\n') + '\n');
const escape = s => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const table = summaries.map(s => `<tr><td>${escape(s.flow)}</td><td>${s.attempts}</td><td>${f(s.mean)}</td><td>${f(s.min)}</td><td>${f(s.max)}</td><td>${f(s.p95)}</td><td>&lt; ${s.budget}</td><td>${f(s.compliancePct)} %</td><td>${escape(s.unit)}</td></tr>`).join('');
const chartRows = summaries.filter(s => s.unit === 'ms' && !s.flow.startsWith('existing-'));
const chart = `<svg xmlns="http://www.w3.org/2000/svg" width="1170" height="${chartRows.length * 42 + 80}" role="img" aria-label="p95 observado como porcentaje del presupuesto"><style>text{font:15px Arial}</style><text x="10" y="22">p95 respecto al presupuesto de cada flujo — escala 0 a 200 %, línea punteada = umbral de 100 %</text><text x="300" y="47">0 %</text><text x="558" y="47">100 %</text><text x="817" y="47">200 %</text>${chartRows.map((s, i) => { const y = 65 + i * 42; return `<text x="10" y="${y + 16}">${escape(s.flow)}</text><rect x="300" y="${y}" width="550" height="22" fill="#eee"/><rect x="300" y="${y}" width="${Math.min(550, 275 * s.p95 / s.budget)}" height="22" fill="#555"/><line x1="575" y1="${y - 3}" x2="575" y2="${y + 25}" stroke="#111" stroke-dasharray="3 2"/><text x="880" y="${y + 16}">${f(s.p95)} ms (${f(100 * s.p95 / s.budget)} %)</text>`; }).join('')}</svg>`;
writeFileSync(resolve(out, 'p95-budget.svg'), chart);
writeFileSync(resolve(out, 'results.html'), `<!doctype html><html lang="es"><meta charset="utf-8"><title>Actividad 6 Resultados reales de rendimiento</title><style>body{font:16px Arial;margin:32px;color:#111}h1{font-size:25px}table{border-collapse:collapse;width:100%;font-size:13px}td,th{border:1px solid #555;padding:8px;text-align:right}td:first-child,th:first-child{text-align:left}p{max-width:1100px;line-height:1.5}</style><h1>Actividad 6 Resultados reales de rendimiento</h1><p>Estética Clientes 1.0.0 · Expo SDK 57 · commit ${protocol.releasedCommit}. Medición local del 24 de noviembre de 2026. Web móvil, backend y Android se identifican por separado. Los umbrales son presupuestos propuestos; API simulada significa respuesta controlada, con tiempo de interfaz medido realmente.</p><table><thead><tr><th>Flujo</th><th>n</th><th>Media</th><th>Mín.</th><th>Máx.</th><th>p95</th><th>Umbral</th><th>Muestras bajo umbral</th><th>Unidad</th></tr></thead><tbody>${table}</tbody></table><p>p95 por rango más cercano. Con 20 muestras ocupa la posición 19; se conserva el máximo y cada repetición en CSV. TotalTime de Android mide Activity Manager; no acredita contenido React listo. TTFB combina red y servidor; no es tiempo de procesamiento puro.</p>${chart}<p>Fuentes: summary.json, samples.csv, api.json, web.json, resultados Playwright y registros ADB en esta misma carpeta. Esta vista se genera desde datos medidos y no sustituye los archivos crudos.</p></html>`);
// Integridad de las evidencias; recalcular al finalizar si se agregan documentos o capturas.
const files = readdirSync(out).filter(name => name !== 'SHA256SUMS.txt');
writeFileSync(resolve(out, 'SHA256SUMS.txt'), files.filter(name => !name.includes('output')).map(name => { try { return `${createHash('sha256').update(readFileSync(resolve(out, name))).digest('hex')}  ${name}`; } catch { return null; } }).filter(Boolean).join('\n') + '\n');
console.log(JSON.stringify(summaries.map(s => ({ flow: s.flow, n: s.attempts, mean: s.mean, p95: s.p95, max: s.max, compliancePct: s.compliancePct })), null, 2));
