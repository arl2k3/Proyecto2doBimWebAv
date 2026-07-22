# Arquitectura BetZone v2.0

## Diagrama: Monolito original

```mermaid
graph TD
    Browser["Navegador (HTML/CSS/JS vanilla)"]
    subgraph Monolito["Monolito Node.js + Express :3000"]
        Views["viewRoutes (sirve .html)"]
        API["Rutas REST /api/*"]
        Ctrl["Controllers"]
        Svc["Services"]
        Models["Models Sequelize"]
        Socket["Socket.IO"]
        Mailer["Nodemailer"]
    end
    DB[("SQL Server único\n7 tablas interrelacionadas")]

    Browser --> Views
    Browser --> API
    Browser <--> Socket
    API --> Ctrl --> Svc --> Models --> DB
    Socket --> Models
    Svc --> Mailer
```

## Diagrama: Arquitectura de microservicios

```mermaid
graph TD
    subgraph Client["Cliente"]
        NG["Angular SPA :4200"]
    end

    GW["API Gateway :8080\nJWT · rate-limit · routing · WS proxy"]

    subgraph Services["Microservicios Node.js + Express"]
        AUTH["Auth Service :3001"]
        WALLET["Wallet Service :3002"]
        BET["Betting Service :3003"]
        CASINO["Casino Service :3004"]
        CHAT["Chat Service :3005"]
        NOTIF["Notifications :3006"]
    end

    subgraph Data["Database per Service (PostgreSQL)"]
        AUTHDB[("auth_db")]
        WALLETDB[("wallet_db")]
        BETDB[("betting_db")]
        CASINODB[("casino_db")]
        CHATDB[("chat_db")]
    end

    BUS{{"RabbitMQ\nuser.registered"}}

    NG -->|HTTPS| GW
    NG <-->|WebSocket| GW
    GW --> AUTH & WALLET & BET & CASINO & CHAT
    AUTH --> AUTHDB
    WALLET --> WALLETDB
    BET --> BETDB
    CASINO --> CASINODB
    CHAT --> CHATDB

    BET -->|debit/credit| WALLET
    CASINO -->|debit/credit| WALLET
    AUTH -.publish.-> BUS
    BUS -.consume.-> WALLET
    AUTH -->|email| NOTIF

    subgraph Obs["Observabilidad"]
        PROM["Prometheus"]
        GRAF["Grafana"]
        LOKI["Loki + Promtail"]
    end
    Services -.-> PROM --> GRAF
    Services -.-> LOKI --> GRAF
```

## Bounded Contexts (DDD)

| Contexto | Microservicio | Entidades |
|----------|---------------|-----------|
| Identity & Access | auth-service | User, PasswordResetToken |
| Wallet | wallet-service | Wallet, Transaction |
| Sports Betting | betting-service | Event, Bet |
| Casino Gaming | casino-service | BlackjackGame, MinesGame |
| Real-time Chat | chat-service | Message |
| Notifications | notifications-service | — (stateless) |

## Patrones aplicados

- **API Gateway** — Single entry point, cross-cutting concerns
- **Database per Service** — Aislamiento de datos, independencia de despliegue
- **Event-Driven** — RabbitMQ para creación async de wallets
- **Saga (orquestación simple)** — Betting/Casino: debit → operación → credit (con rollback)
- **Clean Architecture** — routes → controllers → services → models en cada servicio
- **SOLID** — Single Responsibility por microservicio

## Flujo: Colocar apuesta

```mermaid
sequenceDiagram
    participant F as Frontend
    participant G as API Gateway
    participant B as Betting Service
    participant W as Wallet Service

    F->>G: POST /api/bets (JWT)
    G->>G: Validar JWT
    G->>B: Proxy + x-user-id
    B->>W: POST /debit (internal key)
    W-->>B: balance actualizado
    B->>B: Crear registro Bet
    B-->>G: 201 Created
    G-->>F: Apuesta confirmada
```

## Seguridad

| Capa | Implementación |
|------|----------------|
| Autenticación | JWT (HS256), OAuth2/OIDC Google |
| Autorización | Roles user/admin, restrictTo middleware |
| Comunicación interna | x-internal-api-key header |
| Rate limiting | 100 req/min en gateway |
| Headers | Helmet en todos los servicios |
| Secretos | Variables de entorno (.env) |

## Observabilidad

- **Health checks**: `GET /health` en cada servicio
- **Métricas**: `GET /metrics` (Prometheus format)
- **Logs**: Promtail → Loki → Grafana
- **Dashboards**: Grafana con datasource Prometheus + Loki
