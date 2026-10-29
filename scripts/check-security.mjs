import { readFileSync, appendFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export function assessZap(report) {
  if (!Array.isArray(report.site) || report.site.length === 0) throw Error('ZAP no registró ningún sitio analizado');
  const alerts = [];
  for (const site of report.site) {
    const url = new URL(site['@name']);
    if (!['127.0.0.1', 'localhost'].includes(url.hostname) || url.port !== '4173') throw Error('El reporte debe corresponder exclusivamente al entorno local 4173');
    if (!Array.isArray(site.alerts)) throw Error('Reporte ZAP incompleto');
    for (const alert of site.alerts) {
      const risk = Number(alert.riskcode);
      if (!Number.isInteger(risk) || risk < 0 || risk > 3) throw Error('Nivel de riesgo ZAP inválido');
      alerts.push(alert);
    }
  }
  const high = alerts.filter(alert => Number(alert.riskcode) >= 3);
  if (high.length) throw Error(`DAST bloqueado: ${high.length} alertas de riesgo alto: ${high.map(a => a.name).join(', ')}`);
  return { sites: report.site.length, alerts: alerts.length, high: high.length };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = assessZap(JSON.parse(readFileSync(process.argv[2] ?? 'reports/zap.json', 'utf8')));
  const summary = `## DAST OWASP ZAP\n\nSHA: ${process.env.GITHUB_SHA ?? 'local'}\n\nSitios: ${result.sites}; alertas: ${result.alerts}; riesgo alto: ${result.high}.\n\nObjetivo: exportación web local en 127.0.0.1:4173. Escaneo pasivo; no acredita auditoría de API productiva ni binario nativo. Las alertas de menor riesgo permanecen en el reporte.\n`;
  console.log(summary);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
}
