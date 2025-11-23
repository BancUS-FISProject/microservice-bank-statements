// Repositorio con Mongoose para bank-statements
const BankStatement = require('../../db/models/bankStatement');

async function findByAccount(accountId, filters = {}) {
    console.log(`[repo] findByAccount -> accountId=${accountId}, filters=${JSON.stringify(filters)}`);
    const query = { account_id: accountId };
    if (filters.from) query.date_start = { $gte: new Date(filters.from) };
    // Siempre filtrar date_end anterior a la fecha actual
    const now = new Date();
    if (filters.to) {
        // Si el filtro 'to' existe, usar la fecha menor entre el 'to' y ahora
        const toDate = new Date(filters.to);
        const maxDate = toDate < now ? toDate : now;
        query.date_end = { $lt: maxDate };
    } else {
        query.date_end = { $lt: now };
    }
    // Devolver solo los campos solicitados: id, date_start y date_end
    return BankStatement.find(query).select('_id date_start date_end').lean();
}

async function findById(id) {
    console.log(`[repo] findById -> id=${id}`);
    return BankStatement.findById(id).lean();
}

async function saveStatement(statementData) {
    console.log(`[repo] saveStatement -> data=${JSON.stringify(statementData)}`);
    const created = await BankStatement.create(statementData);
    return created.toObject();
}

// Añadir transacción creando un nuevo statement (simple behavior)
async function appendTransaction(accountId, tx, opts = {}) {
    const stmt = {
        account_id: accountId,
        date_start: opts.date_start || tx.date,
        date_end: opts.date_end || tx.date,
        transactions: [tx],
    };
    return saveStatement(stmt);
}

module.exports = { findByAccount, findById, saveStatement, appendTransaction };
