const express = require('express');
const internalAuth = require('../../../shared/middleware/internalAuth');
const notificationController = require('../controllers/notificationController');

const router = express.Router();

router.post('/email', internalAuth, notificationController.sendEmail);

module.exports = router;
