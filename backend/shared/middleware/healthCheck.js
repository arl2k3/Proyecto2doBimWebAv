const client = require('prom-client');

const register = new client.Registry();
client.collectDefaultMetrics({ register });

function healthRouter(serviceName, dbCheck = null) {
  const express = require('express');
  const router = express.Router();

  router.get('/health', async (_req, res) => {
    const health = {
      service: serviceName,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };

    if (dbCheck) {
      try {
        await dbCheck();
        health.database = 'connected';
      } catch {
        health.status = 'unhealthy';
        health.database = 'disconnected';
        return res.status(503).json(health);
      }
    }

    res.json(health);
  });

  router.get('/metrics', async (_req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  });

  return router;
}

module.exports = { healthRouter, register };
