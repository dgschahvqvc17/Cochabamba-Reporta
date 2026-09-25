/**
 * Servicio del dashboard de supervisión (MVC - Service, HU15).
 *
 * Capa de red del panel de indicadores y alertas del administrador.
 * Replica el patrón de `userService.ts`/`incidentService.ts`:
 * helper `api<T>` con Bearer token, manejo de 401 (clearSession) y
 * respuesta tipada `ApiResponse<T>`.
 *
 * @format
 */

import type { DashboardSnapshot } from '../models/Dashboard';
import { clearSession } from '../utils/session';
import { API_BASE_URL as BASE_URL } from '../config/api';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: {
    code?: string;
    details?: { field: string; message: string }[];
  };
}

const REQUEST_TIMEOUT_MS = 20000;

const api = async <T>(
  path: string,
  accessToken: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };

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
      return {
        success: false,
        message: 'El servidor no devolvió una respuesta válida.',
        error: { code: 'EMPTY_RESPONSE' },
      };
    }

    try {
      return JSON.parse(text) as ApiResponse<T>;
    } catch {
      return {
        success: false,
        message: 'El servidor respondió con un formato inesperado.',
        error: { code: 'INVALID_RESPONSE' },
      };
    }
  } catch (error) {
    clearTimeout(timeout);

    if (error instanceof Error && error.name === 'AbortError') {
      return {
        success: false,
        message: 'La petición tardó demasiado. Inténtalo de nuevo.',
        error: { code: 'TIMEOUT' },
      };
    }

    return {
      success: false,
      message: 'No se pudo conectar con el servidor.',
      error: { code: 'NETWORK_ERROR' },
    };
  }
};

/** GET /dashboard — snapshot de indicadores del sistema (solo ADMINISTRADOR). */
export async function getDashboard(
  accessToken: string,
): Promise<ApiResponse<DashboardSnapshot>> {
  return api<DashboardSnapshot>('/dashboard', accessToken);
}
