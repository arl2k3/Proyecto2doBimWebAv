const jwt = require('jsonwebtoken');
const { apiErrorResponse } = require('../../../shared/utils/helpers');
const env = require('../config/env');

function protect(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json(apiErrorResponse('No autorizado. Token ausente.'));
  }

  try {
    const decoded = jwt.verify(token, env.jwt.secret);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json(apiErrorResponse('Token inválido o expirado.'));
  }
}

module.exports = { protect };
