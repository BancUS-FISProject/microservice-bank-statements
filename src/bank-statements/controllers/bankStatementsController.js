const bankStatementsService = require('../services/bankStatementsService');

async function getByAccount(req, res) {
    const { accountId } = req.params;
    try {
        const months = await bankStatementsService.getByAccount(accountId);
        return res.json({ accountId: accountId || null, months });
    } catch (err) {
        console.error('[controller] getByAccount error', err);
        return res.status(500).json({ error: 'failed_to_get_by_account' });
    }
}


async function getById(req, res) {
    const { id } = req.params;
    try {
        const detail = await bankStatementsService.getById(id);
        if (!detail) return res.status(404).json({ error: 'not_found' });
        return res.json({ id, detail });
    } catch (err) {
        console.error('[controller] getById error', err);
        return res.status(500).json({ error: 'failed_to_get_by_id' });
    }
}

async function generate(req, res) {
    try {
        const created = await bankStatementsService.generate();
        return res.status(201).json({ created: true, statements: created });
    } catch (err) {
        console.error('[controller] generate error', err);
        return res.status(500).json({ error: 'failed_to_generation' });
    }
}

async function deleteById(req, res) {
    const { id } = req.params;
    try {
        const deleted = await bankStatementsService.deleteById(id);
        if (!deleted) return res.status(404).json({ error: 'not_found' });
        return res.json({ deleted: true, id });
    } catch (err) {
        console.error('[controller] deleteById error', err);
        return res.status(500).json({ error: 'failed_to_delete' });
    }
}

async function updateStatements(req, res) {
    const { accountId } = req.params;
    const statements = req.body;
    try {
        const out = await bankStatementsService.updateStatements(accountId, statements);
        return res.json({ updated: true, count: Array.isArray(out) ? out.length : 0, items: out });
    } catch (err) {
        console.error('[controller] updateStatements error', err);
        if (err.message === 'statements_must_be_array') return res.status(400).json({ error: 'statements_must_be_array' });
        return res.status(500).json({ error: 'failed_to_update' });
    }
}

module.exports = { getByAccount, getById, generate, deleteById, updateStatements };


