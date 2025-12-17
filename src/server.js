const express = require('express');
const dotenv = require('dotenv');

dotenv.config();

const DEFAULT_PORT = 3000;
const port = process.env.PORT || DEFAULT_PORT;
const { connect } = require('./db');

function createApp() {
    const app = express();
    app.use(express.json());

    // Ruta base
    app.get('/', (req, res) => {
        res.json({ status: 'ok', message: 'Microservice bank statements' });
    });

    // Montar router de la versión 1 para bank statements
    const bankRouter = require('./bank-statements/router');
    app.use('/v1/bankstatemens', bankRouter);

    // Inicializar schedulers (si existen)
    try {
        require('./lib/scheduler/bankStatementsCron');
        console.log('[server] Scheduler bankStatementsCron cargado');
    } catch (err) {
        console.warn('[server] No se pudo cargar scheduler:', err.message);
    }

    return app;
}

async function start(mongoUri) {
    const app = createApp();
    const uri = mongoUri || process.env.MONGO_URI;
    if (!uri) {
        console.warn('[server] MONGO_URI not provided. Skipping DB connection.');
    } else {
        try {
            await connect(uri);
        } catch (err) {
            // No hacer que la app falle si la BD no está disponible en entornos de prueba.
            console.error('[server] Error conectando a la BD, se continúa sin conexión:', err.message);
        }
    }

    const server = app.listen(port, () => {
        console.log(`Server listening on port : ${port}`);
    });
    return server;
}

module.exports = { createApp, start };
