const blackjackService = require('../services/blackjackService');

async function start(req, res, next) {
  try {
    const { bet } = req.body;
    const game = await blackjackService.startGame(req.user.id, bet);
    res.status(201).json({ success: true, data: game });
  } catch (err) { next(err); }
}

async function hit(req, res, next) {
  try {
    const game = await blackjackService.hit(req.user.id);
    res.status(200).json({ success: true, data: game });
  } catch (err) { next(err); }
}

async function stand(req, res, next) {
  try {
    const game = await blackjackService.stand(req.user.id);
    res.status(200).json({ success: true, data: game });
  } catch (err) { next(err); }
}

async function double(req, res, next) {
  try {
    const game = await blackjackService.double(req.user.id);
    res.status(200).json({ success: true, data: game });
  } catch (err) { next(err); }
}

async function split(req, res, next) {
  try {
    const game = await blackjackService.split(req.user.id);
    res.status(200).json({ success: true, data: game });
  } catch (err) { next(err); }
}

async function activeGame(req, res, next) {
  try {
    const game = await blackjackService.getActiveGame(req.user.id);
    res.status(200).json({ success: true, data: game });
  } catch (err) { next(err); }
}

async function history(req, res, next) {
  try {
    const games = await blackjackService.getHistory(req.user.id);
    res.status(200).json({ success: true, data: games });
  } catch (err) { next(err); }
}

module.exports = { start, hit, stand, double, split, activeGame, history };
