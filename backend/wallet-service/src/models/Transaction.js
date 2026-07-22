const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/db');

class Transaction extends Model {}

Transaction.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    type: { type: DataTypes.STRING(10), allowNull: false, validate: { isIn: [['debit', 'credit']] } },
    amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    balanceAfter: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    reference: { type: DataTypes.STRING(100), allowNull: true },
    description: { type: DataTypes.STRING(255), allowNull: true },
    source: { type: DataTypes.STRING(50), allowNull: true },
  },
  { sequelize, modelName: 'Transaction', tableName: 'transactions' }
);

module.exports = Transaction;
