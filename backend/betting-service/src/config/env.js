require('dotenv').config();

module.exports = {
  port: process.env.BETTING_PORT || 3003,
  nodeEnv: process.env.NODE_ENV || 'development',
  db: {
    host: process.env.BETTING_DB_HOST || 'localhost',
    port: process.env.BETTING_DB_PORT || 5432,
    user: process.env.BETTING_DB_USER || 'betzone',
    pass: process.env.BETTING_DB_PASS || 'betzone_secret',
    name: process.env.BETTING_DB_NAME || 'betting_db',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback_secret_key',
  },
  walletServiceUrl: process.env.WALLET_SERVICE_URL || 'http://wallet-service:3002',
  internalApiKey: process.env.INTERNAL_API_KEY || 'internal_service_key',
};
