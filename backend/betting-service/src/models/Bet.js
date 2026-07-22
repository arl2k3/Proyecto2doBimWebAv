const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/db');

class Bet extends Model {}

Bet.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    eventId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0.01,
      },
    },
    prediction: {
      type: DataTypes.STRING(10),
      allowNull: false,
      validate: {
        isIn: [['home', 'away', 'draw']],
      },
    },
    odds: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'pending',
      validate: {
        isIn: [['pending', 'won', 'lost', 'refunded']],
      },
    },
  },
  {
    sequelize,
    modelName: 'Bet',
    tableName: 'bets',
  }
);

module.exports = Bet;
