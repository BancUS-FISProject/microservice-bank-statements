// Repositorio placeholder. Implementar persistencia real aquí.

function findByAccount(accountId, filters) {
    console.log(`[repo] findByAccount -> accountId=${accountId}, filters=${JSON.stringify(filters)}`);
    return [];
}

function findById(id) {
    console.log(`[repo] findById -> id=${id}`);
    return null;
}

function saveTransaction(tx) {
    console.log(`[repo] saveTransaction -> tx=${JSON.stringify(tx)}`);
    return { id: 'tx-123' };
}

module.exports = { findByAccount, findById, saveTransaction };
