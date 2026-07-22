const { Bet, Event } = require('../models');
const { sequelize } = require('../config/db');
const walletClient = require('../clients/walletClient');

async function placeBet(userId, { eventId, amount, prediction }) {
  const betAmount = parseFloat(amount);

  if (isNaN(betAmount) || betAmount <= 0) {
    const err = new Error('La cantidad a apostar debe ser un número positivo.');
    err.statusCode = 400;
    throw err;
  }

  const transaction = await sequelize.transaction();

  try {
    const event = await Event.findByPk(eventId, { transaction, lock: transaction.LOCK.UPDATE });
    if (!event) {
      const err = new Error('El evento deportivo no existe.');
      err.statusCode = 404;
      throw err;
    }

    if (event.status !== 'active') {
      const err = new Error('No se admiten más apuestas para este evento porque no está activo.');
      err.statusCode = 400;
      throw err;
    }

    let selectedOdds = 1.0;
    if (prediction === 'home') {
      selectedOdds = event.oddsHome;
    } else if (prediction === 'away') {
      selectedOdds = event.oddsAway;
    } else if (prediction === 'draw') {
      selectedOdds = event.oddsDraw;
    } else {
      const err = new Error('Predicción inválida. Debe ser home, away o draw.');
      err.statusCode = 400;
      throw err;
    }

    await transaction.commit();

    let newBalance;
    try {
      newBalance = await walletClient.debit(userId, betAmount, {
        reference: `BET_EVENT_${eventId}`,
        description: `Apuesta deportiva evento #${eventId}`,
        source: 'betting',
      });
    } catch (debitError) {
      throw debitError;
    }

    let bet;
    try {
      bet = await Bet.create({
        userId,
        eventId,
        amount: betAmount,
        prediction,
        odds: selectedOdds,
        status: 'pending',
      });
    } catch (createError) {
      await walletClient.credit(userId, betAmount, {
        reference: `BET_ROLLBACK_EVENT_${eventId}`,
        description: `Reversión apuesta fallida evento #${eventId}`,
        source: 'betting',
      });
      throw createError;
    }

    return { bet, newBalance };
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    throw error;
  }
}

async function getUserBets(userId) {
  return Bet.findAll({
    where: { userId },
    include: [{ model: Event, as: 'event' }],
    order: [['createdAt', 'DESC']],
  });
}

async function getAllBets() {
  return Bet.findAll({
    include: [{ model: Event, as: 'event' }],
    order: [['createdAt', 'DESC']],
  });
}

async function updateBet(betId, { amount, prediction, odds, status }) {
  const bet = await Bet.findByPk(betId, {
    include: [{ model: Event, as: 'event' }],
  });

  if (!bet) {
    const err = new Error('Apuesta no encontrada.');
    err.statusCode = 404;
    throw err;
  }

  if (bet.status !== 'pending') {
    const err = new Error('No se pueden editar apuestas que ya han sido resueltas.');
    err.statusCode = 400;
    throw err;
  }

  if (amount !== undefined) bet.amount = amount;
  if (prediction !== undefined) {
    if (!['home', 'away', 'draw'].includes(prediction)) {
      const err = new Error('Predicción inválida. Debe ser home, away o draw.');
      err.statusCode = 400;
      throw err;
    }
    bet.prediction = prediction;
  }
  if (odds !== undefined) bet.odds = odds;
  if (status !== undefined) {
    if (!['pending', 'won', 'lost', 'refunded'].includes(status)) {
      const err = new Error('Estado inválido de apuesta.');
      err.statusCode = 400;
      throw err;
    }
    bet.status = status;
  }

  await bet.save();
  return bet;
}

async function deleteBet(betId) {
  const bet = await Bet.findByPk(betId);

  if (!bet) {
    const err = new Error('Apuesta no encontrada.');
    err.statusCode = 404;
    throw err;
  }

  if (bet.status === 'won') {
    const winnings = parseFloat(bet.amount) * parseFloat(bet.odds);
    await walletClient.debit(bet.userId, winnings, {
      reference: `BET_DELETE_${bet.id}`,
      description: `Reversión ganancia apuesta #${bet.id}`,
      source: 'betting',
    });
  }

  await bet.destroy();
}

module.exports = {
  placeBet,
  getUserBets,
  getAllBets,
  updateBet,
  deleteBet,
};
