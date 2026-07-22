require('dotenv').config();

module.exports = {
  port: process.env.AUTH_PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  db: {
    host: process.env.AUTH_DB_HOST || 'localhost',
    port: process.env.AUTH_DB_PORT || 5432,
    user: process.env.AUTH_DB_USER || 'betzone',
    pass: process.env.AUTH_DB_PASS || 'betzone_secret',
    name: process.env.AUTH_DB_NAME || 'auth_db',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback_secret_key',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackUrl: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:8080/api/auth/google/callback',
  },
  appUrl: process.env.APP_URL || 'http://localhost:8080',
  defaultBalance: parseFloat(process.env.DEFAULT_USER_BALANCE || '1000.00'),
  rabbitmqUrl: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
  notificationsUrl: process.env.NOTIFICATIONS_SERVICE_URL || 'http://notifications-service:3006',
  internalApiKey: process.env.INTERNAL_API_KEY || 'internal_service_key',
};
