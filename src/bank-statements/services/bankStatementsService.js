const repo = require('../repositories/bankStatementsRepository');

async function getByAccount(accountId, filters) {
    console.log(`[service] getByAccount -> accountId=${accountId}`);
    const items = await repo.findByAccount(accountId, filters);
    const monthNames = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const groups = {};
    for (const it of (items || [])) {
        const year = it.year;
        const month = it.month;
        if (!year || !month) continue;
        const key = `${year}-${String(month).padStart(2, '0')}`;

        if (!groups[key]) {
            groups[key] = {
                year,
                month,
                items: []
            };
        }
        groups[key].items.push(it);
    }
    const months = Object.values(groups).map(g => {
        let minStart = null;
        let maxEnd = null;
        let representativeId = null;

        for (const s of g.items) {
            const ds = s.date_start ? new Date(s.date_start) : null;
            const de = s.date_end ? new Date(s.date_end) : null;

            if (ds && (!minStart || ds < minStart)) minStart = ds;
            if (de && (!maxEnd || de > maxEnd)) {
                maxEnd = de;
                representativeId = s._id || s.id || null;
            }
            // if no date_end present, fallback to _id of first item
            if (!representativeId && (s._id || s.id)) representativeId = s._id || s.id;
        }

        return {
            year: g.year,
            month: g.month,
            month_name: monthNames[g.month - 1] || null,
            count: g.items.length,
            Id: representativeId
        };
    });
    months.sort((a, b) => (b.year - a.year) || (b.month - a.month));
    return months;
}


async function getById(id) {
    console.log(`[service] getById -> id=${id}`);
    return repo.findById(id);
}

/**
 * generate()
 * - genera statements para todas las cuentas devueltas por `ms.getAllAccounts()`
 * - usa el mes actual (formato "YYYY-MM")
 * - devuelve array con los objetos creados (o construidos en memoria si no se pudo persistir)
 */
