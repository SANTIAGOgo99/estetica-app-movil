# Actividad 5 — Liberación y despliegue continuo

Materia: Gestión del Proceso de Desarrollo de Software. Tercer parcial.
Actualizado: 23/11/2026 (México). Aplicación: Estética Clientes, Expo SDK 57.
Los registros de servicios usan UTC; el build terminó el 24/11/2026 a las 04:41 UTC.

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
| ci.yml | Push y PR ejecutan seis categorías. El job opcional depende de las seis, solo admite push de develop con SHA habilitado y pasa EXPO_TOKEN explícitamente por nombre. |
| android-release.yml | Workflow reutilizable con EXPO_TOKEN obligatorio y aprobación del entorno: verifica CI/configuración, acceso EAS, build, descarga y metadatos. |
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

La ruta reutilizable permite operar desde Actions sin modificar main. El flujo
actual utiliza workflow_call desde ci.yml y Re-run all jobs sobre un push de
develop con SHA habilitado. El botón workflow_dispatch independiente requiere
una definición en la rama predeterminada; no es necesario para la ruta utilizada.

## Estado real y límites de evidencia

| Categoría | Resultado |
| --- | --- |
| Existente y comprobado antes de los cambios | CI del commit a3a3686 aprobada; proyecto EAS real; APK histórico FINISHED 6953a647-0856-4125-afca-f40b1d20539d; archivo/hash coincidentes; API pública accesible. |
| Integración comprobada | PR #238 y #239 integrados normalmente a develop; commit 35755d883bf111ab3596c30c2da9520cf7cecde5. |
| CI y aprobación comprobadas | Ejecución 45321572186, intento 2: seis categorías aprobadas y aprobación normal de android-release registrada por SANTIAGOgo99. |
| Autenticación comprobada | El runner confirmó acceso al proyecto EAS existente y revalidó pruebas, configuración y checkout limpio antes de solicitar el build. |
| Compilación real comprobada | Build EAS cd8bb15d-b39e-4c9a-a0be-68dad9cfa0b3 FINISHED, solicitado únicamente por el workflow, perfil preview e INTERNAL. Versión 1.0.0, versionCode 1. |
| Entrega comprobada | Actions 45321572186, intento 2, terminó completed/success y publicó el artefacto 14890427679 con APK y metadatos; caduca el 24/12/2026 a las 04:41:21 UTC. |
| Integridad y firma comprobadas | El APK descargado de Expo coincide con release.json/SHA256SUMS de Actions. apksigner 35.0.0: Verifies, código 0, firma v2, un firmante; mismo certificado que el APK histórico. aapt confirma paquete y versión del binario. |
| Cierre de activación comprobado | ANDROID_PREVIEW_RELEASE_SHA retirada después de completar el workflow. EXPO_TOKEN, RELEASE_API_URL, revisión obligatoria y restricción a develop conservados. Main no se modificó. |
| Pendiente de aceptación nativa | La instalación y los recorridos funcionales del APK nuevo deben verificarse por separado en Android. |
| Fuera del alcance | Google Play, AAB nuevo, OTA, modificación de main y despliegue del backend. |

El APK histórico se subió con cambios sin confirmar y registra en EAS un commit
anterior al contenido completo. Se conserva como evidencia histórica, no como
resultado del nuevo workflow. requireCommit y la comprobación del SHA evitan
presentar ese instalador como una liberación reproducible nueva.

Los resultados se vinculan con el SHA e intento reales en Actions y con el
identificador del build EAS. FINISHED y la entrega del APK están comprobados.
No se sustituye una prueba nativa por una fixture, un test de política o un job
web aprobado.

## Registro de la liberación verificada

