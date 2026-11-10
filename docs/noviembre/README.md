# Avance de noviembre

## Funciones implementadas

- Navegación pública con Inicio, Servicios y Productos. Citas, Perfil y accesos al
  carrito aparecen únicamente con sesión de cliente.
- Aviso de privacidad público en `/privacy` y disponible desde registro y perfil.
- Consentimiento explícito desmarcado y validación antes de enviar el registro.
- Retirada de la sesión cuando la API rechaza su token con 401. Un error 500 permite
  reintentar y no cierra la sesión.
- Validación de HTTPS antes de transmitir credenciales o tokens.
- Configuración Android de R8, reducción de recursos y bloqueo de permisos que las
  funciones actuales no necesitan.

## Código para revisión

| Función | Archivo |
| --- | --- |
| Footer según sesión | [ui.tsx](../../src/components/ui.tsx) |
| Aviso de privacidad | [Screens.tsx](../../src/features/privacy/Screens.tsx) |
| Aceptación en registro | [AuthScreens.tsx](../../src/features/auth/AuthScreens.tsx) |
| Validación y envío del consentimiento | [registration.ts](../../src/features/auth/registration.ts) |
| Respuestas 401 | [client.ts](../../src/features/api/client.ts) y [AuthService.ts](../../src/application/auth/AuthService.ts) |
| Transporte HTTPS | [apiUrl.ts](../../src/infrastructure/http/apiUrl.ts) |
| Optimización y permisos Android | [app.json](../../app.json) |
| Recorridos funcionales | [november.spec.ts](../../tests/browser/november.spec.ts) |

## Validación

Se verificaron 11 servicios y 17 productos reales. Las operaciones de autenticación
y registro de las pruebas automatizadas utilizan respuestas controladas y datos
sintéticos. No crean registros en la base productiva.

- Lint y TypeScript correctos.
- 63 pruebas de regresión aprobadas.
- 15 recorridos web móviles aprobados, incluidos siete nuevos de noviembre.
- Introspección correcta de configuración nativa; pendiente comprobar el APK final.

[Capturas, matriz y resultados](../evidence/noviembre-2026/README.md).

```bash
npm run lint
npm run typecheck
npm run test:regression
npm run test:export
npm run test:acceptance
```

## Backend

Las correcciones adicionales se encuentran en la rama
[fix/registro-clientes-seguro del backend](https://github.com/SANTIAGOgo99/Esteticaa-backend/tree/fix/registro-clientes-seguro).
Incluyen rol de cliente obligatorio en el registro público, respuestas sin
diagnóstico interno y actualizaciones compatibles de dependencias. Compilación y
seis pruebas HTTP aprobadas; sin integración a main ni despliegue productivo.

## Pendientes

Pinning SHA-256 y pruebas anti-MitM; persistencia del consentimiento y operaciones
ARCO en el backend; renovación de tokens; pruebas Android Debug/Release; APK firmado,
inspección JADX/MobSF y publicación en Google Play. La auditoría de dependencias
del móvil conserva seis avisos altos pendientes. HTTPS y la configuración de R8
constituyen avances parciales, no acreditan esos puntos completos.
