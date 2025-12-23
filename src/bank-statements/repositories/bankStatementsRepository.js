// Repositorio con Mongoose para bank-statements
const BankStatement = require('../../db/models/bankStatement');

async function findByAccount(accountId, filters = {}) {
    console.log(`[repo] findByAccount -> accountId=${accountId}, filters=${JSON.stringify(filters)}`);

    const query = {
        'account.id': accountId
    };
    // Filtro opcional por rango de meses (YYYY-MM)
    if (filters.from) {
        const [fromYear, fromMonth] = filters.from.split('-').map(Number);
        query.$or = [
            { year: { $gt: fromYear } },
            { year: fromYear, month: { $gte: fromMonth } }
        ];
    }
    if (filters.to) {
        const [toYear, toMonth] = filters.to.split('-').map(Number);
        query.$and = [
            ...(query.$and || []),
            {
                $or: [
                    { year: { $lt: toYear } },
                    { year: toYear, month: { $lte: toMonth } }
                ]
            }
        ];
    }
    return BankStatement
        .find(query)
        .sort({ year: -1, month: -1 })
        .lean();
}


async function findById(id) {
    console.log(`[repo] findById -> id=${id}`);
    return BankStatement.findById(id).lean();
}

async function findByAccountYearMonth(accountId, year, month) {
    console.log(`[repo] findByAccountYearMonth -> accountId=${accountId}, year=${year}, month=${month}`);
    return BankStatement.findOne({ 'account.id': accountId, year: Number(year), month: Number(month) }).lean();
}

async function findByAccountNameYearMonth(accountName, year, month) {
    console.log(`[repo] findByAccountNameYearMonth -> accountName=${accountName}, year=${year}, month=${month}`);
    return BankStatement.findOne({ 'account.name': accountName, year: Number(year), month: Number(month) }).lean();
}

async function deleteById(id) {
    console.log(`[repo] deleteById -> id=${id}`);
    return BankStatement.findByIdAndDelete(id).lean();
}

async function replaceStatementsForAccount(accountId, statements = []) {
    console.log(`[repo] replaceStatementsForAccount -> accountId=${accountId}, count=${(statements || []).length}`);
    // eliminar statements existentes
    await BankStatement.deleteMany({ 'account.id': accountId });

    if (!Array.isArray(statements) || statements.length === 0) return [];

    // asegurar que cada statement tenga el campo account.id correcto
    const prepared = statements.map(s => {
        const account = Object.assign({}, s.account || {}, { id: accountId });
        return Object.assign({}, s, { account });
    });

    const inserted = await BankStatement.insertMany(prepared);
    return inserted.map(d => d.toObject());
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

module.exports = { findByAccount, findById, saveStatement, appendTransaction, deleteById, replaceStatementsForAccount, findByAccountYearMonth, findByAccountNameYearMonth };
