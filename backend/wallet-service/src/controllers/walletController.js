const walletService = require('../services/walletService');

async function getBalance(req, res, next) {
  try {
    const balance = await walletService.getBalance(req.params.userId);
    res.json({ success: true, data: { userId: parseInt(req.params.userId, 10), balance } });
  } catch (err) { next(err); }
}

async function debit(req, res, next) {
  try {
    const { userId, amount, reference, description, source } = req.body;
    const balance = await walletService.debit(userId, amount, { reference, description, source });
    res.json({ success: true, data: { balance } });
  } catch (err) { next(err); }
}

async function credit(req, res, next) {
  try {
    const { userId, amount, reference, description, source } = req.body;
    const balance = await walletService.credit(userId, amount, { reference, description, source });
    res.json({ success: true, data: { balance } });
  } catch (err) { next(err); }
}

async function recharge(req, res, next) {
  try {
    const userId = req.headers['x-user-id'];
    const { amount } = req.body;
    if (!userId) return res.status(401).json({ success: false, message: 'Usuario no identificado.' });
    const balance = await walletService.credit(userId, amount, {
      reference: 'RECHARGE',
      description: 'Recarga manual de saldo',
      source: 'user',
    });
    res.json({ success: true, message: 'Recarga exitosa.', data: { balance } });
  } catch (err) { next(err); }
}

async function getTransactions(req, res, next) {
  try {
    const txs = await walletService.getTransactions(req.params.userId);
    res.json({ success: true, data: txs });
  } catch (err) { next(err); }
}

async function createWallet(req, res, next) {
  try {
    const { userId, initialBalance } = req.body;
    const wallet = await walletService.createWallet(userId, initialBalance);
    res.status(201).json({ success: true, data: wallet });
  } catch (err) { next(err); }
}

module.exports = { getBalance, debit, credit, recharge, getTransactions, createWallet };
