const { Message } = require('../models');

function formatMessage(record) {
  return {
    id: record.id,
    user: {
      id: record.userId,
      username: record.username,
      role: record.role,
    },
    message: record.message,
    room: record.room,
    createdAt: record.createdAt,
  };
}

async function getHistory(req, res, next) {
  try {
    const { room } = req.params;
    const messages = await Message.findAll({
      where: { room: room || 'general' },
      order: [['createdAt', 'ASC']],
      limit: 50,
    });

    res.status(200).json({
      success: true,
      data: messages.map(formatMessage),
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { getHistory, formatMessage };
