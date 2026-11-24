# Evidencias de liberación interna Android

Liberación del SHA `35755d883bf111ab3596c30c2da9520cf7cecde5` de develop.
Los registros remotos usan UTC: 24/11/2026; en México corresponde al 23/11/2026.

- [release.json](release.json), [project.json](project.json) y
  [SHA256SUMS.txt](SHA256SUMS.txt) se recuperaron del artefacto 14890427679 de
  Actions. No son fixtures. Se leyeron sus entradas ZIP por rangos HTTP; la
  descarga completa inicial desde GitHub se atascó y se canceló localmente.
- [github-run.json](github-run.json), [github-jobs.json](github-jobs.json),
  [github-approvals.json](github-approvals.json) y
  [github-artifacts.json](github-artifacts.json) conservan campos seleccionados
  de la API GitHub: mismo SHA e intento, seis checks, aprobación y entrega.
- [github-release-job.json](github-release-job.json) confirma el éxito de los
  pasos de autenticación, controles previos, build, hash y publicación.
- [github-environment-final.json](github-environment-final.json) registra la
  retirada del SHA de activación, la presencia del secreto sin leer su valor,
  la URL pública y las protecciones conservadas. Main sigue en 79ad3affa3f36146cfdde5a5a0a6c8c6d6a645b2.
- [eas-build.json](eas-build.json) confirma FINISHED, proyecto, commit, perfil,
  distribución, versión y URL del APK. [eas-builds.json](eas-builds.json) muestra
  únicamente el nuevo build y el histórico del 19/11, sin builds activos.
- [local-checks.json](local-checks.json) registra lint y TypeScript locales
  aprobados; los checks de la liberación están en github-jobs.json.
- [apk-verification.json](apk-verification.json) registra la descarga real desde
  Expo, su hash y tamaño coincidentes con Actions, apksigner Verifies (salida 0,
  v2, un firmante) y el manifiesto binario leído con aapt. El certificado público
  coincide con el del APK histórico; su huella no es una credencial privada.

El APK binario se conserva en Expo y Actions, no se añade a Git. La aceptación
funcional de este APK en un teléfono Android sigue pendiente. Los jobs de
aceptación y rendimiento de CI son web móvil con API simulada; integración
local y SAST/DAST no acreditan validación nativa ni backend de staging real.

Fuentes para capturas:

1. [Resumen de Actions, intento 2](https://github.com/SANTIAGOgo99/estetica-app-movil/actions/runs/45321572186/attempts/2): SHA y siete jobs verdes.
2. [Job de liberación](https://github.com/SANTIAGOgo99/estetica-app-movil/actions/runs/45321572186/job/138209661545): autenticación, controles, EAS y artefactos.
3. [Build EAS](https://expo.dev/accounts/appmovilestetica/projects/estetica-clientes/builds/cd8bb15d-b39e-4c9a-a0be-68dad9cfa0b3): FINISHED, preview, INTERNAL, SHA y versión.
4. [Artefacto APK](https://github.com/SANTIAGOgo99/estetica-app-movil/actions/runs/45321572186/artifacts/14890427679): APK, JSON y checksum. Vence 24/12/2026 04:41:21 UTC.
5. [Entorno GitHub](https://github.com/SANTIAGOgo99/estetica-app-movil/settings/environments): abrir android-release; mostrar revisor, develop, nombres del secreto y variable, sin revelar el token.
6. [Verificación local](apk-verification.json): hash, firma v2 y manifiesto real. Para reproducir en terminal, calcular Get-FileHash -Algorithm SHA256 sobre el APK y ejecutar apksigner verify --verbose --print-certs sobre ese mismo archivo.
7. Teléfono Android: instalación y recorridos reales, todavía pendientes; no usar capturas de web como sustituto.

No volver a ejecutar el build para obtener capturas. Las pantallas actuales y
los registros conservados permiten documentar la liberación ya terminada.
