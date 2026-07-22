const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/db');

class Event extends Model {}

Event.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    eventDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    oddsHome: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 1.5,
    },
    oddsAway: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 1.5,
    },
    oddsDraw: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 1.5,
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'active',
      validate: {
        isIn: [['active', 'completed']],
      },
    },
    winner: {
      type: DataTypes.STRING(10),
      allowNull: true,
      validate: {
        isIn: [['home', 'away', 'draw', null]],
      },
    },
  },
  {
    sequelize,
    modelName: 'Event',
    tableName: 'events',
  }
);

module.exports = Event;
