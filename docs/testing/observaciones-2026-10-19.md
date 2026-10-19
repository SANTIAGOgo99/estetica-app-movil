# Atención de observaciones de pruebas — 19/10/2026

Esta revisión atiende la lista docente del 16/10/2026. Es el estándar vigente; el informe del día 16 es histórico y no se utiliza para afirmar pruebas nuevas.

| Observación | Corrección y evidencia | Límite pendiente |
|---|---|---|
| Tipo y alcance | Comentarios en cada job y resúmenes automáticos por ejecución; matriz de herramientas y cobertura | Ampliar casos al implementar historias futuras |
| Datos de prueba | JSON versionado con IDs, cliente/catálogo ficticios y presupuesto; usado por unitarias y navegador | Cuenta y datos de staging real |
| Estandarización por push/merge/pull | Seis jobs en cada push y PR; merge produce otro push; mismo archivo general | Los commits anteriores conservan su YAML anterior |
| Tipo documentado en YAML | Tipo, HU/módulo/sprint y entorno indicados junto a cada job | No confundir simulación con integración real |
| APK y Google Play después de pruebas | eas.json con perfiles APK/AAB, workflow manual con puerta de seis checks del mismo SHA y política probada | Inicializar EAS, firma, cuenta Play Console, pruebas nativas y staging; no hay publicación acreditada |
| Comentarios de resultados | Acciones actualizadas a versiones actuales; Ubuntu 24.04 fijo; fallos no se ocultan; advertencias conocidas de Node 22 documentadas | Reevaluar warnings/dependencias cuando cambie SDK o entorno |
| Pipeline actúa según el resultado | needs bloquea dependientes; política de distribución rechaza fallos/evidencia antigua; demostración de dato incorrecto y posterior corrección | No aprobar manualmente una historia sin evidencia específica |
| Minimizar artefactos | Un artefacto web compartido en ejecuciones correctas; resúmenes/métricas en Summary; diagnóstico solo ante fallos | Descargar evidencias necesarias antes de que caduquen |
| Coincidir con la planeación | Herramientas, eventos, datos y alcances actualizados en matriz y tareas; estados según evidencia, no todos terminados | Esfuerzo/nativo/staging siguen pendientes |

## PR y ejecuciones que corresponden

| PR | Qué acredita | ¿Aplica al estándar actual de seis jobs en cada evento? |
|---|---|---|
| #1 | Documentación inicial | No; histórico |
| #2 | Configuración inicial TypeScript | No; histórico |
| #106 | CI inicial, dirigido a main | No; sus commits ya están en develop y su configuración fue sustituida |
| #107 | Avances de acceso/catálogo, dirigido a main | No como evidencia del pipeline vigente; sus avances ya forman parte de develop |
| #157 | Primera organización con seis categorías y separación cuatro/dos | Antecedente; no cumple la nueva regla de seis en cada evento |
| #235 | Ajuste de ramas activas y guía anterior | Antecedente; todavía usaba cuatro/dos |
| PR de esta revisión | Estándar seis por evento, datos, resúmenes, medición HU01 y distribución condicionada | Sí, una vez aprobadas sus verificaciones; consultar sus Checks y el push de merge |

Un título que empieza por Merge pull request no determina la rama del run. Mirar Branch, evento, SHA y YAML de esa ejecución. No reejecutar commits antiguos para intentar que incorporen un archivo nuevo.

## Resultados locales

- Análisis estático: ejecutar lint y typecheck antes de entregar.
- Unitarias: 16 casos, incluidos datos HU01, sesión y política de distribución.
- Integración: dos escenarios HTTP locales, sin PostgreSQL real.
- Regresión: 45 casos acumulados; incluye unitarias/integración, no sumar nuevamente.
- Aceptación web: cinco escenarios; el de sesión incluye restauración y cierre.
- Rendimiento web: tres escenarios, HU01/HU02/HU04; cinco muestras y presupuesto de 5000 ms.
- Los resultados definitivos se verifican en las ejecuciones del PR y del merge. Los números describen casos implementados, no aprobación de todas las historias.

## Cómo comprobar la corrección

1. Abrir Code → seleccionar develop → .github/workflows/ci.yml. Ver seis jobs y ausencia del filtro que omitía aceptación/rendimiento fuera de develop.
2. En Actions abrir el push o PR de esta revisión. Comprobar rama, commit y evento, seis jobs aprobados y resúmenes de alcance/casos.
3. Abrir el resumen de rendimiento y revisar HU01, muestras, p95 y presupuesto. No presentarlo como velocidad del backend real.
4. Consultar la demostración negativa conservada: HU01-U04 falla si se exige aceptar un correo inválido. Regresión y los jobs dependientes quedan bloqueados.
5. Consultar la ejecución corregida posterior: debe pasar el dato restaurado y ejecutar las seis categorías.
6. Abrir Artifacts: una ejecución correcta debe tener solo interfaz-web-pruebas; la fallida adjunta el diagnóstico disponible.
7. En Projects, abrir HU00/HU01 y sus tareas: revisar enlace a evidencia, herramientas y pendientes. En revisión no significa aceptación final de la docente.
8. Para distribución, revisar despliegue-android.md y release.unit.test.mjs. Su configuración/política no acredita APK/AAB generado ni Google Play publicado.

## Condiciones para completar lo pendiente

Confirmar si existen cuentas en expo.dev y Play Console. Preparar backend y base de datos de pruebas aislados; configurar variables/secretos sin publicarlos. Ejecutar aceptación en teléfono y esfuerzo manual, registrar el SHA comprobado y después autorizar la distribución. No sustituir este proceso por pruebas de carga en producción.
