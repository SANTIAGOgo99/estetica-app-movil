# Evidencias de desarrollo de octubre

Capturas generadas el 29/10/2026 por `npm run test:acceptance`. Son ejecuciones de las pantallas React Native exportadas a web en Chromium, con API simulada e identificadores ficticios. No se crearon reservas ni pedidos productivos. El caso público comprueba 320 y 412 px y ausencia de desbordamiento horizontal; los demás usan el viewport móvil Pixel 7 configurado en Playwright.

## Pantallas y recorridos

| Evidencia | Qué se comprueba |
| --- | --- |
| [Inicio a 320 px](inicio-320.png) y [a 412 px](inicio-412.png) | Entrada pública y navegación |
| [Servicios a 320 px](servicios-320.png) y [a 412 px](servicios-412.png) | Catálogo y acceso al detalle |
| [Productos a 320 px](productos-320.png) y [a 412 px](productos-412.png) | Catálogo público |
| [Validación a 320 px](acceso-validacion-320.png) y [a 412 px](acceso-validacion-412.png) | Error de campos vacíos después de intentar agendar sin sesión |
| [Carrito](carrito.png) y [dos unidades](carrito-dos-unidades.png) | Cantidades y total calculado; 120.50 × 2 = 241 |
| [Selección de compra](compra.png) | Resumen de productos, sin simular un pedido real |
| [Perfil](perfil.png) | Datos de cliente y cierre de sesión |
| [Agenda](agenda.png) | Fecha, horario disponible y horario ocupado deshabilitado |
| [Confirmación simulada](cita-confirmada-api-simulada.png) | Navega después de la respuesta controlada del servidor |

[Resultado de los ocho escenarios de aceptación](acceptance.json). [Resultados de verificación local](verification.json). [Mediciones de rendimiento](performance.json).

## Código que produce el comportamiento

- [Pantallas y rutas](../../../src/app/).
- [Clean y casos de uso de sesión](../../../src/application/auth/AuthService.ts).
- [Singleton y Observer](../../../src/application/auth/SessionStore.ts).
- [Contrato Repository](../../../src/domain/auth/TokenRepository.ts).
- [Repository y Factory](../../../src/infrastructure/auth/TokenRepositoryFactory.ts).
- [Conexión real de los patrones con la app](../../../src/composition/auth.ts).
- [Adaptador de React](../../../src/features/auth/AuthProvider.tsx).
- [Reglas de carrito independientes de la vista](../../../src/domain/commerce/cart.ts).
- [Pruebas de patrones y casos de uso](../../../tests/patterns.unit.test.mjs).
- [Prueba integrada HTTP y cuatro patrones](../../../tests/auth-service.integration.test.mjs).
- [Reglas de dependencia de arquitectura](../../../tests/architecture.unit.test.mjs).
- [Recorridos que generan las capturas](../../../tests/browser/october.spec.ts).

## Seguridad en CI

[ci.yml](../../../.github/workflows/ci.yml) ejecuta Semgrep antes de las exportaciones. Regresión depende del análisis estático; ejecuta ZAP pasivo sobre la web local antes de exportar Android. Semgrep bloquea hallazgos ERROR y errores de ejecución; [check-security.mjs](../../../scripts/check-security.mjs) bloquea alertas ZAP de riesgo alto, reportes sin sitio o de otro objetivo. Los riesgos menores permanecen visibles. [La prueba negativa](../../../tests/security.unit.test.mjs) comprueba que el control rechaza riesgo alto.

Los reportes reales se descargan desde los artefactos seguridad-sast y seguridad-dast del run. El alcance DAST es la exportación web local, no el backend productivo ni un APK. El registro local no reemplaza los checks del commit que se vaya a integrar.
