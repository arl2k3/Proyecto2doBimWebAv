const { body } = require('express-validator');

const betValidator = [
  body('eventId')
    .notEmpty().withMessage('El identificador del evento es obligatorio.'),
  body('amount')
    .isFloat({ min: 0.01 }).withMessage('La apuesta mínima debe ser mayor a 0 dólares.'),
  body('prediction')
    .isIn(['home', 'away', 'draw']).withMessage('La predicción debe ser: home, away o draw.'),
];

module.exports = { betValidator };
