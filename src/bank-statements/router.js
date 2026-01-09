const express = require('express');
const router = express.Router();

const controller = require('./controllers/bankStatementsController');
const validate = require('../middleware/validate');
const validators = require('../validators/bankStatementsValidators');
const { extractUserFromToken } = require('../middleware/auth');

// Health check endpoint (sin autenticación)
router.get('/health', (req, res) => {
    res.status(200).json({
        status: 'UP',
        service: 'bank-statements',
        marker: 'ROUTER_HEALTH_OK'
    });
});

// Aplicar middleware de autenticación a todas las rutas siguientes
router.use(extractUserFromToken);

// Rutas según especificación:
// GET /v1/bankstatements/by-iban/{iban} -> lista de meses disponibles
router.get(
    '/by-iban/:iban',
    validate(validators.getByIban),
    controller.getByIbanMonths
);

// GET /v1/bankstatements/by-iban?iban=ES..&month=YYYY-MM
router.get(
    '/by-iban',
    validate(validators.getByIbanMonth),
    controller.getByIbanMonth
);

// POST /v1/bankstatements/generate-current
router.post(
    '/generate-current',
    validate(validators.generateFromCurrentMonth),
    controller.generateFromCurrentMonth
);

// POST /v1/bankstatements/generate
router.post(
    '/generate',
    validate(validators.generate),
    controller.generate
);

/**
 * =========================
 * RUTAS GENÉRICAS (AL FINAL)
 * =========================
 */

// GET /v1/bankstatements/{id}
router.get(
    '/:id',
    validate(validators.getById),
    controller.getById
);

// PUT /v1/bankstatements/{id}
router.put(
    '/:id',
    validate(validators.updateStatement),
    controller.updateStatement
);

// DELETE /v1/bankstatements/{id}
router.delete(
    '/:id',
    validate(validators.deleteById),
    controller.deleteById
);

module.exports = router;