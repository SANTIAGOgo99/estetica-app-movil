# Actividad 5 — Liberación y despliegue continuo

Materia: Gestión del Proceso de Desarrollo de Software. Tercer parcial.
Fecha de preparación: 23/11/2026. Aplicación: Estética Clientes, Expo SDK 57.

## 1. Selección y descripción de la herramienta

Se elige GitHub Actions como orquestador y Expo EAS Build (actualmente llamado
Expo Build en la documentación) como servicio de compilación y distribución
interna Android. Los comandos eas y eas.json conservan su nombre.

Actions ejecuta el control de calidad, identifica el commit y aplica aprobación
del entorno. EAS compila en la nube y utiliza las credenciales Android del
proyecto existente para producir un APK instalable sin Expo Go. Es pertinente
porque la aplicación usa Expo/React Native y módulos nativos como SecureStore y
pinning; una exportación JavaScript no sustituye un instalador nativo.

El destino elegido es distribución interna: compartir e instalar el APK en
Android para validación. Se implementa **entrega controlada con aprobación
manual**. No se afirma despliegue automático a usuarios por cada push, envío a
Google Play ni actualizaciones OTA. Los tres conceptos deben distinguirse en la
exposición académica.

## 2. Elementos de configuración

| Elemento | Función / relación con CD |
| --- | --- |
| package.json / package-lock.json | Scripts y versiones; npm ci instala el árbol de dependencias bloqueado. No se añadieron dependencias de aplicación para CD. |
| app.json | Identidad y configuración nativa. Owner appmovilestetica, slug estetica-clientes, projectId 2760f10f-64e7-4592-a27d-902075976f54, paquete com.santiagogo99.esteticaclientes. Conserva plugins y restricciones de seguridad. |
| eas.json / cli | CLI 27.11.0, versiones nativas remotas y requireCommit para subir un commit limpio. |
| eas.json / preview | distribution internal, environment preview, Android buildType apk, Node 22.13.1 y URL pública de API. Es el único perfil invocado. |
| eas.json / production y submit | Configuración preexistente AAB/tienda conservada, sin activación desde este workflow. |
| ci.yml | Push y PR ejecutan seis categorías. El job opcional depende de las seis y solo admite push de develop con SHA habilitado. |
| android-release.yml | Workflow reutilizable con aprobación del entorno: verifica CI/configuración, acceso EAS, build, descarga y metadatos. Entrada manual preparada para una futura integración autorizada en main. |
| scripts/release-policy.mjs | Exige SHA/rama/evento correctos, seis jobs completos y evidencia del intento correcto; bloquea resultados fallidos, omitidos y ambiguos. |
| scripts/release-config.mjs | Contrato de identidad EAS, perfil interno y coherencia de la API. Evita vincular otro proyecto o compilar una configuración distinta. |
| scripts/verify-release.mjs | Consulta Actions por API, valida checkout limpio y guarda la referencia CI del mismo commit. Repite el control antes del build. |
| scripts/verify-eas-project.mjs | Confirma remotamente cuenta, slug e ID con el token del runner; no crea proyectos. |
| scripts/release-artifact.mjs | Exige build FINISHED Android/INTERNAL/preview del mismo proyecto y SHA; descarga el APK y calcula su SHA-256. |
| Entorno android-release | Separa configuración de liberación y exige revisión antes de utilizar credenciales. |
| EXPO_TOKEN | Secreto del entorno para autenticar al runner en Expo; nunca se versiona ni se incluye en el APK. |
| RELEASE_API_URL | Variable pública del entorno; debe coincidir con el valor que eas.json entrega al constructor remoto y con el host de pinning. |
| ANDROID_PREVIEW_RELEASE_SHA | Variable de repositorio que habilita solo un commit completo de develop. Ausente significa liberación desactivada. |
| GITHUB_TOKEN / permisos | Token temporal de Actions para consultar evidencia. Permisos contents:read y actions:read; no se requiere token personal GitHub para el runner. |
| Protecciones de develop/main | PR, seis checks requeridos, rama actualizada y sin force-push. No se debilitan para integrar CD. |
| needs / if / concurrency | Orden de pruebas antes del build, habilitación explícita y control de concurrencia. Develop no cancela builds aprobados con un nuevo push. |
| .gitignore / .easignore | Excluyen archivos locales, credenciales y salidas. output/release no ensucia el commit; respuestas crudas de EAS no se publican como evidencia. |
| TypeScript / ESLint / tests / Playwright / SAST / DAST | Controles previos. Se añade lint de scripts CD; la aceptación/rendimiento siguen siendo web móvil y el DAST sigue siendo local. |
| Artefactos y resúmenes | APK, release.json, project.json y SHA256SUMS. ID/intento distinguen ejecuciones y permiten revisión posterior. |

