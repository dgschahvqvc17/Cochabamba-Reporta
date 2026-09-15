/**
 * Constantes y validaciones de ubicación (MVC - utils).
 *
 * HU08 — Registrar ubicación del incidente.
 * Centraliza los límites geográficos y los helpers de las coordenadas
 * (latitud/longitud) evitando valores mágicos (principio DRY) tanto en
 * el validator como en el service.
 *
 * @format
 */

'use strict';

const MIN_LATITUDE = -90;
const MAX_LATITUDE = 90;
const MIN_LONGITUDE = -180;
const MAX_LONGITUDE = 180;
const MAX_ADDRESS_LENGTH = 200;

const toNumber = (value) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const number = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(number) ? number : null;
};

const isValidLatitude = (value) => {
  const latitude = toNumber(value);
  return (
    latitude !== null && latitude >= MIN_LATITUDE && latitude <= MAX_LATITUDE
  );
};

const isValidLongitude = (value) => {
  const longitude = toNumber(value);
  return (
    longitude !== null &&
    longitude >= MIN_LONGITUDE &&
    longitude <= MAX_LONGITUDE
  );
};

const normalizeAddress = (value) =>
  value ? String(value).trim().slice(0, MAX_ADDRESS_LENGTH) : null;

const toPublicLocation = (location) => ({
  id: location.id,
  incidentId: location.incident_id,
  latitude: Number(location.latitude),
  longitude: Number(location.longitude),
  address: location.address ?? null,
  capturedAt: location.captured_at,
});

module.exports = {
  MIN_LATITUDE,
  MAX_LATITUDE,
  MIN_LONGITUDE,
  MAX_LONGITUDE,
  MAX_ADDRESS_LENGTH,
  toNumber,
  isValidLatitude,
  isValidLongitude,
  normalizeAddress,
  toPublicLocation,
};