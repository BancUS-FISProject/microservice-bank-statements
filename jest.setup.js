// jest.setup.js - Configuración global para tests
process.env.NODE_ENV = 'test';
process.env.MONGO_URI = 'mongodb://localhost:27017/bankstatements-test';

// Configurar Mongoose para tests (Mongoose 9.0+)
const mongoose = require('mongoose');
// Permitir que Mongoose buffere comandos si no hay conexión
mongoose.set('bufferCommands', true);
// Desabilitar timeout del buffer (permitir indefinidamente) para tests sin BD
mongoose.set('bufferTimeoutMS', false);

