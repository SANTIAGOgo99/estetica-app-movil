import { appendFileSync, readFileSync } from 'node:fs';
import { validateRelease } from './release-policy.mjs';
const repo = process.env.GITHUB_REPOSITORY;
const id = process.env.SOURCE_RUN_ID;
if (!repo || !/^\d+$/.test(id ?? '')) throw Error('Indicar ID de ejecución de pruebas válida');
async function get(path) {
  const response = await fetch(`https://api.github.com/repos/${repo}/${path}`, { headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}`, Accept: 'application/vnd.github+json' }, signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw Error(`No se pudo consultar la evidencia: HTTP ${response.status}`);
  return response.json();
}
const run = await get(`actions/runs/${id}`);
const { jobs } = await get(`actions/runs/${id}/jobs?per_page=100`);
const profile = validateRelease({ run, jobs, sha: process.env.GITHUB_SHA, branch: process.env.GITHUB_REF_NAME, target: process.env.RELEASE_TARGET, nativeSha: process.env.NATIVE_ACCEPTANCE_APPROVED_SHA, stagingSha: process.env.STAGING_ACCEPTANCE_APPROVED_SHA });
const config = JSON.parse(readFileSync('app.json', 'utf8')).expo;
if (!config.extra?.eas?.projectId || !config.android?.package) throw Error('Inicializar EAS: faltan projectId y android.package; no se generaron identificadores ficticios');
if (!process.env.EXPO_TOKEN) throw Error('Configurar EXPO_TOKEN en el entorno android-release');
const api = new URL(process.env.RELEASE_API_URL ?? '');
if (api.protocol !== 'https:' || api.username || api.password || api.hostname.endsWith('.test')) throw Error('Configurar RELEASE_API_URL HTTPS real sin credenciales incrustadas');
appendFileSync(process.env.GITHUB_OUTPUT, `profile=${profile}\n`);
appendFileSync(process.env.GITHUB_STEP_SUMMARY, `## Distribución autorizada por las pruebas\n\nRun ${id}; commit ${process.env.GITHUB_SHA}; perfil ${profile}. Para Google Play se exigieron evidencias nativas y staging del mismo commit.\n`);
