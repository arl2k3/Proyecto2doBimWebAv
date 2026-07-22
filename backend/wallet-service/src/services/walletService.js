const { Wallet, Transaction } = require('../models');
const { sequelize } = require('../config/db');
const env = require('../config/env');

async function createWallet(userId, initialBalance = env.defaultBalance) {
  const existing = await Wallet.findOne({ where: { userId } });
  if (existing) return existing;

  const transaction = await sequelize.transaction();
  try {
    const wallet = await Wallet.create({ userId, balance: initialBalance }, { transaction });
    await Transaction.create(
      {
        userId,
        type: 'credit',
        amount: initialBalance,
        balanceAfter: initialBalance,
        reference: 'WALLET_INIT',
        description: 'Saldo inicial de bienvenida',
        source: 'system',
      },
      { transaction }
    );
    await transaction.commit();
    return wallet;
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

async function getBalance(userId) {
  const wallet = await Wallet.findOne({ where: { userId } });
  if (!wallet) {
    const err = new Error('Wallet no encontrado.');
    err.statusCode = 404;
    throw err;
  }
  return parseFloat(wallet.balance);
}

async function debit(userId, amount, { reference, description, source } = {}) {
  const amt = parseFloat(amount);
  if (isNaN(amt) || amt <= 0) {
    const err = new Error('Monto de débito inválido.');
    err.statusCode = 400;
    throw err;
  }

  const t = await sequelize.transaction();
  try {
    const wallet = await Wallet.findOne({ where: { userId }, transaction: t, lock: t.LOCK.UPDATE });
    if (!wallet) {
      const err = new Error('Wallet no encontrado.');
      err.statusCode = 404;
      throw err;
    }
    if (parseFloat(wallet.balance) < amt) {
      const err = new Error('Saldo insuficiente.');
      err.statusCode = 400;
      throw err;
    }

    wallet.balance = parseFloat(wallet.balance) - amt;
    await wallet.save({ transaction: t });

    await Transaction.create(
      {
        userId,
        type: 'debit',
        amount: amt,
        balanceAfter: wallet.balance,
        reference,
        description,
        source,
      },
      { transaction: t }
    );

    await t.commit();
    return parseFloat(wallet.balance);
  } catch (err) {
    await t.rollback();
    throw err;
  }
}

async function credit(userId, amount, { reference, description, source } = {}) {
  const amt = parseFloat(amount);
  if (isNaN(amt) || amt <= 0) {
    const err = new Error('Monto de crédito inválido.');
    err.statusCode = 400;
    throw err;
  }

  const t = await sequelize.transaction();
  try {
    const wallet = await Wallet.findOne({ where: { userId }, transaction: t, lock: t.LOCK.UPDATE });
    if (!wallet) {
      const err = new Error('Wallet no encontrado.');
      err.statusCode = 404;
      throw err;
    }

    wallet.balance = parseFloat(wallet.balance) + amt;
    await wallet.save({ transaction: t });

    await Transaction.create(
      {
        userId,
        type: 'credit',
        amount: amt,
        balanceAfter: wallet.balance,
        reference,
        description,
        source,
      },
      { transaction: t }
    );

    await t.commit();
    return parseFloat(wallet.balance);
  } catch (err) {
    await t.rollback();
    throw err;
  }
}

async function getTransactions(userId, limit = 50) {
  return Transaction.findAll({
    where: { userId },
    order: [['createdAt', 'DESC']],
    limit,
  });
}

module.exports = { createWallet, getBalance, debit, credit, getTransactions };
