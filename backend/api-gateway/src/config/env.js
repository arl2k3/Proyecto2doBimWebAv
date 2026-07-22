require('dotenv').config();

module.exports = {
  port: parseInt(process.env.GATEWAY_PORT || process.env.PORT || '8080', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'fallback_secret_key',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  rateLimit: {
    windowMs: 60 * 1000,
    max: 100,
  },
  services: {
    auth: process.env.AUTH_SERVICE_URL || 'http://auth-service:3001',
    wallet: process.env.WALLET_SERVICE_URL || 'http://wallet-service:3002',
    betting: process.env.BETTING_SERVICE_URL || 'http://betting-service:3003',
    casino: process.env.CASINO_SERVICE_URL || 'http://casino-service:3004',
    chat: process.env.CHAT_SERVICE_URL || 'http://chat-service:3005',
    notifications: process.env.NOTIFICATIONS_SERVICE_URL || 'http://notifications-service:3006',
  },
};
