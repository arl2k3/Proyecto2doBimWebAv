const User = require('./User');
const PasswordResetToken = require('./PasswordResetToken');

User.hasMany(PasswordResetToken, { foreignKey: 'userId', as: 'resetTokens' });
PasswordResetToken.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = { User, PasswordResetToken };
