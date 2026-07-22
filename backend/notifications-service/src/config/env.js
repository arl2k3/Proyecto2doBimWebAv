require('dotenv').config();

module.exports = {
  port: process.env.NOTIFICATIONS_PORT || 3006,
  nodeEnv: process.env.NODE_ENV || 'development',
  internalApiKey: process.env.INTERNAL_API_KEY || 'internal_service_key',
  email: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'BetZone <noreply@betzone.com>',
  },
};
