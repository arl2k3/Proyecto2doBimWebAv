const Event = require('./Event');
const Bet = require('./Bet');

Event.hasMany(Bet, { foreignKey: 'eventId', as: 'bets' });
Bet.belongsTo(Event, { foreignKey: 'eventId', as: 'event' });

module.exports = { Event, Bet };
