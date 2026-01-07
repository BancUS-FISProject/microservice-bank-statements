const express = require('express');
const router = express.Router();

const controller = require('./controllers/bankStatementsController');
const validate = require('../middleware/validate');
const validators = require('../validators/bankStatementsValidators');
const { extractUserFromToken } = require('../middleware/auth');

// Aplicar middleware de autenticación a todas las rutas
router.use(extractUserFromToken);

// Rutas según especificación:
// GET  /v1/bankstatements/by-iban/{iban} -> lista de meses disponibles
router.get('/by-iban/:iban', validate(validators.getByIban), controller.getByIbanMonths);

// GET /v1/bankstatements/by-iban?iban=ES..&month=YYYY-MM
router.get('/by-iban', validate(validators.getByIbanMonth), controller.getByIbanMonth);

// GET  /v1/bankstatements/{id}
router.get('/:id', validate(validators.getById), controller.getById);

// POST /v1/bankstatements/generate -> generar puntual a partir de transacciones en body
router.post('/generate', validate(validators.generate), controller.generate);

// DELETE /v1/bankstatements/:id -> eliminar statement por ID de MongoDB
router.delete('/:id', validate(validators.deleteById), controller.deleteById);

// PUT /v1/bankstatements/account/{iban}/statements -> reemplazar lista de estados de cuenta por IBAN
router.put('/account/:iban/statements', validate(validators.updateStatements), controller.updateStatements);

module.exports = router;
