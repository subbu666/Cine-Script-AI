const { BadRequestError } = require('../utils/AppError');

/**
 * Validation Middleware Factory
 * Creates middleware that validates request data against Joi schemas
 * @param {Joi.Schema} schema - Joi schema to validate against
 * @param {string} source - Request property to validate (body, query, params)
 * @returns {Function} Express middleware
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const dataToValidate = req[source];

    if (!dataToValidate) {
      return next(new BadRequestError(`No ${source} data provided`));
    }

    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false, // Collect all errors
      stripUnknown: true, // Remove unknown fields
      convert: true, // Auto-convert types
    });

    if (error) {
      // Attach the Joi error to the request for the error handler
      return next(error);
    }

    // Replace request data with validated data
    req[source] = value;

    next();
  };
};

/**
 * Pre-built validators for common use cases
 */
const validators = {
  body: (schema) => validate(schema, 'body'),
  query: (schema) => validate(schema, 'query'),
  params: (schema) => validate(schema, 'params'),
};

module.exports = {
  validate,
  validators,
};
