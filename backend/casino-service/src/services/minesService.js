const { MinesGame } = require('../models');
const { sequelize } = require('../config/db');
const walletClient = require('../clients/walletClient');

const WALLET_SOURCE = 'casino';

const GRID_SIZE = 5;
const TOTAL_CELLS = GRID_SIZE * GRID_SIZE;

function calcMultiplier(minesCount, revealedCount) {
  const safeCells = TOTAL_CELLS - minesCount;
  if (revealedCount === 0) return 1.0;
  let mult = 1.0;
  for (let i = 0; i < revealedCount; i++) {
    const remaining = TOTAL_CELLS - i;
    const safeRemaining = safeCells - i;
    mult *= (remaining / safeRemaining);
  }
  return parseFloat((mult * 0.97).toFixed(4));
}

function generateMines(count) {
  const positions = new Set();
  while (positions.size < count) {
    positions.add(Math.floor(Math.random() * TOTAL_CELLS));
  }
  return [...positions];
}

async function startGame(userId, betAmount, minesCount) {
  const bet   = parseFloat(betAmount);
  const mines = parseInt(minesCount, 10);

  if (isNaN(bet) || bet <= 0) {
    const err = new Error('La apuesta debe ser un número positivo.');
    err.statusCode = 400; throw err;
  }
  if (isNaN(mines) || mines < 1 || mines > 24) {
    const err = new Error('La cantidad de minas debe estar entre 1 y 24.');
    err.statusCode = 400; throw err;
  }

  const balance = await walletClient.getBalance(userId);
  if (balance < bet) {
    const err = new Error('Saldo insuficiente.'); err.statusCode = 400; throw err;
  }

  const transaction = await sequelize.transaction();
  try {
    await MinesGame.update(
      { status: 'exploded', payout: 0 },
      { where: { userId, status: 'in_progress' }, transaction }
    );

    await transaction.commit();
  } catch (err) {
    try { await transaction.rollback(); } catch (_) {}
    throw err;
  }

  let currentBalance = await walletClient.debit(userId, bet, {
    reference: 'MINES_BET',
    description: 'Apuesta Mines',
    source: WALLET_SOURCE,
  });

  const gameTransaction = await sequelize.transaction();
  try {
    const minePositions = generateMines(mines);

    const game = await MinesGame.create({
      userId,
      bet,
      minesCount: mines,
      gridSize: GRID_SIZE,
      minePositions: JSON.stringify(minePositions),
      revealedCells: '[]',
      multiplier: 1.0,
      status: 'in_progress',
      payout: 0,
    }, { transaction: gameTransaction });

    await gameTransaction.commit();

    return buildGameResponse(game, currentBalance);
  } catch (err) {
    try { await gameTransaction.rollback(); } catch (_) {}
    try {
      await walletClient.credit(userId, bet, {
        reference: 'MINES_ROLLBACK',
        description: 'Reversión apuesta Mines',
        source: WALLET_SOURCE,
      });
    } catch (_) {}
    throw err;
  }
}

async function revealCell(userId, cellIndex) {
  const idx = parseInt(cellIndex, 10);
  if (isNaN(idx) || idx < 0 || idx >= TOTAL_CELLS) {
    const err = new Error('Índice de celda inválido.'); err.statusCode = 400; throw err;
  }

  const transaction = await sequelize.transaction();
  try {
    const game = await MinesGame.findOne({
      where: { userId, status: 'in_progress' },
      transaction, lock: true,
    });
    if (!game) {
      const err = new Error('No hay ninguna partida activa de Mines.'); err.statusCode = 400; throw err;
    }

    const minePositions = JSON.parse(game.minePositions);
    let revealedCells   = JSON.parse(game.revealedCells);

    if (revealedCells.includes(idx)) {
      const err = new Error('Esta celda ya fue revelada.'); err.statusCode = 400; throw err;
    }

    const isMine = minePositions.includes(idx);
    revealedCells.push(idx);

    let status     = 'in_progress';
    let multiplier = game.multiplier;
    let payout     = 0;
    let balance    = await walletClient.getBalance(userId);

    if (isMine) {
      status = 'exploded';
      payout = 0;
    } else {
      multiplier = calcMultiplier(game.minesCount, revealedCells.length);
      const safeCells = TOTAL_CELLS - game.minesCount;
      if (revealedCells.length >= safeCells) {
        status = 'cashed_out';
        payout = parseFloat(game.bet) * multiplier;
        balance = await walletClient.credit(userId, payout, {
          reference: 'MINES_PAYOUT',
          description: 'Pago Mines (auto cashout)',
          source: WALLET_SOURCE,
        });
      }
    }

    await game.update({
      revealedCells: JSON.stringify(revealedCells),
      multiplier,
      status,
      payout,
    }, { transaction });

    await transaction.commit();

    return {
      ...buildGameResponse(
        { ...game.toJSON(), revealedCells: JSON.stringify(revealedCells), multiplier, status, payout },
        balance
      ),
      minePositions: status !== 'in_progress' ? minePositions : null,
      hitMine: isMine,
      cellIndex: idx,
    };
  } catch (err) {
    try { await transaction.rollback(); } catch (_) {}
    throw err;
  }
}

async function cashOut(userId) {
  const transaction = await sequelize.transaction();
  try {
    const game = await MinesGame.findOne({
      where: { userId, status: 'in_progress' },
      transaction, lock: true,
    });
    if (!game) {
      const err = new Error('No hay ninguna partida activa de Mines.'); err.statusCode = 400; throw err;
    }

    const revealedCells = JSON.parse(game.revealedCells);
    if (revealedCells.length === 0) {
      const err = new Error('Debes revelar al menos una celda antes de cobrar.'); err.statusCode = 400; throw err;
    }

    const multiplier = parseFloat(game.multiplier);
    const payout     = parseFloat(game.bet) * multiplier;

    await game.update({ status: 'cashed_out', payout }, { transaction });
    await transaction.commit();

    const balance = await walletClient.credit(userId, payout, {
      reference: 'MINES_PAYOUT',
      description: 'Pago Mines (cashout)',
      source: WALLET_SOURCE,
    });

    const minePositions = JSON.parse(game.minePositions);

    return {
      ...buildGameResponse(
        { ...game.toJSON(), status: 'cashed_out', payout },
        balance
      ),
      minePositions,
    };
  } catch (err) {
    try { await transaction.rollback(); } catch (_) {}
    throw err;
  }
}

async function getActiveGame(userId) {
  const game = await MinesGame.findOne({
    where: { userId, status: 'in_progress' },
  });
  if (!game) return null;
  const balance = await walletClient.getBalance(userId);
  return buildGameResponse(game, balance);
}

async function getHistory(userId) {
  return MinesGame.findAll({
    where: { userId },
    order: [['created_at', 'DESC']],
    limit: 20,
    attributes: ['id', 'bet', 'minesCount', 'status', 'multiplier', 'payout', ['created_at', 'createdAt']],
  });
}

function buildGameResponse(game, balance) {
  const revealedCells = typeof game.revealedCells === 'string'
    ? JSON.parse(game.revealedCells) : game.revealedCells;

  return {
    id:            game.id,
    bet:           parseFloat(game.bet),
    minesCount:    game.minesCount,
    gridSize:      game.gridSize,
    revealedCells,
    multiplier:    parseFloat(game.multiplier),
    status:        game.status,
    payout:        parseFloat(game.payout || 0),
    balance:       parseFloat(balance),
  };
}

module.exports = {
  startGame,
  revealCell,
  cashOut,
  getActiveGame,
  getHistory,
};
