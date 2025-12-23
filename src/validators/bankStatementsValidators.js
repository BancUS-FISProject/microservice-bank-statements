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
        body: Joi.object({
            accountId: Joi.string().optional(),
            month: Joi.string().pattern(monthPattern).optional(),
            transactions: Joi.array().items(Joi.object({
                sender: Joi.string().optional(),
                receiver: Joi.string().optional(),
                quantity: Joi.number().optional(),
                amount: Joi.number().optional(),
                status: Joi.string().optional(),
                currency: Joi.string().optional(),
                gmt_time: Joi.string().isoDate().optional()
            })).optional()
        }).optional()
    },

    deleteByIdentifier: {
        body: Joi.object({
            id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional(),
            accountId: Joi.string().optional(),
            accountName: Joi.string().optional(),
            month: Joi.string().pattern(monthPattern).optional()
        }).or('id', 'accountId', 'accountName').with('accountId', 'month').with('accountName', 'month')
    },
    updateStatements: {
        params: Joi.object({ accountId: Joi.string().required() }),
        body: Joi.array().items(Joi.object().required()).required()
    }
};
