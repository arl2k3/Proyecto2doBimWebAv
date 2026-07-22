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

app.use(healthRouter('chat-service', () => sequelize.authenticate()));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use(errorMiddleware);

module.exports = app;
