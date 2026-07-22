const axios = require('axios');
const env = require('../config/env');

const client = axios.create({
  baseURL: env.walletServiceUrl,
  headers: {
    'Content-Type': 'application/json',
    'x-internal-api-key': env.internalApiKey,
  },
});

function mapWalletError(error) {
  if (error.response) {
    const err = new Error(error.response.data?.message || 'Error en Wallet Service.');
    err.statusCode = error.response.status;
    throw err;
  }
  const err = new Error('Wallet Service no disponible.');
  err.statusCode = 503;
  throw err;
}

async function getBalance(userId) {
  try {
    const { data } = await client.get(`/api/wallet/balance/${userId}`);
    return data.data.balance;
  } catch (error) {
    mapWalletError(error);
  }
}

async function debit(userId, amount, { reference, description, source } = {}) {
  try {
    const { data } = await client.post('/api/wallet/debit', {
      userId,
      amount,
      reference,
      description,
      source: source || 'betting',
    });
    return data.data.balance;
  } catch (error) {
    mapWalletError(error);
  }
}

async function credit(userId, amount, { reference, description, source } = {}) {
  try {
    const { data } = await client.post('/api/wallet/credit', {
      userId,
      amount,
      reference,
      description,
      source: source || 'betting',
    });
    return data.data.balance;
  } catch (error) {
    mapWalletError(error);
  }
}

module.exports = { getBalance, debit, credit };
