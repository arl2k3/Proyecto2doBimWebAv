const { apiErrorResponse } = require('../utils/helpers');

function errorMiddleware(err, req, res, _next) {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Error interno del servidor';

  if (process.env.NODE_ENV === 'development') {
    console.error(`[${req.method}] ${req.originalUrl} →`, err);
  }

  res.status(statusCode).json(apiErrorResponse(message));
}

module.exports = errorMiddleware;
