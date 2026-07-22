# BetZone v2.0 — Observabilidad, DevOps y Cumplimiento de Rúbrica

Documento de referencia para la evaluación y la presentación del proyecto. Describe **dónde está cada pieza**, **si está integrada** y **cómo usar/ingresar** a las herramientas implementadas (Prometheus, Grafana, Loki, Promtail).

> Todo lo descrito vive en `Proyecto2doBimWebAv/` y está integrado en `docker-compose.yml` (y replicado en `k8s/` para Kubernetes).

---

## Tabla de contenidos

1. [Arranque del stack completo](#1-arranque-del-stack-completo)
2. [Mapa de puertos y URLs](#2-mapa-de-puertos-y-urls)
3. [Tutorial: Prometheus](#3-tutorial-prometheus)
4. [Tutorial: Grafana](#4-tutorial-grafana)
5. [Tutorial: Loki (logs)](#5-tutorial-loki-logs)
6. [Tutorial: Promtail](#6-tutorial-promtail)
7. [Cómo se integra todo (flujo)](#7-cómo-se-integra-todo-flujo)
8. [Cumplimiento de la rúbrica](#8-cumplimiento-de-la-rúbrica)
9. [DevOps / CI-CD](#9-devops--cicd)
10. [Kubernetes (extra)](#10-kubernetes-extra)
11. [Checklist antes de presentar](#11-checklist-antes-de-presentar)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. Arranque del stack completo

```bash
cd Proyecto2doBimWebAv
cp .env.example .env      # si aún no tienes .env
docker compose up -d
```

Verifica que todo esté arriba:

```bash
docker compose ps
```

Todos los contenedores deben aparecer como `running` / `healthy`. Esto incluye:

- 7 microservicios backend + API Gateway
- 5 bases de datos PostgreSQL
- RabbitMQ
- **Prometheus, Loki, Promtail, Grafana** (observabilidad)
- Frontend (Angular + nginx)

---

## 2. Mapa de puertos y URLs

| Herramienta | URL | Credenciales | Para qué sirve |
|-------------|-----|--------------|----------------|
| **Frontend (Angular)** | http://localhost:4200 | — | La aplicación BetZone |
| **API Gateway** | http://localhost:8080 | JWT | Entrada única al backend |
| **Grafana** | http://localhost:3000 | `admin` / `admin` | Ver métricas y logs (UI principal) |
| **Prometheus** | http://localhost:9090 | — | Motor de métricas |
| **Loki** | http://localhost:3100 | — | Almacén de logs (se consulta vía Grafana) |
| **Promtail** | *(sin interfaz)* | — | Agente que recolecta logs de Docker |
| **RabbitMQ** | http://localhost:15672 | ver `.env` | Cola de mensajes (si está expuesto) |

> Las credenciales de Grafana se definen en `.env`:
> ```
> GRAFANA_ADMIN_USER=admin
> GRAFANA_ADMIN_PASSWORD=admin
> ```

---

## 3. Tutorial: Prometheus

**Qué es:** sistema que "raspa" (scrape) métricas HTTP de cada microservicio cada 15 segundos y las guarda como series temporales.

**Configuración:** `infrastructure/prometheus/prometheus.yml`
Cada microservicio expone `GET /metrics` (formato Prometheus) gracias a `backend/shared/middleware/healthCheck.js` (usa la librería `prom-client`).

### Cómo ingresar y usarlo

1. Abre **http://localhost:9090**.
2. Ve a **Status → Targets** (menú superior).
   - Deberías ver todos los jobs en estado **UP**:
     `api-gateway`, `auth-service`, `wallet-service`, `betting-service`, `casino-service`, `chat-service`, `notifications-service`.
   - Si alguno está **DOWN**, ese servicio no está corriendo o no expone `/metrics`.
3. Ve a la pestaña **Graph** y prueba consultas (PromQL):

   ```promql
   # Uso de CPU acumulado por proceso
   process_cpu_user_seconds_total

   # Memoria residente del proceso (bytes)
   process_resident_memory_bytes

   # Número de handles/descriptores abiertos
   nodejs_active_handles_total

   # Segundos desde que arrancó cada servicio
   process_start_time_seconds
   ```

4. Pulsa **Execute** y cambia entre **Table** y **Graph** para ver los valores.

### Verificación rápida por terminal

```bash
# Ver métricas crudas de un servicio (vía gateway)
curl http://localhost:8080/metrics

# Ver el estado de los targets en JSON
curl http://localhost:9090/api/v1/targets
```

---

## 4. Tutorial: Grafana

**Qué es:** la interfaz visual donde se ven **métricas (desde Prometheus)** y **logs (desde Loki)**. Es la herramienta principal para la demo.

**Configuración:** `infrastructure/grafana/provisioning/`
- `datasources/datasources.yml` → Prometheus y Loki ya vienen **conectados automáticamente**.
- `dashboards/dashboard.yml` → carpeta donde se cargarían dashboards JSON (actualmente vacía).

### Cómo ingresar

1. Abre **http://localhost:3000**.
2. Inicia sesión con `admin` / `admin` (te pedirá cambiar la contraseña la primera vez; puedes omitirlo con "Skip").

### Ver métricas (Prometheus)

1. Menú lateral → **Explore** (ícono de brújula).
2. Arriba, selecciona el datasource **Prometheus**.
3. Escribe una consulta, por ejemplo:
   ```promql
   process_resident_memory_bytes
   ```
4. Pulsa **Run query**. Verás la gráfica de memoria por servicio.

### Ver logs (Loki)

1. Menú lateral → **Explore**.
2. Selecciona el datasource **Loki**.
3. En el modo **Builder** o **Code**, usa una consulta LogQL:
   ```logql
   {container="betzone-betting-service"}
   ```
4. Pulsa **Run query**. Verás los logs en tiempo real de ese contenedor.

Otros contenedores que puedes consultar:
```
{container="betzone-api-gateway"}
{container="betzone-auth-service"}
{container="betzone-chat-service"}
{container="betzone-casino-service"}
```

Filtrar por texto dentro del log:
```logql
{container="betzone-auth-service"} |= "error"
```

### Crear un dashboard (opcional para la demo)

1. Menú lateral → **Dashboards → New → New dashboard**.
2. **Add visualization** → elige datasource **Prometheus**.
3. Pega una consulta (ej. `process_resident_memory_bytes`) y **Apply**.
4. Repite para añadir paneles de logs (datasource Loki).
5. **Save dashboard** (ícono de disquete).

---

## 5. Tutorial: Loki (logs)

**Qué es:** la base de datos de logs (como "Prometheus pero para logs"). **No se navega directamente**; se consulta desde Grafana.

**Configuración:** `infrastructure/loki/loki-config.yml`
- Escucha en el puerto **3100**.
- Retención de logs: **168h (7 días)**.

### Cómo comprobar que está vivo

```bash
# Endpoint de salud de Loki
curl http://localhost:3100/ready
# Respuesta esperada: "ready"
```

Para **ver** los logs, usa Grafana → Explore → datasource **Loki** (ver sección anterior).

### Lenguaje de consulta (LogQL) — ejemplos

```logql
# Todos los logs del gateway
{container="betzone-api-gateway"}

# Solo líneas que contengan "error"
{container="betzone-betting-service"} |= "error"

# Excluir ruido de health checks
{container="betzone-auth-service"} != "/health"
```

---

## 6. Tutorial: Promtail

**Qué es:** el **agente recolector**. Lee la salida estándar de los contenedores Docker y la envía a Loki. **No tiene interfaz gráfica.**

**Configuración:** `infrastructure/promtail/promtail-config.yml`
- Lee el socket de Docker (`/var/run/docker.sock`) y los logs en `/var/lib/docker/containers`.
- Etiqueta cada log con el nombre del contenedor y el servicio de Docker Compose.
- Envía a Loki en `http://loki:3100/loki/api/v1/push`.

### Cómo comprobar que funciona

```bash
# Ver logs del propio Promtail
docker logs betzone-promtail

# Si Promtail está enviando datos, en Grafana → Explore → Loki
# aparecerán logs al consultar {container="..."}
```

> No necesitas configurar nada manualmente: en cuanto un contenedor escribe en consola, Promtail lo captura y lo manda a Loki automáticamente.

---

## 7. Cómo se integra todo (flujo)

```
                 MÉTRICAS                                LOGS
                 ────────                                ────

  Microservicios (Node.js)                  Contenedores Docker (stdout/stderr)
   ├── GET /health                                      │
   └── GET /metrics  (prom-client)                      │
            │                                           ▼
            ▼                                      Promtail
       Prometheus  (scrape c/15s)                  (lee docker.sock)
            │                                           │
            │                                           ▼
            │                                         Loki  (:3100)
            │                                           │
            └─────────────► Grafana ◄──────────────────┘
                          (:3000)
                  Datasources ya provisionados:
                  - Prometheus
                  - Loki
```

Archivos clave:

```
Proyecto2doBimWebAv/
├── docker-compose.yml                       # define prometheus, loki, promtail, grafana
├── backend/shared/middleware/healthCheck.js # expone /health y /metrics en cada servicio
└── infrastructure/
    ├── prometheus/prometheus.yml            # qué scrapear
    ├── loki/loki-config.yml                 # almacenamiento de logs
    ├── promtail/promtail-config.yml         # recolección de logs Docker
    └── grafana/provisioning/
        ├── datasources/datasources.yml      # Prometheus + Loki conectados
        └── dashboards/dashboard.yml         # carpeta de dashboards
```

---

## 8. Cumplimiento de la rúbrica

| Requisito | Estado | Dónde verlo |
|-----------|--------|-------------|
| Refactoring de BD (Database per Service) | ✅ Implementado | `docker-compose.yml`, `k8s/databases.yaml`, `docs/arquitectura.md` |
| Dos patrones de diseño de microservicios | ✅ (varios) | `docs/arquitectura.md` (API Gateway, Database per Service, Event-Driven, Saga) |
| Seguridad (JWT, OAuth2/OIDC) | ✅ Implementado | `api-gateway/middlewares/authGateway.js`, `auth-service/config/passport.js` |
| Frontend funcional + contenedor | ✅ Implementado | `frontend/`, `frontend/Dockerfile`, puerto 4200 |
| Backend microservicios + contenedor | ✅ Implementado | `backend/*/Dockerfile`, 7 servicios |
| Monitoreo y logs | ✅ Implementado | Prometheus + Grafana + Loki + Promtail |
| DevOps (CI/CD) | ✅ Implementado | `.github/workflows/ci-cd.yml` |
| Demostración de ejecución | ✅ | `docs/guion-presentacion.md` |
| **Extra:** Kubernetes | ✅ Manifiestos | `k8s/` |

### Detalle: Database per Service

| Monolito (1er bim) | Microservicios (2do bim) |
|--------------------|--------------------------|
| 1 SQL Server, 7 tablas con FK cruzadas | 5 PostgreSQL independientes |
| `users.balance` compartido por 4 módulos | `wallet_db` aislado (Wallet + Transaction) |
| Un solo schema | Cada servicio accede solo a su BD |

### Detalle: Patrones de diseño

| Patrón | Ubicación | Propósito |
|--------|-----------|-----------|
| API Gateway | `backend/api-gateway/` | Entrada única, JWT, rate-limit, proxy HTTP/WS |
| Database per Service | 5 PostgreSQL | Aislamiento de datos por dominio |
| Event-Driven (RabbitMQ) | `auth-service` → `wallet-service` | Crear wallet async al registrarse |
| Saga (orquestación simple) | `betting-service`, `casino-service` | debit → operación → credit con rollback |

### Detalle: Seguridad

| Medida | Ubicación |
|--------|-----------|
| JWT (Bearer, HS256) | `api-gateway/src/middlewares/authGateway.js` |
| OAuth 2.0 / OIDC (Google) | `auth-service/src/config/passport.js` + rutas `/api/auth/google` |
| Roles user/admin | Middleware `restrictTo` |
| API Key interna service-to-service | `shared/middleware/internalAuth.js` (`x-internal-api-key`) |
| Rate limiting (100 req/min) | API Gateway |
| Helmet + CORS | Todos los servicios |
| Secretos por variables de entorno | `.env` |

> **OAuth:** requiere `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` en `.env`. Si están vacíos, OAuth queda inactivo y el resto de la app funciona normal.

---

## 9. DevOps / CI-CD

**Archivo:** `.github/workflows/ci-cd.yml`

**Pipeline (se dispara en push/PR a `main`):**

```
push / PR → main
   │
   ├── 1. lint     → npm lint en cada microservicio
   │
   ├── 2. test     → paso placeholder (pendiente: tests reales)
   │
   └── 3. build-and-push  (solo en push a main)
          → docker build de cada servicio + frontend
          → docker push a ghcr.io/<owner>/betzone-<servicio>:latest y :<sha>
```

**Para activarlo de verdad:**
1. Sube el repositorio a GitHub.
2. El `GITHUB_TOKEN` ya tiene permiso `packages: write` (definido en el workflow).
3. Cada push a `main` construirá y publicará las imágenes en GitHub Container Registry (GHCR).

---

## 10. Kubernetes (extra)

**Carpeta:** `k8s/`

```
k8s/
├── namespace.yaml      # namespace betzone
├── secrets.yaml        # credenciales (Secrets)
├── configmap.yaml      # configuración común
├── databases.yaml      # PostgreSQL como StatefulSets
├── services.yaml       # Deployments + Services de microservicios
├── rabbitmq.yaml       # cola de mensajes
├── monitoring.yaml     # Prometheus, Loki, Grafana
└── ingress.yaml        # rutas en betzone.local (api, socket.io, frontend, grafana)
```

**Despliegue (requiere un cluster local como minikube o kind):**

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/databases.yaml
kubectl apply -f k8s/rabbitmq.yaml
kubectl apply -f k8s/services.yaml
kubectl apply -f k8s/monitoring.yaml
kubectl apply -f k8s/ingress.yaml
```

Verifica:

```bash
kubectl get pods -n betzone
kubectl get svc  -n betzone
```

---

## 11. Checklist antes de presentar

- [ ] `docker compose up -d` y todos los contenedores **healthy** (`docker compose ps`)
- [ ] Frontend abre en http://localhost:4200
- [ ] API responde: `curl http://localhost:8080/health`
- [ ] Grafana entra en http://localhost:3000 (admin/admin)
- [ ] Prometheus targets **UP** en http://localhost:9090/targets
- [ ] Logs visibles en Grafana → Explore → Loki
- [ ] Usuario admin creado en BD (`UPDATE users SET role='admin' WHERE email='...'`)
- [ ] SMTP configurado si vas a mostrar recuperación de contraseña
- [ ] (Opcional) Repo en GitHub para mostrar el workflow de CI/CD

### Orden sugerido para la demo

1. `docker compose up -d` → mostrar contenedores arriba.
2. Registro + login en el frontend.
3. Admin crea evento → usuario apuesta → admin resuelve (ver débito/crédito).
4. Blackjack / Mines.
5. Chat en dos navegadores.
6. **Grafana** → Explore → métricas (Prometheus) y logs (Loki).
7. **Prometheus** → Targets UP.
8. (Opcional) mostrar `.github/workflows/ci-cd.yml` y los manifiestos `k8s/`.

---

## 12. Troubleshooting

| Problema | Causa probable | Solución |
|----------|----------------|----------|
| Grafana no abre | Contenedor no levantó | `docker logs betzone-grafana` |
| Targets DOWN en Prometheus | Servicio caído o sin `/metrics` | `docker compose ps`, revisar logs del servicio |
| No aparecen logs en Loki | Promtail no recolecta | `docker logs betzone-promtail`; verificar montaje de `docker.sock` |
| Loki "not ready" | Aún arrancando | Esperar ~20s; `curl http://localhost:3100/ready` |
| Métricas vacías | Servicio recién iniciado | Esperar un ciclo de scrape (15s) |
| Grafana pide datasource manual | Provisioning no cargó | Reiniciar Grafana: `docker compose restart grafana` |

---

## Documentos relacionados

| Archivo | Contenido |
|---------|-----------|
| `README.md` | Inicio rápido y estructura del proyecto |
| `docs/arquitectura.md` | Diagramas Mermaid, patrones, seguridad |
| `docs/migracion.md` | Plan de migración monolito → microservicios |
| `docs/manual-tecnico.md` | Endpoints, variables de entorno, troubleshooting |
| `docs/guion-presentacion.md` | Guion de 15–20 min para la defensa |
| **`docs/observabilidad-y-devops.md`** | **Este documento** |
