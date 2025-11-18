const repo = require('../repositories/bankStatementsRepository');

function getByAccount(accountId, filters) {
    console.log(`[service] getByAccount -> accountId=${accountId}, filters=${JSON.stringify(filters)}`);
    // Aquí iría la lógica para validar filtros y llamar al repositorio
    return [];
}

function getById(id) {
    console.log(`[service] getById -> id=${id}`);
    // Aquí se obtendría el detalle desde el repositorio
    return null;
}

function postTransaction(payload) {
    console.log(`[service] postTransaction -> payload=${JSON.stringify(payload)}`);
    // Aquí se podría validar y persistir la transacción
    return { accepted: true };
}

module.exports = { getByAccount, getById, postTransaction };
