/**
 * Servicio de incidentes (MVC - Service).
 *
 * HU06 — Registro de incidentes por parte del ciudadano.
 * HU07 — Adjuntar evidencia fotográfica.
 * HU08 — Registrar ubicación del incidente.
 * Contiene únicamente la comunicación HTTP con la API REST:
 *   - `createIncident(accessToken, payload)` → POST /incidents
 *   - `getIncidentById(accessToken, id)`      → GET /incidents/:id
 *   - `attachEvidence(accessToken, id, file)` → POST /incidents/:id/evidence
 *     (multipart/form-data — HU07).
 *   - `attachLocation(accessToken, id, payload)` → POST /incidents/:id/location
 *     (JSON — HU08).
 * Replica el patrón de categoryService.ts: helper `api` con manejo
 * de 401 (clearSession), ApiResponse genérico y BASE_URL compartido.
 *
 * @format
 */

import type {
  Evidence,
  Incident,
  IncidentCreateResponse,
  IncidentLocation,
  IncidentPayload,
  LocationPayload,
} from '../models/Incident';
import { clearSession } from '../utils/session';

const BASE_URL = 'http://localhost:3000/api/v1';

/** Timeout de cada petición para que la UI nunca quede "cargando" sin fin. */
const REQUEST_TIMEOUT_MS = 20000;

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: {
    code?: string;
    details?: { field: string; message: string }[];
  };
}

/**
 * Helper HTTP con manejo robusto: el servidor puede responder HTML (404/error
 * del proxy), vacío, o no estar encendido; en todos esos casos devuelve una
 * `ApiResponse` con success:false en vez de lanzar un SyntaxError que dejaría
 * la interfaz cargando para siempre.
 */
const api = async <T>(
  path: string,
  accessToken: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> => {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
  };

  const isFormData =
    typeof FormData !== 'undefined' && options.body instanceof FormData;

  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
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
        message:
          response.ok
            ? 'El servidor no devolvió una respuesta válida.'
            : `El servidor respondió con un error (${response.status}).`,
        error: { code: 'EMPTY_RESPONSE' },
      };
    }

    try {
      return JSON.parse(text) as ApiResponse<T>;
    } catch {
      return {
        success: false,
        message: `El servidor respondió con un formato inesperado. Verifica que el backend esté actualizado y reinícialo. (HTTP ${response.status})`,
        error: { code: 'INVALID_RESPONSE' },
      };
    }
  } catch (error) {
    clearTimeout(timeout);

    const aborted =
      error instanceof Error && error.name === 'AbortError';

    return {
      success: false,
      message: aborted
        ? 'La solicitud tardó demasiado. Verifica que el backend esté encendido e inténtalo de nuevo.'
        : 'No se pudo conectar con el servidor. Verifica que el backend esté encendido e inténtalo de nuevo.',
      error: { code: 'NETWORK_ERROR' },
    };
  }
};

export async function createIncident(
  accessToken: string,
  payload: IncidentPayload,
): Promise<ApiResponse<IncidentCreateResponse>> {
  return api<IncidentCreateResponse>('/incidents', accessToken, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getIncidentById(
  accessToken: string,
  incidentId: number,
): Promise<ApiResponse<{ incident: Incident }>> {
  return api<{ incident: Incident }>(`/incidents/${incidentId}`, accessToken);
}

export async function getMyIncidents(
  accessToken: string,
  status?: string,
): Promise<ApiResponse<{ incidents: Incident[] }>> {
  const path = status
    ? `/incidents?status=${encodeURIComponent(status)}`
    : '/incidents';

  return api<{ incidents: Incident[] }>(path, accessToken);
}

export async function attachEvidence(
  accessToken: string,
  incidentId: number,
  file: Blob | { uri: string; name: string; type: string },
  fileName: string,
): Promise<ApiResponse<{ evidence: Evidence }>> {
  const body = new FormData();
  body.append('image', file as unknown as Blob, fileName);

  return api<{ evidence: Evidence }>(
    `/incidents/${incidentId}/evidence`,
    accessToken,
    {
      method: 'POST',
      body,
    },
  );
}

export async function attachLocation(
  accessToken: string,
  incidentId: number,
  payload: LocationPayload,
): Promise<ApiResponse<{ location: IncidentLocation }>> {
  return api<{ location: IncidentLocation }>(
    `/incidents/${incidentId}/location`,
    accessToken,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );
}

export async function updateIncident(
  accessToken: string,
  incidentId: number,
  payload: IncidentPayload,
): Promise<ApiResponse<{ incident: Incident }>> {
  return api<{ incident: Incident }>(`/incidents/${incidentId}`, accessToken, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteIncident(
  accessToken: string,
  incidentId: number,
): Promise<ApiResponse<{ id: number; code: string }>> {
  return api<{ id: number; code: string }>(
    `/incidents/${incidentId}`,
    accessToken,
    { method: 'DELETE' },
  );
}
