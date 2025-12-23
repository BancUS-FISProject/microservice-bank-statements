// Reusable request validator middleware using Joi
module.exports = function validate(schemas) {
    // schemas: { params?: Joi.object, query?: Joi.object, body?: Joi.object }
    return (req, res, next) => {
        let Joi;
        try {
            Joi = require('joi');
        } catch (e) {
            // If Joi isn't available, skip strict validation but warn.
            console.warn('[validate] joi not available - skipping validation');
            return next();
        }

        try {
            if (schemas.params) {
                const { error, value } = schemas.params.validate(req.params);
                if (error) return res.status(400).json({ error: 'invalid_params', details: error.details });
                req.params = value;
            }
            if (schemas.query) {
                const { error, value } = schemas.query.validate(req.query);
                if (error) return res.status(400).json({ error: 'invalid_query', details: error.details });
                req.query = value;
            }
            if (schemas.body) {
                const { error, value } = schemas.body.validate(req.body);
                if (error) return res.status(400).json({ error: 'invalid_body', details: error.details });
                req.body = value;
            }
            return next();
        } catch (err) {
            return next(err);
        }
    };
};