| Dato | Valor real |
| --- | --- |
| Rama y commit | develop — 35755d883bf111ab3596c30c2da9520cf7cecde5 |
| CI y liberación | 45321572186, intento 2, completed/success |
| Aprobación | android-release, approved, SANTIAGOgo99; revisión normal tras autorización expresa |
| Build EAS | cd8bb15d-b39e-4c9a-a0be-68dad9cfa0b3, FINISHED |
| Proyecto existente | @appmovilestetica/estetica-clientes, 2760f10f-64e7-4592-a27d-902075976f54 |
| Destino | Android, preview, INTERNAL, APK; no tienda |
| Versión / código Android | 1.0.0 / 1 |
| Creación / finalización EAS | 24/11/2026 04:25:25.822 / 04:41:14.395 UTC |
| Archivo | estetica-clientes-35755d883bf1-cd8bb15d-b39e-4c9a-a0be-68dad9cfa0b3.apk |
| Tamaño registrado y comprobado localmente | 92 061 167 bytes |
| SHA-256 del APK registrado y comprobado localmente | 0c4152abe89972016a49fd1abf9087dfe9fefec409b70cfc22548259986bdf42 |
| Artefacto Actions | 14890427679; nombre incluye commit completo, run e intento |
| Firma criptográfica independiente | apksigner verify: Verifies, salida 0, APK Signature Scheme v2, un firmante |
| SHA-256 del certificado público | daba11567e6dccc39fe102c76496f23311061302c467ff1a04a84f56a749ba04 |
| Manifiesto binario comprobado con aapt | com.santiagogo99.esteticaclientes; versión 1.0.0/1; minSdk 24, targetSdk 36; MainActivity presente |

El APK está disponible en [Expo, descarga del APK](https://expo.dev/artifacts/eas/FWkL1mHZGJY0pdhgCkO64PRReILJp0IublyBCc5H7Lk.apk)
y en el artefacto de Actions enlazado debajo. El hash anterior corresponde al
archivo APK; el digest que muestra GitHub para el artefacto corresponde al ZIP
que contiene APK y metadatos, por lo que son valores distintos.

Los [metadatos conservados](evidence/actividad5-cd/README.md) documentan la cadena
de trazabilidad. Son consultas y archivos reales de esta ejecución, sin tokens,
credenciales de firma, respuestas crudas de EAS ni URLs temporales firmadas.
La verificación independiente se hizo después del workflow sobre el APK
descargado, sin modificarlo. release.json conserva correctamente el alcance
original del workflow; la comprobación posterior está en apk-verification.json.
Una firma válida y un manifiesto legible no acreditan la instalación o el
comportamiento funcional en un dispositivo.

## Capturas para el documento

| Captura | Qué demuestra / cuándo obtenerla |
| --- | --- |
| [PR #238](https://github.com/SANTIAGOgo99/estetica-app-movil/pull/238) y [PR #239](https://github.com/SANTIAGOgo99/estetica-app-movil/pull/239) | Integración por PR hacia develop, incluida la corrección de transmisión del secreto; main intacta. |
| [CI 45321572186, intento 2](https://github.com/SANTIAGOgo99/estetica-app-movil/actions/runs/45321572186/attempts/2) | Seis categorías y liberación aprobadas del SHA 35755d8; mostrar SHA e intento. |
| app.json y eas.json | Identidad existente y perfil APK interno. |
| [Environment android-release](https://github.com/SANTIAGOgo99/estetica-app-movil/settings/environments) | Aprobación, develop y nombres EXPO_TOKEN/RELEASE_API_URL; no mostrar valores secretos. |
| [Job de liberación](https://github.com/SANTIAGOgo99/estetica-app-movil/actions/runs/45321572186/job/138209661545) | Acceso al proyecto existente, control previo, compilación y entrega exitosos; la aprobación ya se registró, no sigue esperando. |
| [Build EAS FINISHED](https://expo.dev/accounts/appmovilestetica/projects/estetica-clientes/builds/cd8bb15d-b39e-4c9a-a0be-68dad9cfa0b3) | Proyecto existente, SHA, perfil preview, INTERNAL y versión 1.0.0/1. |
| [Artefacto APK y metadatos](https://github.com/SANTIAGOgo99/estetica-app-movil/actions/runs/45321572186/artifacts/14890427679) | Descargar APK, release.json, project.json y SHA256SUMS; conservar copia antes del vencimiento. |
| [Verificación independiente](evidence/actividad5-cd/apk-verification.json) | Hash del archivo, coincidencia con Actions, firma válida v2 y manifiesto real; no aceptación funcional. |
| APK instalado y recorridos Android | Entrega y aceptación nativa, pendientes de prueba real. |

Ver [guía operativa y pasos del propietario](testing/despliegue-android.md).

Referencias: [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/),
[Build desde CI](https://docs.expo.dev/build/building-on-ci/),
[eas.json](https://docs.expo.dev/eas/json/),
[distribución interna](https://docs.expo.dev/build/internal-distribution/),
[reutilización Actions](https://docs.github.com/en/actions/how-tos/reuse-automations/reuse-workflows).
