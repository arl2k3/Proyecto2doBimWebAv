const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { healthRouter } = require('./middlewares/health');
const { jwtGatewayAuth } = require('./middlewares/authGateway');
const { setupProxies } = require('./middlewares/proxySetup');
const env = require('./config/env');

const app = express();

app.use(helmet());
app.use(cors({
  origin: env.corsOrigin === '*' ? true : env.corsOrigin.split(',').map((o) => o.trim()),
  credentials: true,
}));

const limiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => ['/health', '/metrics'].includes(req.path),
  message: { success: false, message: 'Demasiadas solicitudes. Intenta más tarde.' },
});

app.use(limiter);
app.use(healthRouter('api-gateway'));
app.use(jwtGatewayAuth);

const { wsProxy } = setupProxies(app);

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Ruta no encontrada.' });
});

module.exports = { app, wsProxy };
