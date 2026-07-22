const client = require('prom-client');

const register = new client.Registry();
client.collectDefaultMetrics({ register });

function healthRouter(serviceName) {
  const express = require('express');
  const router = express.Router();

  router.get('/health', (_req, res) => {
    res.json({
      service: serviceName,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  router.get('/metrics', async (_req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  });

  return router;
}

module.exports = { healthRouter, register };
