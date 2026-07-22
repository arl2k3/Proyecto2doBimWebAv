const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { healthRouter } = require('../../shared/middleware/healthCheck');
const errorMiddleware = require('../../shared/middleware/errorMiddleware');
const { sequelize } = require('./config/db');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use(healthRouter('betting-service', () => sequelize.authenticate()));
app.use('/api/events', require('./routes/eventRoutes'));
app.use('/api/bets', require('./routes/betRoutes'));
app.use(errorMiddleware);

module.exports = app;
