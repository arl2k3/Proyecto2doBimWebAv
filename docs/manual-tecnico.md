# Manual Técnico — BetZone Microservicios

## Requisitos

- Docker Desktop 4.x+
- Docker Compose v2
- Node.js 20+ (desarrollo local)
- 8 GB RAM mínimo para stack completo

## Variables de entorno críticas

| Variable | Servicio | Descripción |
|----------|----------|-------------|
| JWT_SECRET | Gateway, Auth, Betting, Casino, Chat | Clave compartida para firmar/verificar tokens |
| INTERNAL_API_KEY | Todos los backends | Autenticación service-to-service |
| RABBITMQ_URL | Auth, Wallet | Conexión AMQP |
| GOOGLE_CLIENT_ID/SECRET | Auth | OAuth2 (opcional) |
| SMTP_* | Notifications | Configuración email |

## Endpoints API (vía Gateway :8080)

### Auth — `/api/auth`
| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | /register | No | Registro |
| POST | /login | No | Login → JWT |
| POST | /logout | No | Logout |
| GET | /me | JWT | Perfil + balance |
| POST | /forgot-password | No | Solicitar reset |
| POST | /reset-password | No | Resetear password |
| GET | /google | No | OAuth redirect |
| GET | /google/callback | No | OAuth callback |

### Wallet — `/api/wallet`
| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | /recharge | JWT | Recargar saldo |

### Betting — `/api/events`, `/api/bets`
| Método | Ruta | Auth | Rol | Descripción |
|--------|------|------|-----|-------------|
| GET | /events | JWT | user | Listar eventos |
| POST | /events | JWT | admin | Crear evento |
| POST | /events/:id/resolve | JWT | admin | Resolver y pagar |
| POST | /bets | JWT | user | Colocar apuesta |
| GET | /bets/history | JWT | user | Historial |

### Casino — `/api/blackjack`, `/api/mines`
Endpoints idénticos al monolito (start, hit, stand, double, split, reveal, cashout, active, history).

### Chat — `/api/chat`, WebSocket
| Evento | Dirección | Descripción |
|--------|-----------|-------------|
| joinRoom | Client→Server | Unirse a sala |
| sendMessage | Client→Server | Enviar mensaje |
| message | Server→Client | Mensaje broadcast |
| sysMessage | Server→Client | Mensaje sistema |

## Comunicación inter-servicios

```
Betting/Casino → Wallet:
  POST /api/wallet/debit  { userId, amount, reference, description, source }
  POST /api/wallet/credit { userId, amount, reference, description, source }
  Header: x-internal-api-key

Auth → Notifications:
  POST /api/notifications/email { to, subject, html }
  Header: x-internal-api-key

Auth → RabbitMQ:
  Publish: user.registered { userId, initialBalance }

Wallet ← RabbitMQ:
  Consume: user.registered → createWallet()
```

## Troubleshooting

| Problema | Solución |
|----------|----------|
| `502 Servicio no disponible` | Verificar `docker compose ps` y logs del servicio |
| Balance = 0 tras registro | RabbitMQ caído; crear wallet manual: POST /api/wallet/create |
| Socket no conecta | Verificar JWT en auth.token; gateway debe proxy /socket.io |
| OAuth no funciona | Configurar GOOGLE_CLIENT_ID/SECRET en .env |

## Monitoreo

```bash
# Health de todos los servicios
curl http://localhost:8080/health
curl http://localhost:3001/health  # auth (directo, debug)

# Métricas Prometheus
curl http://localhost:9090/targets

# Logs centralizados
# Grafana → Explore → Loki → {container="betzone-betting-service"}
```
