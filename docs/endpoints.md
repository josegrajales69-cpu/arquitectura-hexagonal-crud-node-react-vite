# Especificación de endpoints REST

Base local: `http://localhost:4000/api`. La API intercambia JSON. Para rutas protegidas enviar `Authorization: Bearer <token>` y `Content-Type: application/json`. Los identificadores (`:id`) son los IDs numéricos generados por PostgreSQL.

## Convenciones de acceso

| Etiqueta | Significado |
|---|---|
| Público | No requiere iniciar sesión. |
| JWT | Requiere token válido. |
| Propietario/Admin | El recurso debe pertenecer al usuario autenticado o el usuario debe tener rol `admin`. |
| Admin | Requiere token con rol `admin`. |

### Autenticación

| Método | Ruta | Entrada | Resultado | Acceso |
|---|---|---|---|---|
| POST | `/auth/register` | `{ "name": "Nombre", "email": "persona@correo.com", "password": "ClaveSegura1" }` | `201`: usuario público y token JWT | Público |
| POST | `/auth/login` | `{ "email": "persona@correo.com", "password": "ClaveSegura1" }` | `200`: usuario público y token JWT | Público |

El usuario público nunca incluye el hash de contraseña. El token se envía como `Bearer` en las operaciones privadas.

### Usuarios — CRUD

| Método | Ruta | Descripción | Acceso |
|---|---|---|---|
| POST | `/users` | Crear usuario administrativamente. Entrada: `name`, `email`, `password` y `role`. | Admin |
| GET | `/users` | Listar usuarios sin credenciales. | Admin |
| GET | `/users/:id` | Consultar un usuario sin hash. | Propietario/Admin |
| PUT | `/users/:id` | Actualizar datos permitidos, rol o contraseña. | Admin |
| DELETE | `/users/:id` | Eliminar usuario; PostgreSQL lo restringe si tiene pedidos asociados. | Admin |

Registro propio se hace con `POST /auth/register`. No se expone contraseña ni hash en lectura. El correo debe ser único.

### Productos — CRUD

| Método | Ruta | Descripción | Acceso |
|---|---|---|---|
| POST | `/products` | Crear ficha de catálogo e inventario. | Admin |
| GET | `/products` | Listar catálogo; filtros opcionales `?q=texto&category=Monitores`. | Público |
| GET | `/products/:id` | Consultar detalle, precio y stock. | Público |
| PUT | `/products/:id` | Actualizar ficha, precio o stock. | Admin |
| DELETE | `/products/:id` | Eliminar producto sólo si no está referenciado por pedidos. | Admin |

Campos principales al crear/actualizar: `name`, `category`, `description`, `price_mxn`, `stock`, `image_url`; `source_url` es opcional. El precio y el stock no pueden ser negativos.

### Pedidos — CRUD y ciclo de vida

| Método | Ruta | Descripción | Acceso |
|---|---|---|---|
| POST | `/orders` | Crear pedido. Entrada: `{ "items": [{ "productId": 1, "quantity": 2 }] }`. El precio se toma del servidor, no del cliente. | JWT |
| GET | `/orders` | Cliente consulta los propios; admin consulta todos. | JWT |
| GET | `/orders/:id` | Consultar pedido y partidas si pertenece al usuario o es admin. | Propietario/Admin |
| PUT | `/orders/:id` | Administración cambia estado enviando `{ "status": "paid" }`, `shipped` o `cancelled`. | Admin |
| DELETE | `/orders/:id` | Cancela un pedido pendiente propio o administrado y restaura el stock. No elimina el registro histórico. | Propietario/Admin |

Cada pedido contiene uno o más productos en `order_items`. La creación valida stock y actualiza inventario en una transacción; ante stock insuficiente no se guarda parcialmente. Estados aceptados por el modelo: `pending`, `paid`, `shipped`, `cancelled`.

## Respuestas y errores esperados

- `200 OK`: consulta o actualización completada.
- `201 Created`: alta de usuario, producto o pedido.
- `400 Bad Request`: datos inválidos o regla de negocio incumplida.
- `401 Unauthorized`: falta token o token inválido.
- `403 Forbidden`: autenticado sin permisos sobre la operación/recurso.
- `404 Not Found`: recurso inexistente.
- `409 Conflict`: correo duplicado o eliminación que viola relaciones existentes.
- `500 Internal Server Error`; `503 Service Unavailable` en `/health` si PostgreSQL no responde.

Comprobación de servicio (fuera del prefijo `/api`): `GET http://localhost:4000/health`.
