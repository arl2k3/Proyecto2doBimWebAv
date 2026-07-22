const { validationResult } = require('express-validator');
const { apiErrorResponse } = require('../../../shared/utils/helpers');

function validateRequest(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
    }));
    return res.status(400).json(apiErrorResponse('Errores de validación en la petición.', formattedErrors));
  }
  next();
}

module.exports = { validateRequest };
