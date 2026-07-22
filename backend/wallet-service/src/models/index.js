const Wallet = require('./Wallet');
const Transaction = require('./Transaction');

Wallet.hasMany(Transaction, { foreignKey: 'userId', sourceKey: 'userId', as: 'transactions' });
Transaction.belongsTo(Wallet, { foreignKey: 'userId', targetKey: 'userId', as: 'wallet' });

module.exports = { Wallet, Transaction };
