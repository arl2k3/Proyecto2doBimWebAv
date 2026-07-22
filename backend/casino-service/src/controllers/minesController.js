const minesService = require('../services/minesService');

async function start(req, res, next) {
  try {
    const { bet, minesCount } = req.body;
    const game = await minesService.startGame(req.user.id, bet, minesCount);
    res.status(201).json({ success: true, data: game });
  } catch (err) { next(err); }
}

async function reveal(req, res, next) {
  try {
    const { cellIndex } = req.body;
    const result = await minesService.revealCell(req.user.id, cellIndex);
    res.status(200).json({ success: true, data: result });
  } catch (err) { next(err); }
}

async function cashOut(req, res, next) {
  try {
    const result = await minesService.cashOut(req.user.id);
    res.status(200).json({ success: true, data: result });
  } catch (err) { next(err); }
}

async function activeGame(req, res, next) {
  try {
    const game = await minesService.getActiveGame(req.user.id);
    res.status(200).json({ success: true, data: game });
  } catch (err) { next(err); }
}

async function history(req, res, next) {
  try {
    const games = await minesService.getHistory(req.user.id);
    res.status(200).json({ success: true, data: games });
  } catch (err) { next(err); }
}

module.exports = { start, reveal, cashOut, activeGame, history };
