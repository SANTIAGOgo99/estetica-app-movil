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

## Responsable

Héctor Santiago Hernández.
