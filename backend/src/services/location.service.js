/**
 * Servicio de ubicaciones (MVC - Service).
 *
 * HU08 — Registrar ubicación del incidente (ciudadano):
 *   - Valida autenticación y propiedad del incidente.
 *   - Valida latitud, longitud y dirección (reglas de utils/location).
 *   - Registra la ubicación mediante location.repository.
 *
 * @format
 */

'use strict';

const incidentRepository = require('../repositories/incident.repository');
const locationRepository = require('../repositories/location.repository');
const { buildError } = require('../utils/errors');
const {
  toNumber,
  isValidLatitude,
  isValidLongitude,
  MAX_ADDRESS_LENGTH,
  normalizeAddress,
  toPublicLocation,
} = require('../utils/location');

const locationService = {
  /**
   * Registra la ubicación de un incidente del ciudadano autenticado.
   */
  async addLocation(user, incidentId, payload) {
    const userId = user && user.id;

    if (!userId) {
      throw buildError(
        'Debe iniciar sesión para registrar la ubicación.',
        401,
        'AUTHENTICATION_REQUIRED',
      );
    }

    const incident = await incidentRepository.findById(incidentId);

    if (!incident) {
      throw buildError('El incidente no existe.', 404, 'INCIDENT_NOT_FOUND');
    }

    if (incident.user_id !== userId) {
      throw buildError(
        'Solo puedes registrar la ubicación de tus propios incidentes.',
        403,
        'FORBIDDEN',
      );
    }

    const latitude = toNumber(payload && payload.latitude);
    const longitude = toNumber(payload && payload.longitude);
    const address = normalizeAddress(payload && payload.address);

    if (latitude === null || !isValidLatitude(latitude)) {
      throw buildError(
        `La latitud debe estar entre -90 y 90.`,
        422,
        'VALIDATION_ERROR',
        'latitude',
      );
    }

    if (longitude === null || !isValidLongitude(longitude)) {
      throw buildError(
        `La longitud debe estar entre -180 y 180.`,
        422,
        'VALIDATION_ERROR',
        'longitude',
      );
    }

    if (address && address.length > MAX_ADDRESS_LENGTH) {
      throw buildError(
        `La dirección no debe superar los ${MAX_ADDRESS_LENGTH} caracteres.`,
        422,
        'VALIDATION_ERROR',
        'address',
      );
    }

    const capturedAt = payload.capturedAt || undefined;

    const created = await locationRepository.create({
      incidentId: incident.id,
      latitude,
      longitude,
      address,
      capturedAt,
    });

    return toPublicLocation(created);
  },
};

module.exports = locationService;