# Bienvenida pública y conexiones reales — 6 de octubre de 2026

## Qué cambió

La página de inicio es ahora la bienvenida pública de la app. Cualquier persona puede consultar servicios, productos, precios, imágenes y detalles sin cuenta. Ya no aparecen la barra de prototipo ni los registros de ejemplo.

Cuando el visitante pulsa Agendar cita, Agregar al carrito, Citas o Perfil, aparece el acceso con la explicación de por qué necesita una cuenta y un enlace para registrarse. Tras iniciar sesión, continúa en el servicio, producto o sección elegida. Volver al inicio desde el acceso descarta la intención anterior.

## Funciones conectadas

| Función | Conexión utilizada | Situación |
| --- | --- | --- |
| Servicios activos y detalles | GET `/services/active`, GET `/services/:id` | Comprobados desde la app sin sesión; 11 servicios al verificar. |
| Productos disponibles y detalles | GET `/products/active`, GET `/products/:id` | Comprobados desde la app sin sesión; 17 productos al verificar. |
| Acceso de cliente | POST `/auth/login` | Conserva el manejo de sesión y los errores de acceso. La prueba exitosa se realizará personalmente con la cuenta del usuario. |
| Registro de cliente | POST `/auth/register` | Envía nombre, correo, teléfono y contraseña. No envía roles administrativos. Solo anuncia éxito después de una respuesta válida del servidor. |
| Perfil | GET `/users/profile` | Muestra nombre, correo y teléfono reales de la cuenta. Maneja errores y actualización. No muestra nombres de ejemplo. |
| Horarios | GET `/appointments/slots?date=…&service_id=…` | Consulta horarios reales por día y servicio; deshabilita los que el servidor informa como no disponibles. |
| Registro de cita | POST `/appointments` | Envía servicio y horario elegido, bloquea envíos repetidos y maneja conflictos. Muestra folio y estado solamente después de confirmación válida del servidor. |
| Agenda de cliente | GET `/appointments/my` | Consulta citas, saldo, anticipo y estado; diferencia próximas e historial usando el estado del calendario del servidor. |
| Carrito | Estado temporal local de una sesión cliente | Utiliza productos reales y respeta sus existencias. Se vacía al salir de la sesión; no equivale a un pedido registrado. |

El backend identifica al cliente con la sesión: la app no envía un identificador de otra persona al reservar y no inventa pagos ni anticipos.

## Lo que aún necesita trabajo del backend

- **Pedidos y pago de productos:** el backend consultado no tiene rutas para crear ni consultar pedidos de clientes. Se conserva el carrito y el resumen; se indica que no se ha realizado una compra ni un cobro.
- **Edición del perfil:** existe consulta del propio perfil, pero las rutas de edición disponibles son administrativas. La app muestra datos reales y remite a la estética para cambios.
- **Reagendar y cancelar:** no se habilitaron escrituras móviles con las rutas actuales. Los controladores existentes requieren validar en el servidor que la cita pertenece al cliente autenticado antes de exponer esas acciones en la app.
- **Recuperación de contraseña:** todavía no existe recuperación automática en las rutas consultadas. Se informa al cliente que contacte a la estética.

No se modificó ni desplegó el backend en este cambio. La revisión de sus contratos se hizo sobre el [repositorio existente](https://github.com/SANTIAGOgo99/esteticaa-backend/tree/main/src/routes).

## Archivos y su propósito

| Archivo o carpeta | Para qué sirve |
| --- | --- |
| `src/app/index.tsx`, `services.tsx`, `products.tsx` y los detalles | Abren las secciones públicas. |
| `src/app/(client)/` | Mantiene las secciones que requieren sesión: agenda, perfil y carrito. |
| `src/features/interfaces/access.ts` | Define qué acciones necesitan una cuenta y permite regresar solo a una dirección interna de la app. |
| `src/features/interfaces/Flow.tsx` | Conserva las selecciones y el carrito temporal, y coordina el regreso después del acceso. Se eliminaron las muestras del prototipo. |
| `src/features/api/client.ts` | Realiza consultas al servidor, maneja fallos y tiempos de espera y envía la sesión cuando se requiere. |
| `src/features/api/useRemote.ts` | Coordina carga, error y reintento; actualiza al regresar a la pantalla. Descarta respuestas anteriores al cambiar de cuenta, pantalla o fecha. |
| `src/features/catalog/model.ts` | Interpreta precios, existencias, categorías e imágenes del catálogo real. Una fotografía inválida no impide consultar los demás datos. |
| `src/features/auth/registration.ts` | Registra cuentas de cliente con el contrato existente. |
| `src/features/account/model.ts` y `Screens.tsx` | Comprueban y presentan el perfil real y la bienvenida pública. |
| `src/features/appointments/model.ts`, `client.ts`, `data.ts` y `Screens.tsx` | Interpretan la agenda y los horarios, registran citas y presentan el resultado real. |
| `src/features/commerce/Screens.tsx` | Presenta carrito y resumen sin simular pedidos guardados. |
| `tests/api.test.mjs` | Comprueba contratos, separación pública/privada, errores, perfil, registro y confirmaciones sin modificar datos reales. |
| `docs/evidence/acceso-publico/` | Capturas de los catálogos y la redirección al acceso. |

Las direcciones antiguas de demostración redirigen al inicio público. Las capturas previas se conservan como evidencia histórica.

## Cómo probar

1. Abre http://localhost:5173/ con Expo encendido. Consulta Servicios y Productos sin iniciar sesión.
2. Abre un servicio y pulsa Agendar cita. Verifica el aviso para iniciar sesión o crear cuenta.
3. Introduce personalmente una cuenta de cliente existente. Las cuentas de administración siguen en la web.
4. Después del acceso, consulta Perfil y Mis citas. Los datos deben coincidir con la web.
5. Para registrar una cita, elige día y horario. **Confirmar mi cita crea una reserva real** en el backend publicado. No es una simulación.
6. Explora un producto y agrégalo al carrito. Puedes ajustar cantidades; el resumen indica el estado pendiente de la creación de pedidos.

Para iniciar Expo si está apagado: `npm start` o `npm.cmd start` en PowerShell. No se requiere compartir contraseñas en mensajes ni documentos.

## Comprobaciones

- TypeScript y lint aprobados.
- 27 pruebas automatizadas aprobadas, incluidas las 16 previas de acceso.
- Exportaciones web y Android aprobadas; esto no sustituye la prueba en teléfono físico.
- Ambos catálogos respondieron 200 sin sesión, con imágenes reales y permiso para `http://localhost:5173`.
- Perfil sin sesión respondió 403: permanece protegido por el servidor.
- Navegación pública, detalles por identificador, búsqueda sin coincidencias y redirecciones desde agendar/carrito verificadas en navegador con tamaño de celular.
- Registro vacío validado sin enviar una creación de cuenta.
- No se crearon cuentas, reservas ni pedidos reales en la revisión. Acceso exitoso, perfil y agenda privados requieren la prueba personal acordada con el usuario.

