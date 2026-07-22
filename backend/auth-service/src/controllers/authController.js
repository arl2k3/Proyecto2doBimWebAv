const authService = require('../services/authService');
const axios = require('axios');
const env = require('../config/env');

async function register(req, res, next) {
  try {
    const user = await authService.registerUser(req.body);
    res.status(201).json({ success: true, message: 'Registro exitoso.', data: user });
  } catch (err) { next(err); }
}

async function login(req, res, next) {
  try {
    const { user, token } = await authService.loginUser(req.body);
    res.status(200).json({ success: true, message: 'Login exitoso.', data: { user, token } });
  } catch (err) { next(err); }
}

async function logout(_req, res) {
  res.status(200).json({ success: true, message: 'Sesión finalizada.' });
}

async function getMe(req, res, next) {
  try {
    const user = await authService.getUserById(req.user.id);
    let balance = 0;
    try {
      const walletRes = await axios.get(`${process.env.WALLET_SERVICE_URL || 'http://wallet-service:3002'}/api/wallet/balance/${req.user.id}`, {
        headers: { 'x-internal-api-key': env.internalApiKey },
      });
      balance = walletRes.data.data.balance;
    } catch { /* wallet may not exist yet */ }

    res.status(200).json({ success: true, data: { user: { ...user.toJSON(), balance } } });
  } catch (err) { next(err); }
}

async function forgotPassword(req, res, next) {
  try {
    await authService.requestPasswordReset(req.body.email);
    res.status(200).json({ success: true, message: 'Si el correo está registrado, recibirás un enlace.' });
  } catch (err) { next(err); }
}

async function resetPassword(req, res, next) {
  try {
    await authService.resetPassword(req.body.token, req.body.password);
    res.status(200).json({ success: true, message: 'Contraseña restablecida exitosamente.' });
  } catch (err) { next(err); }
}

async function getUserInternal(req, res, next) {
  try {
    const user = await authService.getUserById(req.params.id);
    res.status(200).json({ success: true, data: user });
  } catch (err) { next(err); }
}

module.exports = { register, login, logout, getMe, forgotPassword, resetPassword, getUserInternal };
