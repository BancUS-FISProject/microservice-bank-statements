const Joi = require('joi');

const monthPattern = /^[0-9]{4}-(0[1-9]|1[0-2])$/; // YYYY-MM, mes 01-12
const ibanEsPattern = /^ES\d{22}$/; // ES + 22 digits (total 24 chars)

module.exports = {
    getByIban: {
        params: Joi.object({
            iban: Joi.string().trim().uppercase().pattern(ibanEsPattern).required().messages({
                'string.pattern.base': 'El IBAN no tiene el formato correcto',
                'string.empty': 'El IBAN no tiene el formato correcto',
                'any.required': 'El IBAN no tiene el formato correcto'
            })
        }),
        query: Joi.object({
            from: Joi.string().pattern(monthPattern).optional(),
            to: Joi.string().pattern(monthPattern).optional()
        })
    },
    getById: {
        params: Joi.object({ id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required() })
    },
    getByIbanMonth: {
        query: Joi.object({
            iban: Joi.string()
                .trim()
                .uppercase()
                .pattern(ibanEsPattern)
                .required()
                .messages({
                    'string.pattern.base': 'El IBAN no tiene el formato correcto',
                    'string.empty': 'El IBAN no tiene el formato correcto',
                    'any.required': 'El IBAN no tiene el formato correcto'
                }),
            month: Joi.string().pattern(monthPattern).required()
        })
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

    deleteById: {
        params: Joi.object({
            id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required().messages({
                'string.pattern.base': 'ID de MongoDB inválido',
                'any.required': 'ID es requerido'
            })
        })
    },

    updateStatements: {
        params: Joi.object({
            iban: Joi.string()
                .trim()
                .uppercase()
                .pattern(ibanEsPattern)
                .required()
                .messages({
                    'string.pattern.base': 'El IBAN no tiene el formato correcto',
                    'string.empty': 'El IBAN es requerido',
                    'any.required': 'El IBAN es requerido'
                })
        })
    },

    generateFromCurrentMonth: {
        body: Joi.object({
            iban: Joi.string()
                .trim()
                .uppercase()
                .pattern(ibanEsPattern)
                .required()
                .messages({
                    'string.pattern.base': 'El IBAN no tiene el formato correcto',
                    'string.empty': 'El IBAN es requerido',
                    'any.required': 'El IBAN es requerido'
                })
        })
    }
};
