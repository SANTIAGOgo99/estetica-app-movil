# Avance del 19 de noviembre

El APK 1.0.0 está compilado para instalar directamente en Android. El backend
actualizado está desplegado y pasó las comprobaciones con PostgreSQL real.

Actualización del 21 de noviembre: el usuario confirmó instalación y apertura
del APK en su Android. Los recorridos funcionales nativos siguen por comprobar.

[Descargar APK](https://expo.dev/artifacts/eas/beAodsUy9xzXW6jSwZRqyqz6eM5N-1uPmaEoeJIyEAw.apk) ·
[Compilación EAS](https://expo.dev/accounts/appmovilestetica/projects/estetica-clientes/builds/6953a647-0856-4125-afca-f40b1d20539d) ·
[Evidencias](../evidence/liberacion-2026-11-19/README.md)

## Estado por apartado

| Apartado | Avance comprobado | Pendiente para acreditarlo completo |
| --- | --- | --- |
| Nube y JWT | API HTTPS, JWT de 15 minutos, refresh token rotativo, cierre y revocación; comprobados con la base real | Recorrido en el APK instalado |
| Anti-MitM y almacenamiento seguro | Pinning SHA-256 con dos claves, módulo nativo incluido en APK; SecureStore para tokens Android | Interceptación/certificado incorrecto y almacenamiento en dispositivo |
| ARCO y consentimiento explícito | Aceptación/version/fecha persistidas; consulta, corrección, oposición y eliminación propia en servidor real | Evidencia de recorridos en Android |
| R8/ProGuard y análisis | APK Release, minificación/reducción configuradas; manifest decodificado con JADX y 11,407 clases con nombres de uno o dos caracteres | Informe completo JADX/MobSF; extracción de recursos incompleta por falta de espacio |
| Caja negra Android Debug y Release | 69 pruebas de regresión, 15 recorridos web anteriores y 3 recorridos web ARCO; 13 comprobaciones reales del backend | Ejecutar y documentar ambos tipos de compilación Android; la web no los sustituye |
| Google Play en revisión o publicada | Identificador Android y perfil de producción AAB configurados | Acceso a Play Console, ficha, políticas, AAB y envío a revisión |
| APK/AAB firmado | APK generado con credenciales de firma administradas por EAS; archivo y SHA-256 registrados; instalación/apertura confirmadas por el usuario el 21/11 | AAB configurado, aún no generado; verificación criptográfica independiente pendiente |
| Permisos justificados en ejecución | Manifest sin cámara, micrófono, ubicación, fotos ni almacenamiento compartido; HTTP bloqueado | Revisar permisos heredados, especialmente SYSTEM_ALERT_WINDOW; las funciones actuales no necesitan permisos peligrosos en ejecución |

## Cómo demostrarlo

| Punto | Qué decir | Qué mostrar |
| --- | --- | --- |
| Conexión | La app consulta la API en la nube y esa API consulta PostgreSQL | Abrir Estética Clientes sin Expo Go; Servicios y Productos con internet y Aiven encendido |
| Acceso | Las opciones privadas aparecen después de autenticar al cliente | Footer público; iniciar sesión y mostrar Citas/Perfil |
| Consentimiento | El registro exige aceptación y el servidor guarda versión/fecha | Registro con casilla desmarcada; aviso; backend-production-live.json |
| ARCO | El cliente consulta/corrige sus datos, retira promociones y elimina su cuenta | Perfil → Administrar mis datos y privacidad; contraseña para corrección/eliminación |
| Sesiones | El acceso se renueva con refresh token rotativo; se rechazan tokens revocados | AuthService.ts y reporte real con refresh 200 y reutilización 401 |
| Protección | El APK bloquea HTTP y contiene nombres de clases ofuscados | AndroidManifest.xml, apk-inspection.json y app.json |
| Instalador | Es un APK propio compilado con EAS, instalable sin Expo Go | Estetica-Clientes-1.0.0.apk, página EAS y apk.json |

Usar exclusivamente una cuenta de prueba para demostrar la eliminación. Se
retiran identificadores y acceso; pueden conservarse relaciones operativas
anonimizadas. No se declara borrado de todos los respaldos o sistemas externos.

## Código

| Función | Archivo |
| --- | --- |
| Footer | [ui.tsx](../../src/components/ui.tsx) |
| ARCO | [SettingsScreen.tsx](../../src/features/account/SettingsScreen.tsx) |
| Consentimiento | [registration.ts](../../src/features/auth/registration.ts) |
| Sesión | [AuthService.ts](../../src/application/auth/AuthService.ts) |
| Recuperación 401 | [client.ts](../../src/features/api/client.ts) |
| Pinning | [pinningPolicy.ts](../../src/infrastructure/http/pinningPolicy.ts) |
| SecureStore | [storage.ts](../../src/infrastructure/auth/storage.ts) |
| Android | [app.json](../../app.json) |

[Backend](https://github.com/SANTIAGOgo99/Esteticaa-backend/tree/fix/registro-clientes-seguro),
commit `760e0042094dcb637e83e1e65a4683e649148318`, desplegado en producción.
Trece pruebas HTTP automatizadas y trece comprobaciones reales aprobaron.
Las cuentas sintéticas se anonimizaron al terminar.

Lint y TypeScript aprobaron. Expo Go omite pinning nativo en desarrollo; el APK
Release exige el módulo. No se declara publicación en Google Play ni resistencia
absoluta a descompilación. Auditoría móvil pendiente: 9 avisos moderados y 4 altos
en la última revisión. Los pins deben revisarse cuando roten certificados.
