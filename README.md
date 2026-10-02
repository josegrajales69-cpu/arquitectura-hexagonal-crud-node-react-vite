# Arquitectura Hexagonal (CRUD) Node JS + React + Vite

Proyecto académico para una tienda PC gaming NEXUS con API REST, PostgreSQL y SPA React/Vite. El backend sigue arquitectura hexagonal; el frontend separa módulos y servicios de red.

## Estructura

El árbol detallado de carpetas y archivos está en [`docs/estructura-proyecto.md`](docs/estructura-proyecto.md).

## Entregables

El índice de entrega, con el estado de cada requisito y AWS marcado como pendiente del laboratorio, está en [`docs/entregables.md`](docs/entregables.md). También puedes abrir directamente el [diagrama visual de arquitectura](docs/arquitectura.svg), la [especificación REST](docs/endpoints.md) y la [guía WSL](docs/despliegue-wsl.md).

## Ejecutar en Ubuntu / WSL

Desde Windows Terminal:

```bash
wsl
```

El proyecto está en el espacio de trabajo de Windows. Cópialo a una subcarpeta propia dentro de la actividad para no mezclarlo con otros archivos:

```bash
mkdir -p "$HOME/taller3apiweb/nexus-gaming-store"
cp -r /mnt/c/Users/josem/Documents/Codex/2026-08-10/en-l/taller3apiweb/. "$HOME/taller3apiweb/nexus-gaming-store/"
cd "$HOME/taller3apiweb/nexus-gaming-store"
```

Instala PostgreSQL si aún no está instalado, crea base de datos y ejecuta el esquema:

```bash
sudo apt update
sudo apt install -y postgresql postgresql-contrib
sudo service postgresql start
sudo apt install -y nodejs npm
sudo -u postgres psql -c "CREATE USER nexus WITH PASSWORD 'nexus_dev';"
sudo -u postgres psql -c "CREATE DATABASE nexus_gaming OWNER nexus;"
psql postgresql://nexus:nexus_dev@localhost:5432/nexus_gaming -f backend/database/schema.sql
```

Configura e inicia API:

```bash
cd "$HOME/taller3apiweb/nexus-gaming-store/backend"
cp .env.example .env
npm install
npm run seed
npm run dev
```

En otra pestaña de Terminal, entra a WSL y arranca React:

```bash
wsl
cd "$HOME/taller3apiweb/nexus-gaming-store/frontend"
npm install
npm run dev -- --host 0.0.0.0
```

Vite mostrará una dirección local, normalmente `http://localhost:5173` (si está ocupado, intentará `5174`). API: `http://localhost:4000/api`; comprobación: `http://localhost:4000/health`.

La guía está disponible en [`docs/despliegue-wsl.md`](docs/despliegue-wsl.md).

El script `npm run seed` actualiza el catálogo y crea la cuenta administradora (`admin@nexus.test`, contraseña inicial `NexusAdmin2026!`). Cambia la contraseña antes de publicar el sistema.

## Notificaciones de pedidos por correo

Al registrar una orden, el caso de uso la guarda con estado `pending` (en la interfaz: **Pendiente de Pago**) y después solicita dos notificaciones: una confirmación para la dirección del cliente y un aviso para `ADMIN_EMAIL`. La confirmación incluye las partidas, el total y las instrucciones definidas por `PAYMENT_INSTRUCTIONS`. No se procesa un pago en línea.

El caso de uso depende únicamente del puerto `EmailServicePort`. El adaptador de salida `NodemailerAdapter` implementa dicho contrato y usa el SMTP configurado. El renderizado de los correos está aislado en `emailTemplates.js`. Las credenciales SMTP se leen de `backend/.env`; el repositorio solo incluye valores de ejemplo en `.env.example`. No publiques secretos ni datos bancarios reales.

### Pruebas

```bash
cd backend
npm install
npm test
npm run test:email
```

`npm test` valida el envío al cliente y administrador después de guardar la orden, el estado pendiente, la tolerancia a errores SMTP y el escape de HTML. `npm run test:email` envía mensajes a un buzón temporal de Ethereal y muestra los enlaces de vista previa; no entrega correo real.

Para demostrar también el checkout de React sin PostgreSQL, ejecuta `npm run demo:checkout` en `backend` y configura `VITE_API_URL=http://localhost:4001/api` en `frontend`. El harness usa usuario, artículo y orden ficticios en memoria, pero reutiliza el caso de uso de pedidos y el adaptador Nodemailer. Al detenerlo, los pedidos temporales se pierden. Las capturas de una ejecución se incluyen en el entregable de la actividad.

