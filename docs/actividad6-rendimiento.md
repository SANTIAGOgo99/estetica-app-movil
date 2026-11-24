# Actividad 6 Evaluación del rendimiento de Estética Clientes

Materia: Gestión del Proceso de Desarrollo de Software. Tercer parcial. Rúbrica RU-TI-GPDS-10-P3-06. Fecha de evaluación: 24 de noviembre de 2026, zona America/Mexico_City. Este informe técnico y su carpeta de evidencias son insumos para el documento académico; no incluyen portada ni formato Word.

La evaluación detectó variabilidad en el endpoint público de servicios: p95 de 2295.20 ms frente al presupuesto de 2000 ms, con 18/20 muestras bajo el límite. Las 40 consultas devolvieron HTTP 200 y catálogos válidos. Se ejecutaron pruebas web con backend real, pruebas de interfaz con API simulada y mediciones del APK liberado en un teléfono físico. Cada alcance se presenta por separado.

## 1 Objetivo de la evaluación del rendimiento

Determinar si Estética Clientes ofrece tiempos de espera y consumo de recursos compatibles con la consulta de servicios y productos del negocio Ezequiel Castillo Ángeles Hair Designer. Se seleccionan métricas reproducibles, se comparan con presupuestos fijados antes de medir y se formula un plan de mejora sustentado en los hallazgos. Esta evaluación continúa la liberación controlada de la Actividad 5 sin cambiar funcionalidades ni aplicar optimizaciones.

## 2 Estado actual del proyecto y pruebas existentes

