require('dotenv').config();

module.exports = {
  port: process.env.WALLET_PORT || 3002,
  nodeEnv: process.env.NODE_ENV || 'development',
  db: {
    host: process.env.WALLET_DB_HOST || 'localhost',
    port: process.env.WALLET_DB_PORT || 5432,
    user: process.env.WALLET_DB_USER || 'betzone',
    pass: process.env.WALLET_DB_PASS || 'betzone_secret',
    name: process.env.WALLET_DB_NAME || 'wallet_db',
  },
  rabbitmqUrl: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
  internalApiKey: process.env.INTERNAL_API_KEY || 'internal_service_key',
  defaultBalance: parseFloat(process.env.DEFAULT_USER_BALANCE || '1000.00'),
};
