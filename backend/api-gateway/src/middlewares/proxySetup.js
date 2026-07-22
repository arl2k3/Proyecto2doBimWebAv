const { createProxyMiddleware } = require('http-proxy-middleware');
const env = require('../config/env');

function attachUserHeaders(proxyReq, req) {
  if (req.user) {
    proxyReq.setHeader('x-user-id', String(req.user.id));
    proxyReq.setHeader('x-user-role', req.user.role || '');
  }
}

function createServiceProxy(pathFilter, target, label) {
  return createProxyMiddleware({
    pathFilter,
    target,
    changeOrigin: true,
    on: {
      proxyReq: (proxyReq, req) => {
        attachUserHeaders(proxyReq, req);
      },
      error: (err, req, res) => {
        console.error(`[proxy:${label}] ${err.message}`);
        if (res.writeHead) {
          res.writeHead(502, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            message: `Servicio ${label} no disponible.`,
          }));
        }
      },
    },
  });
}

function setupProxies(app) {
  const routes = [
    { path: '/api/auth', target: env.services.auth, label: 'auth' },
    { path: '/api/users', target: env.services.auth, label: 'auth-users' },
    { path: '/api/wallet', target: env.services.wallet, label: 'wallet' },
    { path: '/api/events', target: env.services.betting, label: 'betting-events' },
    { path: '/api/bets', target: env.services.betting, label: 'betting-bets' },
    { path: '/api/blackjack', target: env.services.casino, label: 'casino-blackjack' },
    { path: '/api/mines', target: env.services.casino, label: 'casino-mines' },
    { path: '/api/chat', target: env.services.chat, label: 'chat' },
    { path: '/api/notifications', target: env.services.notifications, label: 'notifications' },
  ];

  // pathFilter preserva la ruta completa (/api/auth/login) al reenviar al microservicio.
  // Con app.use('/api/auth', proxy) Express recorta el prefijo y el downstream recibe /login → 404.
  routes.forEach(({ path, target, label }) => {
    app.use(createServiceProxy(path, target, label));
  });

  const wsProxy = createProxyMiddleware({
    pathFilter: '/socket.io',
    target: env.services.chat,
    changeOrigin: true,
    ws: true,
    on: {
      proxyReq: (proxyReq, req) => {
        attachUserHeaders(proxyReq, req);
      },
      error: (err) => {
        console.error(`[proxy:socket.io] ${err.message}`);
      },
    },
  });

  app.use(wsProxy);

  return { wsProxy };
}

module.exports = { setupProxies };
