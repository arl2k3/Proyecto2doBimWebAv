const { Message } = require('../models');
const { formatMessage } = require('../controllers/chatController');

function chatSocketHandler(io, socket) {
  console.log(`🔌 Cliente Conectado: ${socket.user.username} [ID: ${socket.id}]`);

  let currentRoom = null;

  socket.on('joinRoom', ({ room }) => {
    if (currentRoom) {
      socket.leave(currentRoom);
      console.log(`🏃‍♂️ ${socket.user.username} salió de la sala: ${currentRoom}`);
    }

    currentRoom = room || 'general';
    socket.join(currentRoom);

    console.log(`📥 ${socket.user.username} se unió a la sala: ${currentRoom}`);

    socket.emit('sysMessage', {
      text: `Te has unido con éxito a la sala: ${currentRoom}!`,
      timestamp: new Date(),
    });

    socket.to(currentRoom).emit('sysMessage', {
      text: `El usuario ${socket.user.username} ha ingresado a la sala.`,
      timestamp: new Date(),
    });
  });

  socket.on('sendMessage', async ({ text }) => {
    if (!text || text.trim() === '') return;
    const targetRoom = currentRoom || 'general';

    try {
      const messageRecord = await Message.create({
        userId: socket.user.id,
        username: socket.user.username,
        role: socket.user.role,
        message: text.trim(),
        room: targetRoom,
      });

      io.to(targetRoom).emit('message', formatMessage(messageRecord));
    } catch (error) {
      console.error('💥 Error al procesar y guardar mensaje del chat:', error.message);
      socket.emit('error', { text: 'No se pudo registrar tu mensaje en el chat.' });
    }
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Cliente Desconectado: ${socket.user.username} [ID: ${socket.id}]`);
    if (currentRoom) {
      socket.to(currentRoom).emit('sysMessage', {
        text: `El usuario ${socket.user.username} ha abandonado la sala.`,
        timestamp: new Date(),
      });
    }
  });
}

module.exports = chatSocketHandler;
