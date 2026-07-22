const app = require('./app');
const env = require('./config/env');
const { connectDB } = require('./config/db');

async function start() {
  try {
    await connectDB();
    app.listen(env.port, () => {
      console.log(`🎰 Casino Service escuchando en puerto ${env.port}`);
    });
  } catch (err) {
    console.error('❌ Error iniciando Casino Service:', err.message);
    process.exit(1);
  }
}

start();
