# Guía del pipeline vigente

Desde el 19/10/2026, las seis categorías se ejecutan en cada push y PR. Esta regla sustituye la separación anterior de cuatro pruebas en rama y dos adicionales en develop.

## Explicación con un ejemplo

Al subir un cambio de inicio de sesión, GitHub descarga el código e instala sus dependencias. Revisa el código, ejecuta las pruebas unitarias y comprueba la comunicación HTTP local. Si esas tres verificaciones pasan, ejecuta la regresión y exporta la interfaz. Después abre esa interfaz para aceptación y rendimiento. Si se integra el PR, el push a develop repite el proceso sobre el código integrado.

El workflow es la definición automatizada; ci.yml es el archivo YAML que lo configura. Los casos están en tests/. Un job es un bloque de trabajo y un step es un paso dentro del bloque. Cada fila en Actions es una ejecución de un commit concreto.

## Qué significa cada bloque

| Elemento | Significado |
|---|---|
| name / run-name | Nombres del workflow y de cada ejecución |
| on: push | Ejecutar al subir un cambio a cualquier rama |
| on: pull_request | Ejecutar al abrir/actualizar un PR cuyo destino sea develop o main |
| workflow_dispatch | Ejecución manual cuando el workflow está registrado en la rama predeterminada |
| permissions: contents: read | Permiso mínimo para leer el repositorio |
| concurrency | Cancela una ejecución anterior del mismo grupo si llega una actualización |
| env | Configuración del proceso; CI activa modo no interactivo y EXPO_NO_DOTENV evita .env local |
| EXPO_PUBLIC_API_URL | Dirección ficticia interceptada por Playwright; no representa integración real |
| jobs | Seis categorías de prueba |
| runs-on: ubuntu-24.04 | Máquina Linux temporal; no es un teléfono Android |
| timeout-minutes | Límite de tiempo del job |
| steps | Pasos ejecutados en orden dentro de un job |
| uses | Acción reutilizable, por ejemplo descargar código |
| with | Parámetros de una acción |
| run | Comando del proyecto |
| needs | Dependencia: continuar solo si los jobs anteriores pasaron |
| if: always() | Escribir el resumen aunque haya fallos; no cambia el resultado |
| if: failure() | Adjuntar evidencia de diagnóstico cuando hay un fallo |
| retention-days | Cuánto tiempo conservar el artefacto |

Las expresiones ${{ ... }} usan datos de GitHub, como evento, referencia o variables configuradas. En PR, branches indica la rama destino. git pull local no ejecuta Actions.

## Herramientas y comandos

- checkout descarga el commit; setup-node prepara Node.js 22.13.1.
- npm ci instala las versiones del lockfile; no genera casos de prueba.
- typecheck y lint hacen análisis estático.
- test:unit selecciona reglas puras, datos de validación y política de distribución.
- test:integration usa servidores HTTP locales. test:staging usa un entorno real separado cuando se configura; su estado se declara aparte.
- test:regression vuelve a ejecutar todos los archivos *.test.mjs. Sus casos incluyen los unitarios/integración; no sumarlos como si fueran todos distintos.
- expo export Android comprueba/genera JavaScript/Hermes; no crea APK.
- test:export genera la interfaz web controlada.
- Playwright abre esa interfaz en Chromium con viewport móvil, interactúa y comprueba resultados.
- test:acceptance cubre comportamientos de acceso y catálogo; no un teléfono físico.
- test:performance mide HU01, servicios y productos con cinco muestras por flujo. p95 debe ser menor de 5000 ms. Con cinco muestras, este p95 coincide con el valor máximo: control inicial, no estudio estadístico amplio.

## Qué significan los resultados

Verde: los pasos y casos incluidos pasaron para ese commit y entorno. Rojo: hubo un fallo. Skipped: no se ejecutó, por dependencia fallida o condición; no equivale a aprobado. Los resúmenes muestran alcance, casos, métricas y lo que falta.

El pipeline prueba datos simulados y contratos locales. Falta validar API/BD de staging, teléfono y esfuerzo. Las tareas de cada historia solo se cierran cuando se cumplen sus criterios y evidencias, no porque un job genérico esté verde.

Se registra el alcance por requerimiento (una HU), módulo (funciones relacionadas) y sprint (entrega e impacto sobre funciones previas).

## Datos y evidencia

Los datos sintéticos se guardan en tests/fixtures/mobile.json; cada caso tiene un ID. Las cuentas reales de staging van en secretos. Los casos simulados no acreditan autenticación real ni velocidad del backend.

Cada job deja un resumen en Actions → ejecución → Summary y logs. Solo se conserva la exportación web necesaria en ejecuciones correctas. Si falla, se adjuntan los reportes/trazas disponibles para diagnosticarlo. Usar evidence-template.md para enlazar las evidencias con cada tarea.

## Demostración de fallo

Un correo sin @ debe rechazarse. Si el archivo de datos dice erróneamente que es válido, el caso HU01-U04 debe fallar. Entonces regresión, aceptación y rendimiento quedan bloqueados. Restaurar la expectativa correcta y repetir debe producir seis jobs aprobados. La ejecución fallida se conserva para demostrar que el pipeline detecta un resultado incorrecto y actúa.

## Distribución

android-release.yml es un workflow opcional de distribución, no otro workflow de pruebas. Antes de generar un paquete comprueba que un push del mismo SHA y rama tiene seis jobs aprobados. También exige configurar EAS y una URL real. Para enviar un AAB como borrador interno en Play Console exige main y aprobación nativa/staging del mismo commit. No publica automáticamente por subir código.

La distribución está preparada, pero no se afirma una compilación o publicación real sin cuentas, firma y evidencia. APK es instalable; AAB es el paquete de tienda. Ninguno sustituye aceptación.

## Respuestas para la revisión

- ¿Por qué un workflow general? Las reglas son comunes; los datos/casos crecen con las historias.
- ¿Por qué siete tareas y seis jobs? Esfuerzo es manual en este proceso.
- ¿Regresión es compilar? No. Regresión comprueba comportamientos previos; exportar es adicional.
- ¿Por qué hay ejecuciones antiguas distintas? Usaron el YAML de su propio commit, antes de este estándar.
- ¿Qué evidencia mostrar? La ejecución de la revisión actual, su commit, seis jobs, resúmenes y la demostración roja conservada.
- ¿Está toda la app terminada? No. Se acredita la cobertura descrita y se mantienen pendientes las demás verificaciones.
- ¿Cómo se impide integrar con errores? main y develop tienen protección: PR obligatorio, seis checks requeridos, rama actualizada y force-push deshabilitado.

Consultar observaciones-2026-10-19.md y despliegue-android.md para la correspondencia exacta con las observaciones y las verificaciones pendientes.
