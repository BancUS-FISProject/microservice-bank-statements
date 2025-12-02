require('dotenv').config();

// estrategia seleccionada via env
const strategy = process.env.MS_STRATEGY || 'mock';

function envOr(key, fallback) {
    return process.env[key] || fallback;
}

// Construir objetos de endpoints por strategy usando vars de entorno prefijadas
const microservices = {

    http: {
        accounts: envOr('STRATEGIES_HTTP_ACCOUNTS_BASE', 'http://localhost:4000'),
        transactions: envOr('STRATEGIES_HTTP_TRANSACTIONS_BASE', 'http://localhost:4001'),
        notifications: envOr('STRATEGIES_HTTP_NOTIFICATIONS_BASE', 'http://localhost:4002'),
    },
};


module.exports = { strategy, microservices };
