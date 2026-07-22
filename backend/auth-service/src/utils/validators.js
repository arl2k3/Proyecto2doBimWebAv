const { body, validationResult } = require('express-validator');
const { apiErrorResponse } = require('../../../shared/utils/helpers');

const registerValidator = [
  body('username').trim().isLength({ min: 3, max: 50 }).withMessage('Username: 3-50 caracteres'),
  body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 6 }).withMessage('Contraseña mínimo 6 caracteres'),
];

const loginValidator = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
];

function validateRequest(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(apiErrorResponse('Errores de validación', errors.array()));
  }
  next();
}

module.exports = { registerValidator, loginValidator, validateRequest };
