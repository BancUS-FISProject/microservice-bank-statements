const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const YAML = require('yaml');

dotenv.config();

const DEFAULT_PORT = 3002;
const port = process.env.PORT || DEFAULT_PORT;
const { connect } = require('./db');

function createApp() {
    const app = express();

    app.use((req, res, next) => {
        console.log('[REQ]', req.method, req.originalUrl);
        next();
    });

    //  HEALTH EXACTO QUE LLAMA EL GATEWAY
    app.get('/v1/bankstatements/health', (req, res) => {
        res.status(200).json({
            status: 'UP',
            service: 'bank-statements',
            marker: 'SERVER_HEALTH_OK'
        });
    });


    // // Habilitar CORS para Swagger UI
    // app.use((req, res, next) => {
    //     res.header('Access-Control-Allow-Origin', '*');
    //     res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    //     res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

    //     // Manejar preflight requests
    //     if (req.method === 'OPTIONS') {
    //         return res.sendStatus(200);
    //     }
    //     next();
    // });

    app.use(express.json());

    // Middleware de logging para ver todas las peticiones y respuestas
    app.use((req, res, next) => {
        const start = Date.now();
        const originalJson = res.json;

        res.json = function (data) {
            const duration = Date.now() - start;
            console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} → ${res.statusCode} (${duration}ms)`);
            return originalJson.call(this, data);
        };

        next();
    });

    // Ruta base
    app.get('/', (req, res) => {
        res.json({ status: 'ok', message: 'Microservice bank statements' });
    });

    // Health check endpoint
    app.get('/health', (req, res) => {
        res.json({ status: 'ok' });
    });

    // Servir documentación OpenAPI
    const openapiPath = path.join(__dirname, '..', 'openapi', 'bank-statements.yaml');
    app.get('/openapi.yaml', (req, res) => {
        res.setHeader('Content-Type', 'text/yaml');
        res.sendFile(openapiPath);
    });

    app.get('/openapi.json', (req, res) => {
        const file = fs.readFileSync(openapiPath, 'utf8');
        const doc = YAML.parse(file);
        res.json(doc);
    });

    // Swagger UI HTML simple
    app.get('/api-docs', (req, res) => {
        res.send(`
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Bank Statements API - Swagger UI</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
</head>
<body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
        window.onload = () => {
            window.ui = SwaggerUIBundle({
                url: '/openapi.json',
                dom_id: '#swagger-ui',
                deepLinking: true,
                presets: [
                    SwaggerUIBundle.presets.apis,
                    SwaggerUIBundle.SwaggerUIStandalonePreset
                ],
                persistAuthorization: true,
            });
        };
    </script>
</body>
</html>
        `);
    });

    // Montar router de la versión 1 para bank statements
    const bankRouter = require('./bank-statements/router');
    app.use('/v1/bankstatements', bankRouter);

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
        // Intentar conectar en background: no bloquear el arranque del servidor
        connect(uri).then(() => {
            console.log('[server] DB connection established (background)');
        }).catch(err => {
            console.error('[server] Error conectando a la BD (background):', err.message || err);
        });
    }

    const server = app.listen(port, () => {
        console.log(`Server listening on port : ${port}`);
    });
    return server;
}

module.exports = { createApp, start };
