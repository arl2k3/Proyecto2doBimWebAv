require('dotenv').config();

module.exports = {
  port: process.env.CASINO_PORT || 3004,
  nodeEnv: process.env.NODE_ENV || 'development',
  db: {
    host: process.env.CASINO_DB_HOST || 'localhost',
    port: process.env.CASINO_DB_PORT || 5432,
    user: process.env.CASINO_DB_USER || 'betzone',
    pass: process.env.CASINO_DB_PASS || 'betzone_secret',
    name: process.env.CASINO_DB_NAME || 'casino_db',
  },
  walletServiceUrl: process.env.WALLET_SERVICE_URL || 'http://localhost:3002',
  internalApiKey: process.env.INTERNAL_API_KEY || 'internal_service_key',
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback_secret_key',
  },
};
