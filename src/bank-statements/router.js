const express = require('express');
const router = express.Router();

const controller = require('./controllers/bankStatementsController');
const validate = require('../middleware/validate');
const validators = require('../validators/bankStatementsValidators');

// Rutas según especificación:
// GET  /v1/bankstatements/by-account/{accountId}
router.get('/by-account/:accountId', validate(validators.getByAccount), controller.getByAccount);

// GET /v1/bankstatements/by-iban?iban=ES..&month=YYYY-MM
router.get('/by-iban', validate(validators.getByIbanMonth), controller.getByIbanMonth);

// GET  /v1/bankstatements/{id}
router.get('/:id', validate(validators.getById), controller.getById);

// POST /v1/bankstatements/generate -> generar puntual a partir de transacciones en body
router.post('/generate', validate(validators.generate), controller.generate);

// NOTE: removed legacy routes for parameterized generate and delete by id

// DELETE /v1/bankstatements/by-identifier -> eliminar pasando body { id } OR { accountId, month } OR { accountName, month }
router.delete('/by-identifier', validate(validators.deleteByIdentifier), controller.deleteByIdentifier);

// PUT /v1/bankstatements/account/{accountId}/statements -> reemplazar lista de estados de cuenta
router.put('/account/:accountId/statements', validate(validators.updateStatements), controller.updateStatements);

module.exports = router;
