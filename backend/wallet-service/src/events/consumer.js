const amqp = require('amqplib');
const walletService = require('../services/walletService');
const env = require('../config/env');

const EXCHANGE = 'betzone.events';
const QUEUE = 'wallet.user.registered';

async function startConsumer() {
  try {
    const conn = await amqp.connect(env.rabbitmqUrl);
    const channel = await conn.createChannel();
    await channel.assertExchange(EXCHANGE, 'topic', { durable: true });
    await channel.assertQueue(QUEUE, { durable: true });
    await channel.bindQueue(QUEUE, EXCHANGE, 'user.registered');

    channel.consume(QUEUE, async (msg) => {
      if (!msg) return;
      try {
        const { userId, initialBalance } = JSON.parse(msg.content.toString());
        await walletService.createWallet(userId, initialBalance);
        console.log(`💰 Wallet creado para userId=${userId}`);
        channel.ack(msg);
      } catch (err) {
        console.error('Error procesando user.registered:', err.message);
        channel.nack(msg, false, false);
      }
    });

    console.log('✅ Wallet Service escuchando eventos RabbitMQ');
  } catch (err) {
    console.warn('⚠️ RabbitMQ no disponible:', err.message);
  }
}

module.exports = { startConsumer };
