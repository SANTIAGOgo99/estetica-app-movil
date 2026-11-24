// Identidad existente: nunca ejecutar eas init/build:configure en el workflow.
export const releaseProject = Object.freeze({
  id: '2760f10f-64e7-4592-a27d-902075976f54',
  owner: 'appmovilestetica', slug: 'estetica-clientes',
  androidPackage: 'com.santiagogo99.esteticaclientes',
  apiUrl: 'https://esteticaa-backend-five.vercel.app/api',
  cliVersion: '27.11.0',
});

export function validatePreviewConfig(app, eas, apiUrl) {
  if (app.extra?.eas?.projectId !== releaseProject.id || app.owner !== releaseProject.owner
    || app.slug !== releaseProject.slug || app.android?.package !== releaseProject.androidPackage)
    throw Error('La identidad no coincide con el proyecto EAS existente');
  const profile = eas.build?.preview;
  if (profile?.distribution !== 'internal' || profile.environment !== 'preview'
    || profile.android?.buildType !== 'apk' || profile.developmentClient === true)
    throw Error('preview debe generar un APK de distribución interna');
  if (eas.cli?.version !== releaseProject.cliVersion || eas.cli.requireCommit !== true
    || eas.cli.appVersionSource !== 'remote') throw Error('Revisar versión de CLI, requireCommit y versiones remotas');
  // La URL del runner NO se transfiere automáticamente al builder remoto.
  if (apiUrl !== releaseProject.apiUrl || profile.env?.EXPO_PUBLIC_API_URL !== apiUrl)
    throw Error('RELEASE_API_URL y preview.env.EXPO_PUBLIC_API_URL deben coincidir con la API verificada');
  return profile;
}

export function validateEasProject(status) {
  const project = status.project;
  if (project?.id !== releaseProject.id || project.slug !== releaseProject.slug
    || project.account !== releaseProject.owner
    || project.fullName !== `@${releaseProject.owner}/${releaseProject.slug}`)
    throw Error('La cuenta/token no confirma acceso al proyecto EAS esperado');
  return { id: project.id, owner: project.account, slug: project.slug, fullName: project.fullName };
}
