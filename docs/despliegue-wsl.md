# Guía de ejecución en Ubuntu WSL y navegador Windows

El backend, el frontend y PostgreSQL se ejecutan dentro de Ubuntu en WSL. Windows Terminal se usa para abrir la consola Linux escribiendo `wsl`; Opera/Edge/Chrome en Windows puede abrir los puertos publicados por WSL usando `localhost`.

> No uses `cd "~/carpeta"`: al poner `~` entre comillas Bash ya no lo expande. Usa `cd ~/carpeta` o `cd "$HOME/carpeta"`.

## A. Preparación inicial (una sola vez)

Abre Windows Terminal, entra a Ubuntu y comprueba Node.js/npm:

```bash
wsl
node --version
npm --version
```

Si los comandos no existen, instala las herramientas y PostgreSQL en WSL:

```bash
sudo apt update
sudo apt install -y nodejs npm postgresql postgresql-contrib
```

El proyecto del workspace Windows se copia a la carpeta Linux de la actividad; no modifica ni borra la carpeta anterior `~/taller3apiweb`:

```bash
mkdir -p "$HOME/taller3apiweb/nexus-gaming-store"
cp -r /mnt/c/Users/josem/Documents/Codex/2026-08-10/en-l/taller3apiweb/. "$HOME/taller3apiweb/nexus-gaming-store/"
cd "$HOME/taller3apiweb/nexus-gaming-store"
```

Inicia el servicio y crea usuario/base sólo la primera vez. Si ya existen, no repitas `CREATE USER`/`CREATE DATABASE`:

```bash
sudo service postgresql start
sudo -u postgres psql
```

En el prompt `postgres=#`, escribe una línea a la vez:

```sql
CREATE USER nexus WITH PASSWORD 'nexus_dev';
CREATE DATABASE nexus_gaming OWNER nexus;
\q
```

Aplica el esquema (puedes repetir este paso, las tablas se definen con `IF NOT EXISTS`):

```bash
cd "$HOME/taller3apiweb/nexus-gaming-store"
psql postgresql://nexus:nexus_dev@localhost:5432/nexus_gaming -f "$HOME/taller3apiweb/nexus-gaming-store/backend/database/schema.sql"
```

## B. Iniciar API (terminal/pestaña 1)

En Windows Terminal abre una pestaña nueva, entra a WSL y ejecuta:

```bash
wsl
sudo service postgresql start
cd "$HOME/taller3apiweb/nexus-gaming-store/backend"
cp .env.example .env
npm install
npm run seed
npm run dev
```

La API queda en `http://localhost:4000/api`. Revisa `http://localhost:4000/health`; debe responder `{"status":"ok","service":"nexus-gaming-api"}`. Deja esta terminal abierta mientras trabajas.

## C. Iniciar React/Vite (terminal/pestaña 2)

Abre otra pestaña de Windows Terminal:

```bash
wsl
cd "$HOME/taller3apiweb/nexus-gaming-store/frontend"
cp .env.example .env
npm install
npm run dev -- --host 0.0.0.0
```

Abre la dirección que muestre Vite. Normalmente es `http://localhost:5173`; si ese puerto está ocupado, Vite usa `http://localhost:5174`. En esta instalación, el navegador se abre en `http://localhost:5174/`. Mantén abierta también esta terminal.

## Cuenta de prueba y seguridad

La semilla prepara el catálogo y la cuenta administradora: `admin@nexus.test` / `NexusAdmin2026!`. No uses esta clave en producción. `npm run seed` puede volver a dejar la contraseña inicial en esa cuenta; evita ejecutarlo después de cambiarla si no quieres restablecerla.

El `.env` local no se debe subir al repositorio. Antes de publicar cambia `JWT_SECRET`, la contraseña de base de datos, credenciales, dominios CORS y datos de cuenta. Para cerrar los servidores, pulsa `Ctrl+C` en cada terminal; para apagar WSL se puede cerrar sesión con `exit`.

## AWS — pendiente del laboratorio

No se ha desplegado en AWS. Cuando actives el laboratorio hay que seleccionar los servicios/recursos permitidos y documentar región, configuración de red, base de datos, secretos, despliegue de API y frontend, HTTPS/CORS y prueba desde navegador. No inventar endpoints, credenciales ni capturas de AWS antes de tener acceso al laboratorio.
