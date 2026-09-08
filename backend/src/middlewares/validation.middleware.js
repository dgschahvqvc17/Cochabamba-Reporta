/**
 * Middleware de validación (MVC - middlewares).
 *
 * Ejecuta las reglas de express-validator y devuelve los
 * errores en formato estándar si la información es inválida.
 *
 * @format
 */

'use strict';

const { validationResult } = require('express-validator');

const { fail } = require('../utils/response');

const validate = (validations) => [
  validations,
  (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const seenFields = new Set();
      const fields = [];

      errors.array().forEach((error) => {
        if (!seenFields.has(error.path)) {
          seenFields.add(error.path);
          fields.push({ field: error.path, message: error.msg });
        }
      });

      return fail(res, 422, 'Algunos datos son inválidos.', 'VALIDATION_ERROR', {
        fields,
      });
    }

    return next();
  },
];

module.exports = { validate };