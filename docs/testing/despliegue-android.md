# Liberación controlada de APK interno

Actualizado: 23/11/2026. Esta guía sustituye el estado de configuración de octubre.
Los pasos de activación y compilación descritos aquí **no se han ejecutado**.

## Estado y alcance

Proyecto existente: `@appmovilestetica/estetica-clientes`, ID
`2760f10f-64e7-4592-a27d-902075976f54`.
Paquete Android: `com.santiagogo99.esteticaclientes`.
Hay un APK histórico EAS finalizado el 19/11 y confirmación de instalación/apertura
del usuario el 21/11. No demuestra el nuevo flujo ni aceptación funcional nativa.

Esta entrega prepara únicamente `preview`: APK firmado de distribución interna.
Los perfiles `production` y `submit.production` se conservan en eas.json, pero no
se invocan en los workflows. No hay envío, revisión ni publicación de Google Play.
`expo export --platform android` sigue siendo exportación JS/Hermes, no APK.

## Integración sin modificar main

1. Revisar el PR de `codex/actividad5-cd-preview` hacia `develop`. Incluye los tres
   commits de noviembre ya existentes y un cambio separado de CD. No incluye los
   cinco archivos locales sin seguimiento detectados al comenzar.
2. Exigir los seis checks de la protección de develop. Mantener intacta la
   protección; no usar push directo, force-push, bypass ni merge administrativo.
3. Integrar el PR solo después de revisión. La configuración queda disponible en
   el commit integrado de develop; la CI de ese push vuelve a ejecutar pruebas.
4. Dejar `ANDROID_PREVIEW_RELEASE_SHA` ausente mientras se revisa el resultado.
   El job de liberación se omite y no se consumen recursos EAS.

`workflow_dispatch` necesita que el YAML exista en la rama predeterminada. Main
no se modifica para resolverlo. La alternativa preparada es `workflow_call`:
ci.yml llama al workflow del mismo commit después de sus seis jobs. Así puede
operarse desde una ejecución de develop en la pestaña Actions.

## Ajustes que debe completar el propietario, después de revisar

| Ámbito | Nombre | Contenido / propósito |
| --- | --- | --- |
| Environment `android-release` / Secret | `EXPO_TOKEN` | Token de Expo con acceso al proyecto existente y permiso para Build. Introducir únicamente en la interfaz de GitHub; nunca en Git, chats o capturas. |
| Environment `android-release` / Variable | `RELEASE_API_URL` | `https://esteticaa-backend-five.vercel.app/api`; debe coincidir con preview.env.EXPO_PUBLIC_API_URL de eas.json. |
| Repository / Variable | `ANDROID_PREVIEW_RELEASE_SHA` | SHA completo de 40 caracteres del commit integrado de develop aprobado para liberar. Dejar ausente hasta autorizar el build. |
| Environment `android-release` | Required reviewers | Existe aprobación de SANTIAGOgo99. Conservarla. Restringir las ramas a develop antes de habilitar el flujo. |

Comprobación remota del 23/11: el entorno existe; sus secretos y variables estaban
vacíos, y las variables de repositorio también. No se crearon tokens ni se
guardaron credenciales. Para este alcance no se necesita cuenta de servicio Play
ni NATIVE_ACCEPTANCE_APPROVED_SHA/STAGING_ACCEPTANCE_APPROVED_SHA.

