const app = require('./app');
const env = require('./config/env');
const { connectDB } = require('./config/db');
const { connectPublisher } = require('./events/publisher');

async function start() {
  try {
    await connectDB();
    await connectPublisher();
    app.listen(env.port, () => {
      console.log(`🔐 Auth Service escuchando en puerto ${env.port}`);
    });
  } catch (err) {
    console.error('❌ Error iniciando Auth Service:', err.message);
    process.exit(1);
  }
}

start();
