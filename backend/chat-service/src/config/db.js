const { Sequelize } = require('sequelize');
const env = require('./env');

const sequelize = new Sequelize(env.db.name, env.db.user, env.db.pass, {
  host: env.db.host,
  port: env.db.port,
  dialect: 'postgres',
  logging: env.nodeEnv === 'development' ? console.log : false,
  define: { underscored: true, timestamps: true },
});

async function connectDB() {
  await sequelize.authenticate();
  require('../models');
  await sequelize.sync({ alter: env.nodeEnv === 'development' });
}

module.exports = { sequelize, connectDB };
