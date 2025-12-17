const repo = require('../repositories/bankStatementsRepository');

async function getByAccount(accountId, filters) {
    console.log(`[service] getByAccount -> accountId=${accountId}, filters=${JSON.stringify(filters)}`);
    const items = await repo.findByAccount(accountId, filters);
    const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    return items.map(it => {
        const dateStart = it.date_start ? new Date(it.date_start) : null;
        const month_name = dateStart ? monthNames[dateStart.getUTCMonth()] : null;
        return { ...it, month_name };
    });
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
            const amount = Number(t.quantity || t.amount || 0);
            if (t.receiver && String(t.receiver) === String(accountId)) {
                total_incoming += amount;
            } else if (t.sender && String(t.sender) === String(accountId)) {
                total_outgoing += amount;
            }
            return {
                date: t.gmt_time ? new Date(t.gmt_time) : new Date(),
                amount,
                currency: t.currency || 'USD',
                description: t.status || '',
            };
        });

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

module.exports = { getByAccount, getById, generate };
