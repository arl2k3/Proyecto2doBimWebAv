const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/db');

class Wallet extends Model {}

Wallet.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    balance: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'USD' },
    status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'active' },
  },
  { sequelize, modelName: 'Wallet', tableName: 'wallets' }
);

module.exports = Wallet;
