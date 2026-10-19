import { appendFileSync, existsSync, readFileSync } from 'node:fs';
const suite = process.argv[2];
const scopes = {
  static: 'Análisis estático de todo src, configuración y pruebas; TypeScript + ESLint.',
  unit: 'HU01: credenciales, vigencia/restauración; reglas puras de catálogo y horarios. Datos: tests/fixtures/mobile.json.',
  integration: 'HU01/HU02/HU08: cliente → servidor HTTP local de contrato. No acredita PostgreSQL real. Staging se declara aparte.',
  regression: 'Todos los archivos tests/*.test.mjs; alcance de módulo/sprint sobre funciones ya cubiertas. Empaquetado es una verificación adicional.',
  acceptance: 'HU01–HU05: navegador Chromium con viewport móvil y API simulada; no es aceptación nativa.',
  performance: 'HU01/HU02/HU04: cinco muestras por flujo, p95 < 5000 ms; web móvil con API simulada, sin extrapolar a red o dispositivo real.',
};
if (!scopes[suite]) throw Error('Suite desconocida');
let text = `## ${suite}\n\n${scopes[suite]}\n\nCommit: ${process.env.GITHUB_SHA ?? 'local'} · Evento: ${process.env.GITHUB_EVENT_NAME ?? 'local'}\n\n`;
const xml = `reports/${suite === 'acceptance' || suite === 'performance' ? 'browser' : suite}.xml`;
if (existsSync(xml)) {
  const data = readFileSync(xml, 'utf8');
  const cases = (data.match(/<testcase\b/g) ?? []).length;
  const failures = (data.match(/<failure\b/g) ?? []).length;
  const errors = (data.match(/<error\b/g) ?? []).length;
  text += `Casos: **${cases}** · Fallos: **${failures}** · Errores: **${errors}**. El resultado definitivo es el estado del job y sus pasos.\n\n`;
} else if (suite !== 'static') text += '**No se generó JUnit. Revisar el paso fallido; no se acredita ejecución de casos.**\n\n';
if (suite === 'integration') {
  if (existsSync('reports/staging.json')) text += `Staging: **${JSON.parse(readFileSync('reports/staging.json', 'utf8')).result}**.\n\n`;
  else text += '**Staging pendiente/no ejecutado:** faltan configuración o secretos, o el evento es PR. El verde de este job acredita el contrato HTTP local.\n\n';
}
if (suite === 'performance' && existsSync('reports/browser.json')) {
  const report = JSON.parse(readFileSync('reports/browser.json', 'utf8'));
  const visit = suites => {
    for (const group of suites ?? []) {
      visit(group.suites);
      for (const spec of group.specs ?? []) for (const test of spec.tests ?? []) for (const result of test.results ?? []) for (const attachment of result.attachments ?? []) {
        if (attachment.name !== 'medicion.json') continue;
        const raw = attachment.body ? Buffer.from(attachment.body, 'base64').toString('utf8') : attachment.path && existsSync(attachment.path) ? readFileSync(attachment.path, 'utf8') : null;
        if (!raw) continue;
        const value = JSON.parse(raw);
        text += `- **${value.hu}**: p95 ${value.p95Ms.toFixed(1)} ms; presupuesto ${value.budgetMs} ms; muestras: ${value.samplesMs.map(v => v.toFixed(1)).join(', ')} ms.\n`;
      }
    }
  };
  visit(report.suites);
  text += '\nCon cinco muestras el p95 calculado es el mayor valor; es un control inicial, no un estudio estadístico amplio.\n';
}
text += '\nLos resultados no cierran automáticamente las historias; esfuerzo y verificaciones nativas se registran manualmente.\n';
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, text);
console.log(text);
