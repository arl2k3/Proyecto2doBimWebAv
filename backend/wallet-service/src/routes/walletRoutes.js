const express = require('express');
const ctrl = require('../controllers/walletController');
const internalAuth = require('../../../shared/middleware/internalAuth');

const router = express.Router();

router.get('/balance/:userId', internalAuth, ctrl.getBalance);
router.post('/debit', internalAuth, ctrl.debit);
router.post('/credit', internalAuth, ctrl.credit);
router.post('/create', internalAuth, ctrl.createWallet);
router.get('/transactions/:userId', internalAuth, ctrl.getTransactions);
router.post('/recharge', ctrl.recharge);

module.exports = router;
