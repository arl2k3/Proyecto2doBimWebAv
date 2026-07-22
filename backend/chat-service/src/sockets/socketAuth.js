const jwt = require('jsonwebtoken');
const env = require('../config/env');

function socketAuth(io) {
  io.use((socket, next) => {
    try {
      let token = socket.handshake.auth?.token;

      if (token?.startsWith('Bearer ')) {
        token = token.split(' ')[1];
      }

      if (!token) {
        return next(new Error('Conexión de socket denegada: Sin token de sesión.'));
      }

      const decoded = jwt.verify(token, env.jwt.secret);
      socket.user = {
        id: decoded.id,
        username: decoded.username,
        email: decoded.email,
        role: decoded.role,
      };

      next();
    } catch (err) {
      console.error('💥 Fallo en autenticidad Socket:', err.message);
      return next(new Error('Acceso no autorizado a nivel de Socket.'));
    }
  });
}

module.exports = socketAuth;
