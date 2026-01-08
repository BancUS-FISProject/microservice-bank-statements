const repo = require('../repositories/bankStatementsRepository');

async function getByIbanMonths(iban, filters) {
    console.log(`[service] getByIbanMonths -> iban=${iban}`);
    const items = await repo.findByIban(iban, filters);
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

async function getByIbanMonth(iban, month) {
    const cleanIban = String(iban || '').replace(/\s+/g, '').toUpperCase();
    const [yStr, mStr] = String(month || '').split('-');
    const year = parseInt(yStr, 10);
    const monthNum = parseInt(mStr, 10);
    if (!year || Number.isNaN(monthNum) || monthNum < 1 || monthNum > 12) throw new Error('invalid_month_format');

    return repo.findByIbanYearMonth(cleanIban, year, monthNum);
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

    // determinar mes objetivo: MES ANTERIOR (el estado se genera el 1ro de cada mes con datos del mes pasado)
    const now = new Date();
    // Restar 1 mes para obtener el mes anterior
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const year = previousMonth.getFullYear();
    const monthIndex = previousMonth.getMonth(); // ya es 0-indexed
    const target = `${year}-${String(monthIndex + 1).padStart(2, '0')}`; // formato 'YYYY-MM'

    console.log(`[service] generate -> generando estado para mes anterior: ${target}`);

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
        // Priorizar IBAN como identificador principal
        const accountId = accountObj && (accountObj.iban || accountObj.id || accountObj.accountId) || 'unknown';
        const accountIban = accountObj && accountObj.iban;

        console.log('[service] generateForAccount ->', { accountId, accountIban, name: accountObj?.name });

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

        console.log(`[service] generateForAccount -> fetched ${transactions.length} transactions for ${accountId}`);

        // calcular rangos de fecha para el mes
        const date_start = new Date(year, monthIndex, 1);
        const date_end = new Date(year, monthIndex + 1, 0);

        // mapear transacciones y calcular totales
        let total_incoming = 0;
        let total_outgoing = 0;
        const mappedTx = (transactions || []).map((t) => {
            const raw = Number(t.quantity || t.amount || 0);
            const amount = Number.isNaN(raw) ? 0 : raw;

            // Log para debug
            console.log(`[TX] amount=${amount}, receiver=${t.receiver}, sender=${t.sender}, accountId=${accountId}, accountIban=${accountIban}`);

            // classify transaction direction - comparar con IBAN y con ID
            let classified = false;
            const receiverStr = String(t.receiver || '');
            const senderStr = String(t.sender || '');
            const accountIdStr = String(accountId);
            const accountIbanStr = String(accountIban || '');

            // Si esta cuenta es el receptor -> incoming
            if ((receiverStr && receiverStr === accountIdStr) ||
                (receiverStr && accountIbanStr && receiverStr === accountIbanStr)) {
                total_incoming += Math.abs(amount);
                classified = true;
                console.log(`  -> INCOMING: +${Math.abs(amount)} (total_incoming=${total_incoming})`);
            }
            // Si esta cuenta es el emisor -> outgoing
            else if ((senderStr && senderStr === accountIdStr) ||
                (senderStr && accountIbanStr && senderStr === accountIbanStr)) {
                total_outgoing += Math.abs(amount);
                classified = true;
                console.log(`  -> OUTGOING: -${Math.abs(amount)} (total_outgoing=${total_outgoing})`);
            }

            // Fallback: clasificar por signo del monto
            if (!classified) {
                if (amount > 0) {
                    total_incoming += amount;
                    console.log(`  -> INCOMING (by sign): +${amount} (total_incoming=${total_incoming})`);
                } else if (amount < 0) {
                    total_outgoing += Math.abs(amount);
                    console.log(`  -> OUTGOING (by sign): -${Math.abs(amount)} (total_outgoing=${total_outgoing})`);
                }
            }

            return {
                date: t.gmt_time ? new Date(t.gmt_time) : new Date(),
                amount,
                currency: t.currency || 'EUR',
                description: t.status || '',
            };
        });

        console.log(`[service] generateForAccount -> ${accountId} FINAL: mappedTxCount=${(mappedTx || []).length} total_incoming=${total_incoming} total_outgoing=${total_outgoing}`);

        const statement = {
            account: {
                iban: accountObj.iban || accountId || '',
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
async function generateSingle({ accountId, month, transactions, user }) {
    console.log('[service] generateSingle ->', accountId, month, Array.isArray(transactions) ? transactions.length : 0, user ? '(with JWT)' : '(no JWT)');
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
            currency: t.currency || 'EUR',
            description: t.status || '',
        };
    });

    const total = total_incoming + total_outgoing;

    // try to enrich account data - priorizar datos del JWT token
    let account = { iban: accountId };

    if (user && user.iban) {
        // Usar datos del JWT token (para requests manuales del frontend)
        account = {
            iban: user.iban,
            name: user.name || '',
            email: user.email || ''
        };
        console.log('[service] generateSingle: using user data from JWT token');
    } else {
        // Fallback: llamar al microservicio de accounts (para scheduler automático)
        try {
            const ms = require('../../lib/ms');
            if (ms && typeof ms.getAccount === 'function') {
                const acc = await ms.getAccount(accountId);
                if (acc) account = Object.assign({}, account, acc);
            }
        } catch (err) {
            console.warn('[service] generateSingle: could not fetch account data', err.message || err);
        }
    }

    const date_start = new Date(year, monthNum - 1, 1);
    const date_end = new Date(year, monthNum, 0);

    const stmt = {
        account: {
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

// delete statement by MongoDB ID
async function deleteById(id) {
    console.log('[service] deleteById ->', id);
    if (!id) throw new Error('id_required');

    try {
        const deleted = await repo.deleteById(id);
        return deleted;
    } catch (err) {
        console.error('[service] deleteById: delete error', err.message || err);
        throw err;
    }
}

// replace the list of statements for an account by IBAN
// Esta función ahora obtiene transacciones del microservicio y actualiza el statement
async function updateStatements(iban, user = null, token = null) {
    console.log('[service] updateStatements -> iban=', iban, 'token presente:', !!token);
    const ms = require('../../lib/ms');

    // Obtener mes actual
    const now = new Date();
    const year = now.getFullYear();
    const monthIndex = now.getMonth();
    const month = monthIndex + 1;

    console.log(`[service] updateStatements -> actualizando para mes: ${year}-${String(month).padStart(2, '0')}`);

    // Calcular rangos de fecha para el mes actual
    const date_start = new Date(year, monthIndex, 1);
    const date_end = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);

    // Obtener transacciones del microservicio
    let allTransactions = [];
    try {
        console.log(`[service] updateStatements -> obteniendo transacciones para ${iban}`);
        const response = await ms.getTransactions(iban, token);
        if (response && Array.isArray(response)) {
            allTransactions = response;
        } else if (response && Array.isArray(response.transactions)) {
            allTransactions = response.transactions;
        }
    } catch (err) {
        console.error('[service] updateStatements error fetching transactions:', err.message || err);
        const e = new Error('error_fetching_transactions');
        throw e;
    }

    console.log(`[service] updateStatements -> fetched ${allTransactions.length} total transactions`);

    // LOGS DETALLADOS: Ver estructura de las transacciones recibidas
    console.log('═══════════════════════════════════════════════════════════');
    console.log('[DEBUG] Estructura completa de transacciones recibidas (updateStatements):');
    allTransactions.forEach((tx, idx) => {
        console.log(`  [${idx}]:`, JSON.stringify(tx, null, 2));
    });
    console.log('═══════════════════════════════════════════════════════════');

    // Si no hay transacciones, retornar error
    if (allTransactions.length === 0) {
        throw new Error('no_transactions_found');
    }

    // Tomar el sender_balance del PRIMER objeto como saldo inicial
    const initialBalance = allTransactions.length > 0 && allTransactions[0].sender_balance
        ? Number(allTransactions[0].sender_balance)
        : 0;

    console.log(`[service] updateStatements -> saldo inicial (sender_balance del primer objeto): ${initialBalance}`);

    // Calcular totales partiendo del saldo inicial
    let total_incoming = initialBalance; // Inicializar con el saldo inicial
    let total_outgoing = 0;

    const mappedTx = allTransactions.map((t, index) => {
        const amount = Number(t.amount || t.quantity || 0);
        const date = t.gmt_time ? new Date(t.gmt_time) : new Date();

        // Determinar tipo de transacción basado en sender/receiver
        const senderIban = (t.sender || '').trim().toUpperCase();
        const receiverIban = (t.receiver || '').trim().toUpperCase();
        const currentIban = iban.trim().toUpperCase();

        let type = 'unknown';
        if (senderIban === currentIban) {
            type = 'outgoing';
            total_outgoing += amount;
        } else if (receiverIban === currentIban) {
            type = 'incoming';
            total_incoming += amount;
        }

        return {
            sender: senderIban,
            receiver: receiverIban,
            amount,
            type,
            status: t.status || 'completed',
            currency: t.currency || 'EUR',
            date
        };
    });

    // Ordenar transacciones por fecha
    mappedTx.sort((a, b) => a.date - b.date);

    console.log(`[service] updateStatements -> totals: incoming=${total_incoming} (incluye saldo inicial ${initialBalance}), outgoing=${total_outgoing}`);

    // Preparar datos de la cuenta
    let account = { iban };

    if (user && user.iban) {
        account = {
            iban: user.iban,
            name: user.name || user.username || 'Usuario',
            email: user.email || '',
        };
    } else {
        // Intentar obtener datos de la cuenta desde microservicio
        try {
            const accountData = await ms.getAccountByIban(iban);
            if (accountData) {
                account = {
                    iban: accountData.iban || iban,
                    name: accountData.name || accountData.accountName || 'Usuario',
                    email: accountData.email || '',
                };
            }
        } catch (err) {
            console.warn('[service] updateStatements -> no se pudo obtener datos de cuenta:', err.message);
        }
    }

    // Construir objeto de estado de cuenta actualizado
    const statement = {
        account: {
            iban: account.iban || iban,
            name: account.name || 'Usuario',
            email: account.email || '',
        },
        date_start,
        date_end,
        year,
        month,
        transactions: mappedTx,
        total_incoming,
        total_outgoing,
    };

    // Actualizar en la base de datos
    try {
        // Primero buscar si existe un statement para este IBAN/año/mes
        const existing = await repo.findByIbanYearMonth(iban, year, month);

        if (existing) {
            // Actualizar el existente
            console.log(`[service] updateStatements -> actualizando statement existente: ${existing._id}`);
            const updated = await repo.updateById(existing._id, statement);
            console.log('[service] updateStatements -> statement actualizado exitosamente');
            return { updated: true, statement: updated };
        } else {
            // Crear nuevo statement
            console.log('[service] updateStatements -> creando nuevo statement');
            const created = await repo.saveStatement(statement);
            console.log('[service] updateStatements -> statement creado exitosamente');
            return { created: true, statement: created };
        }
    } catch (err) {
        console.error('[service] updateStatements error persisting:', err);
        throw err;
    }
}

/**
 * generateFromCurrentMonth(iban, user, token)
 * - Consume GET /v1/transactions/user/{iban}
 * - Filtra transacciones del mes actual
 * - Crea y persiste un estado de cuenta para el mes en curso
 */
async function generateFromCurrentMonth(iban, user, token = null) {
    console.log(`[service] generateFromCurrentMonth -> iban=${iban}`);
    const ms = require('../../lib/ms');

    // Obtener mes actual
    const now = new Date();
    const year = now.getFullYear();
    const monthIndex = now.getMonth(); // 0-indexed
    const month = monthIndex + 1;

    console.log(`[service] generateFromCurrentMonth -> mes actual: ${year}-${String(month).padStart(2, '0')}`);

    // Verificar si ya existe un statement para este mes
    try {
        const existing = await repo.findByIbanYearMonth(iban, year, month);
        if (existing) {
            console.log(`[service] generateFromCurrentMonth -> ya existe statement para ${iban} - ${year}-${month}`);
            console.log('[service] generateFromCurrentMonth -> actualizando statement existente con transacciones actuales');
            // Llamar a updateStatements para actualizar con transacciones actuales
            return await updateStatements(iban, user, token);
        }
    } catch (err) {
        console.log('[service] generateFromCurrentMonth -> no existe statement previo, generando nuevo');
    }

    // Calcular rangos de fecha para el mes actual
    const date_start = new Date(year, monthIndex, 1);
    const date_end = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);

    console.log(`[service] generateFromCurrentMonth -> rango: ${date_start.toISOString()} - ${date_end.toISOString()}`);

    // Obtener transacciones del microservicio
    let allTransactions = [];
    try {
        console.log(`[service] generateFromCurrentMonth -> llamando getTransactions con token: ${token ? 'SI' : 'NO'}`);
        const txs = await ms.getTransactions(iban, token);
        if (Array.isArray(txs)) {
            allTransactions = txs;
        } else if (txs && txs.error) {
            console.warn('[service] getTransactions returned error:', txs.message);
            throw new Error('error_fetching_transactions');
        }
    } catch (err) {
        console.error('[service] generateFromCurrentMonth error getting transactions:', err.message || err);
        throw err;
    }

    console.log(`[service] generateFromCurrentMonth -> fetched ${allTransactions.length} total transactions`);

    // LOGS DETALLADOS: Ver estructura de las transacciones recibidas
    console.log('═══════════════════════════════════════════════════════════');
    console.log('[DEBUG] Estructura completa de transacciones recibidas:');
    allTransactions.forEach((tx, idx) => {
        console.log(`\n[TX ${idx + 1}]:`, JSON.stringify(tx, null, 2));
    });
    console.log('═══════════════════════════════════════════════════════════');

    // Usar TODAS las transacciones sin filtrar por mes
    console.log(`[service] generateFromCurrentMonth -> usando ${allTransactions.length} transacciones (todas las disponibles)`);

    // Si no hay transacciones, retornar error
    if (allTransactions.length === 0) {
        throw new Error('no_transactions_found');
    }

    // Tomar el sender_balance del PRIMER objeto como saldo inicial
    const initialBalance = allTransactions.length > 0 && allTransactions[0].sender_balance
        ? Number(allTransactions[0].sender_balance)
        : 0;

    console.log(`[service] generateFromCurrentMonth -> saldo inicial (sender_balance del primer objeto): ${initialBalance}`);

    // Calcular totales partiendo del saldo inicial
    let total_incoming = initialBalance; // Inicializar con el saldo inicial
    let total_outgoing = 0;

    const mappedTx = allTransactions.map((t, index) => {
        const raw = Number(t.quantity || t.amount || 0);
        const amount = Number.isNaN(raw) ? 0 : raw;

        const receiverStr = String(t.receiver || '');
        const senderStr = String(t.sender || '');
        const ibanStr = String(iban || '');

        // Clasificar dirección de la transacción
        if (receiverStr && receiverStr === ibanStr) {
            total_incoming += Math.abs(amount);
        } else if (senderStr && senderStr === ibanStr) {
            total_outgoing += Math.abs(amount);
        } else {
            // Fallback: clasificar por signo del monto
            if (amount > 0) {
                total_incoming += amount;
            } else if (amount < 0) {
                total_outgoing += Math.abs(amount);
            }
        }

        return {
            date: t.gmt_time ? new Date(t.gmt_time) : new Date(),
            amount,
            currency: t.currency || 'EUR',
            description: t.status || '',
        };
    });

    // Ordenar transacciones por fecha
    mappedTx.sort((a, b) => a.date - b.date);

    console.log(`[service] generateFromCurrentMonth -> totals: incoming=${total_incoming} (incluye saldo inicial ${initialBalance}), outgoing=${total_outgoing}`);

    // Preparar datos de la cuenta
    let account = { iban };

    if (user && user.iban) {
        // Usar datos del JWT token
        account = {
            iban: user.iban,
            name: user.name || 'Usuario',
            email: user.email || ''
        };
        console.log('[service] generateFromCurrentMonth: using user data from JWT token');
    } else {
        // Fallback: llamar al microservicio de accounts
        try {
            if (ms && typeof ms.getAccount === 'function') {
                const acc = await ms.getAccount(iban);
                if (acc && !acc.error) {
                    account = {
                        iban: acc.iban || iban,
                        name: acc.name || 'Usuario',
                        email: acc.email || ''
                    };
                }
            }
        } catch (err) {
            console.warn('[service] generateFromCurrentMonth: could not fetch account data', err.message || err);
        }
    }

    // Construir objeto de estado de cuenta
    const statement = {
        account: {
            iban: account.iban || iban,
            name: account.name || 'Usuario',
            email: account.email || '',
        },
        date_start,
        date_end,
        year,
        month,
        transactions: mappedTx,
        total_incoming,
        total_outgoing,
    };

    // Persistir en la base de datos
    try {
        const BankStatement = require('../../db/models/bankStatement');
        const created = await BankStatement.create(statement);
        console.log('[service] generateFromCurrentMonth: statement created with ID', created._id);

        // Intentar notificar
        try {
            const monthStr = `${year}-${String(month).padStart(2, '0')}`;
            await ms.sendNotification({
                to: account.email,
                subject: 'Estado de cuenta generado',
                accountId: iban,
                month: monthStr
            });
        } catch (err) {
            console.warn('[service] generateFromCurrentMonth: notification failed', err.message || err);
        }

        return { created: true, statement: created };
    } catch (err) {
        console.error('[service] generateFromCurrentMonth: persist failed', err.message || err);
        throw err;
    }
}

module.exports = { getByIbanMonths, getById, getByIbanMonth, generate, generateSingle, deleteByIdentifier, deleteById, updateStatements, generateFromCurrentMonth };
