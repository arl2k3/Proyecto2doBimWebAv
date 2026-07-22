const http = require('http');
const { app, wsProxy } = require('./app');
const env = require('./config/env');

const server = http.createServer(app);

server.on('upgrade', (req, socket, head) => {
  if (!req.url?.startsWith('/socket.io')) {
    socket.destroy();
    return;
  }

  // El JWT del socket viaja en el payload de handshake de Socket.IO, no en la URL.
  // El chat-service valida el token a nivel de socket (socketAuth), por lo que aquí
  // solo reenviamos el upgrade de WebSocket de forma transparente.
  wsProxy.upgrade(req, socket, head);
});

server.listen(env.port, () => {
  console.log(`🚪 BetZone API Gateway escuchando en puerto ${env.port}`);
});