## 3. Vínculo entre herramienta, configuración y entorno

Commit de develop → seis jobs CI → SHA habilitado → aprobación android-release
→ token confirma proyecto EAS → perfil preview genera APK → verificación de
proyecto/commit/estado → descarga y hash → instalación manual en Android.

La API utilizada es https://esteticaa-backend-five.vercel.app/api. Está alojada
en Vercel y pertenece a otro repositorio; el workflow móvil no la despliega.
El entorno preview de EAS es una selección de configuración, no una API/base de
datos aislada. No se cambia el pinning ni la funcionalidad móvil para esta tarea.

La ruta reutilizable permite preparar CD sin modificar main. El botón manual
de android-release.yml seguirá pendiente de su incorporación autorizada en la
rama predeterminada. Después de integrar en develop, puede habilitarse un SHA y
usar Re-run all jobs sobre su ejecución push desde la interfaz Actions.

## Estado real y límites de evidencia

| Categoría | Resultado |
| --- | --- |
| Existente y comprobado antes de los cambios | CI del commit a3a3686 aprobada; proyecto EAS real; APK histórico FINISHED 6953a647-0856-4125-afca-f40b1d20539d; archivo/hash coincidentes; API pública accesible. |
| Implementado para revisión | Workflow preview reutilizable, habilitación por SHA, protección de pruebas/intento, contrato de proyecto/API y manifiesto/hash de APK. |
| Pendiente de credencial/activación | Guardar EXPO_TOKEN y RELEASE_API_URL en android-release; restringir ramas; revisar/integrar PR; habilitar el SHA solo después de autorización. |
| Pendiente de ejecución real | Actions → EAS → APK para este código, descarga desde Actions e instalación/aceptación nativa. No existe evidencia nueva de estas operaciones. |
| Fuera del alcance | Google Play, AAB nuevo, OTA, modificación de main y despliegue del backend. |

El APK histórico se subió con cambios sin confirmar y registra en EAS un commit
anterior al contenido completo. Se conserva como evidencia histórica, no como
resultado del nuevo workflow. requireCommit y la comprobación del SHA evitan
presentar ese instalador como una liberación reproducible nueva.

Los resultados de validación de esta preparación se reportan en el PR y en la
respuesta de entrega; las ejecuciones nuevas deben enlazarse con su SHA real.
No se sustituye una prueba nativa por una fixture, un test de política o un job
web aprobado.

## Capturas para el documento

| Captura | Qué demuestra / cuándo obtenerla |
| --- | --- |
| PR hacia develop y commits | Integración revisable sin modificar main; obtener durante preparación. |
| CI del nuevo SHA con seis jobs aprobados y liberación skipped | Controles operativos y ausencia de build en preparación. |
| app.json y eas.json | Identidad existente y perfil APK interno. |
| Environment android-release | Aprobación, restricciones de ramas y nombres de ajustes; ocultar valores secretos. |
| Proyecto Expo con ID y APK histórico | Vinculación existente; rotular explícitamente como evidencia del 19/11. |
| Job esperando aprobación | Control humano antes de consumir EAS; obtener solo en ejecución autorizada. |
| Job EAS y build FINISHED del SHA nuevo | Integración real Actions–Expo; pendiente de ejecución autorizada. |
| Artifacts y release.json/SHA256SUMS | Trazabilidad commit–CI–build–APK; pendientes del build real. |
| APK instalado y recorridos Android | Entrega y aceptación nativa, pendientes de prueba real. |

Ver [guía operativa y pasos del propietario](testing/despliegue-android.md).

Referencias: [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/),
[Build desde CI](https://docs.expo.dev/build/building-on-ci/),
[eas.json](https://docs.expo.dev/eas/json/),
[distribución interna](https://docs.expo.dev/build/internal-distribution/),
[reutilización Actions](https://docs.github.com/en/actions/how-tos/reuse-automations/reuse-workflows).
