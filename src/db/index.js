const mongoose = require('mongoose');

async function connect(uri, options = {}) {
    try {
        // Conectar sin pasar opciones de parser obsoletas (la versión de mongoose/mongodb puede gestionarlo internamente)
        await mongoose.connect(uri, {
            ...options,
        });

        console.log('[db] Connected to MongoDB');

        // Asegurarse que la colección 'bank-statements' exista
        const db = mongoose.connection.db;

    } catch (err) {
        console.error('[db] Error connecting to MongoDB', err);
        throw err;
    }
}

module.exports = { connect, mongoose };
