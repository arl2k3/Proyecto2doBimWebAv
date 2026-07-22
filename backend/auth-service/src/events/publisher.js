const amqp = require('amqplib');
const env = require('../config/env');

const EXCHANGE = 'betzone.events';

let channel = null;

async function connectPublisher() {
  try {
    const conn = await amqp.connect(env.rabbitmqUrl);
    channel = await conn.createChannel();
    await channel.assertExchange(EXCHANGE, 'topic', { durable: true });
    console.log('✅ Auth Service conectado a RabbitMQ');
  } catch (err) {
    console.warn('⚠️ RabbitMQ no disponible, eventos async deshabilitados:', err.message);
  }
}

function publishEvent(routingKey, payload) {
  if (!channel) return;
  channel.publish(EXCHANGE, routingKey, Buffer.from(JSON.stringify(payload)), { persistent: true });
}

module.exports = { connectPublisher, publishEvent, EXCHANGE };
