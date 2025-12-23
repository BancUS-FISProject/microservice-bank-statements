const express = require('express');
const router = express.Router();

const controller = require('./controllers/bankStatementsController');
const validate = require('../middleware/validate');
const validators = require('../validators/bankStatementsValidators');

// Rutas según especificación:
// GET  /v1/bankstatemens/by-account/{accountId}
router.get('/by-account/:accountId', validate(validators.getByAccount), controller.getByAccount);

// GET  /v1/bankstatemens/{id}
router.get('/:id', validate(validators.getById), controller.getById);

// POST /v1/bankstatemens/generate/{month}/{accountId}
router.post('/generate/:month/:accountId', validate(validators.generate), controller.generate);

// DELETE /v1/bankstatemens/{id} -> eliminar estado de cuenta
router.delete('/:id', validate(validators.deleteById), controller.deleteById);

// PUT /v1/bankstatemens/account/{accountId}/statements -> reemplazar lista de estados de cuenta
router.put('/account/:accountId/statements', validate(validators.updateStatements), controller.updateStatements);

module.exports = router;
