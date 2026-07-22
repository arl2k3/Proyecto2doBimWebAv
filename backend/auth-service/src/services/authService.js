const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const axios = require('axios').default;
const { User, PasswordResetToken } = require('../models');
const { verifyPassword, hashPassword } = require('../../../shared/utils/hash');
const { publishEvent } = require('../events/publisher');
const env = require('../config/env');

function generateToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, email: user.email, role: user.role },
    env.jwt.secret,
    { expiresIn: env.jwt.expiresIn }
  );
}

function sanitizeUser(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl,
  };
}

async function registerUser({ username, email, password }) {
  if (await User.findOne({ where: { email } })) {
    const err = new Error('El correo electrónico ya está registrado.');
    err.statusCode = 400;
    throw err;
  }
  if (await User.findOne({ where: { username } })) {
    const err = new Error('El nombre de usuario ya está en uso.');
    err.statusCode = 400;
    throw err;
  }

  const user = await User.create({ username, email, password });
  publishEvent('user.registered', {
    userId: user.id,
    username: user.username,
    email: user.email,
    initialBalance: env.defaultBalance,
  });

  return sanitizeUser(user);
}

async function loginUser({ email, password }) {
  const user = await User.findOne({ where: { email } });
  if (!user || !user.password) {
    const err = new Error('Credenciales incorrectas.');
    err.statusCode = 401;
    throw err;
  }
  if (!(await verifyPassword(password, user.password))) {
    const err = new Error('Credenciales incorrectas.');
    err.statusCode = 401;
    throw err;
  }
  return { user: sanitizeUser(user), token: generateToken(user) };
}

async function findOrCreateOAuthUser(profile) {
  let user = await User.findOne({ where: { googleId: profile.id } });
  if (!user) user = await User.findOne({ where: { email: profile.emails[0].value } });

  if (user) {
    if (!user.googleId) {
      await user.update({ googleId: profile.id, avatarUrl: profile.photos?.[0]?.value });
    }
  } else {
    const username = profile.displayName.replace(/\s+/g, '_').toLowerCase() + '_' + Date.now().toString(36);
    user = await User.create({
      username,
      email: profile.emails[0].value,
      googleId: profile.id,
      avatarUrl: profile.photos?.[0]?.value,
      password: null,
    });
    publishEvent('user.registered', {
      userId: user.id,
      username: user.username,
      email: user.email,
      initialBalance: env.defaultBalance,
    });
  }

  return { user: sanitizeUser(user), token: generateToken(user) };
}

async function requestPasswordReset(email) {
  const user = await User.findOne({ where: { email } });
  if (!user) return;

  await PasswordResetToken.update({ used: true }, { where: { userId: user.id, used: false } });

  const rawToken = crypto.randomBytes(32).toString('hex');
  await PasswordResetToken.create({
    userId: user.id,
    token: rawToken,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    used: false,
  });

  const resetLink = `${env.appUrl}/reset-password?token=${rawToken}`;

  try {
    await axios.post(
      `${env.notificationsUrl}/api/notifications/email`,
      {
        to: user.email,
        subject: '🔐 BetZone — Recuperación de Contraseña',
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:auto;background:#0f172a;color:#e2e8f0;padding:32px;border-radius:12px;">
            <h2 style="color:#3b82f6;">BetZone — Restablecer Contraseña</h2>
            <p>Hola <strong>${user.username}</strong>,</p>
            <p>Recibimos una solicitud para restablecer tu contraseña.</p>
            <a href="${resetLink}" style="display:inline-block;margin:20px 0;padding:12px 24px;background:#3b82f6;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;">Restablecer Contraseña</a>
            <p style="color:#64748b;font-size:12px;">El enlace expira en 1 hora.</p>
          </div>`,
      },
      { headers: { 'x-internal-api-key': env.internalApiKey } }
    );
  } catch (err) {
    console.error('Error enviando email de reset:', err.message);
  }
}

async function resetPassword(token, newPassword) {
  if (!token || !newPassword || newPassword.length < 6) {
    const err = new Error('Token y contraseña válida (mín. 6 chars) son obligatorios.');
    err.statusCode = 400;
    throw err;
  }

  const record = await PasswordResetToken.findOne({
    where: { token, used: false },
    include: [{ model: User, as: 'user' }],
  });

  if (!record) {
    const err = new Error('Token inválido o ya utilizado.');
    err.statusCode = 400;
    throw err;
  }
  if (new Date() > new Date(record.expiresAt)) {
    await record.update({ used: true });
    const err = new Error('El enlace de recuperación ha expirado.');
    err.statusCode = 400;
    throw err;
  }

  const hashed = await hashPassword(newPassword);
  await record.user.update({ password: hashed }, { hooks: false });
  await record.update({ used: true });
}

async function getUserById(id) {
  const user = await User.findByPk(id, {
    attributes: ['id', 'username', 'email', 'role', 'avatarUrl', 'createdAt'],
  });
  if (!user) {
    const err = new Error('Usuario no encontrado.');
    err.statusCode = 404;
    throw err;
  }
  return user;
}

module.exports = {
  registerUser,
  loginUser,
  findOrCreateOAuthUser,
  requestPasswordReset,
  resetPassword,
  getUserById,
  generateToken,
  sanitizeUser,
};
