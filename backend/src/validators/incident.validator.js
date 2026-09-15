/**
 * Validaciones de incidentes (MVC - validator).
 *
 * HU06 — Registro de incidentes por parte del ciudadano.
 * Reglas aplicadas conforme a los criterios de aceptación:
 *   - La categoría es obligatoria.
 *   - El título es obligatorio.
 *   - La descripción es obligatoria.
 *   - Se validan las longitudes de título y descripción.
 *
 * (La evidencia fotográfica es HU07 y la ubicación es HU08,
 *  historias independientes fuera del alcance de esta validación.)
 *
 * @format
 */

'use strict';

const { body, query } = require('express-validator');

const MIN_TITLE_LENGTH = 8;
const MAX_TITLE_LENGTH = 120;
const MIN_DESCRIPTION_LENGTH = 15;
const MAX_DESCRIPTION_LENGTH = 2000;

/** Estados del ciclo de vida (coincide con el enum incident_status de Supabase). */
const INCIDENT_STATUSES = [
  'REPORTADO',
  'RECIBIDO',
  'EN_VERIFICACION',
  'VERIFICADO',
  'ASIGNADO_PARA_SOLUCION',
  'EN_ATENCION',
  'ATENDIDO',
  'CERRADO',
  'RECHAZADO',
];

const validateCategoryId = body('categoryId')
  .isInt({ min: 1 })
  .withMessage('Debe seleccionar una categoría.')
  .toInt();

const validateListStatus = query('status')
  .optional({ values: 'falsy' })
  .isIn(INCIDENT_STATUSES)
  .withMessage('El estado indicado no es válido.');

const listIncidentsValidation = [validateListStatus];

const validateTitle = body('title')
  .trim()
  .notEmpty()
  .withMessage('El título es obligatorio.')
  .isLength({ min: MIN_TITLE_LENGTH, max: MAX_TITLE_LENGTH })
  .withMessage(
    `El título debe tener entre ${MIN_TITLE_LENGTH} y ${MAX_TITLE_LENGTH} caracteres.`,
  );

const validateDescription = body('description')
  .trim()
  .notEmpty()
  .withMessage('La descripción es obligatoria.')
  .isLength({ min: MIN_DESCRIPTION_LENGTH, max: MAX_DESCRIPTION_LENGTH })
  .withMessage(
    `La descripción debe tener entre ${MIN_DESCRIPTION_LENGTH} y ${MAX_DESCRIPTION_LENGTH} caracteres.`,
  );

const createIncidentValidation = [
  validateCategoryId,
  validateTitle,
  validateDescription,
];

module.exports = {
  createIncidentValidation,
  listIncidentsValidation,
  INCIDENT_STATUSES,
  MIN_TITLE_LENGTH,
  MAX_TITLE_LENGTH,
  MIN_DESCRIPTION_LENGTH,
  MAX_DESCRIPTION_LENGTH,
};
