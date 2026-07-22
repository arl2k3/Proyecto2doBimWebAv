const express = require('express');
const { protect } = require('../middlewares/authMiddleware');
const ctrl = require('../controllers/blackjackController');

const router = express.Router();
router.use(protect);

router.post('/start',   ctrl.start);
router.post('/hit',     ctrl.hit);
router.post('/stand',   ctrl.stand);
router.post('/double',  ctrl.double);
router.post('/split',   ctrl.split);
router.get('/active',   ctrl.activeGame);
router.get('/history',  ctrl.history);

module.exports = router;
