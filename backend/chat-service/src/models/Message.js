const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/db');

class Message extends Model {}

Message.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    room: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: 'general',
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    username: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    role: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'user',
    },
  },
  {
    sequelize,
    modelName: 'Message',
    tableName: 'messages',
  }
);

module.exports = Message;
