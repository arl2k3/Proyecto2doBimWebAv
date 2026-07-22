const axios = require('axios');
const env = require('../config/env');

const client = axios.create({
  baseURL: env.walletServiceUrl,
  headers: {
    'Content-Type': 'application/json',
    'x-internal-api-key': env.internalApiKey,
  },
});

function mapWalletError(err) {
  if (err.response) {
    const walletErr = new Error(err.response.data?.message || 'Error en Wallet Service.');
    walletErr.statusCode = err.response.status;
    throw walletErr;
  }
  const walletErr = new Error('Wallet Service no disponible.');
  walletErr.statusCode = 503;
  throw walletErr;
}

async function getBalance(userId) {
  try {
    const { data } = await client.get(`/api/wallet/balance/${userId}`);
    return parseFloat(data.data.balance);
  } catch (err) {
    mapWalletError(err);
  }
}

async function debit(userId, amount, { reference, description, source } = {}) {
  try {
    const { data } = await client.post('/api/wallet/debit', {
      userId,
      amount,
      reference,
      description,
      source,
    });
    return parseFloat(data.data.balance);
  } catch (err) {
    mapWalletError(err);
  }
}

async function credit(userId, amount, { reference, description, source } = {}) {
  try {
    const { data } = await client.post('/api/wallet/credit', {
      userId,
      amount,
      reference,
      description,
      source,
    });
    return parseFloat(data.data.balance);
  } catch (err) {
    mapWalletError(err);
  }
}

module.exports = { getBalance, debit, credit };
