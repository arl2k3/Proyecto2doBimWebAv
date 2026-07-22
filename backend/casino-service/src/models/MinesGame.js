const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/db');

class MinesGame extends Model {}

MinesGame.init(
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
    minesCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'mines_count',
      validate: { min: 1, max: 24 },
    },
    gridSize: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 5,
      field: 'grid_size',
    },
    minePositions: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: '[]',
      field: 'mine_positions',
    },
    revealedCells: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: '[]',
      field: 'revealed_cells',
    },
    multiplier: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: false,
      defaultValue: 1.0000,
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'in_progress',
      validate: {
        isIn: [['in_progress', 'cashed_out', 'exploded']],
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
    modelName: 'MinesGame',
    tableName: 'mines_games',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

module.exports = MinesGame;