async function generate() {
    console.log(`[service] generate (all accounts)`);
    const ms = require('../../lib/ms');

    // determinar mes objetivo (formato YYYY-MM)
    const now = new Date();
    const target = now.toISOString().slice(0, 7); // 'YYYY-MM'
    const [yStr, mStr] = target.split('-');
    const year = parseInt(yStr, 10);
    const monthIndex = Math.max(0, parseInt(mStr, 10) - 1);

    // obtener todas las cuentas desde ms
    let accounts = [];
    try {
        const res = await ms.getAllAccounts();
        if (Array.isArray(res)) accounts = res;
        else if (res && res.error) {
            console.warn('[service] getAllAccounts returned error:', res.message);
        }
    } catch (err) {
        console.error('[service] generate error getting all accounts:', err.message || err);
    }

    const results = [];

    // helper que genera para una sola cuenta
    async function generateForAccount(accountObj) {
        const accountId = accountObj && (accountObj.id || accountObj.accountId || accountObj.iban) || 'unknown';

        // obtener transacciones para la cuenta
        let transactions = [];
        try {
            const txs = await ms.getTransactions(accountId);
            if (Array.isArray(txs)) transactions = txs;
            else if (txs && txs.error) {
                console.warn('[service] getTransactions returned error for', accountId, txs.message);
            }
        } catch (err) {
            console.error('[service] generate error getting transactions for', accountId, err.message || err);
        }

        // calcular rangos de fecha para el mes
        const date_start = new Date(year, monthIndex, 1);
        const date_end = new Date(year, monthIndex + 1, 0);

        // mapear transacciones y calcular totales
        let total_incoming = 0;
        let total_outgoing = 0;
        const mappedTx = (transactions || []).map((t) => {
            const raw = Number(t.quantity || t.amount || 0);
            const amount = Number.isNaN(raw) ? 0 : raw;

            // classify transaction direction:
            // 1) if receiver equals accountId -> incoming
            // 2) else if sender equals accountId -> outgoing
            // 3) else fallback to sign: positive -> incoming, negative -> outgoing
            let classified = false;
            if (t.receiver && String(t.receiver) === String(accountId)) {
                total_incoming += Math.abs(amount);
                classified = true;
            } else if (t.sender && String(t.sender) === String(accountId)) {
                total_outgoing += Math.abs(amount);
                classified = true;
            }
            if (!classified) {
                if (amount > 0) total_incoming += amount;
                else if (amount < 0) total_outgoing += Math.abs(amount);
            }
            console.log(` total_incoming=${total_incoming} total_outgoing=${total_outgoing}`);
            return {
                date: t.gmt_time ? new Date(t.gmt_time) : new Date(),
                amount,
                currency: t.currency || 'USD',
                description: t.status || '',
            };
        });

        console.log(`[service] generateForAccount -> ${accountId} mappedTxCount=${(mappedTx || []).length} total_incoming=${total_incoming} total_outgoing=${total_outgoing}`);

        const statement = {
            account: {
                id: accountObj.id || accountObj.accountId || accountId,
                iban: accountObj.iban || '',
                name: accountObj.name || '',
                email: accountObj.email || null,
            },
            date_start,
            date_end,
            transactions: mappedTx,
            total_incoming,
            total_outgoing,
            year,
            month: monthIndex + 1,
        };

        // intentar persistir
        try {
            const BankStatement = require('../../db/models/bankStatement');
            const created = await BankStatement.create(statement);
            console.log('[service] generateForAccount persisted totals', { accountId, total_incoming: created.total_incoming, total_outgoing: created.total_outgoing });
            console.log('[service] generate: persisted for', accountId, created && created._id);
            // intentar notificar
            try {
                await ms.sendNotification({ to: accountObj.email, subject: 'Bank statement generated', accountId, month: target });
            } catch (err) {
                console.warn('[service] generate: fallo sendNotification for', accountId, err.message || err);
            }
            return created;
        } catch (err) {
            console.warn('[service] generate: persist failed for', accountId, 'continuing:', err.message || err);
            // intentar notificar aun si no se persistió
            try {
                await ms.sendNotification({ to: accountObj.email, subject: 'Bank statement generated (not persisted)', accountId, month: target, statement });
            } catch (err2) {
                console.warn('[service] generate: notify also failed for', accountId, err2.message || err2);
            }
            return statement;
        }
    }

    // generar para todas las cuentas en serie
    for (const acc of accounts) {
        try {
            const out = await generateForAccount(acc);
            results.push(out);
        } catch (err) {
            console.error('[service] generate: unexpected error for account', acc && (acc.id || acc.accountId), err.message || err);
        }
    }

    return results;
}

