const { sendMail } = require('../config/mailer');
const { apiSuccessResponse } = require('../../../shared/utils/helpers');

async function sendEmail(req, res, next) {
  try {
    const { to, subject, html } = req.body;

    if (!to || !subject || !html) {
      const err = new Error('Los campos to, subject y html son obligatorios.');
      err.statusCode = 400;
      throw err;
    }

    await sendMail({ to, subject, html });

    res.status(200).json(apiSuccessResponse(null, 'Correo enviado correctamente.'));
  } catch (error) {
    next(error);
  }
}

module.exports = { sendEmail };
