const { Event, Bet } = require('../models');
const { sequelize } = require('../config/db');
const walletClient = require('../clients/walletClient');

async function getAllEvents(filters = {}) {
  const where = {};
  if (filters.status) {
    where.status = filters.status;
  }
  return Event.findAll({
    where,
    order: [['createdAt', 'DESC']],
  });
}

async function getEventById(eventId) {
  const event = await Event.findByPk(eventId);
  if (!event) {
    const err = new Error('Evento deportivo no encontrado.');
    err.statusCode = 404;
    throw err;
  }
  return event;
}

async function createEvent({ title, eventDate, oddsHome, oddsAway, oddsDraw }) {
  return Event.create({
    title,
    eventDate: eventDate || null,
    oddsHome,
    oddsAway,
    oddsDraw,
    status: 'active',
  });
}

async function updateEvent(eventId, { title, eventDate, oddsHome, oddsAway, oddsDraw }) {
  const event = await Event.findByPk(eventId);
  if (!event) {
    const err = new Error('Evento deportivo no encontrado.');
    err.statusCode = 404;
    throw err;
  }

  if (event.status !== 'active') {
    const err = new Error('No se puede editar un evento que ya ha sido completado.');
    err.statusCode = 400;
    throw err;
  }

  if (title !== undefined) event.title = title;
  if (eventDate !== undefined) event.eventDate = eventDate || null;
  if (oddsHome !== undefined) event.oddsHome = oddsHome;
  if (oddsAway !== undefined) event.oddsAway = oddsAway;
  if (oddsDraw !== undefined) event.oddsDraw = oddsDraw;

  await event.save();
  return event;
}

async function deleteEvent(eventId) {
  const event = await Event.findByPk(eventId);
  if (!event) {
    const err = new Error('Evento deportivo no encontrado.');
    err.statusCode = 404;
    throw err;
  }

  const activeBets = await Bet.count({
    where: { eventId, status: 'pending' },
  });

  if (activeBets > 0) {
    const err = new Error('No se puede eliminar un evento que tiene apuestas pendientes.');
    err.statusCode = 400;
    throw err;
  }

  await event.destroy();
}

async function resolveEvent(eventId, winner) {
  if (!['home', 'away', 'draw'].includes(winner)) {
    const err = new Error('Resultado oficial inválido. Debe ser: home, away, o draw.');
    err.statusCode = 400;
    throw err;
  }

  const transaction = await sequelize.transaction();

  try {
    const event = await Event.findByPk(eventId, { transaction, lock: transaction.LOCK.UPDATE });
    if (!event) {
      const err = new Error('Evento no encontrado.');
      err.statusCode = 404;
      throw err;
    }

    if (event.status === 'completed') {
      const err = new Error('Este evento ya fue finalizado y resuelto previamente.');
      err.statusCode = 400;
      throw err;
    }

    event.status = 'completed';
    event.winner = winner;
    await event.save({ transaction });

    const bets = await Bet.findAll({
      where: { eventId, status: 'pending' },
      transaction,
    });

    const winnersToPay = [];

    for (const bet of bets) {
      const isWinner = bet.prediction === winner;

      if (isWinner) {
        winnersToPay.push({
          bet,
          winnings: parseFloat(bet.amount) * parseFloat(bet.odds),
        });
        bet.status = 'won';
      } else {
        bet.status = 'lost';
      }

      await bet.save({ transaction });
    }

    await transaction.commit();

    for (const { bet, winnings } of winnersToPay) {
      await walletClient.credit(bet.userId, winnings, {
        reference: `BET_WIN_${bet.id}`,
        description: `Ganancia apuesta #${bet.id} evento #${eventId}`,
        source: 'betting',
      });
    }

    return event;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

module.exports = {
  getAllEvents,
  getEventById,
  createEvent,
  resolveEvent,
  updateEvent,
  deleteEvent,
};
