const cron = require('node-cron');


// Helper: invoca generate y captura errores
async function runGenerateForAll() {
    try {
        // Carga perezosa del servicio para evitar errores por importación
        // de modelos/repositories en tiempo de carga del módulo.
        let service;
        try {
            service = require('../../bank-statements/services/bankStatementsService');
        } catch (err) {
            console.error('[cron] No se pudo importar bankStatementsService:', err.message);
            return;
        }

        console.log('[cron] Ejecutando generate para');
        const res = await service.generate();
        console.log('[cron] Resultado generate:', res);
    } catch (err) {
        console.error('[cron] Error en generate:', err);
    }
}


// Cron expression mensual: ejecutar a las 00:00 del día 1 de cada mes

cron.schedule('0 0 1 * *', async () => {
    console.log('[cron] Es 1° de mes: ejecutando generate mensual');
    await runGenerateForAll();
});


// JOB DE PRUEBAS: ejecutar cada 10 segundos (expresión cron con segundos)

//cron.schedule('*/10 * * * * *', async () => {
//    console.log('[cron][test] Ejecutando job de prueba (cada 10s)');
//   await runGenerateForAll();
//});

module.exports = {
    runGenerateForAll,
};
