# Entregables de la actividad — NEXUS PC Gaming

## Lista de entrega

| N.º | Entregable | Archivo/evidencia | Estado |
|---:|---|---|---|
| 1 | Diagrama arquitectónico del backend hexagonal. | [Diagrama SVG](arquitectura.svg) y [explicación de capas](arquitectura.md). | Preparado |
| 2 | Especificación ordenada de endpoints CRUD para usuarios, productos y pedidos. | [Especificación REST](endpoints.md). | Preparado y contrastado con las rutas del servidor |
| 3 | Repositorio con servidor Node.js y cliente React/Vite. | Código en `backend/` y `frontend/`; [árbol completo](estructura-proyecto.md). | Preparado |
| 4 | Guía de despliegue en WSL y acceso desde navegador Windows. | [Guía WSL](despliegue-wsl.md). | Preparada; usa los puertos locales 4000 y 5174 |
| 5 | Despliegue en AWS cuando se active el laboratorio. | Ver apartado AWS abajo. | **Pendiente** — laboratorio aún no activo |

## Criterios cubiertos

- Persistencia PostgreSQL para usuarios, productos, pedidos y partidas de pedido, con claves foráneas, restricciones y transacción para crear/cancelar pedidos.
- Separación de dominio, casos de uso/puertos y adaptadores de entrada/salida.
- Contraseñas verificadas y almacenadas como hash bcrypt; autenticación mediante JWT y permisos de administración.
- API REST para operaciones CRUD de las tres entidades. Para pedidos, borrar se modela de forma segura como cancelación lógica que conserva historial y repone stock cuando corresponde.
- SPA React/Vite con registro/acceso, catálogo y carrito, pedidos y acceso de gestión de catálogo según rol.
- Instrucciones para ejecutar ambos servidores y consumir la SPA desde el navegador del host Windows.

## Pendiente: AWS

Este punto no se declara completado hasta que el laboratorio AWS esté habilitado y se pueda verificar un despliegue real. Al activarlo, completar recursos aprobados por el laboratorio, región, configuración de red, variables/secretos seguros, base de datos, API, frontend, HTTPS/CORS y pruebas. Agregar capturas de la consola y del sitio sólo después de realizar esas verificaciones; no deben aparecer claves, tokens ni contraseñas.

## Navegación rápida

- [README del proyecto](../README.md)
- [Arquitectura](arquitectura.md)
- [Endpoints](endpoints.md)
- [Estructura](estructura-proyecto.md)
- [Despliegue local en WSL](despliegue-wsl.md)
