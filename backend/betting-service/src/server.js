const app = require('./app');
const env = require('./config/env');
const { connectDB } = require('./config/db');

async function start() {
  try {
    await connectDB();
    app.listen(env.port, () => {
      console.log(`🎲 Betting Service escuchando en puerto ${env.port}`);
    });
  } catch (err) {
    console.error('❌ Error iniciando Betting Service:', err.message);
    process.exit(1);
  }
}

start();
