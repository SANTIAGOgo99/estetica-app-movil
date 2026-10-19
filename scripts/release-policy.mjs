// Política pura: ninguna distribución se inicia con un pipeline fallido, antiguo o de PR.
export const requiredChecks = ['Análisis de código estático', 'Pruebas unitarias', 'Pruebas de integración', 'Pruebas de regresión y empaquetado', 'Pruebas de aceptación (web móvil)', 'Pruebas de rendimiento (web móvil)'];
export function validateRelease({ run, jobs, sha, branch, target, nativeSha, stagingSha }) {
  if (!['preview', 'play-internal'].includes(target)) throw Error('Destino no reconocido');
  if (!['develop', 'main'].includes(branch)) throw Error('Distribuir solo desde develop o main');
  if (run.head_sha !== sha || run.head_branch !== branch || run.event !== 'push') throw Error('La evidencia debe ser push del mismo commit y rama');
  if (!run.path?.startsWith('.github/workflows/ci.yml') || run.status !== 'completed' || run.conclusion !== 'success') throw Error('Pipeline de pruebas incompleto o fallido');
  for (const name of requiredChecks) if (!jobs.some(job => job.name === name && job.conclusion === 'success')) throw Error('Falta prueba aprobada: ' + name);
  if (target === 'play-internal' && (branch !== 'main' || nativeSha !== sha || stagingSha !== sha)) throw Error('Google Play requiere main y aceptación nativa/staging del mismo commit');
  return target === 'preview' ? 'preview' : 'production';
}
