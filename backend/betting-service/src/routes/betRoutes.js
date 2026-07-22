const express = require('express');
const betController = require('../controllers/betController');
const { betValidator } = require('../utils/validators');
const { validateRequest } = require('../middlewares/validationMiddleware');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(protect);

router.post('/', betValidator, validateRequest, betController.record);
router.get('/history', betController.selectUserBets);

router.get('/', restrictTo('admin'), betController.selectAll);
router.put('/:id', restrictTo('admin'), betController.update);
router.delete('/:id', restrictTo('admin'), betController.destroy);

module.exports = router;
