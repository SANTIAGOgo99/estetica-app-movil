# Plan de pruebas móvil

18 historias (HU00 técnica y HU01–HU17 funcionales), 59 tareas de desarrollo conservadas y 126 tareas de pruebas: siete por historia. [Matriz completa](plan.json). Las pruebas aún pendientes siguen abiertas.

## Alcance

- Requerimiento: casos y criterios de cada HU.
- Módulo: flujos de acceso, catálogo, agendamiento, citas y compras.
- Sprint: repetir regresión sobre todas las historias integradas y revisar criterios de la entrega. No agregar pruebas dispersas: registrar esta evidencia en las sub-issues de las HU cubiertas.

## Flujo de ramas

Cada HU tiene rama codex/huXX-descripcion desde develop. Los avances anteriores se conservan como línea base en develop; las ramas nuevas sirven para correcciones y pruebas futuras, sin reconstruir historial. HU00 configura el proceso.

1. Subir cambios a la rama HU: estático + unitarias + integración; después regresión y empaquetado.
2. Abrir PR hacia develop y revisar las cuatro verificaciones.
3. Integrar solo si pasan. En el push a develop se repiten las cuatro y se agregan aceptación y rendimiento.
4. Esfuerzo se ejecuta manualmente en entorno controlado y se registra en P07.
5. Integrar a main únicamente una entrega validada. Las condiciones del workflow no bloquean por sí solas el botón de merge: requieren protección de ramas o disciplina de revisión.

## Herramientas y límites de la automatización actual

| Tipo | Herramienta / comando | Cobertura actual |
|---|---|---|
| Estático | TypeScript + ESLint; npm run typecheck y npm run lint | Todo el código |
| Unitarias | node:test; npm run test:unit | Validaciones, catálogo, horarios y acceso |
| Integración | node:test + servidor HTTP local; npm run test:integration | Autenticación, catálogo y conflicto de reserva; falta staging + BD |
| Regresión | node:test; npm run test:regression | Todos los archivos *.test.mjs; exportación Android adicional |
| Aceptación | Playwright; npm run test:acceptance | HU01–HU05, interfaz web en viewport móvil, API simulada |
| Rendimiento | Playwright; npm run test:performance | HU02/HU04: cinco cargas, p95 < 5 s, Chromium móvil y API simulada |
| Esfuerzo | Procedimiento P07 manual | Pendiente en entorno controlado; fuera del YAML |

Las funciones futuras (en particular reagendamiento, cancelación y pedidos) necesitan implementar sus casos al desarrollar cada historia. Se conservan las 126 tareas pendientes hasta reunir su evidencia. Web móvil no demuestra funcionamiento ni rendimiento nativo; Android/iOS y API/PostgreSQL requieren validación adicional.

## Ejecutar localmente

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
```

La exportación de pruebas fuerza una URL ficticia y desactiva .env. No utiliza cuentas reales. Reportes en reports/ y trazas en test-results/; GitHub Actions los guarda como artefactos. El empaquetado JavaScript no genera APK: un APK Expo requiere EAS/configuración de firma y no acredita por sí solo aceptación.

## Evidencia mínima por caso

Caso/HU/tipo, fecha real, commit, entorno/dispositivo, datos ficticios, pasos, esperado, obtenido, aprobado/fallido/bloqueado, enlace al reporte y defecto. Usar [plantilla](evidence-template.md). No cerrar una HU solo por seis jobs verdes: faltan las verificaciones manuales y los criterios no automatizados.

## Historias

- [HU00 - Preparar repositorio y flujo DevOps de la aplicación móvil](stories/HU00.md): devops; Sprint 1.
- [HU01 - Iniciar sesión](stories/HU01.md): acceso; Sprint 1.
- [HU02 - Consultar servicios](stories/HU02.md): catalogo; Sprint 1.
- [HU03 - Ver detalle de un servicio](stories/HU03.md): catalogo; Sprint 1.
- [HU04 - Consultar productos](stories/HU04.md): catalogo; Sprint 1.
- [HU05 - Ver detalle de un producto](stories/HU05.md): catalogo; Sprint 1.
- [HU06 - Consultar fechas disponibles](stories/HU06.md): agendamiento; Sprint 2.
- [HU07 - Consultar horarios disponibles](stories/HU07.md): agendamiento; Sprint 2.
- [HU08 - Agendar una cita](stories/HU08.md): agendamiento; Sprint 2.
- [HU09 - Confirmar información de la cita](stories/HU09.md): agendamiento; Sprint 2.
- [HU10 - Consultar mis citas](stories/HU10.md): citas; Sprint 3.
- [HU11 - Reagendar una cita](stories/HU11.md): citas; Sprint 3.
- [HU12 - Cancelar una cita](stories/HU12.md): citas; Sprint 3.
- [HU13 - Consultar estado de una cita](stories/HU13.md): citas; Sprint 3.
- [HU14 - Agregar productos al carrito](stories/HU14.md): compras; Sprint 4.
- [HU15 - Consultar y modificar el carrito](stories/HU15.md): compras; Sprint 4.
- [HU16 - Generar pedido o compra](stories/HU16.md): compras; Sprint 4.
- [HU17 - Confirmar pedido](stories/HU17.md): compras; Sprint 4.
