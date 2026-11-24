// Política pura: ninguna distribución se inicia con un pipeline fallido, antiguo o de PR.
export const requiredChecks = ['Análisis de código estático', 'Pruebas unitarias', 'Pruebas de integración', 'Pruebas de regresión y empaquetado', 'Pruebas de aceptación (web móvil)', 'Pruebas de rendimiento (web móvil)'];
export function validateRelease({ run, jobs, sha, branch, target, nativeSha, stagingSha, currentRunId, currentRunAttempt }) {
  if (!['preview', 'play-internal'].includes(target)) throw Error('Destino no reconocido');
  if (!['develop', 'main'].includes(branch)) throw Error('Distribuir solo desde develop o main');
  if (run.head_sha !== sha || run.head_branch !== branch || run.event !== 'push') throw Error('La evidencia debe ser push del mismo commit y rama');
  // workflow_call comparte el run padre: sus seis jobs ya deben haber terminado.
  // Solo se admite un run abierto si es exactamente el mismo ID e intento.
  const ownRunningCi = target === 'preview' && branch === 'develop'
    && String(run.id) === String(currentRunId) && currentRunId !== undefined
    && Number(run.run_attempt) === Number(currentRunAttempt) && Number(currentRunAttempt) >= 1
    && run.status === 'in_progress' && run.conclusion == null;
  if (!/^\.github\/workflows\/ci\.yml(?:@.+)?$/.test(run.path ?? '')
    || (!ownRunningCi && (run.status !== 'completed' || run.conclusion !== 'success'))) throw Error('Pipeline de pruebas incompleto o fallido');
  for (const name of requiredChecks) {
    const matches = jobs.filter(job => job.name === name);
    if (matches.length !== 1 || matches[0].status !== 'completed' || matches[0].conclusion !== 'success')
      throw Error('Falta prueba aprobada o hay evidencia ambigua: ' + name);
  }
  if (target === 'play-internal' && (branch !== 'main' || nativeSha !== sha || stagingSha !== sha)) throw Error('Google Play requiere main y aceptación nativa/staging del mismo commit');
  return target === 'preview' ? 'preview' : 'production';
}

export function validatePreviewRelease(options) {
  if (options.branch !== 'develop') throw Error('Esta entrega interna solo admite develop');
  if (!/^[a-f0-9]{40}$/.test(options.sha ?? '') || options.approvedSha !== options.sha)
    throw Error('Falta habilitar exactamente este SHA con ANDROID_PREVIEW_RELEASE_SHA');
  return validateRelease({ ...options, target: 'preview' });
}
