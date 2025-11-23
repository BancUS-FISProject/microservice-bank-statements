const repo = require('../repositories/bankStatementsRepository');

async function getByAccount(accountId, filters) {
    console.log(`[service] getByAccount -> accountId=${accountId}, filters=${JSON.stringify(filters)}`);
    // Validaciones / transformaciones aquí si son necesarias
    const items = await repo.findByAccount(accountId, filters);
    // Añadir nombre del mes (en español) según date_start
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

async function postTransaction(payload) {
    console.log(`[service] postTransaction -> payload=${JSON.stringify(payload)}`);
    // Transformar payload en tx y delegar en el repositorio para persistir
    const tx = {
        date: payload.date ? new Date(payload.date) : new Date(),
        amount: payload.amount || 0,
        type: payload.type || 'credit',
        description: payload.description || '',
    };
    // Guardar creando un nuevo statement simple (por ahora)
    const result = await repo.appendTransaction(payload.accountId || payload.account_id || 'unknown', tx, {
        date_start: payload.date_start ? new Date(payload.date_start) : undefined,
        date_end: payload.date_end ? new Date(payload.date_end) : undefined,
    });
    return result;
}

module.exports = { getByAccount, getById, postTransaction };
