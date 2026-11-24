import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { validatePreviewRelease, requiredChecks } from './release-policy.mjs';
import { validatePreviewConfig } from './release-config.mjs';

const repo = process.env.GITHUB_REPOSITORY;
const id = process.env.SOURCE_RUN_ID;
if (!/^[\w.-]+\/[\w.-]+$/.test(repo ?? '') || !/^\d+$/.test(id ?? '')) throw Error('Indicar repositorio e ID de CI válidos');
async function get(path) {
  const response = await fetch(`https://api.github.com/repos/${repo}/${path}`, {
    headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}`, Accept: 'application/vnd.github+json' },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw Error(`No se pudo consultar la evidencia: HTTP ${response.status}`);
  return response.json();
}
const run = await get(`actions/runs/${id}`);
if (!Number.isSafeInteger(run.run_attempt) || run.run_attempt < 1) throw Error('Intento de CI inválido');
const jobs = [];
for (let page = 1; ; page++) {
  const batch = await get(`actions/runs/${id}/attempts/${run.run_attempt}/jobs?per_page=100&page=${page}`);
  jobs.push(...batch.jobs);
  if (jobs.length >= batch.total_count) break;
  if (!batch.jobs.length) throw Error('Respuesta de jobs incompleta');
}
validatePreviewRelease({
  run, jobs, sha: process.env.GITHUB_SHA, branch: process.env.GITHUB_REF_NAME,
  currentRunId: process.env.GITHUB_RUN_ID, currentRunAttempt: process.env.GITHUB_RUN_ATTEMPT,
  approvedSha: process.env.APPROVED_RELEASE_SHA,
});
if (run.repository?.full_name !== repo) throw Error('CI de otro repositorio');
const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
if (git('rev-parse', 'HEAD') !== process.env.GITHUB_SHA || git('status', '--porcelain')) throw Error('Se requiere checkout limpio del SHA probado');
validatePreviewConfig(JSON.parse(readFileSync('app.json', 'utf8')).expo,
  JSON.parse(readFileSync('eas.json', 'utf8')), process.env.RELEASE_API_URL);
if (!process.env.EXPO_TOKEN) throw Error('Configurar EXPO_TOKEN en android-release; no escribirlo en Git');
mkdirSync('output/release', { recursive: true });
const source = {
  repository: repo, commit: process.env.GITHUB_SHA, branch: process.env.GITHUB_REF_NAME,
  ciRunId: String(run.id), ciAttempt: run.run_attempt,
  ciUrl: `https://github.com/${repo}/actions/runs/${id}/attempts/${run.run_attempt}`,
  releaseRunId: process.env.GITHUB_RUN_ID, releaseAttempt: Number(process.env.GITHUB_RUN_ATTEMPT),
  releaseUrl: `https://github.com/${repo}/actions/runs/${process.env.GITHUB_RUN_ID}/attempts/${process.env.GITHUB_RUN_ATTEMPT}`,
  checks: requiredChecks.map(name => ({ name, conclusion: 'success' })),
  scope: 'Seis jobs del intento consultado; aceptación/rendimiento web. No acredita staging real ni aceptación nativa.',
};
writeFileSync('output/release/source.json', JSON.stringify(source, null, 2) + '\n');
appendFileSync(process.env.GITHUB_STEP_SUMMARY, `## Pruebas previas aprobadas\n\nSHA: ${source.commit}\n\n[CI del intento verificado](${source.ciUrl}). Perfil preview; distribución interna.\n`);
