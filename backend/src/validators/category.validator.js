/**
 * Validaciones de categorías de incidentes (HU04).
 *
 * Reglas aplicadas conforme a los criterios de aceptación:
 *   - El nombre es obligatorio.
 *   - Longitud máxima del nombre y de la descripción.
 *   - La activación/desactivación recibe un valor booleano.
 *
 * @format
 */

'use strict';

const { body } = require('express-validator');

const MIN_NAME_LENGTH = 2;
const MAX_NAME_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 255;

const validateCategoryName = body('name')
  .trim()
  .notEmpty()
  .withMessage('El nombre de la categoría es obligatorio.')
  .isLength({ min: MIN_NAME_LENGTH, max: MAX_NAME_LENGTH })
  .withMessage(
    `El nombre debe tener entre ${MIN_NAME_LENGTH} y ${MAX_NAME_LENGTH} caracteres.`,
  );

const validateCategoryDescription = body('description')
  .optional({ values: 'falsy' })
  .trim()
  .isLength({ max: MAX_DESCRIPTION_LENGTH })
  .withMessage(
    `La descripción no debe superar los ${MAX_DESCRIPTION_LENGTH} caracteres.`,
  );

const validateUpdateName = body('name')
  .optional({ values: 'falsy' })
  .trim()
  .notEmpty()
  .withMessage('El nombre de la categoría es obligatorio.')
  .isLength({ min: MIN_NAME_LENGTH, max: MAX_NAME_LENGTH })
  .withMessage(
    `El nombre debe tener entre ${MIN_NAME_LENGTH} y ${MAX_NAME_LENGTH} caracteres.`,
  );

const validateCategoryStatus = body('active')
  .toBoolean()
  .isBoolean()
  .withMessage('El estado debe ser un valor booleano.');

const createCategoryValidation = [
  validateCategoryName,
  validateCategoryDescription,
];

const updateCategoryValidation = [validateUpdateName, validateCategoryDescription];

const updateCategoryStatusValidation = [validateCategoryStatus];

module.exports = {
  createCategoryValidation,
  updateCategoryValidation,
  updateCategoryStatusValidation,
};