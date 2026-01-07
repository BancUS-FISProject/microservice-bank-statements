const bankStatementsService = require('../services/bankStatementsService');

async function getByIbanMonths(req, res) {
    const { iban } = req.params;
    const user = req.user;

    try {
        // Verificar que el IBAN solicitado coincida con el del usuario autenticado
        if (user && user.iban && user.iban !== iban) {
            return res.status(403).json({
                error: 'forbidden',
                message: 'No tienes permiso para acceder a este IBAN'
            });
        }

        // Pasar datos del usuario al servicio
        const months = await bankStatementsService.getByIbanMonths(iban, {}, user);

        // If no months found, return 404
        if (!months || months.length === 0) {
            return res.status(404).json({ error: 'not_found', message: 'No hay estados de cuenta para este IBAN' });
        }

        return res.json({ iban: iban || null, months });
    } catch (err) {
        console.error('[controller] getByIbanMonths error', err);
        return res.status(500).json({ error: 'failed_to_get_by_iban' });
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

async function getByIbanMonth(req, res) {
    const { iban, month } = req.query;
    try {
        const detail = await bankStatementsService.getByIbanMonth(iban, month);
        if (!detail) {
            return res.status(404).json({ error: 'not_found', message: 'El IBAN no registra estados de cuenta correspondientes a este mes' });
        }
        return res.json({ iban, month, detail });
    } catch (err) {
        console.error('[controller] getByIbanMonth error', err);
        if (err && err.message === 'invalid_month_format') return res.status(400).json({ error: 'invalid_month_format' });
        return res.status(500).json({ error: 'failed_to_get_by_iban_month' });
    }
}

async function generate(req, res) {
    // If body contains transactions -> generate single statement from provided data
    const body = req.body || {};
    const hasTx = Array.isArray(body.transactions) && body.transactions.length > 0;
    if (hasTx || body.month || body.accountId) {
        const accountId = body.accountId || req.params.accountId;
        const month = body.month || req.params.month;
        const transactions = body.transactions || [];
        const user = req.user;
        try {
            const stmt = await bankStatementsService.generateSingle({ accountId, month, transactions, user });
            return res.status(201).json({ created: true, statement: stmt });
        } catch (err) {
            console.error('[controller] generateSingle error', err);
            if (err && err.message === 'month_in_progress') {
                return res.status(400).json({ error: 'month_in_progress', message: err.userMessage || 'Mes en curso - no se puede generar' });
            }
            if (err && err.message === 'accountId_required') return res.status(400).json({ error: 'accountId_required' });
            if (err && err.message === 'month_required') return res.status(400).json({ error: 'month_required' });
            return res.status(500).json({ error: 'failed_to_generate_single' });
        }
    }

    // Otherwise fallback to bulk generate (scheduler automático - NO usa JWT)
    try {
        const created = await bankStatementsService.generate();
        return res.status(201).json({ created: true, statements: created });
    } catch (err) {
        console.error('[controller] generate error', err);
        return res.status(500).json({ error: 'failed_to_generation' });
    }
}

async function deleteByIdentifier(req, res) {
    // body can contain { id } OR { accountId, month } OR { accountName, month }
    const body = req.body || {};
    try {
        const deleted = await bankStatementsService.deleteByIdentifier(body);
        if (!deleted) return res.status(404).json({ error: 'not_found' });
        // deleted may be the deleted doc or result
        const id = (deleted && (deleted._id || deleted.id)) || body.id;
        return res.json({ deleted: true, id });
    } catch (err) {
        console.error('[controller] deleteByIdentifier error', err);
        if (err && err.message === 'identifier_required') return res.status(400).json({ error: 'identifier_required' });
        return res.status(500).json({ error: 'failed_to_delete' });
    }
}

async function deleteById(req, res) {
    const { id } = req.params;
    try {
        const deleted = await bankStatementsService.deleteById(id);
        if (!deleted) return res.status(404).json({ error: 'not_found', message: 'Statement no encontrado' });
        return res.json({ deleted: true, id });
    } catch (err) {
        console.error('[controller] deleteById error', err);
        return res.status(500).json({ error: 'failed_to_delete' });
    }
}

async function updateStatements(req, res) {
    const { iban } = req.params;
    const statements = req.body;
    try {
        const out = await bankStatementsService.updateStatements(iban, statements);
        return res.json({ updated: true, count: Array.isArray(out) ? out.length : 0, items: out });
    } catch (err) {
        console.error('[controller] updateStatements error', err);
        if (err.message === 'statements_must_be_array') return res.status(400).json({ error: 'statements_must_be_array' });
        return res.status(500).json({ error: 'failed_to_update' });
    }
}

module.exports = { getByIbanMonths, getById, getByIbanMonth, generate, deleteByIdentifier, deleteById, updateStatements };


