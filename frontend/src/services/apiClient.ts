/**
 * Cliente HTTP compartido (MVC - services).
 *
 * Fuente única de las peticiones a la API REST: aplica el token de sesión,
 * un tiempo de espera máximo (para que la interfaz nunca quede cargando
 * para siempre), el cierre de sesión ante un 401 real del sistema y, sobre
 * todo, devuelve `ApiResponse` con mensajes pensados para usuarios sin
 * conocimiento técnico (ver utils/errorMessages).
 *
 * Antes cada servicio tenía su propia copia; ahora todos usan este helper.
 *
 * @format
 */

import { API_BASE_URL as BASE_URL } from '../config/api';
import {
  EMPTY_RESPONSE_MESSAGE,
  NETWORK_ERROR_MESSAGE,
  OFFLINE_MESSAGE,
  SLOW_CONNECTION_MESSAGE,
  SYSTEM_ERROR_MESSAGE,
  UNEXPECTED_RESPONSE_MESSAGE,
  isDeviceOffline,
} from '../utils/errorMessages';
import { clearSession } from '../utils/session';

/**
 * Tiempo de espera de cada petición. Generoso a propósito para la subida
 * multipart de las fotos desde el móvil (HU07).
 */
export const REQUEST_TIMEOUT_MS = 60000;

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: {
    code?: string;
    details?: { field: string; message: string }[];
  };
}

const failure = (code: string, message: string): ApiResponse<never> => ({
  success: false,
  message,
  error: { code },
});

/**
 * Ejecuta una petición contra la API y normaliza el resultado:
 *   - 401 real del sistema → cierra la sesión (nunca por falta de internet,
 *     porque sin comunicación no hay respuesta del servidor).
 *   - Respuesta vacía o con formato inesperado → mensaje amigable.
 *   - Sin conexión o tiempo agotado → mensaje de conexión, no de sistema.
 */
export async function api<T>(
  path: string,
  accessToken: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
  };

  const isFormData =
    typeof FormData !== 'undefined' && options.body instanceof FormData;

  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (response.status === 401) {
      clearSession();
    }

    const text = await response.text();

    if (!text) {
      return failure(
        'EMPTY_RESPONSE',
        response.ok ? EMPTY_RESPONSE_MESSAGE : SYSTEM_ERROR_MESSAGE,
      );
    }

    try {
      return JSON.parse(text) as ApiResponse<T>;
    } catch {
      return failure('INVALID_RESPONSE', UNEXPECTED_RESPONSE_MESSAGE);
    }
  } catch (error) {
    clearTimeout(timeout);

    const timedOut = error instanceof Error && error.name === 'AbortError';

    // Si el dispositivo ya sabe que no hay internet, el mensaje es el de
    // "sin conexión" y no uno de error del sistema: el usuario nunca debe
    // ver avisos técnicos como "token caducado" por falta de señal.
    const message = isDeviceOffline()
      ? OFFLINE_MESSAGE
      : timedOut
        ? SLOW_CONNECTION_MESSAGE
        : NETWORK_ERROR_MESSAGE;

    return failure('NETWORK_ERROR', message);
  }
}
