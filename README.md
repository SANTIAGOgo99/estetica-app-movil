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
`npm ci`, `npx tsc --noEmit` y `npm run lint`. No se ejecutan pruebas
automatizadas hasta que existan casos y un comando real en el proyecto.

Para validar cambios localmente:

```bash
npm ci
npm run typecheck
npm run lint
```

La planeación está en [GitHub Projects](https://github.com/users/SANTIAGOgo99/projects/1).
HU00–HU17 son Issues padre; las actividades específicas son sub-issues.
Las pruebas compartidas indican las historias cubiertas en su descripción.
Los títulos de pruebas están en mayúsculas y usan el label violeta `PRUEBA`.
El cierre de una tarea requiere evidencia; un Issue calendarizado no implica
que la funcionalidad o la prueba ya se haya ejecutado.

## Responsable

Héctor Santiago Hernández.
