/**
 * Validaciones de ubicación (MVC - validator).
 *
 * HU08 — Registrar ubicación del incidente.
 * Reglas aplicadas al body de POST /api/v1/incidents/:id/location:
 *   - Latitud obligatoria dentro de [-90, 90].
 *   - Longitud obligatoria dentro de [-180, 180].
 *   - Dirección opcional (máx. MAX_ADDRESS_LENGTH).
 *   - capturedAt opcional en formato fecha-hora (ISO 8601).
 * Los límites se importan de utils/location para no duplicar valores.
 *
 * @format
 */

'use strict';

const { body } = require('express-validator');

const {
  MIN_LATITUDE,
  MAX_LATITUDE,
  MIN_LONGITUDE,
  MAX_LONGITUDE,
  MAX_ADDRESS_LENGTH,
} = require('../utils/location');

const validateLatitude = body('latitude')
  .notEmpty()
  .withMessage('Debe registrar la latitud de la ubicación.')
  .isFloat({ min: MIN_LATITUDE, max: MAX_LATITUDE })
  .withMessage(
    `La latitud debe estar entre ${MIN_LATITUDE} y ${MAX_LATITUDE}.`,
  )
  .toFloat();

const validateLongitude = body('longitude')
  .notEmpty()
  .withMessage('Debe registrar la longitud de la ubicación.')
  .isFloat({ min: MIN_LONGITUDE, max: MAX_LONGITUDE })
  .withMessage(
    `La longitud debe estar entre ${MIN_LONGITUDE} y ${MAX_LONGITUDE}.`,
  )
  .toFloat();

const validateAddress = body('address')
  .optional({ values: 'null' })
  .trim()
  .isLength({ max: MAX_ADDRESS_LENGTH })
  .withMessage(
    `La dirección no debe superar los ${MAX_ADDRESS_LENGTH} caracteres.`,
  );

const validateCapturedAt = body('capturedAt')
  .optional({ values: 'null' })
  .isISO8601()
  .withMessage('La fecha de captura debe tener un formato válido.');

const locationValidation = [
  validateLatitude,
  validateLongitude,
  validateAddress,
  validateCapturedAt,
];

module.exports = { locationValidation };