# Interfaces móviles — 6 de octubre de 2026

## Qué se creó y para qué

Se implementaron las 16 interfaces del documento de diseño: bienvenida, acceso, registro, inicio, servicios, detalle de servicio, agenda, confirmación de cita, productos, detalle de producto, carrito, finalización de compra, confirmación de compra, mis citas, mis compras y perfil.

Sirven para presentar los módulos al profesor y revisar cómo el cliente recorrerá la app antes de completar todas las operaciones del servidor.

## Fuentes

- Documento de Diseño, Maquetado y Guía de Estilos de Interfaces de Usuario, proporcionado por el usuario: 25 páginas, interfaces en páginas 5–20.
- [Repositorio web](https://github.com/SANTIAGOgo99/esteticaa-frontend): recursos originales en `src/assets/images`; estilo de `src/pages/public/Login.css`; controles de `Login.tsx` y `AuthModal.tsx`; contratos de los catálogos de cliente.
- Marfil, crema, rosa, café y dorado; Cormorant Garamond para títulos y Outfit para controles. Se ajustó el color de texto secundario para mejorar lectura.
- No se copió el enlace de recuperación vacío ni el botón de Google que la web muestra como próximamente. Recuperación indica contactar a la estética.

## Archivos que vas a encontrar

| Carpeta o archivo | Qué contiene y para qué sirve |
| --- | --- |
| `assets/brand/` | Logo, emblema y fotografía originales de la web, junto con su procedencia. |
| `src/theme.ts` | Colores y nombres de las tipografías compartidas. |
| `src/components/ui.tsx` | Botones, tarjetas, campos, ojo para mostrar contraseña, filtros y navegación inferior. Evita estilos distintos entre pantallas. |
| `src/features/auth/AuthScreens.tsx` | Bienvenida, formulario de acceso y diseño del registro. El acceso conserva su conexión real. |
| `src/features/catalog/Screens.tsx` | Listados y detalles de servicios y productos, búsqueda y categorías. |
| `src/features/catalog/useCatalog.ts` | Consulta los catálogos reales usando la dirección configurada del backend. Maneja carga, fallo, tiempo de espera y reintento. |
| `src/features/appointments/Screens.tsx` | Fecha, horario, resumen, confirmación y lista de citas. |
| `src/features/commerce/Screens.tsx` | Carrito, cantidades, formulario de compra, confirmación e historial. |
| `src/features/account/Screens.tsx` | Inicio y perfil; cierre real de sesión fuera de la demostración. |
| `src/features/interfaces/Flow.tsx` | Datos de ejemplo y estado temporal del recorrido. Mantiene separados los ejemplos y la sesión real. |
| `src/app/` | Direcciones que abren cada pantalla. La lógica está en los módulos anteriores. |
| `src/app/preview/` | Galería de desarrollo de las 16 interfaces. No modifica ni crea un token de acceso. |
| `docs/evidence/interfaces/` | Capturas de la revisión visual. |

No se creó otro backend dentro de AppMovil: la app utiliza el backend existente de la web.

## Recorridos

- Bienvenida → acceso o registro → inicio.
- Inicio → servicios → detalle → fecha y horario → confirmación → mis citas.
- Inicio → productos → detalle → carrito → formulario → confirmación → mis compras.
- Inicio → perfil → edición de ejemplo o cierre de sesión.

La barra inferior ofrece Inicio, Servicios, Productos, Citas y Perfil. La barra superior de demostración permite revisar directamente cualquier interfaz.

## Qué es real y qué es demostración

**Real:** formulario de acceso, validación, petición al backend, manejo del token y cierre de sesión ya implementados. Los listados consultan `/services` y `/products/active` con la sesión real; esta integración aún requiere una cuenta válida para comprobar el recorrido completo.

**Demostración:** registro, agenda, reprogramación/cancelación, carrito/compra e información y edición de perfil. Se pueden probar con datos de ejemplo guardados únicamente en memoria. Al recargar se restablecen. Las confirmaciones dicen expresamente que no se generó una reserva ni un pedido real. En las pantallas reales las acciones todavía no conectadas permanecen deshabilitadas o muestran su estado pendiente.

No se inventó una regla de anticipo, un costo de entrega ni una pasarela de pago. Deben confirmarse con el backend y las reglas de la estética.

## Cómo probar

1. Ejecuta `npm start` en la carpeta AppMovil; usa `npm.cmd start` si PowerShell bloquea scripts.
2. Abre http://localhost:5173/preview/welcome o pulsa “Recorrer las interfaces de demostración” desde bienvenida.
3. Recorre los módulos. Prueba búsqueda, campos vacíos, mostrar/ocultar contraseña, selección de horarios y cantidades del carrito.
4. Para probar acceso real, abre http://localhost:5173/sign-in e introduce personalmente una cuenta de cliente existente.
5. Para revisión en teléfono, abre el proyecto con la versión compatible de Expo Go o una compilación de desarrollo. La comprobación visual en teléfono físico sigue pendiente.

## Validación

- TypeScript y lint: aprobados.
- Pruebas unitarias de acceso: 16 aprobadas.
- Dependencias compatibles con Expo SDK 57: comprobadas.
- Exportación de paquetes web y Android: comprobada; no equivale a instalar o probar en teléfono.
- Revisión visual en navegador con dimensiones 390 × 844 del prototipo; pantallas pequeñas también revisadas.
- Búsqueda sin coincidencias, selección de fecha y horario ocupado deshabilitado, validación de formulario de compra y recálculo de total comprobados con datos ficticios.
- Ejemplo de carrito: de $600 a $920 al agregar una unidad de shampoo; confirmación de ejemplo sin pedido ni cobro real.

Se actualizaron dependencias compatibles de SDK 57 y se aplicaron correcciones disponibles sin forzar cambios de SDK. La auditoría quedó con 28 avisos (10 moderados, 18 altos), sin crítico; las correcciones restantes proponen cambios incompatibles y requieren revisión independiente.

## Trabajo pendiente

Probar acceso exitoso y catálogos con una cuenta real; conectar registro, disponibilidad, creación y gestión de citas, pedidos e información de perfil. No se considera terminada una historia funcional solamente por tener su interfaz.
