const service = require('../services/bankStatementsService');

async function getByAccount(req, res) {
    const { accountId } = req.params;
    const { from, to } = req.query;

    // Llamada al servicio (por ahora solo loguea)
    try {
        const items = await service.getByAccount(accountId, { from, to });
        return res.json({ accountId, from: from || null, to: to || null, items });
    } catch (err) {
        console.error('[controller] getByAccount error', err);
        return res.status(500).json({ error: 'failed_to_get_by_account' });
    }
}

async function getById(req, res) {
    const { id } = req.params;
    try {
        const detail = await service.getById(id);
        if (!detail) return res.status(404).json({ error: 'not_found' });
        return res.json({ id, detail });
    } catch (err) {
        console.error('[controller] getById error', err);
        return res.status(500).json({ error: 'failed_to_get_by_id' });
    }
}

const BankStatement = require('../../db/models/bankStatement');

async function postTransaction(req, res) {
    const payload = req.body;
    try {
        const created = await service.postTransaction(payload);
        return res.status(201).json({ created: true, statement: created });
    } catch (err) {
        console.error('[controller] postTransaction error', err);
        return res.status(500).json({ error: 'failed_to_create_transaction' });
    }
}

module.exports = { getByAccount, getById, postTransaction };
