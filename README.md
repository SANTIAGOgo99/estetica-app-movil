# Estética App Móvil

Aplicación móvil orientada a los clientes de **Ezequiel Castillo Ángeles Hair Designer**.

## Objetivo

Desarrollar una aplicación móvil que permita a los clientes consultar servicios y productos, gestionar citas y realizar operaciones relacionadas con el carrito y pedidos desde un dispositivo móvil.

## Alcance

La aplicación móvil está enfocada únicamente al cliente. Las funciones administrativas continuarán realizándose mediante el sistema web existente.

Funciones principales:

- Inicio de sesión.
- Consulta de servicios.
- Consulta de productos.
- Visualización del detalle de servicios y productos.
- Consulta de fechas y horarios disponibles.
- Agendamiento de citas.
- Consulta de citas.
- Reagendamiento y cancelación de citas.
- Carrito de productos.
- Registro de pedidos.

## Tecnologías

- React Native.
- Expo.
- JavaScript / TypeScript.
- Node.js.
- Express.
- PostgreSQL.
- API REST.
- Git y GitHub.

## Metodología

Se utilizará **Scrumban**, combinando la planeación mediante Backlog y Sprints con el seguimiento visual de Kanban.

Flujo de trabajo:

Backlog → Por hacer → En progreso → En revisión → Terminado.

## Arquitectura

La aplicación utiliza una arquitectura cliente-servidor. La aplicación móvil funciona como cliente y consume mediante una API REST el backend desarrollado con Node.js y Express, el cual gestiona las reglas del negocio y el acceso a PostgreSQL.

## Estrategia de ramas y pruebas

- main: entregas estables.
- develop: integración de historias y ejecución de las seis verificaciones.
- codex/huXX-descripcion: una rama por historia para sus correcciones y pruebas.

Las ramas anteriores se conservan. La línea base de develop reúne los avances existentes, sin reconstruir el historial. En las ramas HU se ejecutan análisis estático, unitarias, integración y regresión. Al integrar a develop se agregan aceptación y rendimiento. Esfuerzo queda como procedimiento manual por historia.

La [planeación de pruebas](docs/testing/README.md) contiene siete tareas por HU, los alcances de requerimiento/módulo/sprint, comandos y límites de la cobertura actual. [GitHub Projects](https://github.com/users/SANTIAGOgo99/projects/1) conserva las tareas de desarrollo y las nuevas pruebas como sub-issues.

Los reportes y trazas se guardan como artefactos de GitHub Actions. Las verificaciones actuales de interfaz usan web móvil con API simulada; Android/iOS y staging requieren evidencia adicional. Un job verde no completa automáticamente una historia.

## Responsable

Héctor Santiago Hernández.


## Acceso y navegación

Las pantallas están en `src/app/` y la lógica de sesión en `src/features/auth/`.
La app utiliza Expo Router; `App.tsx` e `index.js` se sustituyeron por su entrada.

Para configurar el acceso, copia `.env.example` a `.env` y completa
`EXPO_PUBLIC_API_URL` con la URL de pruebas del backend, incluyendo `/api`.
Desde un teléfono, usa una dirección accesible en la red; `localhost` apunta al teléfono.
Esta variable es pública: no pongas contraseñas ni secretos en ella.
Reinicia Expo después de configurarla.

```bash
npm start
```

Sin URL configurada, el formulario muestra un aviso y no concede acceso.
El backend debe devolver un token vigente y `role: client`. Las cuentas administrativas
continúan en el sistema web. SecureStore guarda el token en el teléfono;
para pruebas web se usa sessionStorage de la pestaña. No se guarda la contraseña.

Las interfaces móviles incluyen los módulos del documento de diseño. Los catálogos son públicos y los datos de cuenta se consultan con una sesión de cliente; las funciones todavía pendientes están identificadas en pantalla.
Consulta [el avance y la explicación de cada archivo](docs/avance-2026-10-05.md)
para ver qué se comprobó y qué falta probar con servidor real.

## Probar el acceso conectado

La configuración local usa el mismo backend publicado que la web:
`https://esteticaa-backend-five.vercel.app/api`.
Es el entorno publicado, no uno aislado de pruebas. `.env` permanece fuera de Git.

Los comandos `npm start` y `npm run web` usan el puerto **5173**, permitido
por el backend para el navegador. Abre `http://localhost:5173/sign-in`.
Introduce una cuenta de **cliente** existente; las cuentas administrativas siguen en la web.

En Windows puedes abrir la prueba con instrucciones:

```powershell
.\scripts\probar-acceso.cmd
```

Consulta [las comprobaciones de conexión y los pasos de prueba](docs/conexion-backend.md).


## Entrada pública y funciones conectadas

Con `npm start` o `npm run web`, abre http://localhost:5173/.
Los visitantes pueden consultar Servicios, Productos y sus detalles sin cuenta.
Agendar, usar el carrito y consultar el perfil requieren iniciar sesión o registrarse.

El acceso está en http://localhost:5173/sign-in. El registro, la consulta de perfil,
los horarios y la agenda utilizan el backend existente. La confirmación de cita
crea una reserva real. La creación de pedidos, la edición de perfil y las acciones
para cambiar o cancelar citas aún necesitan trabajo en el backend.

Lee [la guía actual de funciones, archivos y pruebas](docs/acceso-publico-2026-10-06.md).
La [guía de interfaces anterior](docs/interfaces-2026-10-06.md) y sus capturas se
conservan como evidencia histórica; sus datos de ejemplo ya se retiraron del flujo actual.
