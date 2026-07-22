require('dotenv').config();

module.exports = {
  port: process.env.CHAT_PORT || 3005,
  nodeEnv: process.env.NODE_ENV || 'development',
  db: {
    host: process.env.CHAT_DB_HOST || 'localhost',
    port: process.env.CHAT_DB_PORT || 5432,
    user: process.env.CHAT_DB_USER || 'betzone',
    pass: process.env.CHAT_DB_PASS || 'betzone_secret',
    name: process.env.CHAT_DB_NAME || 'chat_db',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback_secret_key',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
};
