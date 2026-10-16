# Guía para explicar el pipeline y el trabajo de pruebas

## Qué representa el trabajo

Una historia de usuario describe una necesidad; por ejemplo, iniciar sesión. Sus tareas de desarrollo construyen esa función y sus siete tareas de pruebas comprueban distintos aspectos. Tener una tarea creada no significa que ya se haya ejecutado o aprobado.

El YAML es la receta de GitHub Actions. Los casos de prueba están en tests/; el YAML decide cuándo y dónde ejecutar los comandos. Un job verde demuestra que esos comandos y casos pasaron para un commit concreto, no que toda la aplicación esté terminada.

## Ramas actuales

- main: versión estable que se conservó.
- develop: reúne los avances e inicia las seis verificaciones automáticas.
- feature/hu00-pruebas-devops: infraestructura y correcciones del proceso de pruebas.
- feature/hu01-iniciar-sesion: trabajo y correcciones del acceso.
- Las ramas históricas anteriores se conservan porque contienen el desarrollo original.
- HU02–HU17 mantienen sus tareas planeadas. Sus ramas se crearán cuando se empiece a trabajar en ellas; no se necesita abrir todas al planear.

Los avances originales estaban agrupados en una rama de acceso y navegación. Renombrar o retirar referencias no divide esos commits en historias independientes ni vuelve a desarrollar las funciones. No se reconstruyó ese historial.

## Qué significan las siete pruebas

| Tipo | Pregunta que responde | Ejemplo |
|---|---|---|
| Unitaria | ¿Funciona una pieza pequeña por separado? | Rechazar un correo inválido. |
| Análisis estático | ¿Hay errores detectables sin abrir la app? | TypeScript comprueba tipos; ESLint analiza reglas del código. |
| Integración | ¿Se comunican correctamente las piezas? | Cliente de autenticación envía una petición HTTP y procesa su respuesta. |
| Regresión | ¿Lo que funcionaba sigue funcionando después del cambio? | Volver a ejecutar todos los casos existentes de acceso, catálogo y citas. |
| Aceptación | ¿Se cumple lo que necesita el usuario? | Iniciar sesión con datos válidos y mostrar error con datos incorrectos. |
| Rendimiento | ¿Cuánto tarda en responder bajo condiciones definidas? | Tiempo hasta que el catálogo es utilizable. |
| Esfuerzo | ¿Qué ocurre al exigirle condiciones extremas? | Aumentar carga en un entorno controlado y revisar errores y recuperación. |

En esta organización, esfuerzo se registra mediante un procedimiento manual en P07 y queda fuera del YAML. Puede automatizarse con otras herramientas si posteriormente se decide ampliar el proceso.

## Cómo leer .github/workflows/ci.yml

La indentación expresa qué opciones pertenecen a cada bloque. Los comentarios empiezan con #. Los textos después de name son nombres visibles; no implementan por sí mismos una prueba.

| Elemento | Significado en este proyecto |
|---|---|
| name | Nombre visible del workflow o paso. |
| on | Eventos que inician la receta. |
| push: branches: ['**'] | Ejecutar al subir cambios a cualquier rama. |
| pull_request: branches: [develop, main] | Ejecutar al abrir o actualizar una solicitud dirigida a develop o main. Son las ramas destino del PR. |
| permissions: contents: read | Dar al workflow permiso de lectura del repositorio. |
| concurrency: group | Identificar ejecuciones del mismo workflow y referencia. |
| cancel-in-progress: true | Cancelar una ejecución anterior del mismo grupo si llega otra actualización. |
| env | Variables compartidas por los jobs. |
| CI: '1' | Indicar que el comando corre en integración continua. |
| EXPO_NO_DOTENV: '1' | Evitar cargar la configuración local .env en CI. |
| EXPO_PUBLIC_API_URL | URL ficticia de pruebas; el navegador intercepta las llamadas y devuelve datos simulados. No es la API productiva. |
| jobs | Los seis bloques de trabajo automatizado. |
| runs-on: ubuntu-latest | Usar una máquina temporal Linux de GitHub. No es un teléfono Android. |
| timeout-minutes | Límite de tiempo para evitar que un job quede ejecutándose indefinidamente. |
| steps | Pasos del job, ejecutados en orden. |
| uses | Ejecutar una acción reutilizable. |
| with | Parámetros de esa acción. |
| run | Ejecutar un comando del proyecto. |
| needs | Exigir que otros jobs terminen correctamente antes de continuar. |
| if | Condición que decide si se ejecuta un job o paso. |
| if: always() | Intentar guardar reportes también cuando falló un paso previo. No convierte el fallo en éxito. |
| path | Carpeta o archivo que se subirá o descargará. |
| if-no-files-found: error | Fallar si falta el archivo de evidencia esperado. |

