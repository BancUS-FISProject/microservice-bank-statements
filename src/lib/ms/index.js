const config = require('../../config');

// obtener la estrategia desde config.strategy (que carga variables de entorno)
const MS_STRATEGY = config.strategy || 'mock';

let strategy;
if (MS_STRATEGY === 'http') {
    strategy = require('./strategies/http');
} else {
    strategy = require('./strategies/mock');
}

module.exports = {
    getAccount: (id) => strategy.getAccount(id),
    getTransactions: (accountId) => strategy.getTransactions(accountId),
    sendNotification: (payload) => strategy.sendNotification(payload),
};