// generate a single statement from provided transactions (or return existing)
async function generateSingle({ accountId, month, transactions }) {
    console.log('[service] generateSingle ->', accountId, month, Array.isArray(transactions) ? transactions.length : 0);
    if (!accountId) throw new Error('accountId_required');
    if (!month) throw new Error('month_required');

    const [yStr, mStr] = String(month).split('-');
    const year = parseInt(yStr, 10);
    const monthNum = Math.max(0, parseInt(mStr, 10));
    if (!year || !monthNum) throw new Error('invalid_month_format');

    // check if target is current month -> disallow
    const now = new Date();
    const nowYear = now.getUTCFullYear();
    const nowMonth = now.getUTCMonth() + 1;
    if (year === nowYear && monthNum === nowMonth) {
        const err = new Error('month_in_progress');
        err.userMessage = 'No es posible generar el estado para el mes en curso';
        throw err;
    }

    // if already exists, return it
    try {
        const existing = await repo.findByAccountYearMonth(accountId, year, monthNum);
        if (existing) return existing;
    } catch (err) {
        console.warn('[service] generateSingle: error checking existing', err.message || err);
    }

    // compute totals from provided transactions
    let total_incoming = 0;
    let total_outgoing = 0;
    const mapped = (transactions || []).map(t => {
        const raw = Number(t.quantity || t.amount || 0);
        const amount = Number.isNaN(raw) ? 0 : raw;
        if (t.receiver && String(t.receiver) === String(accountId)) {
            total_incoming += Math.abs(amount);
        } else if (t.sender && String(t.sender) === String(accountId)) {
            total_outgoing += Math.abs(amount);
        } else {
            if (amount > 0) total_incoming += amount;
            else if (amount < 0) total_outgoing += Math.abs(amount);
        }
        return {
            date: t.gmt_time ? new Date(t.gmt_time) : new Date(),
            amount,
            currency: t.currency || 'USD',
            description: t.status || '',
        };
    });

    const total = total_incoming + total_outgoing;

    // try to enrich account data
    let account = { id: accountId };
    try {
        const ms = require('../../lib/ms');
        if (ms && typeof ms.getAccount === 'function') {
            const acc = await ms.getAccount(accountId);
            if (acc) account = Object.assign({}, account, acc);
        }
    } catch (err) {
        console.warn('[service] generateSingle: could not fetch account data', err.message || err);
    }

    const date_start = new Date(year, monthNum - 1, 1);
    const date_end = new Date(year, monthNum, 0);

    const stmt = {
        account: {
            id: account.id || accountId,
            iban: account.iban || '',
            name: account.name || '',
            email: account.email || null,
        },
        date_start,
        date_end,
        transactions: mapped,
        total_incoming,
        total_outgoing,
        total,
        year,
        month: monthNum,
    };


    try {
        const created = await repo.saveStatement(stmt);
        return created;
    } catch (err) {
        console.error('[service] generateSingle: persist failed', err.message || err);
        // return built statement if persist fails
        return stmt;
    }
}

// delete statement by identifier: supports { id } OR { accountId, month } OR { accountName, month }
async function deleteByIdentifier(opts = {}) {
    console.log('[service] deleteByIdentifier ->', opts && (opts.id || (opts.accountId && opts.month) || (opts.accountName && opts.month)));
    const { id, accountId, accountName, month } = opts || {};

    if (id) {
        try {
            const deleted = await repo.deleteById(id);
            return deleted;
        } catch (err) {
            console.error('[service] deleteByIdentifier: delete error', err.message || err);
            throw err;
        }
    }

    if ((accountId || accountName) && month) {
        const [yStr, mStr] = String(month).split('-');
        const year = parseInt(yStr, 10);
        const monthNum = Math.max(0, parseInt(mStr, 10));
        if (!year || !monthNum) throw new Error('invalid_month_format');

        let existing = null;
        try {
            if (accountId) existing = await repo.findByAccountYearMonth(accountId, year, monthNum);
            else if (accountName) existing = await repo.findByAccountNameYearMonth(accountName, year, monthNum);
        } catch (err) {
            console.error('[service] deleteByIdentifier: lookup error', err.message || err);
            throw err;
        }

        if (!existing) return null;
        // delete by _id
        try {
            const deleted = await repo.deleteById(existing._id);
            return deleted;
        } catch (err) {
            console.error('[service] deleteByIdentifier: delete error', err.message || err);
            throw err;
        }
    }

    const e = new Error('identifier_required');
    throw e;
}

// replace the list of statements for an account
async function updateStatements(accountId, statements) {
    console.log('[service] updateStatements -> accountId=', accountId, 'count=', Array.isArray(statements) ? statements.length : 0);
    if (!Array.isArray(statements)) throw new Error('statements_must_be_array');
    // basic normalization: ensure account.id is set for each statement
    const normalized = statements.map(s => {
        const st = Object.assign({}, s);
        st.account = Object.assign({}, st.account || {}, { id: accountId });
        return st;
    });
    try {
        const out = await repo.replaceStatementsForAccount(accountId, normalized);
        return out;
    } catch (err) {
        console.error('[service] updateStatements error', err);
        throw err;
    }
}

module.exports = { getByAccount, getById, generate, generateSingle, deleteByIdentifier, updateStatements };
