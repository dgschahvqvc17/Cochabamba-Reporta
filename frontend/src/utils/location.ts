/**
 * Utilidades de ubicación (MVC - utils).
 *
 * HU08 — Registrar ubicación del incidente.
 * Centraliza los límites geográficos (consistentes con el backend
 * utils/location.js y location.validator.js), los helpers de validación
 * y formato de coordenadas, y la obtención de la posición actual del
 * dispositivo vía `expo-location` (compatible con Expo Go). En web usa
 * directamente `navigator.geolocation`.
 *
 * @format
 */

import { Platform } from 'react-native';
import * as Location from 'expo-location';

export const MIN_LATITUDE = -90;
export const MAX_LATITUDE = 90;
export const MIN_LONGITUDE = -180;
export const MAX_LONGITUDE = 180;
export const MAX_ADDRESS_LENGTH = 200;

/** Resolución de visualización de las coordenadas (décimas de segundo). */
const DISPLAY_PRECISION = 6;

export interface CurrentPosition {
  latitude: number;
  longitude: number;
  /** Marca de tiempo de la captura (ISO 8601). */
  capturedAt: string;
}

export interface LocationResult {
  ok: boolean;
  position?: CurrentPosition;
  message?: string;
  /** true cuando el usuario denegó el permiso de ubicación. */
  permissionDenied?: boolean;
}

export function toCoordinate(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const number = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(number) ? number : null;
}

export function isValidLatitude(value: unknown): boolean {
  const latitude = toCoordinate(value);
  return (
    latitude !== null && latitude >= MIN_LATITUDE && latitude <= MAX_LATITUDE
  );
}

export function isValidLongitude(value: unknown): boolean {
  const longitude = toCoordinate(value);
  return (
    longitude !== null &&
    longitude >= MIN_LONGITUDE &&
    longitude <= MAX_LONGITUDE
  );
}

export function normalizeAddress(value: string | null | undefined): string {
  return value ? String(value).trim().slice(0, MAX_ADDRESS_LENGTH) : '';
}

export function formatCoordinates(
  latitude: number,
  longitude: number,
): string {
  const lat = Number(latitude.toFixed(DISPLAY_PRECISION));
  const lng = Number(longitude.toFixed(DISPLAY_PRECISION));
  return `${lat}, ${lng}`;
}

/**
 * Obtiene la posición actual. En web pide el permiso del navegador;
 * en móvil dispara el diálogo del sistema operativo. Devuelve un
 * resultado comprensible para la interfaz (HU08: solicitar permiso,
 * obtener ubicación, alertar si no se puede obtener).
 */
export async function getCurrentPosition(): Promise<LocationResult> {
  if (Platform.OS === 'web') {
    return getWebPosition();
  }

  try {
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== 'granted') {
      return {
        ok: false,
        permissionDenied: true,
        message:
          'No se pudo acceder a tu ubicación porque el permiso fue denegado. Actívalo en los ajustes e inténtalo de nuevo.',
      };
    }

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    const { latitude, longitude } = position.coords;

    if (!isValidLatitude(latitude) || !isValidLongitude(longitude)) {
      return {
        ok: false,
        message: 'Las coordenadas obtenidas no son válidas.',
      };
    }

    return {
      ok: true,
      position: {
        latitude,
        longitude,
        capturedAt: new Date().toISOString(),
      },
    };
  } catch {
    return {
      ok: false,
      message:
        'La ubicación no está disponible en este dispositivo. Inténtalo de nuevo.',
    };
  }
}

function getWebPosition(): Promise<LocationResult> {
  return new Promise((resolve) => {
    if (!isGeolocationSupported()) {
      resolve({
        ok: false,
        message:
          'La ubicación no está disponible en este navegador o dispositivo. En web se requiere un contexto seguro (HTTPS o localhost).',
      });
      return;
    }

    // Timeout manual: el navegador puede no invocar callbacks si no hay
    // contexto seguro, así la pantalla nunca queda "localizando" sin fin.
    const TIMEOUT_MS = 20000;

    let settled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const settle = (result: LocationResult) => {
      if (settled) {
        return;
      }
      settled = true;
      if (timer) {
        clearTimeout(timer);
      }
      resolve(result);
    };

    const onSuccess = (position: {
      coords: { latitude: number; longitude: number };
    }) => {
      const { latitude, longitude } = position.coords;

      if (!isValidLatitude(latitude) || !isValidLongitude(longitude)) {
        settle({
          ok: false,
          message: 'Las coordenadas obtenidas no son válidas.',
        });
        return;
      }

      settle({
        ok: true,
        position: {
          latitude,
          longitude,
          capturedAt: new Date().toISOString(),
        },
      });
    };

    const onError = (error: { code?: number; message?: string }) => {
      if (error && error.code === 1) {
        settle({
          ok: false,
          permissionDenied: true,
          message:
            'No se pudo acceder a tu ubicación porque el permiso fue denegado. Actívalo en los ajustes e inténtalo de nuevo.',
        });
        return;
      }

      settle({
        ok: false,
        message: error && error.message
          ? `No se pudo obtener tu ubicación: ${error.message}`
          : 'No se pudo obtener tu ubicación. Inténtalo de nuevo.',
      });
    };

    try {
      navigator.geolocation.getCurrentPosition(onSuccess, onError, {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      });

      timer = setTimeout(() => {
        settle({
          ok: false,
          message:
            'Tu ubicación tardó demasiado en obtenerse. Inténtalo de nuevo.',
        });
      }, TIMEOUT_MS);
    } catch {
      settle({
        ok: false,
        message: 'La ubicación no está disponible en este dispositivo.',
      });
    }
  });
}

function isGeolocationSupported(): boolean {
  if (Platform.OS === 'web') {
    return (
      typeof navigator !== 'undefined' && Boolean(navigator.geolocation)
    );
  }
  return true;
}