Las expresiones entre ${{ y }} se evalúan con datos de GitHub. github.workflow es el nombre del workflow y github.ref identifica la referencia, por ejemplo refs/heads/develop.

### Acciones y comandos

- actions/checkout: descarga el código del commit que se está comprobando.
- actions/setup-node: prepara Node.js 22.13.1, el entorno que ejecuta las herramientas del proyecto.
- cache: npm: permite reutilizar archivos descargados para acelerar la instalación; no sustituye npm ci.
- npm ci: instala las versiones fijadas en package-lock.json. Si el manifiesto y el lock no coinciden, falla.
- npm run typecheck: ejecuta TypeScript sin generar archivos de salida.
- npm run lint: ejecuta el análisis de ESLint configurado para Expo.
- npm run test:unit: ejecuta la selección de pruebas unitarias y genera JUnit.
- npm run test:integration: ejecuta el escenario con servidor HTTP local y genera JUnit.
- npm run test:regression: ejecuta todos los archivos tests/*.test.mjs y genera JUnit.
- npx expo export --platform android: comprueba y genera el paquete JavaScript/Hermes Android. No genera un APK ni prueba una instalación en teléfono.
- npm run test:export: genera la interfaz web de prueba con URL ficticia y sin leer .env.
- actions/upload-artifact: conserva reportes o archivos de una ejecución para descargarlos después.
- actions/download-artifact: recupera la exportación web del job anterior. Cada job tiene una máquina separada y no comparte su disco automáticamente.
- npx playwright install --with-deps chromium: instala el navegador y las dependencias que usarán las pruebas de interfaz.
- npm run test:acceptance: abre la interfaz y comprueba los casos de aceptación automatizados.
- npm run test:performance: mide las cargas de catálogo y comprueba el presupuesto establecido.

## Orden de los seis jobs

1. Análisis estático, unitarias e integración pueden ejecutarse en paralelo: no tienen needs entre sí.
2. Regresión tiene needs: [analisis-estatico, unitarias, integracion]. Solo continúa si los tres pasan. Ejecuta la suite completa y comprueba la exportación Android y web.
3. Aceptación y rendimiento necesitan regresión y pueden ejecutarse en paralelo cuando esta termina.
4. Ambos tienen esta condición:

```yaml
if: github.event_name == 'push' && github.ref == 'refs/heads/develop'
```

&& significa que se deben cumplir ambas condiciones: tiene que ser un push y su rama debe ser develop. El merge de un PR a develop provoca ese push. La condición también se cumpliría con un push directo a develop; no verifica por sí sola que hubo PR.

Por eso en una rama de historia o en un PR aparecen cuatro jobs ejecutados y dos skipped. Skipped significa omitido por la condición, no aprobado. Después de integrar a develop se ejecutan los seis.

## Qué se puede demostrar actualmente

- Análisis estático: TypeScript y ESLint pasan.
- Unitarias: cuatro casos seleccionados.
- Integración: un escenario con varias verificaciones de HTTP local; no conecta PostgreSQL.
- Regresión: 32 casos en total, incluidos los unitarios y la integración. No se deben sumar como si fueran 37 casos diferentes.
- Aceptación: cinco casos de acceso y catálogos/detalles, con navegador en tamaño móvil y API simulada.
- Rendimiento: dos casos, servicios y productos. Cada uno recoge cinco tiempos y exige p95 menor de 5000 ms.
- Con cinco muestras, el p95 calculado coincide con el mayor tiempo de esas cinco. Es un control inicial, no un estudio estadístico amplio.
- El navegador utiliza viewport Pixel 7. Esto no demuestra funcionamiento o rendimiento en un Pixel físico ni en iOS.
- Falta completar casos de funciones futuras, pruebas nativas, integración con API/base de datos de staging y esfuerzo manual.

La evidencia debe relacionar caso, HU, commit, entorno, entrada, resultado esperado, obtenido y reporte. Se descarga desde Actions → ejecución → Artifacts. Un fallo debe generar una incidencia y después una repetición del caso corregido.

## Alcance de requerimiento, módulo y sprint

- Requerimiento: comprobar una historia y sus criterios concretos.
- Módulo: recorrer juntas funciones relacionadas, por ejemplo entrar, reservar y consultar la cita.
- Sprint: revisar la entrega de ese periodo y repetir pruebas de las funciones anteriores para detectar regresiones.

No son tres pruebas adicionales. Son distintos alcances de aplicación de las pruebas. Una ejecución compartida puede enlazarse desde varias historias si realmente cubre sus casos.

## Preguntas que conviene poder responder

1. ¿Por qué un solo YAML? Porque todas las historias comparten las mismas herramientas y reglas; los casos se agregan a las suites al desarrollar cada historia.
2. ¿Por qué hay siete tareas y seis jobs? Porque esfuerzo se ejecuta manualmente en este proceso; sus pasos y resultados siguen siendo obligatorios en P07.
3. ¿Compilar equivale a regresión? No. Compilar verifica que se puede generar el paquete; regresión ejecuta casos para comprobar que no se rompieron comportamientos.
4. ¿Generar un APK equivale a aceptación? No. El APK es un archivo instalable; aceptación necesita ejecutar y comprobar los criterios del usuario.
5. ¿Qué pasa si falla un job inicial? Regresión queda bloqueada y los jobs dependientes no continúan. Hay que revisar el log, corregir y subir otro commit.
6. ¿Por qué acceptance y performance no corrieron en mi rama? Porque están condicionados al push a develop.
7. ¿Ya están terminadas todas las historias? No. Las tareas organizan el trabajo y las ejecuciones acreditan solo su cobertura real.
8. ¿Por qué usar API simulada? Para repetir los casos sin depender de datos o disponibilidad de producción. Es necesario complementar esto con staging para probar integración real.
9. ¿El pipeline impide un merge incorrecto? Solo si se configuran protecciones de rama. El plan actual de este repositorio privado no permite habilitarlas; por eso se revisan los checks antes de integrar.
10. ¿Dónde está la evidencia? En los reportes JUnit/HTML y trazas guardados como artefactos, y en las tareas con sus registros de ejecución.
11. ¿Qué es DevOps aquí? Mantener código, planeación, pruebas y evidencias conectados: cambiar, subir, verificar, corregir e integrar continuamente.

## Cómo continuar con una historia

Seleccionar una historia, crear su rama desde develop cuando empiece el trabajo, implementar sus cambios y casos, subirlos, revisar los cuatro checks, abrir PR hacia develop y revisar antes de integrar. Después revisar los seis jobs y complementar las evidencias manuales. No cerrar la historia si faltan sus criterios, aunque el pipeline esté verde.

Referencias: [sintaxis oficial de GitHub Actions](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax) y [artefactos de ejecución](https://docs.github.com/en/actions/concepts/workflows-and-actions/workflow-artifacts).
