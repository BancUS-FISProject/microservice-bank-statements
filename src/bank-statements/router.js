const express = require('express');
const router = express.Router();

const controller = require('./controllers/bankStatementsController');

// Rutas según especificación:
// GET  /v1/bankstatemens/by-account/{accountId}
router.get('/by-account/:accountId', controller.getByAccount);

// GET  /v1/bankstatemens/{id}
router.get('/:id', controller.getById);

// POST /v1/bankstatemens/generate/{month}/{accountId}
router.post('/generate/:month/:accountId', controller.generate);

module.exports = router;
