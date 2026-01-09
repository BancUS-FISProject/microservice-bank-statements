const express = require('express');
const router = express.Router();

const controller = require('./controllers/bankStatementsController');
const validate = require('../middleware/validate');
const validators = require('../validators/bankStatementsValidators');
const { extractUserFromToken } = require('../middleware/auth');

/**
 * =========================
 * RUTAS PÚBLICAS (SIN AUTH)
 * =========================
 */

// Health check (EVITA que /:id capture "health")
router.get('/health', (req, res) => {
    res.json({ status: 'UP', service: 'bank-statements' });
});

/**
 * =========================
 * MIDDLEWARE DE AUTH
 * =========================
 */
router.use(extractUserFromToken);

/**
 * =========================
 * RUTAS ESPECÍFICAS (PRIMERO)
 * =========================
 */

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



// const express = require('express');
// const router = express.Router();

// const controller = require('./controllers/bankStatementsController');
// const validate = require('../middleware/validate');
// const validators = require('../validators/bankStatementsValidators');
// const { extractUserFromToken } = require('../middleware/auth');

// // Aplicar middleware de autenticación a todas las rutas
// router.use(extractUserFromToken);

// // Rutas según especificación:
// // GET  /v1/bankstatements/by-iban/{iban} -> lista de meses disponibles
// router.get('/by-iban/:iban', validate(validators.getByIban), controller.getByIbanMonths);

// // GET /v1/bankstatements/by-iban?iban=ES..&month=YYYY-MM
// router.get('/by-iban', validate(validators.getByIbanMonth), controller.getByIbanMonth);

// // GET  /v1/bankstatements/{id}
// router.get('/:id', validate(validators.getById), controller.getById);

// // POST /v1/bankstatements/generate -> generar puntual a partir de transacciones en body
// router.post('/generate', validate(validators.generate), controller.generate);

// // DELETE /v1/bankstatements/:id -> eliminar statement por ID de MongoDB
// router.delete('/:id', validate(validators.deleteById), controller.deleteById);

// // PUT /v1/bankstatements/:id -> actualizar statement por ID de MongoDB
// router.put('/:id', validate(validators.updateStatement), controller.updateStatement);

// // POST /v1/bankstatements/generate-current -> generar estado de cuenta del mes actual desde transacciones
// router.post('/generate-current', validate(validators.generateFromCurrentMonth), controller.generateFromCurrentMonth);

// module.exports = router;