## Endpoints

| Método | Ruta | Descripción | Acceso |
|---|---|---|---|
| POST | `/api/auth/register` | Registrar cuenta cliente | Público |
| POST | `/api/auth/login` | Iniciar sesión y obtener JWT | Público |
| GET | `/api/users` | Listar usuarios | Admin |
| GET | `/api/users/:id` | Consultar usuario | Propietario/Admin |
| POST | `/api/users` | Crear usuario | Admin |
| PUT | `/api/users/:id` | Actualizar datos/rol | Admin |
| DELETE | `/api/users/:id` | Eliminar usuario | Admin |
| GET | `/api/products` | Catálogo; acepta `?q=` y `?category=` | Público |
| GET | `/api/products/:id` | Consultar producto | Público |
| POST | `/api/products` | Crear producto | Admin |
| PUT | `/api/products/:id` | Actualizar producto/inventario | Admin |
| DELETE | `/api/products/:id` | Eliminar producto | Admin |
| GET | `/api/orders` | Ver pedidos propios (admin ve todos) | JWT |
| GET | `/api/orders/:id` | Consultar pedido propio | JWT |
| POST | `/api/orders` | Crear pedido con uno o más productos | JWT |
| PUT | `/api/orders/:id` | Cambiar estado (admin) | Admin |
| DELETE | `/api/orders/:id` | Cancelar pedido pendiente | Propietario/Admin |

## Diagrama de arquitectura

Consulta el diagrama en [`docs/arquitectura.md`](docs/arquitectura.md) y la tabla completa en [`docs/endpoints.md`](docs/endpoints.md).

Los hashes bcrypt y el servicio JWT están en `backend/src/infrastructure/security/`. Las rutas y controladores REST están en `backend/src/infrastructure/adapters/inbound/http/`.

## Precios e imágenes

Precios de referencia en MXN, consultados el 25-09-2026; pueden cambiar. Las existencias guardadas en la app son inventario propio del catálogo y no se sincronizan con los proveedores. Las fichas enlazan imágenes y referencias comerciales.

- PC Gamer PC-083-A Ryzen 7 / RTX 4060 / 16 GB / SSD 1 TB: $21,369 MXN ([Cyberpuerta](https://www.cyberpuerta.mx/Computadoras/PC-s-de-Escritorio/Computadora-Gamer-PC-Gamer-PC-083-A-AMD-Ryzen-7-5700-NVIDIA-GeForce-RTX-4060-16GB-1TB-SSD-Windows-10-Prueba.html)).
- PC Gamer PC-052-B Ryzen 7 5700X / RTX 4060 / 32 GB / SSD 1 TB: $22,099 MXN ([Cyberpuerta](https://www.cyberpuerta.mx/Computadoras/PC-s-de-Escritorio/Computadora-Gamer-PC-Gamer-PC-052-B-AMD-Ryzen-7-5700X-NVIDIA-GeForce-RTX-4060-32GB-1TB-SSD-Windows-10-Prueba.html)).
- Xtreme PC CM-05528 Ryzen 7 / RTX 5060 / 32 GB / SSD 1 TB: $16,899 MXN; sin existencias según proveedor ([Cyberpuerta](https://www.cyberpuerta.mx/Computadoras/PC-s-de-Escritorio/Computadora-Gamer-Xtreme-PC-Gaming-CM-05528-AMD-Ryzen-7-5700-NVIDIA-GeForce-RTX-5060-32GB-1TB-SSD-Wi-Fi-Windows-10-Prueba.html)).
- Monitor AOC 27G50F 27″ FHD IPS 144 Hz: $2,139 MXN ([Cyberpuerta](https://www.cyberpuerta.mx/Computo-Hardware/Monitores/Monitores/Monitor-Gamer-AOC-27G50F-LCD-IPS-27-1920x1080-Full-HD-G-Sync-FreeSync-144Hz-HDMI-DisplayPort-Negro.html)).
- Mouse Logitech G203 LIGHTSYNC 8,000 DPI: $421 MXN ([Cyberpuerta](https://www.cyberpuerta.mx/Por-Marca/LOGITECH/Mouse-Gamer-Ergonomico-Logitech-G203-LightSync-Alambrico-Optico-8-000DPI-USB-A-Negro.html)).

## AWS (cuando el laboratorio esté activo)

Pendiente de configurar en la cuenta/laboratorio asignado: desplegar API y frontend, PostgreSQL administrado, secretos fuera del repositorio, CORS de producción, HTTPS y reglas de red mínimas. No subir `.env` ni credenciales a Git.
