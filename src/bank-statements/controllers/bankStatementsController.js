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
    const user = req.user;

    try {
        const detail = await bankStatementsService.getByIbanMonth(iban, month);

        // Si no se encuentra el statement, retornar 404
        if (!detail) {
            console.log(`[controller] Statement no encontrado para ${iban} - ${month}`);
            return res.status(404).json({
                error: 'not_found',
                message: `No se encontró estado de cuenta para el IBAN ${iban} en el mes ${month}`
            });
        }

        // Retornar el statement encontrado
        return res.status(200).json({ iban, month, detail });
    } catch (err) {
        console.error('[controller] getByIbanMonth error', err);
        if (err && err.message === 'invalid_month_format') {
            return res.status(400).json({
                error: 'invalid_month_format',
                message: 'El formato del mes debe ser YYYY-MM'
            });
        }
        return res.status(500).json({
            error: 'failed_to_get_by_iban_month',
            message: 'Error al obtener el estado de cuenta'
        });
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

async function updateStatement(req, res) {
    const { id } = req.params;
    const updateData = req.body;
    const user = req.user;

    console.log('[controller] updateStatement -> id:', id);
    console.log('[controller] updateStatement -> updateData:', updateData);

    try {
        const result = await bankStatementsService.updateStatementById(id, updateData);

        if (!result) {
            return res.status(404).json({
                error: 'not_found',
                message: 'Statement no encontrado'
            });
        }

        return res.status(200).json({
            message: 'Estado de cuenta actualizado exitosamente',
            updated: true,
            statement: result
        });
    } catch (err) {
        console.error('[controller] updateStatement error', err);

        if (err && err.message === 'invalid_id') {
            return res.status(400).json({
                error: 'invalid_id',
                message: 'El ID proporcionado no es válido'
            });
        }

        return res.status(500).json({
            error: 'failed_to_update',
            message: 'Error al actualizar el estado de cuenta'
        });
    }
}

async function generateFromCurrentMonth(req, res) {
    const { iban } = req.body;
    const user = req.user;
    const token = req.headers.authorization;

    console.log('[controller] generateFromCurrentMonth -> iban:', iban);
    console.log('[controller] generateFromCurrentMonth -> token presente:', !!token);

    try {
        // Verificar que el IBAN solicitado coincida con el del usuario autenticado
        if (user && user.iban && user.iban !== iban) {
            return res.status(403).json({
                error: 'forbidden',
                message: 'No tienes permiso para generar estados de cuenta para este IBAN'
            });
        }

        const result = await bankStatementsService.generateFromCurrentMonth(iban, user, token);

        if (result.updated) {
            return res.status(200).json({
                message: 'Estado de cuenta actualizado con las transacciones más recientes',
                updated: true,
                statement: result.statement
            });
        }

        if (result.created) {
            return res.status(201).json({
                message: 'Estado de cuenta generado exitosamente',
                created: true,
                statement: result.statement
            });
        }

        return res.status(201).json({
            message: 'Estado de cuenta generado exitosamente',
            created: true,
            statement: result.statement
        });
    } catch (err) {
        console.error('[controller] generateFromCurrentMonth error', err);

        if (err && err.message === 'error_fetching_transactions') {
            return res.status(502).json({
                error: 'error_fetching_transactions',
                message: 'No se pudieron obtener las transacciones del servicio externo'
            });
        }

        if (err && err.message === 'no_transactions_found') {
            return res.status(404).json({
                error: 'no_transactions_found',
                message: 'No se encontraron transacciones para el mes actual. El estado de cuenta no se puede generar sin transacciones.'
            });
        }

        return res.status(500).json({
            error: 'failed_to_generate_statement',
            message: 'Error al generar el estado de cuenta'
        });
    }
}

module.exports = { getByIbanMonths, getById, getByIbanMonth, generate, deleteByIdentifier, deleteById, updateStatement, generateFromCurrentMonth };


