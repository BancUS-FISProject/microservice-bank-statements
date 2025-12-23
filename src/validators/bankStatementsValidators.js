const Joi = require('joi');

const monthPattern = /^[0-9]{4}-[0-9]{2}$/; // YYYY-MM

module.exports = {
    getByAccount: {
        params: Joi.object({ accountId: Joi.string().required() }),
        query: Joi.object({ from: Joi.string().isoDate().optional(), to: Joi.string().isoDate().optional() })
    },
    getById: {
        params: Joi.object({ id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required() })
    },
    generate: {
        // keep existing generate route with optional month/account params (some routes still use them)
        params: Joi.object({ month: Joi.string().pattern(monthPattern).optional(), accountId: Joi.string().optional() })
    },
    deleteById: {
        params: Joi.object({ id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required() })
    },
    updateStatements: {
        params: Joi.object({ accountId: Joi.string().required() }),
        body: Joi.array().items(Joi.object().required()).required()
    }
};
