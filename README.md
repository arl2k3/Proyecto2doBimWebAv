# 🏆 BetZone v2.0 — Arquitectura de Microservicios

> Refactorización del monolito **Proyecto1erBimWebAv** hacia una arquitectura moderna desacoplada.

## Inicio rápido

```bash
cd Proyecto2doBimWebAv
cp .env.example .env
docker compose up -d
```

| Servicio | URL |
|----------|-----|
| Frontend (Angular) | http://localhost:4200 |
| API Gateway | http://localhost:8080 |
| Grafana | http://localhost:3000 |
| Prometheus | http://localhost:9090 |

## Estructura del proyecto

```
Proyecto2doBimWebAv/
├── backend/
│   ├── api-gateway/          # Punto de entrada único (JWT, rate-limit, proxy)
│   ├── auth-service/         # Identidad, JWT, OAuth2/OIDC
│   ├── wallet-service/       # Saldo y ledger de transacciones
│   ├── betting-service/      # Eventos deportivos y apuestas
│   ├── casino-service/       # Blackjack y Mines
│   ├── chat-service/         # Chat en tiempo real (Socket.IO)
│   ├── notifications-service/# Envío de emails
│   └── shared/               # Middleware y utilidades compartidas
├── frontend/                 # Angular 19 SPA
├── infrastructure/           # Prometheus, Grafana, Loki
├── k8s/                      # Manifiestos Kubernetes
├── docs/                     # Documentación técnica
├── scripts/database/         # Scripts de inicialización
├── docker-compose.yml
└── .github/workflows/        # CI/CD
```

## Microservicios

| Servicio | Puerto | Base de datos | Responsabilidad |
|----------|--------|---------------|-----------------|
| API Gateway | 8080 | — | Routing, JWT, rate-limit, WS proxy |
| Auth | 3001 | auth_db | Registro, login, OAuth2, reset password |
| Wallet | 3002 | wallet_db | Balance, débitos, créditos, ledger |
| Betting | 3003 | betting_db | Eventos, apuestas, resolución |
| Casino | 3004 | casino_db | Blackjack, Mines |
| Chat | 3005 | chat_db | Mensajes, Socket.IO |
| Notifications | 3006 | — | Emails SMTP |

## Decisiones arquitectónicas

1. **PostgreSQL por servicio** — Reemplaza SQL Server monolítico por contenedores Docker nativos (Database per Service).
2. **Wallet Service separado** — Desacopla el saldo de `users`; betting y casino llaman vía REST interno.
3. **RabbitMQ** — Evento `user.registered` crea wallet automáticamente (comunicación async).
4. **JWT en Bearer header** — Frontend Angular almacena token en localStorage (vs cookies HttpOnly del monolito).
5. **OAuth2/OIDC** — Google como proveedor externo (Passport.js).
6. **API Gateway** — Punto único de entrada; valida JWT y propaga `x-user-id`/`x-user-role`.

## Desarrollo local (sin Docker)

```bash
# Terminal 1: Infraestructura
docker compose up -d auth-db wallet-db betting-db casino-db chat-db rabbitmq

# Terminal 2-8: Cada microservicio
cd backend/auth-service && npm install && npm run dev
cd backend/wallet-service && npm install && npm run dev
# ... etc

# Frontend
cd frontend && npm install && npm start
```

## Documentación adicional

- [Arquitectura y diagramas](docs/arquitectura.md)
- [Plan de migración](docs/migracion.md)
- [Manual técnico](docs/manual-tecnico.md)
- [Guion de presentación](docs/guion-presentacion.md)

## Usuario admin de prueba

Tras el primer registro, promover a admin en PostgreSQL:

```sql
-- Conectar a auth_db
UPDATE users SET role = 'admin' WHERE email = 'tu@email.com';
```

## Licencia

Proyecto académico — Web Avanzado 2026-A.
