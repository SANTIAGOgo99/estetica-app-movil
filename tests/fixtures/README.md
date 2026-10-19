# Datos de prueba versionados

mobile.json contiene casos sintéticos identificados HU01-U01–U07, un cliente ficticio, catálogo y presupuesto de rendimiento. No contiene cuentas ni contraseñas de un sistema real. Los casos de vigencia/restauración completan HU01-U08–U09 en session.unit.test.mjs.

Tipo y alcance:
- Unitarias: validación y sesión en memoria, sin red.
- Integración: contratos HTTP locales; el servidor de prueba simula backend, no PostgreSQL.
- Aceptación y rendimiento: interfaz web en viewport móvil, respuestas interceptadas por Playwright.
- Regresión: vuelve a ejecutar todos los casos Node, incluidos los anteriores; no sumar sus casos como si fueran diferentes.

Los secretos de staging deben configurarse en GitHub, nunca en este JSON. npm run test:staging falla si faltan configuración/cuenta o se indica el servidor productivo conocido. Su aprobación verifica API por HTTP, no inspección directa de la base de datos.

Para demostrar detección de fallo, cambiar temporalmente valid a true en HU01-U04 (correo sin @). El validador debe rechazarlo y el job unitario debe fallar. Corregir el dato y repetir. La prueba comprueba el contrato real del validador; no se agrega una aprobación ficticia ni se ocultan fallos.
