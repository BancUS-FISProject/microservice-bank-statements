const service = require('../services/bankStatementsService');

async function getByAccount(req, res) {
    const { accountId } = req.params;
    const { from, to } = req.query;

    // Llamada al servicio (por ahora solo loguea)
    service.getByAccount(accountId, { from, to });

    // Respuesta placeholder
    return res.json({ accountId, from: from || null, to: to || null, items: [] });
}

async function getById(req, res) {
    const { id } = req.params;
    service.getById(id);
    return res.json({ id, detail: null });
}

const BankStatement = require('../../db/models/bankStatement');

async function postTransaction(req, res) {
    const payload = req.body;
    service.postTransaction(payload);

    // Crear un bank-statement mock y persistirlo
    try {
        const tx = {
            date: payload.date ? new Date(payload.date) : new Date(),
            amount: payload.amount || 0,
            type: payload.type || 'credit',
            description: payload.description || '',
        };

        const stmt = await BankStatement.create({
            account_id: payload.accountId || payload.account_id || 'unknown',
            date_start: payload.date_start ? new Date(payload.date_start) : new Date(),
            date_end: payload.date_end ? new Date(payload.date_end) : new Date(),
            transactions: [tx],
        });

        return res.status(201).json({ created: true, statement: stmt });
    } catch (err) {
        console.error('[controller] Error creating mock bank statement', err);
        return res.status(500).json({ error: 'failed_to_create_mock' });
    }
}

module.exports = { getByAccount, getById, postTransaction };
