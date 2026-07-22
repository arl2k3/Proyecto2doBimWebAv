const nodemailer = require('nodemailer');
const env = require('./env');

const transporter = nodemailer.createTransport({
  host: env.email.host,
  port: env.email.port,
  secure: env.email.secure,
  auth: {
    user: env.email.user,
    pass: env.email.pass,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

async function verifyConnection() {
  if (!env.email.user || !env.email.pass) {
    console.warn('⚠️ SMTP sin credenciales (SMTP_USER/SMTP_PASS vacíos). El envío de correos fallará.');
    return;
  }
  try {
    await transporter.verify();
    console.log(`✅ SMTP conectado correctamente como ${env.email.user}`);
  } catch (err) {
    console.error('❌ Fallo de verificación SMTP:', err.message);
  }
}

async function sendMail({ to, subject, html }) {
  try {
    const info = await transporter.sendMail({
      from: env.email.from,
      to,
      subject,
      html,
    });
    console.log(`📤 Correo enviado a ${to} (messageId: ${info.messageId})`);
    return info;
  } catch (err) {
    console.error(`❌ Error enviando correo a ${to}:`, err.message);
    throw err;
  }
}

module.exports = { sendMail, transporter, verifyConnection };
