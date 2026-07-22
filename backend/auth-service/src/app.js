const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { healthRouter } = require('../../shared/middleware/healthCheck');
const errorMiddleware = require('../../shared/middleware/errorMiddleware');
const { sequelize } = require('./config/db');
const { configurePassport, passport } = require('./config/passport');

configurePassport();

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(passport.initialize());

app.use(healthRouter('auth-service', () => sequelize.authenticate()));
app.use('/api/auth', require('./routes/authRoutes'));
app.use(errorMiddleware);

module.exports = app;
