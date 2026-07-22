const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const client = require('prom-client');
const errorMiddleware = require('../../shared/middleware/errorMiddleware');

const register = new client.Registry();
client.collectDefaultMetrics({ register });

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({
    service: 'notifications-service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use(errorMiddleware);

module.exports = app;
