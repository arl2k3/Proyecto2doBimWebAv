const app = require('./app');
const env = require('./config/env');
const { verifyConnection } = require('./config/mailer');

app.listen(env.port, () => {
  console.log(`📧 Notifications Service escuchando en puerto ${env.port}`);
  verifyConnection();
});
