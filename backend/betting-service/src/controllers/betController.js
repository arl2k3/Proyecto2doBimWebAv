const betService = require('../services/betService');

async function record(req, res, next) {
  try {
    const { eventId, amount, prediction } = req.body;
    const { bet, newBalance } = await betService.placeBet(req.user.id, {
      eventId,
      amount,
      prediction,
    });

    res.status(201).json({
      success: true,
      message: 'Apuesta colocada con éxito.',
      data: {
        bet,
        balance: newBalance,
      },
    });
  } catch (error) {
    next(error);
  }
}

async function selectUserBets(req, res, next) {
  try {
    const bets = await betService.getUserBets(req.user.id);
    res.status(200).json({
      success: true,
      data: bets,
    });
  } catch (error) {
    next(error);
  }
}

async function selectAll(req, res, next) {
  try {
    const bets = await betService.getAllBets();
    res.status(200).json({
      success: true,
      data: bets,
    });
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    const { amount, prediction, odds, status } = req.body;
    const updatedBet = await betService.updateBet(req.params.id, {
      amount,
      prediction,
      odds,
      status,
    });

    res.status(200).json({
      success: true,
      message: 'Apuesta actualizada exitosamente.',
      data: updatedBet,
    });
  } catch (error) {
    next(error);
  }
}

async function destroy(req, res, next) {
  try {
    await betService.deleteBet(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Apuesta eliminada exitosamente.',
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  record,
  selectUserBets,
  selectAll,
  update,
  destroy,
};
