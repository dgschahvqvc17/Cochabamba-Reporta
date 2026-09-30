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
 * HU10 — Asignación para verificación (assignedToId + nota).
 * HU12 — Asignación para solución (assignedToId + nota).
 * HU13 — Atención de solución (acciones realizadas + observaciones).
 *
 * (La evidencia fotográfica es HU07 y la ubicación es HU08,
 *  historias independientes fuera del alcance de esta validación.)
 *
 * @format
 */

'use strict';

const { body, query } = require('express-validator');
const { INCIDENT_STATUSES } = require('../utils/incidentStatus');
const {
  MAX_REPEATED_LETTERS_RUN,
  hasExcessiveRepeatedLetters,
  hasUselessSpaces,
} = require('../utils/text');
const {
  MIN_TITLE_LENGTH,
  MAX_TITLE_LENGTH,
  MIN_DESCRIPTION_LENGTH,
  MAX_DESCRIPTION_LENGTH,
  DEFAULT_LIST_PAGE_SIZE,
  MAX_LIST_PAGE_SIZE,
  MAX_OBSERVATIONS_LENGTH,
  MAX_REJECTED_REASON_LENGTH,
  MAX_ACTIONS_LENGTH,
  INCIDENT_ORDER_VALUES,
} = require('../utils/incidentRules');

const validateCategoryId = body('categoryId')
  .isInt({ min: 1 })
  .withMessage('Debe seleccionar una categoría.')
  .toInt();

const validateListStatus = query('status')
  .optional({ values: 'falsy' })
  .isIn(INCIDENT_STATUSES)
  .withMessage('El estado indicado no es válido.');

const validateListCategoryId = query('categoryId')
  .optional({ values: 'falsy' })
  .isInt({ min: 1 })
  .withMessage('La categoría indicada no es válida.')
  .toInt();

const validateListDate = (field, label) =>
  query(field)
    .optional({ values: 'falsy' })
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage(`${label} debe tener el formato AAAA-MM-DD.`);

const validateListSearch = query('search')
  .optional({ values: 'falsy' })
  .trim()
  .isLength({ max: 100 })
  .withMessage('La búsqueda no debe superar los 100 caracteres.');

const validateListPage = query('page')
  .optional({ values: 'falsy' })
  .isInt({ min: 1 })
  .withMessage('La página indicada no es válida.')
  .toInt();

const validateListLimit = query('limit')
  .optional({ values: 'falsy' })
  .isInt({ min: 1, max: MAX_LIST_PAGE_SIZE })
  .withMessage(
    `El límite por página no debe superar ${MAX_LIST_PAGE_SIZE} registros.`,
  )
  .toInt();

/** Orden por fecha de llegada: `asc` (más antiguos) u `order=desc`. */
const validateListOrder = query('order')
  .optional({ values: 'falsy' })
  .toLowerCase()
  .isIn(INCIDENT_ORDER_VALUES)
  .withMessage('El orden debe ser "asc" (más antiguos primero) o "desc".');

const listIncidentsValidation = [
  validateListStatus,
  validateListCategoryId,
  validateListDate('from', 'La fecha desde'),
  validateListDate('to', 'La fecha hasta'),
  validateListSearch,
  validateListPage,
  validateListLimit,
  validateListOrder,
];

/**
 * Mapa interactivo: mismos filtros que el listado (estado, categoría y
 * búsqueda) sin paginación. El alcance por rol lo aplica el service
 * (utils/mapScope), nunca los parámetros de la consulta.
 */
const mapIncidentsValidation = [
  validateListStatus,
  validateListCategoryId,
  validateListSearch,
];

/** Sin espacios al principio, al final ni duplicados ("  bache  roto "). */
const noUselessSpaces = (label) => (value) => {
  if (hasUselessSpaces(value)) {
    throw new Error(
      `${label} no puede empezar ni terminar con espacios, ni tener espacios de más.`,
    );
  }

  return true;
};

/** Detecta el relleno con teclado: "aaa", "lllooo", "bbbb". */
const noRepeatedLetters = (label) => (value) => {
  if (hasExcessiveRepeatedLetters(value, MAX_REPEATED_LETTERS_RUN)) {
    throw new Error(
      `${label} no puede tener más de ${MAX_REPEATED_LETTERS_RUN} letras iguales seguidas. Revisa que esté bien escrito.`,
    );
  }

  return true;
};

const validateTitle = body('title')
  .trim()
  .notEmpty()
  .withMessage('El título es obligatorio.')
  .isLength({ min: MIN_TITLE_LENGTH, max: MAX_TITLE_LENGTH })
  .withMessage(
    `El título debe tener entre ${MIN_TITLE_LENGTH} y ${MAX_TITLE_LENGTH} caracteres.`,
  )
  .custom(noUselessSpaces('El título'))
  .custom(noRepeatedLetters('El título'));

const validateDescription = body('description')
  .trim()
  .notEmpty()
  .withMessage('La descripción es obligatoria.')
  .isLength({ min: MIN_DESCRIPTION_LENGTH, max: MAX_DESCRIPTION_LENGTH })
  .withMessage(
    `La descripción debe tener entre ${MIN_DESCRIPTION_LENGTH} y ${MAX_DESCRIPTION_LENGTH} caracteres.`,
  )
  .custom(noUselessSpaces('La descripción'))
  .custom(noRepeatedLetters('La descripción'));

