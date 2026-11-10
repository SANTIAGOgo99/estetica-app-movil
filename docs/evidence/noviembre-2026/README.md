# Evidencias de noviembre

Verificación del 10/11/2026. Consultar también el [avance de noviembre](../../noviembre/README.md).

## Backend real y catálogos visibles

Estas capturas corresponden a la aplicación web en desarrollo y al backend real,
en sesión anónima. El recorrido es exclusivamente de lectura.

- [Inicio público](real-inicio-publico.png).
- [Servicios reales](real-services.png): 11 registros en el backend.
- [Productos reales](real-products.png): 17 registros en el backend.
- [Consultas HTTP reales](backend.json): catálogos 200, perfil sin token 403 y token inválido 401.
- [Resultado de interfaz conectada](live-ui.json): rutas, respuestas y ausencia de errores JavaScript de página.

## Recorridos con API simulada

Chromium, presentación móvil. Datos ficticios de `tests/fixtures/mobile.json`.
Las capturas de sesión y registro no representan cuentas ni altas reales.

| Caso | Pasos y resultado esperado | Evidencia | Resultado web |
| --- | --- | --- | --- |
| NOV-01 | Abrir inicio, servicios y productos sin sesión a 320/412 px. Solo aparecen Inicio, Servicios y Productos en el footer. No hay accesos privados ni desborde horizontal del documento. | [Inicio 320](publico-inicio-320.png), [Inicio 412](publico-inicio-412.png), [Servicios 320](publico-services-320.png), [Servicios 412](publico-services-412.png), [Productos 320](publico-products-320.png), [Productos 412](publico-products-412.png) | Aprobado |
| NOV-02 | Iniciar sesión: aparecen Citas, Perfil y carrito. Cerrar sesión: desaparecen y se elimina la sesión guardada. | [Con sesión](sesion-footer-privado.png), [Después de salir](sesion-cerrada.png) | Aprobado |
| NOV-03 | Abrir /profile, /appointments, /cart y /checkout sin sesión: las rutas están protegidas y no se solicitan datos privados. | [Ruta protegida](ruta-privada-protegida.png) | Aprobado |
| NOV-04 | Leer el aviso público y desplegarlo en registro. Los campos se conservan y la casilla permanece desmarcada. | [Aviso](aviso-privacidad.png), [Casilla desmarcada](registro-consentimiento-desmarcado.png) | Aprobado |
| NOV-05 | Enviar formulario sin aceptación: no hay POST. Aceptar: se envía una sola petición con versión del aviso y sin rol administrativo. La respuesta simulada confirma el registro. | [Bloqueo](registro-bloqueado-sin-consentimiento.png), [Respuesta simulada](registro-confirmado-api-simulada.png) | Aprobado |
| NOV-06 | Responder 401 a perfil con sesión: limpiar token y accesos. Al abrir el acceso se explica que venció la sesión. | [Sesión rechazada](sesion-rechazada-401.png) | Aprobado |
| NOV-07 | Responder 500: mostrar error público y conservar sesión. Reintentar con respuesta válida: recuperar perfil. | [Fallo controlado](fallo-servidor-sin-exponer-datos.png) | Aprobado |

## Resultados y configuración

- [Verificación general](verification.json): lint y tipos correctos, 63 pruebas de regresión y 15 recorridos web aprobados.
- [Reporte JUnit de regresión](regression.xml).
- [Correcciones adicionales del backend](https://github.com/SANTIAGOgo99/Esteticaa-backend/tree/fix/registro-clientes-seguro): código compilado, seis pruebas HTTP y auditoría de dependencias sin avisos en la rama de trabajo.
- [JUnit de las pruebas del backend](backend-registration.xml).
- [Configuración Android introspectada](android-config.json): R8, reducción de recursos, rechazo de tráfico sin cifrar y permisos bloqueados.
- [Auditoría de dependencias](dependency-audit.json): avisos pendientes, incluidos seis de riesgo alto.
- Reporte HTML navegable: ejecutar `npx playwright show-report reports/browser` después de las pruebas.

## Límites de esta evidencia

- Los siete casos nuevos también deben ejecutarse en Android Debug y Release. Ambos estados nativos quedan pendientes.
- La introspección de Expo no es un APK, un manifest final fusionado ni un reporte de descompilación.
- SecureStore ya está integrado para la sesión nativa; falta comprobarlo en dispositivo.
- El pinning, la renovación del token y las operaciones ARCO del backend siguen pendientes.
- El servidor actual ignora los metadatos de consentimiento. Las pruebas acreditan el control y envío desde el cliente, no su persistencia en la base.
- No hay compilación firmada nueva, revisión activa en Google Play ni publicación acreditada.

## Registro de observaciones

| Observación | Acción | Estado |
| --- | --- | --- |
| Citas y Perfil visibles para visitantes | Filtrar footer por sesión; retirar accesos al carrito en inicio y catálogo públicos | Corregido y comprobado en NOV-01/NOV-02 |
| El rechazo 401 dejaba el token guardado | Notificar rechazo y expirar solo la sesión correspondiente | Corregido y comprobado en NOV-06 y regresión |
| El registro no tenía aceptación explícita del aviso | Añadir aviso, casilla desmarcada, versión y validación antes de enviar | Avance de cliente comprobado; persistencia en backend pendiente |
| Primera comprobación del backend devolvió 500 con Aiven apagado | Se volvió a comprobar después del arranque que realizó el propietario | Catálogos 200; ver backend.json |
| La primera compilación web superó el tiempo de espera del recorrido real | Ampliar la espera de compilación inicial y repetir el recorrido | Catálogos reales verificados; ver live-ui.json |

La ejecución de esta matriz en Android Debug y Release queda para la siguiente revisión.
