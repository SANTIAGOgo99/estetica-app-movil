# Plan y ejecución de pruebas móvil

Estándar vigente desde el 19/10/2026: seis jobs en cada push y pull request hacia develop/main; mismo workflow general para todas las historias. Esfuerzo se registra manualmente en P07. Esto sustituye la separación anterior de cuatro jobs por rama y dos adicionales en develop.

18 historias, 59 tareas de desarrollo conservadas y siete tareas de pruebas por historia (126). [Matriz](plan.json). Tener tareas creadas o un workflow verde no aprueba automáticamente una historia.

## Tipo, datos y alcance

| Categoría | Herramienta | Alcance actual |
|---|---|---|
| Estático | TypeScript + ESLint | Código, configuración y pruebas del repositorio |
| Unitaria | node:test | Credenciales con datos JSON, vigencia/restauración, reglas de catálogo/horario y política de distribución |
| Integración | node:test + HTTP local | Login, perfil, sesión, catálogo y conflicto de reserva; no acredita PostgreSQL real |
| Regresión | node:test | Toda la suite acumulada; incluye casos anteriores, no sumar como ejecuciones diferentes |
| Aceptación | Playwright + Chromium | HU01–HU05, interfaz web móvil con API simulada; incluye restauración/cierre y rechazo de credenciales |
| Rendimiento | Playwright | HU01/HU02/HU04, cinco muestras por flujo, p95 < 5000 ms; interfaz web/API simulada |
| Esfuerzo | Procedimiento P07 | Manual; pendiente en entorno controlado, nunca contra producción |

Datos: [tests/fixtures/mobile.json](../../tests/fixtures/mobile.json), casos identificados y ficticios. Los mocks representan respuestas controladas; no hay servidor detrás de api.example.test. [Alcance y uso de datos](../../tests/fixtures/README.md).

Requerimiento: casos de cada HU. Módulo: ejecutar sus funciones relacionadas. Sprint: repetir la suite y revisar los criterios de todas las historias integradas. Una evidencia compartida se vincula a las HU que realmente cubre.

## Ramas y eventos

Solo HU00 y HU01 tienen ramas activas por historia: feature/hu00-pruebas-devops y feature/hu01-iniciar-sesion. HU02–HU17 conservan sus tareas y nombres previstos, sin crear ramas adelantadas. main conserva la entrega estable; develop integra los avances.

- Push a cualquier rama con el YAML vigente: seis categorías.
- Abrir/actualizar PR dirigido a develop o main: seis categorías sobre el resultado propuesto de integración.
- Merge: produce un push a la rama destino y repite las seis categorías.
- git pull en tu equipo descarga cambios: no es un evento de Actions. Cuando se dice pull en la revisión se interpreta como pull request.
- Un fallo en las tres verificaciones iniciales bloquea regresión; aceptación/rendimiento dependen de regresión y quedan bloqueados. No hay continue-on-error.
- Las ejecuciones históricas siguen utilizando el YAML de su propio commit. Reejecutarlas no les incorpora las pruebas actuales.

## Evidencia y artefactos

Cada job agrega resumen de alcance, commit y casos/resultados a Summary. Rendimiento incluye muestras, p95 y presupuesto. El estado del job y los logs son la fuente del resultado; un resumen escrito en always() no transforma un fallo en éxito.

En ejecuciones correctas se genera un solo artefacto, interfaz-web-pruebas, necesario para compartir la exportación entre dos máquinas; caduca en tres días. Los fallos adjuntan JUnit, HTML/trazas disponibles por siete días. Conservar enlaces al run/commit y registrar los resultados en cada tarea. [Plantilla](evidence-template.md).

## Integración real pendiente y configuración

npm run test:staging consulta el backend de pruebas real: catálogos, login de cliente, perfil y agenda. No crea cuentas/citas/pedidos ni hace estrés. Se rechaza el servidor productivo conocido. Hace falta un entorno aislado y una cuenta CLIENTE de prueba.

Variables de GitHub: STAGING_API_URL (incluye /api), STAGING_ENVIRONMENT_CONFIRMED=true. Secretos: STAGING_CLIENT_EMAIL y STAGING_CLIENT_PASSWORD. Nunca enviarlos por chat ni guardarlos en Git. [.env.test.example](../../.env.test.example) solo muestra nombres vacíos.

El paso se ejecuta en push si está configurado; no se expone a PR. Si falta configuración, el resumen indica staging pendiente, no aprobado. Si se configura y falla, integración falla y bloquea lo dependiente. El verde sin staging solo acredita HTTP local. Las consultas a una API real no prueban directamente toda la persistencia de PostgreSQL.

## Android y Google Play

[eas.json](../../eas.json) define APK interno (preview) y AAB de tienda (production). [Distribución Android](../../.github/workflows/android-release.yml) es un workflow manual distinto al pipeline de pruebas. Exige un run aprobado con los seis jobs, push del mismo commit y rama. Nunca se dispara por cada push.

Falta inicializar el proyecto EAS, android.package, firma y credenciales. El workflow falla en su puerta de configuración si faltan estos datos. Para Google Play también exige main y aprobación de staging/nativo asociada al SHA exacto. Envía solo a canal interno como borrador, no a producción. Ver [procedimiento de distribución](despliegue-android.md).

## Comprobar localmente

```bash
npm ci
npm run lint
npm run typecheck
npm run test:unit
npm run test:integration
npm run test:regression
npm run test:export
npx playwright install chromium
npm run test:acceptance
npm run test:performance
node scripts/test-summary.mjs performance
```

No cambiar type: module del proyecto solo para quitar advertencias del runner. Node 22.13.1 informa que la eliminación de tipos es experimental y detecta módulos TS sin type declarado; estas advertencias conocidas no son pruebas fallidas. Las acciones de GitHub se actualizaron a versiones actuales y Ubuntu se fija a 24.04 para evitar cambios de imagen durante la revisión.

[Observaciones, evidencias y PR aplicables](observaciones-2026-10-19.md) · [Guía para explicar el YAML](guia-pipeline.md).

Protección verificada: main y develop exigen los seis checks de GitHub Actions y PR. android-release exige aprobación manual del propietario.
