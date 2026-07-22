const express = require('express');
const eventController = require('../controllers/eventController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/', protect, eventController.selectAll);
router.get('/:id', protect, eventController.selectById);

router.post('/', protect, restrictTo('admin'), eventController.store);
router.put('/:id', protect, restrictTo('admin'), eventController.update);
router.delete('/:id', protect, restrictTo('admin'), eventController.destroy);
router.post('/:id/resolve', protect, restrictTo('admin'), eventController.resolve);

module.exports = router;
