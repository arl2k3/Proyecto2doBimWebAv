# Plan de Migración — Monolito → Microservicios

## Fase 0: Análisis ✅

- [x] Inventariar módulos, entidades, rutas API y dependencias
- [x] Identificar bounded contexts (6 dominios)
- [x] Detectar acoplamiento crítico: `user.balance` compartido
- [x] Documentar arquitectura actual y propuesta

## Fase 1: Infraestructura base ✅

- [x] Crear estructura `Proyecto2doBimWebAv/`
- [x] Configurar `backend/shared/` (helpers, middleware)
- [x] Docker Compose con 5 PostgreSQL + RabbitMQ
- [x] `.env.example` con todas las variables

## Fase 2: Microservicios core ✅

| Servicio | Origen monolito | Cambios clave |
|----------|-----------------|---------------|
| auth-service | authService, authController, User model | User sin balance; OAuth2 Google; RabbitMQ publish |
| wallet-service | userService.updateBalance | Nuevo: Wallet + Transaction ledger |
| betting-service | eventService, betService | walletClient en lugar de User.balance |
| casino-service | blackjackService, minesService | walletClient en lugar de User.balance |
| chat-service | chatSocket, Message model | username/role denormalizados |
| notifications-service | mailer.js | Stateless, internal API |

## Fase 3: API Gateway ✅

- [x] Proxy HTTP a todos los servicios
- [x] Validación JWT centralizada
- [x] Propagación x-user-id / x-user-role
- [x] WebSocket proxy para Socket.IO
- [x] Rate limiting

## Fase 4: Frontend Angular ✅

- [x] SPA standalone Angular 19
- [x] Auth interceptor (Bearer JWT)
- [x] Servicios por dominio (auth, betting, casino, chat, wallet)
- [x] Componentes: login, register, dashboard, chat, blackjack, mines
- [x] Dockerfile + nginx

## Fase 5: Dockerización ✅

- [x] Dockerfile por servicio (build context: `backend/`)
- [x] docker-compose.yml orquestando 15+ contenedores
- [x] Health checks y depends_on

## Fase 6: Observabilidad ✅

- [x] Prometheus scraping /metrics
- [x] Grafana dashboards provisioning
- [x] Loki + Promtail para logs centralizados

## Fase 7: DevOps ✅

- [x] GitHub Actions CI/CD (.github/workflows/ci-cd.yml)
- [x] Build + push Docker images a ghcr.io

## Fase 8: Kubernetes (extra) ✅

- [x] Namespace, Deployments, Services
- [x] ConfigMaps, Secrets
- [x] Ingress

## Archivos: crear / modificar / eliminar

### Creados (Proyecto2doBimWebAv/)
```
backend/api-gateway/
backend/auth-service/
backend/wallet-service/
backend/betting-service/
backend/casino-service/
backend/chat-service/
backend/notifications-service/
backend/shared/
frontend/
infrastructure/
k8s/
docs/
scripts/database/
docker-compose.yml
.github/workflows/
```

### Reutilizados del monolito (lógica adaptada)
```
authService.js      → auth-service (sin balance, + OAuth, + RabbitMQ)
eventService.js     → betting-service (+ walletClient)
betService.js       → betting-service (+ walletClient)
blackjackService.js → casino-service (+ walletClient)
minesService.js     → casino-service (+ walletClient)
chatSocket.js       → chat-service
mailer.js           → notifications-service
hash.js, helpers.js → backend/shared/
validators.js       → auth-service, betting-service
Models Event,Bet,Blackjack,Mines,Message → respectivos servicios
```

### No migrados (reemplazados)
```
viewRoutes.js       → Angular routing
public/js/*.js      → Angular components + services
public/css/*.js     → Angular SCSS
views/*.html        → Angular templates
config/db.js (mssql)→ PostgreSQL por servicio
src/app.js monolito → 7 apps independientes
```

### Sin cambios (referencia)
```
Proyecto1erBimWebAv/  → Se mantiene intacto como referencia del 1er bimestre
```

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| Consistencia de saldo cross-service | Wallet Service con transacciones atómicas + rollback |
| Wallet no creado al registrar | RabbitMQ event + endpoint manual /create |
| Latencia inter-servicio | Red Docker interna (<1ms); acceptable para demo |
| SQL Server → PostgreSQL | Sequelize abstrae dialecto; modelos adaptados |
