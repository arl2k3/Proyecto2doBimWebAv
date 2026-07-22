const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/db');

class BlackjackGame extends Model {}

BlackjackGame.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id',
    },
    bet: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    playerCards: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: '[]',
      field: 'player_cards',
    },
    dealerCards: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: '[]',
      field: 'dealer_cards',
    },
    deck: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: '[]',
    },
    playerScore: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'player_score',
    },
    dealerScore: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'dealer_score',
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'in_progress',
      validate: {
        isIn: [['in_progress', 'won', 'lost', 'push', 'blackjack', 'bust']],
      },
    },
    payout: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
    },
  },
  {
    sequelize,
    modelName: 'BlackjackGame',
    tableName: 'blackjack_games',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

module.exports = BlackjackGame;
