# Estructura del repositorio NEXUS

Raíz del repositorio: `taller3apiweb/`. Se excluyen `node_modules/`, `dist/`, archivos `.env` y otros artefactos generados porque se regeneran localmente y no forman parte del código fuente entregable.

```text
taller3apiweb/
├── README.md
├── .gitignore
├── backend/
│   ├── package.json
│   ├── .env.example
│   ├── database/
│   │   └── schema.sql
│   └── src/
│       ├── server.js
│       ├── domain/
│       │   ├── entities/
│       │   │   ├── User.js
│       │   │   ├── Product.js
│       │   │   └── Order.js
│       │   └── errors/
│       │       └── DomainError.js
│       ├── application/
│       │   ├── ports/
│       │   │   ├── UserRepository.js
│       │   │   ├── ProductRepository.js
│       │   │   ├── OrderRepository.js
│       │   │   └── PasswordHasher.js
│       │   └── use-cases/
│       │       ├── auth.js
│       │       ├── users.js
│       │       ├── products.js
│       │       └── orders.js
│       └── infrastructure/
│           ├── adapters/
│           │   ├── inbound/http/
│           │   │   ├── controllers.js
│           │   │   └── middleware.js
│           │   └── outbound/
│           │       └── PostgresRepository.js
│           ├── config/
│           │   ├── database.js
│           │   └── seed.js
│           └── security/
│               ├── BcryptPasswordHasher.js
│               └── JwtTokenService.js
├── frontend/
│   ├── package.json
│   ├── .env.example
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── styles.css
│       ├── modules/
│       │   ├── auth/AuthModal.jsx
│       │   ├── catalog/ProductCard.jsx
│       │   └── orders/OrderList.jsx
│       └── services/api.js
└── docs/
    ├── entregables.md
    ├── arquitectura.md
    ├── arquitectura.svg
    ├── endpoints.md
    ├── estructura-proyecto.md
    └── despliegue-wsl.md
```

Backend: Node.js + Express (ES modules), PostgreSQL (`pg`), bcryptjs y JWT. Frontend: React 18 + Vite. Los contratos y las decisiones de arquitectura se describen en [arquitectura](arquitectura.md); los comandos para correr el código en [guía WSL](despliegue-wsl.md).
