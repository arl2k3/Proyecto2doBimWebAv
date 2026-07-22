# Guion de Presentación Final — BetZone v2.0

**Duración estimada:** 15-20 minutos  
**Participantes:** 1-2 presentadores

---

## 1. Introducción (2 min)

> "Presentamos **BetZone v2.0**, la evolución de nuestra plataforma de apuestas deportivas y casino desde una arquitectura monolítica hacia **microservicios desacoplados**, cumpliendo los requisitos del segundo bimestre de Web Avanzado."

**Puntos clave:**
- Proyecto original: monolito Node.js + Express + SQL Server (1er bimestre)
- Objetivo: separar frontend/backend, microservicios, Docker, observabilidad
- Stack: Angular 19, Node.js, PostgreSQL, RabbitMQ, Prometheus, Grafana

---

## 2. Problema del monolito (2 min)

**Mostrar diagrama Mermaid (arquitectura actual)**

> "El monolito funcionaba, pero tenía limitaciones:"

1. **Acoplamiento de saldo** — `user.balance` mutado por 4 servicios distintos
2. **Escalabilidad** — Un solo proceso Node.js para todo
3. **Despliegue** — Cambio en chat requiere redeploy de apuestas
4. **Frontend acoplado** — HTML servido por Express, sin SPA moderna
5. **Base de datos única** — 7 tablas con FK cruzadas

---

## 3. Análisis DDD — Bounded Contexts (2 min)

> "Aplicamos Domain-Driven Design para identificar 6 contextos delimitados:"

| Contexto | Entidades | Microservicio |
|----------|-----------|---------------|
| Identidad | User, ResetToken | auth-service |
| Cartera | Wallet, Transaction | wallet-service |
| Apuestas | Event, Bet | betting-service |
| Casino | Blackjack, Mines | casino-service |
| Chat | Message | chat-service |
| Notificaciones | — | notifications-service |

**Decisión clave:** Extraer Wallet como servicio independiente.

---

## 4. Arquitectura propuesta (3 min)

**Mostrar diagrama Mermaid (microservicios)**

> "La nueva arquitectura tiene:"

- **Frontend Angular** desacoplado, consume API Gateway
- **API Gateway** — JWT, rate-limit, routing, WebSocket proxy
- **6 microservicios** con Database per Service (PostgreSQL)
- **RabbitMQ** — evento async `user.registered` → crea wallet
- **Observabilidad** — Prometheus + Grafana + Loki

**Demo en vivo:** `docker compose up -d` → mostrar contenedores levantándose

---

## 5. Demo funcional (5 min)

### 5.1 Registro y login
- Registrar usuario → RabbitMQ crea wallet con $1000
- Login → JWT en localStorage

### 5.2 Apuestas deportivas
- Admin crea evento "Real Madrid vs Barcelona"
- Usuario apuesta $100 al empate
- Mostrar débito en wallet (transacción ledger)
- Admin resuelve → crédito automático a ganadores

### 5.3 Casino
- Blackjack: repartir, hit, stand
- Mines: revelar celdas, cashout

### 5.4 Chat en tiempo real
- Dos ventanas/navegadores
- Unirse a sala "laliga", enviar mensajes

### 5.5 OAuth (si configurado)
- Login con Google

---

## 6. Seguridad (2 min)

- JWT Authentication (Bearer header)
- OAuth 2.0 / OpenID Connect (Google)
- Control de roles (user/admin)
- API Key interna service-to-service
- Rate limiting (100 req/min)
- Helmet + CORS
- Variables de entorno para secretos

---

## 7. DevOps y observabilidad (2 min)

**Mostrar Grafana dashboard**

- Health checks en cada servicio
- Prometheus scraping métricas
- Logs centralizados con Loki
- CI/CD con GitHub Actions (build → test → push Docker)
- Manifiestos Kubernetes (Deployments, Services, Ingress)

---

## 8. Conclusiones (1 min)

> "La migración demuestra:"

1. ✅ Separación frontend/backend (Angular + microservicios)
2. ✅ Database per Service con PostgreSQL
3. ✅ Docker Compose: `docker compose up -d` levanta todo
4. ✅ Funcionalidad 100% preservada del monolito
5. ✅ Patrones DDD, SOLID, Clean Architecture
6. ✅ Observabilidad y CI/CD production-ready

**Preguntas**

---

## Material de apoyo

- Repositorio: `Proyecto2doBimWebAv/`
- Monolito original: `Proyecto1erBimWebAv/` (referencia)
- Docs: `docs/arquitectura.md`, `docs/migracion.md`
- README con instrucciones de instalación
