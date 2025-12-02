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

async function generate(accountId, month) {
    console.log(`[service] generate -> payload=${JSON.stringify(payload)}`);
    // Transformar los valores entrantes 
    return {};
}

module.exports = { getByAccount, getById, postTransaction };
