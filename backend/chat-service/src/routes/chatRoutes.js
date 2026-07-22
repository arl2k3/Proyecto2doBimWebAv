const express = require('express');
const chatController = require('../controllers/chatController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/history/:room', protect, chatController.getHistory);

module.exports = router;
