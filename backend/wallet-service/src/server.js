const app = require('./app');
const env = require('./config/env');
const { connectDB } = require('./config/db');
const { startConsumer } = require('./events/consumer');

async function start() {
  try {
    await connectDB();
    await startConsumer();
    app.listen(env.port, () => {
      console.log(`💰 Wallet Service escuchando en puerto ${env.port}`);
    });
  } catch (err) {
    console.error('❌ Error iniciando Wallet Service:', err.message);
    process.exit(1);
  }
}

start();
