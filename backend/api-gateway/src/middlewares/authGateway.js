const jwt = require('jsonwebtoken');
const { apiErrorResponse } = require('../../../shared/utils/helpers');
const env = require('../config/env');

const PUBLIC_ROUTES = [
  { method: 'POST', path: '/api/auth/register' },
  { method: 'POST', path: '/api/auth/login' },
  { method: 'POST', path: '/api/auth/forgot-password' },
  { method: 'POST', path: '/api/auth/reset-password' },
  { method: 'GET', path: '/api/auth/google' },
  { method: 'GET', path: '/api/auth/google/callback' },
];

function getRequestPath(req) {
  return req.originalUrl.split('?')[0];
}

function isPublicRoute(req) {
  const path = getRequestPath(req);
  return PUBLIC_ROUTES.some(
    (route) => route.method === req.method && route.path === path
  );
}

function extractToken(req) {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }

  if (req.url) {
    try {
      const url = new URL(req.url, 'http://localhost');
      return url.searchParams.get('token');
    } catch {
      return null;
    }
  }

  return null;
}

function verifyToken(token) {
  if (!token) return null;
  try {
    return jwt.verify(token, env.jwtSecret);
  } catch {
    return null;
  }
}

function jwtGatewayAuth(req, res, next) {
  if (isPublicRoute(req)) {
    return next();
  }

  // El handshake de Socket.IO transporta el token en el payload de autenticación
  // (no en la URL ni en headers), por lo que el chat-service es quien valida el JWT
  // a nivel de socket. El gateway solo actúa como proxy transparente para /socket.io.
  if (getRequestPath(req).startsWith('/socket.io')) {
    return next();
  }

  const decoded = verifyToken(extractToken(req));
  if (!decoded) {
    return res.status(401).json(apiErrorResponse('No autorizado. Token ausente o inválido.'));
  }

  req.user = decoded;
  next();
}

function authenticateUpgrade(req) {
  return verifyToken(extractToken(req));
}

module.exports = {
  jwtGatewayAuth,
  isPublicRoute,
  PUBLIC_ROUTES,
  authenticateUpgrade,
};