const createIncidentValidation = [
  validateCategoryId,
  validateTitle,
  validateDescription,
];

/** HU10: asignar incidente a un funcionario de verificación. */
const validateAssignedToId = body('assignedToId')
  .isInt({ min: 1 })
  .withMessage('Debe seleccionar un funcionario de verificación.')
  .toInt();

const validateAssignNote = body('note')
  .optional({ values: 'falsy' })
  .trim()
  .isLength({ max: 255 })
  .withMessage('La nota no debe superar los 255 caracteres.');

const assignVerificationValidation = [
  validateAssignedToId,
  validateAssignNote,
];

/**
 * HU — Reasignar el verificador de un incidente en verificación.
 * Misma forma que la asignación (assignedToId distinto del actual + nota).
 */
const reassignVerificationValidation = [
  validateAssignedToId,
  validateAssignNote,
];

/** HU12: asignar un incidente verificado a un responsable de solución. */
const validateSolutionAssignedToId = body('assignedToId')
  .isInt({ min: 1 })
  .withMessage('Debe seleccionar un responsable de solución.')
  .toInt();

const assignSolutionValidation = [
  validateSolutionAssignedToId,
  validateAssignNote,
];

/** Transición genérica de estado (PATCH /:id/status). */
const validateStatus = body('status')
  .isIn(INCIDENT_STATUSES)
  .withMessage('El estado indicado no es válido.');

const validateChangeComment = body('comment')
  .optional({ values: 'falsy' })
  .trim()
  .isLength({ max: 500 })
  .withMessage('El comentario no debe superar los 500 caracteres.');

const changeStatusValidation = [validateStatus, validateChangeComment];

/** HU11: verificar un incidente (personal de verificación). */

const validateVerified = body('verified')
  .isBoolean()
  .withMessage('Indique si el incidente fue verificado.')
  .toBoolean();

const validateObservations = body('observations')
  .optional({ values: 'falsy' })
  .trim()
  .isLength({ max: MAX_OBSERVATIONS_LENGTH })
  .withMessage(
    `Las observaciones no deben superar los ${MAX_OBSERVATIONS_LENGTH} caracteres.`,
  );

const validateRejectedReason = body('rejectedReason')
  .optional({ values: 'falsy' })
  .trim()
  .isLength({ max: MAX_REJECTED_REASON_LENGTH })
  .withMessage(
    `El motivo de rechazo no debe superar los ${MAX_REJECTED_REASON_LENGTH} caracteres.`,
  );

const verifyIncidentValidation = [
  validateVerified,
  validateObservations,
  validateRejectedReason,
];

/**
 * Rechazo del encargado de recepción (HU) — el motivo es obligatorio y se
 * entrega al ciudadano (historial + notificación).
 */
const validateRejectedReasonRequired = body('rejectedReason')
  .trim()
  .notEmpty()
  .withMessage('Debe indicar el motivo por el que rechaza el reporte.')
  .isLength({ max: MAX_REJECTED_REASON_LENGTH })
  .withMessage(
    `El motivo de rechazo no debe superar los ${MAX_REJECTED_REASON_LENGTH} caracteres.`,
  );

const rejectIncidentValidation = [validateRejectedReasonRequired];

/** HU13: acciones realizadas obligatorias al iniciar la atención. */
const validateActionsRequired = body('actions')
  .trim()
  .notEmpty()
  .withMessage('Debe registrar las acciones realizadas.')
  .isLength({ max: MAX_ACTIONS_LENGTH })
  .withMessage(
    `Las acciones no deben superar los ${MAX_ACTIONS_LENGTH} caracteres.`,
  );

/** HU13: acciones realizadas opcionales (marcar atendido / cerrar). */
const validateActionsOptional = body('actions')
  .optional({ values: 'falsy' })
  .trim()
  .isLength({ max: MAX_ACTIONS_LENGTH })
  .withMessage(
    `Las acciones no deben superar los ${MAX_ACTIONS_LENGTH} caracteres.`,
  );

const attendIncidentValidation = [validateActionsRequired, validateObservations];

const markAttendedValidation = [validateActionsOptional, validateObservations];

const closeIncidentValidation = [validateActionsOptional, validateObservations];

module.exports = {
  createIncidentValidation,
  listIncidentsValidation,
  mapIncidentsValidation,
  assignVerificationValidation,
  reassignVerificationValidation,
  assignSolutionValidation,
  changeStatusValidation,
  verifyIncidentValidation,
  rejectIncidentValidation,
  attendIncidentValidation,
  markAttendedValidation,
  closeIncidentValidation,
  INCIDENT_STATUSES,
  DEFAULT_LIST_PAGE_SIZE,
  MAX_LIST_PAGE_SIZE,
  MIN_TITLE_LENGTH,
  MAX_TITLE_LENGTH,
  MIN_DESCRIPTION_LENGTH,
  MAX_DESCRIPTION_LENGTH,
  MAX_OBSERVATIONS_LENGTH,
  MAX_REJECTED_REASON_LENGTH,
  MAX_ACTIONS_LENGTH,
};
