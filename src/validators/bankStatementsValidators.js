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
            month: Joi.number().integer().min(1).max(12).optional().messages({
                'number.base': 'El mes debe ser un número',
                'number.min': 'El mes debe estar entre 1 y 12',
                'number.max': 'El mes debe estar entre 1 y 12'
            }),
            year: Joi.number().integer().min(2020).max(2100).optional().messages({
                'number.base': 'El año debe ser un número',
                'number.min': 'El año debe ser mayor o igual a 2020',
                'number.max': 'El año debe ser menor o igual a 2100'
            }),
            transactions: Joi.array().items(
                Joi.object({
                    date: Joi.date().iso().required().messages({
                        'date.base': 'La fecha debe ser válida',
                        'date.format': 'La fecha debe estar en formato ISO 8601',
                        'any.required': 'La fecha es obligatoria'
                    }),
                    amount: Joi.number().required().messages({
                        'number.base': 'El monto debe ser un número',
                        'any.required': 'El monto es obligatorio'
                    }),
                    currency: Joi.string().required().messages({
                        'string.base': 'La moneda debe ser un string',
                        'any.required': 'La moneda es obligatoria'
                    }),
                    description: Joi.string().optional().allow('').messages({
                        'string.base': 'La descripción debe ser un string'
                    })
                }).unknown(false).messages({
                    'object.unknown': 'El campo {#label} no está permitido en las transacciones'
                })
            ).optional()
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

    updateStatement: {
        params: Joi.object({
            id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required().messages({
                'string.pattern.base': 'ID de MongoDB inválido',
                'any.required': 'ID es requerido'
            })
        }),
        body: Joi.object({
            transactions: Joi.array().items(
                Joi.object({
                    date: Joi.date().iso().required(),
                    amount: Joi.number().required(),
                    currency: Joi.string().required(),
                    description: Joi.string().optional().allow('')
                }).unknown(false)
            ).optional(),
            total_incoming: Joi.number().optional(),
            total_outgoing: Joi.number().optional()
        }).optional()
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
