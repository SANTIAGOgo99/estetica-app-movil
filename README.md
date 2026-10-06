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

## Estrategia de ramas

- main: contiene versiones estables del proyecto.
- eature/nombre-funcion: utilizada para nuevas funcionalidades.
- ix/nombre-error: utilizada para correcciones.

Las modificaciones se desarrollan en ramas independientes antes de integrarse a main.

## Gestión del proyecto

La planeación y seguimiento de historias de usuario, tareas, prioridades y Sprints se realiza mediante GitHub Projects.

## Validación continua

Los push y Pull Requests ejecutan GitHub Actions con Node.js 22.13.1,
`npm ci`, `npx tsc --noEmit`, `npm run lint` y `npm test` (16 casos de autenticación).

Para validar cambios localmente:

```bash
npm ci
npm run typecheck
npm run lint
npm test
```

La planeación está en [GitHub Projects](https://github.com/users/SANTIAGOgo99/projects/1).
HU00–HU17 son Issues padre; las actividades específicas son sub-issues.
Las pruebas compartidas indican las historias cubiertas en su descripción.
Los títulos de pruebas están en mayúsculas y usan el label violeta `PRUEBA`.
El cierre de una tarea requiere evidencia; un Issue calendarizado no implica
que la funcionalidad o la prueba ya se haya ejecutado.

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

Las interfaces móviles incluyen los módulos del documento de prototipos. El modo de demostración permite recorrerlas con datos de ejemplo; las operaciones reales pendientes están identificadas en pantalla.
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


## Probar las interfaces de los módulos

Con `npm start` o `npm run web`, abre http://localhost:5173/preview/welcome.
La demostración solo está disponible durante desarrollo. No requiere iniciar sesión y no crea cuentas, citas ni pedidos reales. La barra superior permite elegir cualquiera de las 16 interfaces.

El acceso real continúa en http://localhost:5173/sign-in, con una cuenta de cliente existente.

Lee [la guía de interfaces, archivos y pruebas](docs/interfaces-2026-10-06.md).
