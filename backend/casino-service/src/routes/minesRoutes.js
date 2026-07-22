const express = require('express');
const { protect } = require('../middlewares/authMiddleware');
const ctrl = require('../controllers/minesController');

const router = express.Router();
router.use(protect);

router.post('/start',   ctrl.start);
router.post('/reveal',  ctrl.reveal);
router.post('/cashout', ctrl.cashOut);
router.get('/active',   ctrl.activeGame);
router.get('/history',  ctrl.history);

module.exports = router;
