# APK y Google Play después de las pruebas

Estado al 19/10/2026: configuración de distribución preparada y política probada; no hay build APK/AAB ni envío a Google Play acreditados. Faltan confirmar/configurar cuentas EAS y Play Console, proyecto, identificador Android y firma. No se inventaron valores ni se ejecutó una publicación.

## Diferenciar archivos

- expo export --platform android genera JavaScript/Hermes: no se instala como APK.
- Perfil preview de eas.json: genera APK firmado para instalar y hacer aceptación en teléfono.
- Perfil production: genera AAB para Google Play. AAB no se instala directamente como APK.
- Enviar a Google Play no equivale a publicar en producción: este flujo usa canal internal y estado draft.

## Comprobar cuentas existentes

1. Iniciar sesión en https://expo.dev y comprobar si aparece el proyecto de esta aplicación. Un proyecto vinculado guarda extra.eas.projectId en app.json; aquí aún falta.
2. Abrir https://play.google.com/console. Confirmar acceso a la cuenta desarrolladora y a la ficha de la app. Si exige registro, el acceso aún no está preparado.
3. Revisar en Vercel un entorno separado y una base de datos aislada. Una URL Preview que comparte la base productiva no es staging aislado.
4. Confirmar solo existencia y nombre de los entornos; no pegar contraseñas, tokens, service accounts ni DATABASE_URL en chat, issues o Git.

## Configurar EAS una vez (requiere la cuenta del propietario)

```bash
npx eas-cli@latest login
npx eas-cli@latest init
npx eas-cli@latest build:configure
```

Revisar cambios antes de subirlos. Conservar los perfiles preview y production de eas.json; configurar el identificador Android definitivo en app.json y las credenciales de firma en EAS. No crear android/ o ios/ a mano.

Configurar EXPO_PUBLIC_API_URL real en el entorno preview/production de EAS. No usar api.example.test para un APK destinado a usuarios. La URL es pública dentro de la aplicación; nunca poner secretos en ella.

La primera compilación puede requerir interacción para crear la firma y completar el proyecto. Ejecutarla con el propietario:

```bash
npx eas-cli@latest build --platform android --profile preview
```

Este comando sí inicia una compilación y puede consumir cuota; no se ejecutó en esta revisión. Instalar el APK y registrar los casos de aceptación nativa en las sub-issues correspondientes.

## Configuración del workflow de distribución

Archivo: .github/workflows/android-release.yml. Es un workflow de distribución separado, no un segundo pipeline de seis pruebas. Solo se inicia manualmente. GitHub exige que workflow_dispatch esté registrado en la rama predeterminada para mostrar Run workflow; la entrega estable a main está pendiente y no se alteró para aparentar una publicación.

Crear el entorno GitHub android-release con aprobación del propietario. Configurar:

- Secreto EXPO_TOKEN: token del propietario de EAS, de alcance apropiado.
- Variable RELEASE_API_URL: backend real HTTPS que usará el paquete.
- Para Google Play, secreto GOOGLE_PLAY_SERVICE_ACCOUNT con credencial autorizada, y permisos/configuración de Play Console y EAS.
- Variables NATIVE_ACCEPTANCE_APPROVED_SHA y STAGING_ACCEPTANCE_APPROVED_SHA: SHA exacto de la entrega comprobada, después de ejecutar y documentar esas pruebas. No establecerlas antes de disponer de evidencia.

No hay publicación automática por push. La puerta de distribución exige:

1. Run del workflow ci.yml terminado y aprobado.
2. Evento push del mismo SHA y rama elegidos para construir, no evidencia de un PR o un commit anterior.
3. Los seis jobs con conclusión success; skipped no equivale a aprobado.
4. Configuración EAS completa y URL real sin credenciales incrustadas.
5. Para play-internal: rama main y aceptaciones nativa/staging del mismo SHA.

El build espera a que EAS termine y valida el resultado. No se utiliza --no-wait para presentar como compilación aprobada una tarea apenas encolada. El envío usa el ID del build recién comprobado, no --latest.

Google Play requiere preparar la aplicación y, para habilitar envíos por API, realizar la primera carga manual cuando corresponda. El canal interno y el borrador quedan sujetos a revisión posterior en Play Console; no se desplegó en producción.

## Cómo verificar la puerta sin tener cuentas

```bash
npm run test:unit
```

release.unit.test.mjs comprueba que la política rechaza un job fallido, un run incompleto, evidencia de PR, un SHA distinto, otro workflow y la falta de aprobación nativa/staging para Google Play. Esto demuestra la política, no una compilación o publicación real.

Referencias: [APK en EAS](https://docs.expo.dev/build-reference/apk/), [configuración eas.json](https://docs.expo.dev/eas/json/), [requisitos para CI](https://docs.expo.dev/build/building-on-ci/), [envío Android](https://docs.expo.dev/submit/android/).
