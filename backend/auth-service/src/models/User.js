const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/db');
const { hashPassword } = require('../../../shared/utils/hash');

class User extends Model {}

User.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    username: { type: DataTypes.STRING(255), allowNull: false, unique: true },
    email: { type: DataTypes.STRING(255), allowNull: false, unique: true, validate: { isEmail: true } },
    password: { type: DataTypes.STRING(255), allowNull: true },
    role: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: 'user',
      validate: { isIn: [['user', 'admin']] },
    },
    googleId: { type: DataTypes.STRING(255), allowNull: true, unique: true },
    avatarUrl: { type: DataTypes.STRING(500), allowNull: true },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) user.password = await hashPassword(user.password);
      },
      beforeUpdate: async (user) => {
        if (user.changed('password') && user.password) {
          user.password = await hashPassword(user.password);
        }
      },
    },
  }
);

module.exports = User;
