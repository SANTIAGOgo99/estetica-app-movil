# Evidencias de la Actividad 6

Evaluación real del 24 de noviembre de 2026. [Informe técnico completo](../../actividad6-rendimiento.md). [Tabla de resultados](comparison.md). [Vista HTML](results.html). [Muestras CSV](samples.csv). [Estadísticas CSV](summary.csv).

La fuente de aplicación evaluada coincide con el commit `35755d883bf111ab3596c30c2da9520cf7cecde5`, liberado en la Actividad 5. El checkout documental es `5fade8e62ad6adadb86b5684ff854962a6d7b6bb`; la rama de trabajo es `codex/actividad6-rendimiento`. No se creó otro APK.

## Qué respalda cada evidencia

| Prueba o control | Evidencia primaria | Vista o captura |
|---|---|---|
| Diagnóstico local/remoto y herramientas | [diagnostic.json](diagnostic.json), [conditions.json](conditions.json) | No contiene números de serie, IP, MAC ni SSID |
| CI del mismo commit liberado | [ci-released-commit.json](ci-released-commit.json), [ci-performance-extract.log](ci-performance-extract.log) | [Job de rendimiento](https://github.com/SANTIAGOgo99/estetica-app-movil/actions/runs/45321572186/job/138206835483) |
| Exportación con URL correcta | [web-export-verification.json](web-export-verification.json), [export-live.log](export-live.log), [export-mock.log](export-mock.log) | Hashes distintos de los bundles real/simulado |
| 20 consultas reales de servicios y 20 de productos | [api.json](api.json), [api-execution.log](api-execution.log), [api-phase-summary.json](api-phase-summary.json) | [results.png](results.png) |
| 20 aperturas web con backend real configurado | [web.json](web.json), [web-execution.log](web-execution.log) | [web-inicio.png](web-inicio.png) |
| 20 catálogos reales por tipo | [web.json](web.json) | [Servicios](web-services.png), [productos](web-products.png) |
| 20 clicks de catálogo a detalle por tipo | [web.json](web.json) | [Detalle servicio](web-services-detail.png), [detalle producto](web-products-detail.png) |
| 20 accesos y 20 consultas de horarios con API simulada | [controlled-playwright.json](controlled-playwright.json) | [Horarios simulados](web-mock-disponibilidad.png) |
| Repetición local de tres pruebas originales de cinco muestras | [existing-playwright.json](existing-playwright.json) | Adjuntos JSON de medición dentro del reporte |
| 20 arranques del APK liberado en Samsung SM-A515F Android 13 | [android.json](android.json), [android-status.json](android-status.json), android-raw-01.log hasta android-raw-20.log | [Inicio del APK liberado](android-inicio-apk-liberado.png) |
| PSS y CPU de esos mismos veinte arranques | [android-derived.json](android-derived.json) y veinte logs crudos | CPU derivada desde la segunda actualización de top; no sustituye logs |
| Estabilidad nativa limitada al lote | [android-exit-reasons.log](android-exit-reasons.log) | Solo las 16 salidas más recientes disponibles; force-stop del protocolo |
| Estadística y comparación | [summary.json](summary.json), [summary.csv](summary.csv), [samples.csv](samples.csv), [comparison.md](comparison.md) | [results.html](results.html), [results.png](results.png), [gráfica PNG](p95-budget.png), [gráfica SVG](p95-budget.svg) |
| Comprobaciones finales | [validation.json](validation.json), [local-checks.json](local-checks.json), [lint.log](lint.log), [typecheck.log](typecheck.log) | Logs vacíos significan ausencia de diagnósticos; revisar códigos de salida en local-checks.json |
| Integridad | [SHA256SUMS.txt](SHA256SUMS.txt) | Hash por archivo de esta carpeta, excepto el manifiesto mismo |

La tabla y la gráfica se generan desde los JSON: son visualizaciones derivadas, no capturas del runner de Actions. Las capturas de la app corresponden a pantallas realmente ejecutadas. La gráfica usa escala relativa al presupuesto de cada flujo; no sirve para comparar milisegundos absolutos entre barras sin leer sus etiquetas.

El archivo `samples.csv` contiene una fila por métrica y repetición. TTFB y tiempo total provienen de la misma solicitud; inicio, PSS y CPU provienen del mismo lanzamiento. No se deben sumar como ensayos independientes.

## Hallazgos y límites que deben acompañar las capturas

- API real de servicios: p95 total 2295.20 ms y p95 TTFB 2293.16 ms; incumple presupuestos de 2000 y 1500 ms. HTTP y contrato: 40/40 respuestas correctas entre ambos catálogos.
- Web real: todas las operaciones funcionaron; se conservan un catálogo de servicios de 6801.81 ms y una navegación a detalle de producto de 2194.51 ms fuera de sus presupuestos individuales. Los cinco flujos aprueban p95.
- Android real: p95 de Activity Manager 706 ms, PSS 121.95 MiB y CPU 9 % de un núcleo. Inicio no significa contenido React listo. CPU máxima 10 %, con 19/20 lecturas estrictamente menores a 10 %.
- El teléfono tenía batería inicial 4 %, carga USB y ahorro de energía activado al consultar después del lote. No se generaliza a batería/carga habituales.
- Acceso y horarios solo se midieron con fixtures. No se usaron credenciales reales ni se crearon citas.
- Se conservan tres diferencias TCP negativas de curl en los crudos; se excluyen únicamente de la estadística de esa fase, con conteo explícito. No hay tiempo puro de procesamiento del servidor.

## Reproducción sin reemplazar esta línea base

Ejecutar desde la raíz del repositorio con la fuente liberada. Se requiere Node 22.13.1, dependencias del lockfile instaladas, curl y acceso de lectura al backend. No se necesita ejecutar EAS Build. Los scripts rechazan diferencias en la fuente evaluada frente al commit liberado.

Usar otra carpeta de salida para conservar intactos los resultados originales:

```powershell
$env:ACTIVITY6_OUT = 'output/actividad6-repeticion'
New-Item -ItemType Directory -Force -Path $env:ACTIVITY6_OUT | Out-Null
$env:PLAYWRIGHT_BROWSERS_PATH = Join-Path (Get-Location) 'tmp/actividad6-browsers'
$env:EXPO_NO_DOTENV = '1'
$env:EXPO_NO_TELEMETRY = '1'
$env:CI = '1'
node node_modules/@playwright/test/cli.js install chromium --only-shell
node scripts/activity6/measure.mjs diagnose
```

Exportación y pruebas simuladas, antes de medir la web real:

```powershell
node scripts/export-test-web.mjs
node node_modules/@playwright/test/cli.js test performance.spec.ts --reporter=json --output=tmp/activity6-existing-output > "$env:ACTIVITY6_OUT/existing-playwright.json"
node node_modules/@playwright/test/cli.js test --config=scripts/activity6/playwright.config.ts
```

API real y web real; ejecutar secuencialmente y esperar a que cada comando termine. No iniciar otro generador de carga contra producción. La exportación usa `--clear` para evitar reutilizar la URL simulada:

```powershell
node scripts/activity6/measure.mjs api
$env:EXPO_PUBLIC_API_URL = 'https://esteticaa-backend-five.vercel.app/api'
node node_modules/expo/bin/cli export --platform web --clear --output-dir tmp/actividad6-web-live
node scripts/activity6/measure.mjs web
```

El script web usa localhost:5173 por el origen autorizado por el backend. El puerto debe estar libre. El script de pruebas simuladas usa 4173. No cambiar CORS ni protecciones para resolver conflictos de puertos. Verificar que el bundle real contenga el dominio productivo y no api.example.test antes de medir.

Android requiere un teléfono de pruebas desbloqueado, conectado por USB, con depuración autorizada y sin interacción durante el lote. El APK de esta actividad se conserva localmente en `output/cd-review/release-cd8bb15d/estetica-clientes-35755d883bf1-cd8bb15d-b39e-4c9a-a0be-68dad9cfa0b3.apk`. En otro equipo debe descargarse el [APK ya liberado](https://expo.dev/artifacts/eas/FWkL1mHZGJY0pdhgCkO64PRReILJp0IublyBCc5H7Lk.apk) a esa ruta y verificar el SHA-256 indicado en el informe; no generar uno nuevo. Ajustar ADB_PATH si cambia la instalación del SDK.

```powershell
node scripts/activity6/android.mjs
```

Si el paquete no está instalado o tiene otro hash, se necesita instalar exactamente el APK liberado, preservando datos. El siguiente comando lo hace; si la firma impide actualizar, el script falla sin desinstalar ni borrar información:

```powershell
node scripts/activity6/android.mjs --install-released
```

Para recalcular estadísticas de un lote nuevo se necesitan sus JSON de API/web/Playwright/Android y el antecedente CI recuperado. Copiar únicamente el antecedente (no muestras actuales) y ejecutar:

```powershell
Copy-Item 'docs/evidence/actividad6-rendimiento/ci-released-commit.json' "$env:ACTIVITY6_OUT/ci-released-commit.json"
node scripts/activity6/summarize.mjs
node scripts/activity6/capture.mjs
```

`write-report.mjs` genera el informe específico de esta línea base y contiene su contexto histórico: no reutilizarlo sin revisar condiciones, fechas y hallazgos de otro lote. `capture.mjs --android-only` captura la pantalla nativa únicamente si verifica controles de inicio público. El capturador de esta ejecución no guardó árboles UI ni pantallas con una sesión personal.

Las mediciones reales de login, perfil y agenda necesitan staging aislado y una cuenta CLIENTE de pruebas autorizada. Guardar configuración/credenciales fuera de Git y del chat. No completar esa parte con cuentas de clientes reales.
