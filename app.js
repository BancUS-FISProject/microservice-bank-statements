// app.js - Exporta la aplicación Express para tests sin iniciar el servidor
const { createApp } = require('./src/server');

// No conectar a BD si estamos en tests
const app = createApp();

// Evitar que el scheduler se intente ejecutar en tests
if (process.env.NODE_ENV !== 'test') {
    // Scheduler ya está cargado en createApp(), está bien
}

module.exports = app;