El repositorio remoto es [SANTIAGOgo99/estetica-app-movil](https://github.com/SANTIAGOgo99/estetica-app-movil). La inspección remota mediante git ls-remote confirmó develop en 35755d883bf111ab3596c30c2da9520cf7cecde5, main en 79ad3affa3f36146cfdde5a5a0a6c8c6d6a645b2 y la rama documental en 5fade8e62ad6adadb86b5684ff854962a6d7b6bb. El historial inmediato contiene la liberación, su corrección del secreto de Expo y el registro de evidencias. Se creó la rama local codex/actividad6-rendimiento desde la rama documental; main y develop conservan sus referencias.

La fuente de aplicación, assets, dependencias declaradas, lockfile, configuración Expo/EAS, tests y configuración Playwright se compararon contra el SHA liberado sin diferencias. El checkout es 5fade8e62ad6adadb86b5684ff854962a6d7b6bb, con cambios documentales respecto del SHA de liberación. Los scripts nuevos permanecen en scripts/activity6 y no forman parte del código móvil. Se conservaron los cinco archivos no versionados previos del usuario.

Se inspeccionaron playwright.config.ts, tests/browser/performance.spec.ts, fixtures.ts, mobile.json, los scripts de exportación/servidor/catálogos y ambos workflows de Actions. La suite existente mide cinco muestras para HU01, HU02 y HU04 con Pixel 7 emulado en Chromium y API simulada. El presupuesto original es p95 < 5000 ms. No equivale a Android nativo ni a PostgreSQL real.

Se consultaron en GitHub los jobs y logs del [run 45321572186, intento 2](https://github.com/SANTIAGOgo99/estetica-app-movil/actions/runs/45321572186/attempts/2), correspondiente al SHA liberado: seis categorías aprobadas y liberación interna aprobada. La integración con staging fue omitida por falta de configuración; el verde no acredita operaciones autenticadas reales. Los p95 del job de rendimiento fueron servicios 270.5 ms, productos 215.1 ms y acceso 89.6 ms. Las muestras del log están redondeadas a 0.1 ms. El archivo de octubre ofrece otro antecedente, con p95 de 1936.97, 1350.04 y 764.13 ms, respectivamente; no se usa para afirmar una tendencia porque cambian fecha, código y entorno.

El YAML de rendimiento conserva los reportes completos como artefactos solo en fallo. Su resumen sí imprime muestras en ejecuciones correctas; de ahí se recuperó la evidencia del mismo SHA. La limitación de conservación se incluye en el plan. No se disparó otra liberación ni se cambiaron protecciones o workflows.

## 3 Métricas seleccionadas definiciones y justificación

Los umbrales son presupuestos propuestos para esta actividad, fijados en [protocol.json](../scripts/activity6/protocol.json) antes de ejecutar los lotes. Conservan 5000 ms para catálogos/acceso de la suite existente. No constituyen SLA del negocio, límites oficiales de Expo ni criterios normativos de Android. Para latencia se exige p95 estrictamente menor al umbral; se muestra además la proporción de muestras que cumplen. El éxito funcional objetivo es 100 %.

| Métrica | Qué mide y por qué importa | Cálculo y unidad | Presupuesto |
|---|---|---|---|
| Apertura web utilizable | Espera para poder elegir servicios desde inicio | reloj monotónico desde page.goto hasta botón visible; ms | p95 < 5000 ms |
| Consulta de catálogos web | Espera hasta que el primer artículo sea visible y seleccionable | inicio de navegación hasta botón Ver artículo; ms | p95 < 5000 ms |
| Navegación catálogo a detalle | Respuesta al tocar un servicio o producto | antes de click hasta encabezado del artículo visible; ms | p95 < 2000 ms |
| Acceso con API simulada | Tiempo de interfaz tras enviar credenciales ficticias | antes de click hasta pantalla de cliente; ms | p95 < 5000 ms |
| Disponibilidad con API simulada | Tiempo de interfaz tras elegir una fecha | antes de click hasta horario disponible visible; ms | p95 < 2000 ms |
| Latencia total API | Espera completa para obtener un catálogo real | curl time_total × 1000; incluye DNS, conexión, TLS, red y servidor; ms | p95 < 2000 ms |
| Tiempo al primer byte API | Espera hasta comenzar a recibir respuesta | curl time_starttransfer × 1000; ms | p95 < 1500 ms |
| Fases de transporte | Ayuda a localizar en qué tramo se acumula la espera | DNS acumulado, diferencias TCP/TLS y descarga; ms | Diagnóstica, sin SLA independiente |
| Inicio nativo con proceso detenido | Tiempo de lanzamiento informado por Activity Manager | am start -W TotalTime tras force-stop; ms | p95 < 3000 ms |
| Memoria nativa PSS | Peso proporcional del proceso en RAM | TOTAL PSS de dumpsys meminfo en KiB / 1024; MiB | p95 < 250 MiB |
| CPU nativa en reposo | Actividad del proceso sin interacción | segunda actualización de top, intervalo de 1 s, tras espera de 5 s; porcentaje de un núcleo | p95 < 10 % de un núcleo |
| Éxito y errores | Que la rapidez corresponda a operaciones correctas | éxitos / intentos × 100; HTTP, catálogo válido, visibilidad y procesos activos | 100 % de éxito; 0 errores JS |
| Estabilidad Android observada | Detecta cierres durante el lote | proceso vivo al final de cada muestra y razones recientes de salida; eventos | 0 cierres inesperados observados; alcance limitado |

Promedio = suma de valores / n. Mínimo y máximo son los extremos observados. p95 se calcula ordenando las muestras y tomando el rango ceil(0.95 × n), con posiciones desde 1: posición 19 para n = 20 y posición 5 para n = 5. Por ello el p95 de cinco muestras coincide con el máximo. Cumplimiento de latencia = muestras correctas con valor < presupuesto / intentos × 100. Se utiliza desviación estándar poblacional para describir el lote, rango = máximo − mínimo y coeficiente de variación = desviación / promedio × 100. No se estiman intervalos de confianza con este tamaño de muestra.

## 4 Metodología y herramientas utilizadas

Se ejecutaron lotes pequeños, secuenciales dentro de cada herramienta, sin carga agresiva. No hubo descarte de primeras muestras, calentamientos excluidos, reintentos para mejorar tiempos ni eliminación de valores extremos. Cada repetición conserva su resultado. Las respuestas de API real se validan como arreglos no vacíos con identificadores y nombres de artículos; los cuerpos no se incorporan a la evidencia.

Herramientas: Node.js v22.13.1, TypeScript, ESLint/Expo lint, Expo CLI del SDK 57.0.33, Playwright 1.64.1, Chromium 156.0.8078.4, curl 8.21.0 con Schannel, Git/GitHub Actions y Android SDK Platform Tools con ADB. Los scripts usan las dependencias existentes; únicamente se descargó el navegador compatible de Playwright en tmp. No se agregaron dependencias de aplicación.

Playwright ejecuta Chromium con descriptor Pixel 7, viewport 412 × 839, escala 2.625, toque habilitado, locale es-MX y zona America/Mexico_City. En el lote real, cada repetición de apertura/catálogo usa un contexto nuevo y los detalles se abren mediante click desde el catálogo de esa misma repetición. El proceso Chromium se comparte; no se llama inicio frío nativo a esta apertura web. Los mocks usan respuestas locales controladas, sin simular retardos de red.

curl abre un proceso/conexión por solicitud, intercala servicios y productos y espera 1200 ms después de cada respuesta. La concurrencia de curl es 1. Playwright bloquea solicitudes reales distintas de GET, HEAD y OPTIONS, espera 1200 ms entre catálogo/detalle y entre contextos y se detiene ante 429/503. El reloj web incluye el control de Playwright y sus esperas automáticas; no es una medición aislada de CPU React.

En Android se verificó SHA-256 del APK local y del base.apk recuperado del teléfono después de instalar el APK liberado con adb install -r. Cada repetición detiene el proceso, lanza MainActivity con am start -W, espera 5 s, consulta memoria y obtiene dos actualizaciones de top. Se conserva la segunda. No se borraron datos ni cachés de disco. No se inició sesión, confirmó una cita ni modificó información productiva.

## 5 Ambiente y condiciones de evaluación

| Elemento | Condición registrada |
|---|---|
| Aplicación | Estética Clientes 1.0.0; Expo 57.0.33; React Native 0.86.3; versionCode Android 1 |
| Fuente evaluada | 35755d883bf111ab3596c30c2da9520cf7cecde5; igualdad del código verificada desde checkout documental |
| Host | Windows 10.0.26200; Intel Core i5-10210U; 8 procesadores lógicos; 16,942,501,888 bytes RAM total; 3,374,956,544 libres en diagnóstico |
| Red host | Wi-Fi Realtek 8822CE; enlace negociado 300 Mbps; sin throttling. No mide throughput a Internet ni radio celular |
| Web real | Exportación optimizada de la fuente liberada servida en http://localhost:5173; API productiva pública real |
| Web simulada | Exportación de pruebas en http://127.0.0.1:4173; https://api.example.test/api interceptada por fixtures |
| Caché web | Contextos nuevos para apertura/catálogos; servidor no-store; routing Playwright desactiva caché HTTP; proceso de navegador compartido |
| API real | https://esteticaa-backend-five.vercel.app/api; GET /services/active y GET /products/active; HTTP/1.1 |
| Teléfono | Samsung SM-A515F, Android 13/API 33; pantalla física 1080 × 2400; conectado por USB |
| Energía teléfono | Batería inicial 4 %, cargando por USB, 27.1 °C; low_power = 1 consultado tras el lote; no se alteraron ajustes |
| APK | Build cd8bb15d-b39e-4c9a-a0be-68dad9cfa0b3; mismo archivo liberado, 92,061,167 bytes |
| SHA-256 APK | 0c4152abe89972016a49fd1abf9087dfe9fefec409b70cfc22548259986bdf42 |

Ventanas verificables: API 24 nov 2026, 12:55:58 a 24 nov 2026, 12:57:39; muestras nativas 24 nov 2026, 12:56:10 a 24 nov 2026, 12:59:15; web real 24 nov 2026, 12:58:36 hasta 24 nov 2026, 13:03:20. Los JSON conservan hora UTC con Z; estas horas se expresan en Ciudad de México. El diagnóstico inicial encontró ADB sin dispositivos y emulador sin AVD; después el usuario conectó y autorizó el teléfono. Se instaló el APK liberado porque el anterior del teléfono tenía otro hash.

Las pruebas nativas se solaparon con parte del lote simulado y curl, en dispositivos distintos. curl terminó antes de comenzar el lote web real. Hubo actividad normal del host y un intento de generar capturas durante el lote web; las muestras se conservaron. Son condiciones de escritorio observadas, no un laboratorio de hardware dedicado.

## 6 Procedimiento ejecutado

1. Leer requisitos, AGENTS.md y package.json; consultar documentación vigente del SDK 57, Expo CLI, Playwright, curl y Android.
2. Revisar estado Git local/remoto, historial, scripts, workflows, resultados históricos y disponibilidad de herramientas; crear la rama independiente conservando los archivos previos.
3. Consultar los jobs/logs de Actions del mismo SHA de liberación y conservar el extracto de muestras de rendimiento.
4. Fijar presupuestos y 20 repeticiones en protocol.json. Exportar web para fixture y backend real. Verificar en los bundles la URL objetivo y sus hashes: la exportación real se repitió con --clear porque inicialmente Metro reutilizó una transformación con la URL simulada. Esa exportación inicial no se usó para las mediciones reales.
5. Ejecutar nuevamente las tres pruebas existentes, cinco muestras cada una. Además ejecutar 20 accesos y 20 selecciones de fecha con respuestas simuladas. No confirmar citas.
6. Realizar 20 GET de servicios y 20 de productos mediante curl. Registrar HTTP, validez, cantidad de artículos, tiempos de transporte, primer byte y total. Las solicitudes terminaron sin activar la regla de detención.
7. Detectar el teléfono autorizado; verificar e instalar el APK de la Actividad 5; confirmar el hash instalado. Ejecutar 20 lanzamientos, 20 lecturas PSS y 20 lecturas CPU en esos mismos lanzamientos; conservar registros crudos. Capturar únicamente inicio público tras comprobar que muestra Iniciar sesión.
8. En Chromium móvil, medir 20 aperturas, 20 consultas de servicios, 20 de productos y 20 transiciones a cada tipo de detalle. Capturar pantallas reales, errores JavaScript y respuestas API. Bloquear operaciones de escritura.
9. Calcular estadísticas y CSV desde las fuentes; generar tablas, gráfica y vista HTML; verificar valores y ejecutar lint/typecheck. No aplicar cambios de optimización.

## 7 Resultados reales de las mediciones

La siguiente tabla combina métricas de distintos alcances, identificados por nombre de flujo. Todas las duraciones están en ms salvo PSS en MiB y CPU en porcentaje de un núcleo. Cada flujo nuevo tiene 20 muestras. Las filas existing-HU corresponden a cinco muestras locales de la suite original.

| Flujo | n | Promedio | Mínimo | Máximo | p95 | Umbral | Cumplimiento | Evaluación |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| api-services-total (ms) | 20 | 986.01 | 623.08 | 3813.37 | 2295.20 | < 2000 | 90.00 % | No cumple |
| api-services-ttfb (ms) | 20 | 983.24 | 622.37 | 3807.06 | 2293.16 | < 1500 | 90.00 % | No cumple |
| api-products-total (ms) | 20 | 747.23 | 651.27 | 950.16 | 938.05 | < 2000 | 100.00 % | Cumple p95 |
| api-products-ttfb (ms) | 20 | 744.93 | 650.47 | 949.27 | 937.22 | < 1500 | 100.00 % | Cumple p95 |
| web-open (ms) | 20 | 1177.81 | 1006.56 | 1305.30 | 1267.50 | < 5000 | 100.00 % | Cumple p95 |
| web-services (ms) | 20 | 2478.68 | 1731.80 | 6801.81 | 4019.49 | < 5000 | 95.00 % | Cumple p95 |
| navigation-services-detail (ms) | 20 | 1029.61 | 621.61 | 1389.18 | 1344.12 | < 2000 | 100.00 % | Cumple p95 |
| web-products (ms) | 20 | 2215.47 | 1729.93 | 3507.46 | 2737.26 | < 5000 | 100.00 % | Cumple p95 |
| navigation-products-detail (ms) | 20 | 1077.67 | 604.33 | 2194.51 | 1693.37 | < 2000 | 95.00 % | Cumple p95 |
| mock-login (ms) | 20 | 285.14 | 218.25 | 435.16 | 341.25 | < 5000 | 100.00 % | Cumple p95 |
| mock-availability (ms) | 20 | 185.97 | 139.61 | 322.35 | 215.51 | < 2000 | 100.00 % | Cumple p95 |
| existing-HU02 (ms) | 5 | 1353.00 | 1094.01 | 1870.94 | 1870.94 | < 5000 | 100.00 % | Cumple p95 |
| existing-HU04 (ms) | 5 | 1413.76 | 1149.68 | 2129.61 | 2129.61 | < 5000 | 100.00 % | Cumple p95 |
| existing-HU01 (ms) | 5 | 374.14 | 288.32 | 596.97 | 596.97 | < 5000 | 100.00 % | Cumple p95 |
| android-process-start (ms) | 20 | 644.50 | 435.00 | 2284.00 | 706.00 | < 3000 | 100.00 % | Cumple p95 |
| android-pss (MiB) | 20 | 122.63 | 114.49 | 166.58 | 121.95 | < 250 | 100.00 % | Cumple p95 |
| android-idle-cpu (% de un núcleo) | 20 | 6.70 | 5.00 | 10.00 | 9.00 | < 10 | 95.00 % | Cumple p95 |


Las 40 respuestas curl fueron HTTP 200, sin errores de transporte; los servicios devolvieron 11 artículos y los productos 17. El éxito funcional de API fue 100 %. En web real hubo 100 operaciones, 0 fallos de visibilidad, 0 errores JavaScript y 0 solicitudes API fallidas/HTTP ≥ 400. Se registraron 80 respuestas/eventos API y 0 intentos bloqueados de escritura. Los lotes simulados aprobaron sus aserciones; esto no acredita login ni agenda productivos.

Android mantuvo el proceso activo en 20/20 muestras. El buffer reciente de exit-info contiene 16 salidas USER REQUESTED/FORCE STOP producidas por el protocolo, sin motivos de crash/ANR en esas entradas. No se calcula una tasa de fallos por hora ni se asegura ausencia de eventos fuera de esa ventana. El APK instalado coincidió por hash con el liberado.

Variación descriptiva de los lotes:

| Flujo | Desviación estándar poblacional | Coeficiente de variación | Rango |
|---|---:|---:|---:|
| api-services-total | 735.33 ms | 74.58 % | 3190.29 ms |
| api-services-ttfb | 734.49 ms | 74.70 % | 3184.69 ms |
| api-products-total | 95.51 ms | 12.78 % | 298.89 ms |
| api-products-ttfb | 96.09 ms | 12.90 % | 298.80 ms |
| web-open | 84.88 ms | 7.21 % | 298.74 ms |
| web-services | 1096.80 ms | 44.25 % | 5070.01 ms |
| navigation-services-detail | 202.55 ms | 19.67 % | 767.57 ms |
| web-products | 395.78 ms | 17.86 % | 1777.53 ms |
| navigation-products-detail | 353.67 ms | 32.82 % | 1590.19 ms |
| mock-login | 45.70 ms | 16.03 % | 216.92 ms |
| mock-availability | 36.12 ms | 19.42 % | 182.74 ms |
| existing-HU02 | 284.80 ms | 21.05 % | 776.93 ms |
| existing-HU04 | 365.54 ms | 25.86 % | 979.93 ms |
| existing-HU01 | 114.66 ms | 30.65 % | 308.65 ms |
| android-process-start | 384.08 ms | 59.59 % | 1849.00 ms |
| android-pss | 10.37 MiB | 8.46 % | 52.09 MiB |
| android-idle-cpu | 1.14 % de un núcleo | 17.08 % | 5.00 % de un núcleo |

Los tiempos nativos CPU se derivaron del encabezado real de toybox top, donde S[%CPU] aparece unido: se separó para alinear las columnas. El capturador inicial dejó CPU null en android.json; los veinte logs originales sí contienen ambas lecturas y permanecen intactos. android-derived.json y summary.json incorporan la segunda lectura correcta. No se sustituyeron observaciones ni se estimaron valores faltantes.

## 8 Comparación con los umbrales

El endpoint de servicios incumple ambos presupuestos: p95 total 2295.20 ≥ 2000 ms y p95 TTFB 2293.16 ≥ 1500 ms. Solo 18/20 consultas cumplen esos límites. Productos cumple total y TTFB en 20/20 muestras. El éxito HTTP/contrato cumple para ambos; lentitud y error funcional son problemas diferentes.

En web real, 5/5 flujos cumplen p95. Se conservan 2 muestras individuales fuera de presupuesto: web-services repetición 1 = 6801.81 ms; navigation-products-detail repetición 6 = 2194.51 ms. Un p95 que cumple no elimina el máximo ni convierte en rápidas todas las visitas.

Android cumple los presupuestos p95 de inicio, PSS y CPU bajo las condiciones de energía descritas. CPU cumple en 19/20 muestras; el máximo de 10.00 % alcanza el límite estricto de 10 %, por lo que esa muestra individual no cumple. No se presenta como incumplimiento del p95, pero se incorpora al seguimiento. Se observó 100 % de procesos activos al terminar las muestras.

## 9 Análisis e interpretación de cada resultado

**Apertura web.** media 1177.81, mínimo 1006.56, máximo 1305.30 y p95 1267.50 ms. Mide la posibilidad de comenzar a explorar servicios desde el inicio público; no incluye una descarga por red celular. El resultado corresponde a recursos servidos desde el mismo equipo.

**Servicios web.** media 2478.68, mínimo 1731.80, máximo 6801.81 y p95 4019.49 ms. Su máximo merece seguimiento aunque el p95 cumpla. Para el usuario, una visita lenta sigue siendo perceptible; el presupuesto de catálogo de 5 s es un control inicial y no una garantía de experiencia inmediata.

**Productos web.** media 2215.47, mínimo 1729.93, máximo 3507.46 y p95 2737.26 ms. Se observa catálogo utilizable bajo el presupuesto en las proporciones de la tabla. La espera combina arranque de JavaScript, fuentes, petición al backend y representación del primer artículo; no garantiza que todas las imágenes de la lista hayan terminado de cargar.

**Navegación a detalles.** Servicios: media 1029.61, mínimo 621.61, máximo 1389.18 y p95 1344.12 ms. Productos: media 1077.67, mínimo 604.33, máximo 2194.51 y p95 1693.37 ms. Se midió un click real sobre el primer artículo y la aparición de su encabezado, incluyendo consulta de detalle; no se sustituyó por page.goto directo. No se midieron todas las rutas privadas.

**API de servicios.** media 986.01, mínimo 623.08, máximo 3813.37 y p95 2295.20 ms. Las repeticiones 1 y 16 tardaron 3813.368 y 2295.204 ms. La mayor espera después del handshake TLS fue 3331.761 ms; la primera respuesta tardó 3807.06 ms en comenzar. Esto sitúa buena parte de la demora después de establecer la conexión, pero no separa red, cola, función y PostgreSQL. Un arranque de función, conexión a BD o consulta lenta son hipótesis; no se consultaron logs de Vercel ni planes SQL que las comprueben.

**API de productos.** media 747.23, mínimo 651.27, máximo 950.16 y p95 938.05 ms. Su distribución es más acotada en este lote y todas las respuestas fueron correctas. Los endpoints se intercalaron para reducir el sesgo de probarlos en bloques temporales separados; no comparten necesariamente los mismos costos internos.

**Acceso y horarios simulados.** Acceso: media 285.14, mínimo 218.25, máximo 435.16 y p95 341.25 ms. Horarios: media 185.97, mínimo 139.61, máximo 322.35 y p95 215.51 ms. Son tiempos realmente medidos de interacción y representación con respuestas controladas; el contenido y la autenticación son ficticios. Ayudan a vigilar regresiones de interfaz, pero no permiten evaluar el login o la disponibilidad reales sin cuenta autorizada. Los tiempos históricos de CI más bajos no demuestran una regresión local, porque cambian host, caché, fecha y ejecución.

**Arranque Android.** media 644.50, mínimo 435.00, máximo 2284.00 y p95 706.00 ms. La primera muestra fue 2284 ms y se conserva; p95 de 20 muestras corresponde al segundo mayor valor. am start -W informa lanzamiento de Activity; la aplicación no tiene instrumentación para registrar cuándo React termina de cargar su contenido. Por ello este valor no equivale a tiempo hasta contenido completamente utilizable.

**Memoria Android.** media 122.63, mínimo 114.49, máximo 166.58 y p95 121.95 MiB. El peso proporcional está bajo el presupuesto en todas las lecturas. Se reinicia el proceso en cada muestra: estos datos no demuestran ausencia de fugas durante una sesión prolongada ni describen el pico de un catálogo con imágenes.

**CPU Android.** media 6.70, mínimo 5.00, máximo 10.00 y p95 9.00 % de un núcleo. El porcentaje de top está referido a un núcleo; no se divide por los ocho núcleos ni se confunde con uso total del teléfono. Cada observación es una ventana corta después del arranque, con ahorro de energía y batería baja. No representa CPU durante desplazamiento, reserva o compras.

**Estabilidad.** No hubo pérdida del proceso en los veinte puntos comprobados ni errores JS en el recorrido web. Es evidencia favorable de funcionamiento en el lote, con alcance temporal reducido. Las detenciones intencionales no se cuentan como fallos de la aplicación.

## 10 Problemas de rendimiento identificados

1. Incumplimiento medido del presupuesto API de servicios y variabilidad marcada en su cola de latencias. El hecho está comprobado; la causa interna permanece sin diagnosticar.
2. Máximos web fuera de presupuesto que deben seguir visibles junto al p95: 2 observaciones. No se descartan como ruido ni se atribuyen automáticamente al servidor.
3. Cobertura nativa limitada a arranque y reposo, con batería 4 % y ahorro de energía; falta repetir en condiciones habituales y medir contenido utilizable y navegación nativa. Esto es una limitación de representatividad, no un defecto probado del APK.
4. Conservación incompleta de reportes exitosos del job de rendimiento: el YAML solo sube el artefacto de ese job en fallo. Es una brecha comprobada de monitoreo y auditoría.
5. Tres muestras curl de productos presentan time_connect < time_namelookup, de modo que la diferencia TCP calculada resulta negativa. Se conservan valores crudos y se excluyen únicamente esas tres diferencias de la estadística de fases. Total y TTFB se mantienen. La causa de la incoherencia de instrumentación no se comprobó.

## 11 Plan de mejora concreto y justificado

Las acciones son propuestas posteriores a la evaluación; no se implementaron optimizaciones. Los responsables son roles sugeridos que el equipo deberá asignar.

| Prioridad | Métrica y evidencia | Objetivo | Causa comprobada o hipótesis | Acción concreta | Responsable propuesto | Verificación posterior |
|---|---|---|---|---|---|---|
| Alta | API servicios p95 2295.20 ms; 18/20 < 2000; TTFB 2293.16 | p95 total < 2000 y TTFB < 1500 ms, éxito 100 % | Demora tras TLS comprobada; arranque de función, conexión/consulta BD son hipótesis | Correlacionar solicitudes lentas con logs de función, tiempos de conexión y consulta; revisar índices con EXPLAIN en entorno aislado; elegir conexión reutilizable, índice o caché solo según diagnóstico | Backend y base de datos | Repetir 20 lecturas intercaladas bajo mismo protocolo; añadir ≥ 100 muestras espaciadas en staging para validar p95 con mayor estabilidad |
| Media | Catálogos/navegación web: 2 muestras fuera del presupuesto | Mantener p95 y reducir máximos de primeras visitas | Outliers comprobados; red, caché, coste JS/fuentes y host son hipótesis | Separar primera visita de posteriores en un lote nuevo, registrar waterfall y tamaño de recursos; evaluar después caché de catálogo y recursos si la evidencia lo justifica | Frontend y QA | Repetir las mismas rutas y condiciones, reportar p95 y máximo, conservar primeras muestras sin descarte |
| Media | CPU nativa p95 9.00 %, máximo 10.00 %; PSS p95 121.95 MiB | CPU p95 < 10 %, PSS p95 < 250 MiB en condiciones habituales | Condición energética atípica comprobada; no hay causa de consumo excesivo demostrada | Repetir con batería ≥ 50 %, estado de ahorro documentado, temperatura estable y apps de fondo registradas; añadir sesión de navegación de 10 min | QA móvil | Comparar sin mezclar lotes; registrar top, PSS y fallos en varios puntos de la sesión |
| Media | Inicio Android p95 706.00 ms; falta TTFD | Conservar TotalTime < 3000 ms y obtener tiempo de contenido utilizable | am start no acredita React listo; limitación comprobada | Diseñar medición externa de disponibilidad de controles o Macrobenchmark en entorno separado; documentar sobrecarga y, si se autoriza después, instrumentar contenido listo | Android y QA | Medir ≥ 20 arranques del mismo tipo, diferenciar TTID/TTFD y comparar por dispositivo |
| Media | Artefactos exitosos de rendimiento no conservados por el job | Cada ejecución con muestras/JSON/CSV y SHA trazable | Condición failure() comprobada en ci.yml | Proponer PR separado para subir siempre resultados de rendimiento y definir retención, sin cambiar puertas de liberación | DevOps | Verificar un run exitoso y uno fallido en rama de pruebas; ambos deben tener artefactos descargables y SHA |
| Media | Fases curl TCP incoherentes en 3/40 solicitudes | 0 fases negativas interpretadas como duraciones válidas | Incoherencia comprobada; origen no determinado | Contrastar versión de curl y ruta/proxy sin registrar credenciales; usar captura de timing alterna y telemetría Server-Timing autorizada en staging | QA y backend | Conservar crudos; comparar mediciones equivalentes; no sumar fases incompatibles |
| Mantenimiento | Productos API y flujos simulados cumplen | Mantener presupuestos y éxito 100 % | Cumplimiento observado, sin defecto probado | Reejecutar suite en cada cambio; revisión periódica de p95/máximo y fallos con el mismo protocolo | Frontend, backend y QA | Comparar con esta línea base por entorno y commit; investigar incumplimientos antes de liberar |
| Mantenimiento | 20/20 procesos Android activos y web sin errores JS | Mantener estabilidad; ampliar ventana de observación | Lote corto, no tasa productiva | Añadir prueba prolongada y registro de crashes/ANR solo de la app, sin datos personales | QA móvil | Cero cierres inesperados en sesión controlada; evidencias con hora, versión y duración |

## 12 Limitaciones de las pruebas

- Veinte muestras por flujo son suficientes para una línea base descriptiva, pero el p95 es sensible a pocos valores; no se hicieron pruebas de carga ni inferencias poblacionales.
- Web móvil en Chromium usa CPU Windows y emulación de viewport/toque. Android se midió de forma independiente con ADB sobre el APK real; sus números no se derivan de Playwright.
- La exportación web comparte fuente con la liberación, pero no es el binario Android ni un sitio web desplegado. localhost evita el costo real de descargar el frontend desde Internet.
- API productiva significa backend real observado en esa fecha. El repositorio móvil no identifica el SHA del despliegue backend ni permite afirmar que sea el mismo backend del día de la liberación. No se midió PostgreSQL directamente.
- TTFB incluye red y servidor. Sin trazas de función, SQL o Server-Timing no hay tiempo puro de procesamiento. Las tres diferencias TCP negativas son datos de instrumentación inválidos para esa fase y se señalan, no se corrigen a cero.
- No se usó cuenta productiva ni cuenta de pruebas real autorizada; login/perfil/agenda reales permanecen sin medir. Para completarlos se necesita staging aislado, una cuenta CLIENTE ficticia autorizada y configuración segura fuera de Git/chat. No basta con el resultado de los mocks.
- El único teléfono fue SM-A515F Android 13, bajo carga USB y batería baja. El estado low_power se consultó después del lote; no hubo vigilancia térmica continua ni control de todas las apps de fondo. No se generaliza a otros modelos.
- Android TotalTime no equivale a contenido utilizable; PSS/CPU corresponden a reposo posterior al arranque, no a flujos completos ni a consumo de batería. No se mide fluidez/FPS ni se concluye ausencia de fugas.
- El buffer de salidas conserva solo las 16 más recientes: no prueba un historial completo de crashes/ANR. No se registró una sesión larga ni una tasa de estabilidad en producción.
- Las muestras existentes locales y las del runner CI no son un experimento comparativo bajo condiciones iguales. Se reutilizan como antecedentes del control y de trazabilidad.

## 13 Evidencias generadas con rutas y enlaces exactos

La raíz relativa es docs/evidence/actividad6-rendimiento/. [Índice completo](evidence/actividad6-rendimiento/README.md). Cada archivo está asociado a la prueba que respalda y SHA256SUMS.txt permite comprobar integridad. Las capturas de results y de la gráfica son vistas derivadas de mediciones crudas; las capturas web y Android provienen de las interfaces ejecutadas.

| Evidencia | Ruta desde el repositorio | Prueba que respalda |
|---|---|---|
| Diagnóstico y ramas | docs/evidence/actividad6-rendimiento/diagnostic.json | Revisión inicial, fuente y entorno |
| Protocolo | scripts/activity6/protocol.json | Parámetros y presupuestos antes de medir |
| CI del SHA liberado | docs/evidence/actividad6-rendimiento/ci-released-commit.json y ci-performance-extract.log | Antecedente de Actions y muestras del mismo SHA |
| API cruda | docs/evidence/actividad6-rendimiento/api.json y api-execution.log | 40 GET reales, HTTP y tiempos |
| Fases de API | docs/evidence/actividad6-rendimiento/api-phase-summary.json | DNS/TCP/TLS y datos de fase rechazados |
| Web real | docs/evidence/actividad6-rendimiento/web.json y web-execution.log | 100 operaciones con backend real, errores y estado HTTP |
| Web con fixture | docs/evidence/actividad6-rendimiento/controlled-playwright.json | 20 accesos y 20 horarios simulados |
| Suite original local | docs/evidence/actividad6-rendimiento/existing-playwright.json | Tres pruebas originales con cinco muestras cada una |
| Identidad web | docs/evidence/actividad6-rendimiento/web-export-verification.json, export-live.log y export-mock.log | URLs y hashes de bundles realmente usados |
| APK y teléfono | docs/evidence/actividad6-rendimiento/android.json y android-status.json | Hash instalado, modelo, energía y 20 lanzamientos |
| Android crudo | docs/evidence/actividad6-rendimiento/android-raw-01.log a android-raw-20.log | am start, meminfo y dos lecturas top por repetición |
| Android derivado | docs/evidence/actividad6-rendimiento/android-derived.json | CPU alineada desde logs originales, inicio y PSS |
| Estabilidad Android | docs/evidence/actividad6-rendimiento/android-exit-reasons.log | Razones recientes de force-stop; alcance limitado |
| Condiciones | docs/evidence/actividad6-rendimiento/conditions.json | Wi-Fi, energía, herramientas y solapamientos |
| Tablas y muestras | docs/evidence/actividad6-rendimiento/summary.json, summary.csv, samples.csv y comparison.md | Estadística y cumplimiento verificables |
| Vista y gráfica | docs/evidence/actividad6-rendimiento/results.html, results.png, p95-budget.svg y p95-budget.png | Presentación de resultados para el documento académico |
| Capturas reales | docs/evidence/actividad6-rendimiento/web-inicio.png, web-services.png, web-products.png, web-services-detail.png, web-products-detail.png, web-mock-disponibilidad.png y android-inicio-apk-liberado.png | Pantallas ejecutadas y alcance de cada prueba |
| Verificaciones | docs/evidence/actividad6-rendimiento/validation.json, local-checks.json, lint.log, typecheck.log y SHA256SUMS.txt | Integridad, conteos, seguridad y controles estáticos |

Trazabilidad externa: [commit evaluado](https://github.com/SANTIAGOgo99/estetica-app-movil/commit/35755d883bf111ab3596c30c2da9520cf7cecde5), [job de rendimiento](https://github.com/SANTIAGOgo99/estetica-app-movil/actions/runs/45321572186/job/138206835483) y [build EAS](https://expo.dev/accounts/appmovilestetica/projects/estetica-clientes/builds/cd8bb15d-b39e-4c9a-a0be-68dad9cfa0b3). Las evidencias locales de la liberación siguen en docs/evidence/actividad5-cd/; no se reemplazaron por estos resultados.

Las fuentes técnicas consultadas fueron [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/), [índice Expo](https://docs.expo.dev/llms.txt), [Expo CLI](https://docs.expo.dev/more/expo-cli/), [emulación de Playwright](https://playwright.dev/docs/emulation), [manual curl](https://curl.se/docs/manpage.html), [ADB](https://developer.android.com/tools/adb), [dumpsys y PSS](https://developer.android.com/tools/dumpsys) y [tiempo de inicio Android](https://developer.android.com/topic/performance/issues/launch-time). Fundamentan herramientas y alcance; los números de este informe proceden de las ejecuciones conservadas.

## 14 Conclusión técnica

La evaluación proporciona una línea base verificable para Estética Clientes: fuente móvil equivalente al SHA liberado, 40 consultas públicas reales, 100 operaciones de interfaz web con backend real, 40 operaciones adicionales con API simulada, repetición de la suite original y 20 arranques del mismo APK en un teléfono Android físico. Las tres métricas nativas proceden de esos mismos 20 lanzamientos y no son 60 ensayos independientes.

El hallazgo que requiere prioridad es la variabilidad del endpoint de servicios, cuyo p95 rebasa los presupuestos total y de primer byte. Las mediciones de arranque y recursos Android cumplen sus presupuestos p95 en las condiciones observadas; la baja batería limita su representatividad. Los extremos web y la muestra de CPU en el límite deben mantenerse visibles aun cuando el p95 apruebe. La siguiente etapa es diagnosticar las causas internas con telemetría autorizada y repetir mediciones controladas antes de optimizar o liberar otra versión.

La evidencia se alinea con los cuatro criterios de la rúbrica: selección justificada de métricas (sección 3), método y herramientas reproducibles (4 a 6), resultados y análisis reales (7 a 10) y acciones verificables fundamentadas (11). La calificación corresponde al docente; los resultados no se alteraron para aparentar cumplimiento.
