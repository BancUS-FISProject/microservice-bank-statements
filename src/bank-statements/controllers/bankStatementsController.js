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

async function postTransaction(req, res) {
    const payload = req.body;
    service.postTransaction(payload);
    // 202 Accepted - se acepta la transacción para procesamiento async
    return res.status(202).json({ accepted: true });
}

module.exports = { getByAccount, getById, postTransaction };
