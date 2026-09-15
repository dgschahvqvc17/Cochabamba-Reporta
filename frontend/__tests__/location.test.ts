/**
 * Pruebas unitarias — HU08 (utils/location.ts).
 *
 * Verifica los límites geográficos, la validación de coordenadas, el
 * formateo y la normalización de la dirección usados por el flujo
 * "Registrar ubicación del incidente".
 *
 * @format
 */

import {
  MAX_ADDRESS_LENGTH,
  MAX_LATITUDE,
  MAX_LONGITUDE,
  MIN_LATITUDE,
  MIN_LONGITUDE,
  formatCoordinates,
  isValidLatitude,
  isValidLongitude,
  normalizeAddress,
  toCoordinate,
} from '../src/utils/location';

describe('location utils (HU08)', () => {
  test('los límites geográficos son los estándar', () => {
    expect(MIN_LATITUDE).toBe(-90);
    expect(MAX_LATITUDE).toBe(90);
    expect(MIN_LONGITUDE).toBe(-180);
    expect(MAX_LONGITUDE).toBe(180);
    expect(MAX_ADDRESS_LENGTH).toBe(200);
  });

  test('convierte números y strings numéricos a coordenada', () => {
    expect(toCoordinate(19.4326)).toBe(19.4326);
    expect(toCoordinate('-99.1332')).toBe(-99.1332);
    expect(toCoordinate('abc')).toBeNull();
    expect(toCoordinate(undefined)).toBeNull();
    expect(toCoordinate(NaN)).toBeNull();
  });

  test('acepta latitudes y longitudes dentro de los rangos válidos', () => {
    expect(isValidLatitude(19.4326)).toBe(true);
    expect(isValidLatitude(-90)).toBe(true);
    expect(isValidLatitude(90)).toBe(true);
    expect(isValidLatitude(90.1)).toBe(false);
    expect(isValidLatitude(-90.5)).toBe(false);
    expect(isValidLatitude('19.4326')).toBe(true);

    expect(isValidLongitude(-99.1332)).toBe(true);
    expect(isValidLongitude(-180)).toBe(true);
    expect(isValidLongitude(180)).toBe(true);
    expect(isValidLongitude(180.1)).toBe(false);
    expect(isValidLongitude(-180.2)).toBe(false);
  });

  test('rechaza coordenadas no numéricas', () => {
    expect(isValidLatitude(null)).toBe(false);
    expect(isValidLatitude(undefined)).toBe(false);
    expect(isValidLongitude('lugar')).toBe(false);
  });

  test('formatea las coordenadas con 6 decimales', () => {
    expect(formatCoordinates(19.4326084, -99.1332099)).toBe(
      '19.432608, -99.13321',
    );

    expect(formatCoordinates(0, 0)).toBe('0, 0');
  });

  test('normaliza la dirección opcional (trim y límite)', () => {
    expect(normalizeAddress('  Av. Principal  ')).toBe('Av. Principal');
    expect(normalizeAddress('')).toBe('');
    expect(normalizeAddress(null)).toBe('');
    expect(normalizeAddress(undefined)).toBe('');
    expect(normalizeAddress('x'.repeat(300)).length).toBe(MAX_ADDRESS_LENGTH);
  });
});