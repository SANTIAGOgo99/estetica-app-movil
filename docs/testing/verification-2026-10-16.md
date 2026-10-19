> Registro histórico del 16/10/2026. El estándar vigente y las nuevas evidencias se describen en observaciones-2026-10-19.md. Algunos runs antiguos fueron retirados con respaldo local; no usarlos como evidencia vigente.

# Verificación de la corrección — 16 de octubre de 2026

## Resultados locales

| Verificación | Resultado |
|---|---|
| ESLint y TypeScript | Sin errores |
| Unitarias | 4 casos aprobados |
| Integración HTTP local | 1 escenario aprobado, con varias verificaciones |
| Regresión completa | 32 casos aprobados; incluye los anteriores |
| Aceptación web móvil | 5 casos aprobados, cubren acceso y catálogo/detalle |
| Rendimiento web móvil | 2 casos aprobados; catálogos con p95 < 5000 ms |
| Exportación Expo Android | Paquete JavaScript/Hermes generado; no es un APK |
| Exportación web de pruebas | Generada con API ficticia y sin leer .env |
| Planeación | 18 historias, 59 tareas conservadas y 126 pruebas únicas; siete por HU |

Node 22.13.1 y Expo SDK 57. Playwright utiliza Chromium con viewport Pixel 7. El servidor HTTP de integración es local y la API de navegador está simulada. No se ejecutó carga sobre producción.

Las cuatro pruebas de aceptación originales comprobaron validación de campos, sesión/restauración, búsqueda/detalle de servicios y productos, protección de agenda/carrito y reintento ante error. Se agregó un quinto caso de rechazo de credenciales sin crear sesión.

## Evidencia en GitHub

[PR HU00 #157](https://github.com/SANTIAGOgo99/estetica-app-movil/pull/157): las ejecuciones y sus artefactos están en Checks. Al integrar en develop, consultar [GitHub Actions](https://github.com/SANTIAGOgo99/estetica-app-movil/actions) para los seis jobs y sus reportes.

[Tablero](https://github.com/users/SANTIAGOgo99/projects/1): cada historia enlaza sus P01–P07. La sincronización conserva las pruebas anteriores como sustituidas y archivadas, nunca como aprobadas. Se guarda un respaldo local en .planning/tests-before-2026-10-16.json y el resultado en .planning/test-sync-result.json.

## Pendientes funcionales

Los resultados anteriores validan el proceso y la cobertura existente. No aprueban automáticamente las 18 historias. Faltan pruebas en Android/iOS, integración con API + PostgreSQL de staging, esfuerzo manual y los casos de las funciones futuras. Cada sub-issue requiere evidencia de su propio alcance antes de cerrarse.

Se conserva la línea base con los avances previos y todas las ramas anteriores. Tras ajustar el alcance, solo HU00 y HU01 conservan rama por historia. Las ramas adelantadas HU02–HU17 se retiraron después de verificar que no tenían commits propios fuera de develop. Las ejecuciones históricas se conservan.

## Referencias de herramientas

- [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/).
- [Expo CLI y exportación](https://docs.expo.dev/more/expo-cli/).
- [Sintaxis de workflows de GitHub Actions](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax).
- [Configuración y servidor de Playwright](https://playwright.dev/docs/test-webserver).
