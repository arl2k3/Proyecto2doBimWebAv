const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/db');

class PasswordResetToken extends Model {}

PasswordResetToken.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    token: { type: DataTypes.STRING(255), allowNull: false, unique: true },
    expiresAt: { type: DataTypes.DATE, allowNull: false },
    used: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  },
  { sequelize, modelName: 'PasswordResetToken', tableName: 'password_reset_tokens', updatedAt: false }
);

module.exports = PasswordResetToken;