En [Expo → Access tokens](https://expo.dev/settings/access-tokens), el propietario
debe crear o elegir un token autorizado y guardarlo directamente en
[GitHub → Environments](https://github.com/SANTIAGOgo99/estetica-app-movil/settings/environments)
→ android-release → Environment secrets → EXPO_TOKEN. El login local de Expo
no se transfiere al runner de GitHub. El token nuevo se comprobará en el runner;
la consulta local del proyecto no acredita su validez.

## Ejecución futura, solo con autorización explícita

No seguir estos pasos durante la preparación:

1. Revisar los cambios y completar el token, URL y restricciones del entorno.
2. Elegir la ejecución CI **por push de develop** posterior al merge. Anotar SHA
   completo e ID; comprobar seis jobs aprobados. No usar un run de PR/feature.
3. Establecer ANDROID_PREVIEW_RELEASE_SHA con ese SHA, a nivel de repositorio.
4. En Actions → esa ejecución → **Re-run all jobs**. No elegir solo el job final:
   el control consulta los seis jobs del intento actual. Los artefactos de CI
   incluyen el número de intento para evitar colisiones con los anteriores.
5. Tras aprobar las seis categorías, el job APK solicita revisión del entorno.
   Comprobar SHA y alcance, y aprobar únicamente cuando se autorice consumir EAS.
6. El workflow verifica el ID/intento de CI, checkout limpio, proyecto, perfil y
   URL. Después instala dependencias, consulta el proyecto con el token y repite
   el control previo. Solo entonces ejecuta `eas build --profile preview`.
7. Espera FINISHED, exige proyecto/paquete/SHA correctos, descarga el APK y
   calcula SHA-256. Conservar el artefacto Android de Actions y su release.json.
8. Retirar ANDROID_PREVIEW_RELEASE_SHA al terminar para evitar otra compilación
   del mismo SHA si alguien vuelve a ejecutar todos los jobs.
9. Instalar el APK y documentar aceptación real en Android por separado.

En workflow_call la ejecución global aún no puede estar completada porque el
build es un job del mismo run. Se exige que **los seis jobs de pruebas** estén
completed/success en su mismo ID e intento; no se acepta otro run incompleto.
Para la entrada manual futura, un run externo debe estar completed/success.

Un nuevo push de develop no cancela automáticamente una ejecución en curso.
Si se cancela Actions después de solicitar un build, revisar EAS: cancelar el
runner no garantiza cancelar la compilación remota. No reintentar a ciegas.

## Identidad, versiones y API

- CLI fijada en 27.11.0 y Node en 22.13.1; no usar init/build:configure.
- app.json conserva owner, slug, projectId, paquete, plugins y funcionalidades.
- cli.requireCommit exige árbol limpio; el JSON de salida se escribe en output/
  (ignorado) para no ensuciar Git antes de compilar.
- appVersionSource continúa remoto. Preview no incrementa automáticamente
  versionCode; la versión real se registra desde EAS. Production no se cambia.
- preview y production siguen apuntando al backend productivo. El nombre
  preview no implica staging aislado. El pinning actual está ligado a ese host.
- El control rechaza una URL distinta entre GitHub y eas.json. La variable de
  GitHub por sí sola no cambia la URL del constructor remoto.

## Trazabilidad y evidencia

El artefacto `android-preview-<SHA>-<RUN_ID>-<INTENTO>` conservará durante 30 días:

- APK cuyo nombre incluye SHA e ID EAS.
- release.json: repositorio, commit, rama, CI/intento, run de liberación, proyecto,
  build ID, estado, versión, URL, tamaño y SHA-256.
- SHA256SUMS.txt y project.json con identidad confirmada remotamente.

No se adjuntan las respuestas crudas de EAS, tokens ni credenciales de firma.
Si falla el proceso, solo se conservan metadatos previos ya verificados.
FINISHED, cabecera ZIP y hash no sustituyen verificación de firma ni aceptación.

## Validación sin compilar

```bash
npm run typecheck
npm run lint -- --no-cache
node --test tests/release.unit.test.mjs tests/release-artifact.unit.test.mjs
npm run test:regression
```

Los casos de CD usan fixtures sintéticas e inyección de respuestas de descarga;
no contactan Expo ni generan APK. La aceptación/rendimiento de CI usan web móvil.

Referencias: [EAS desde CI](https://docs.expo.dev/build/building-on-ci/),
[eas.json](https://docs.expo.dev/eas/json/),
[workflows reutilizables](https://docs.github.com/en/actions/how-tos/reuse-automations/reuse-workflows),
[reintentos en Actions](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/re-run-workflows-and-jobs).
