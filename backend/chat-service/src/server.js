const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const env = require('./config/env');
const { connectDB } = require('./config/db');
const socketAuth = require('./sockets/socketAuth');
const chatSocketHandler = require('./sockets/chatSocket');

async function start() {
  try {
    await connectDB();

    const server = http.createServer(app);
    const io = new Server(server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });

    socketAuth(io);

    io.on('connection', (socket) => {
      chatSocketHandler(io, socket);
    });

    server.listen(env.port, () => {
      console.log(`💬 Chat Service escuchando en puerto ${env.port}`);
    });
  } catch (err) {
    console.error('❌ Error iniciando Chat Service:', err.message);
    process.exit(1);
  }
}

start();
