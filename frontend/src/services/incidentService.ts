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
  AssignSolutionPayload,
  AssignVerificationPayload,
  AttendIncidentPayload,
  AttendIncidentResult,
  Evidence,
  Incident,
  IncidentAssignment,
  IncidentCreateResponse,
  IncidentHistoryEntry,
  IncidentListData,
  IncidentLocation,
  IncidentPayload,
  LocationPayload,
  SolutionUser,
  VerifierUser,
  VerifyIncidentPayload,
  VerifyIncidentResult,
} from '../models/Incident';
import { clearSession } from '../utils/session';
import { API_BASE_URL as BASE_URL } from '../config/api';

/** Timeout de cada petición para que la UI nunca quede "cargando" sin fin.
 *  Generoso para la subida multipart de fotos desde el móvil (HU07). */
const REQUEST_TIMEOUT_MS = 60000;

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

/**
 * Parámetros del listado de incidentes para el personal municipal (HU09):
 * búsqueda por código/título/descripción, filtros por estado, categoría y
 * fecha (AAAA-MM-DD), y paginación.
 */
export interface IncidentListParams {
  page?: number;
  limit?: number;
  status?: string;
  categoryId?: number;
  from?: string;
  to?: string;
  search?: string;
}

/**
 * Lista de incidentes con paginación para el personal municipal (HU09).
 * El rol del usuario autenticado determina el alcance: el ciudadano sigue
 * viendo solo sus reportes (getMyIncidents).
 */
export async function getIncidents(
  accessToken: string,
  params: IncidentListParams = {},
): Promise<ApiResponse<IncidentListData>> {
  const query = new URLSearchParams();

  if (params.page !== undefined) query.set('page', String(params.page));
  if (params.limit !== undefined) query.set('limit', String(params.limit));
  if (params.status) query.set('status', params.status);
  if (params.categoryId !== undefined) {
    query.set('categoryId', String(params.categoryId));
  }
  if (params.from) query.set('from', params.from);
  if (params.to) query.set('to', params.to);
  if (params.search) query.set('search', params.search);

  const qs = query.toString();

  return api<IncidentListData>(
    `/incidents${qs ? `?${qs}` : ''}`,
    accessToken,
  );
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

/**
 * Subida nativa de evidencia vía XMLHttpRequest (HU07).
 *
 * El `fetch` de Expo (winter, default en SDK 57) no serializa el objeto
 * nativo `{uri,name,type}` de React Native dentro de FormData, y el
 * constructor de Blob de RN no admite partes binarias (ArrayBuffer).
 * XMLHttpRequest sí lee el archivo local de forma nativa, por lo que es el
 * camino determinista en móvil. Replica el contrato de `api`.
 */
export function attachEvidenceNative(
  accessToken: string,
  incidentId: number,
  file: { uri: string; name: string; type: string },
  fileName: string,
): Promise<ApiResponse<{ evidence: Evidence }>> {
  return new Promise((resolve) => {
    const body = new FormData();
    body.append('image', file as unknown as Blob, fileName);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${BASE_URL}/incidents/${incidentId}/evidence`);
    if (accessToken) {
      xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
    }
    // No se fija Content-Type: React Native genera el boundary del multipart.
    xhr.responseType = 'text';
    xhr.timeout = REQUEST_TIMEOUT_MS;

    const invalid = (code: string, message: string) => ({
      success: false,
      message,
      error: { code },
    });

    xhr.onload = () => {
      if (xhr.status === 401) {
        clearSession();
      }

      const text = xhr.responseText ?? '';
      if (!text) {
        resolve(
          invalid(
            'EMPTY_RESPONSE',
            xhr.status >= 200 && xhr.status < 300
              ? 'El servidor no devolvió una respuesta válida.'
              : `El servidor respondió con un error (${xhr.status}).`,
          ),
        );
        return;
      }

      try {
        resolve(JSON.parse(text) as ApiResponse<{ evidence: Evidence }>);
      } catch {
        resolve(
          invalid(
            'INVALID_RESPONSE',
            `El servidor respondió con un formato inesperado. Verifica que el backend esté actualizado y reinícialo. (HTTP ${xhr.status})`,
          ),
        );
      }
    };

    xhr.onerror = () =>
      resolve(
        invalid(
          'NETWORK_ERROR',
          'No se pudo conectar con el servidor. Verifica que el backend esté encendido e inténtalo de nuevo.',
        ),
      );

    xhr.ontimeout = () =>
      resolve(
        invalid(
          'NETWORK_ERROR',
          'La solicitud tardó demasiado. Verifica que el backend esté encendido e inténtalo de nuevo.',
        ),
      );

    xhr.send(body);
  });
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

/** HU10: lista los funcionarios de verificación disponibles. */
export async function getVerifiers(
  accessToken: string,
): Promise<ApiResponse<{ verifiers: VerifierUser[] }>> {
  return api<{ verifiers: VerifierUser[] }>(
    '/incidents/verifiers',
    accessToken,
  );
}

/** HU10: lista los incidentes pendientes de verificación (REPORTADO/RECIBIDO). */
export async function getPendingVerificationIncidents(
  accessToken: string,
  params: { page?: number; limit?: number; search?: string } = {},
): Promise<ApiResponse<IncidentListData>> {
  const query = new URLSearchParams();

  if (params.page !== undefined) query.set('page', String(params.page));
  if (params.limit !== undefined) query.set('limit', String(params.limit));
  if (params.search) query.set('search', params.search);

  const qs = query.toString();

  return api<IncidentListData>(
    `/incidents/pending-verification${qs ? `?${qs}` : ''}`,
    accessToken,
  );
}

/**
 * HU10: asigna un incidente a un funcionario de verificación.
 * Cambia el estado a EN_VERIFICACION, registra la asignación y las
 * notificaciones en el backend.
 */
export async function assignVerification(
  accessToken: string,
  incidentId: number,
  payload: AssignVerificationPayload,
): Promise<
  ApiResponse<{ assignment: IncidentAssignment; incident: Incident }>
> {
  return api<{ assignment: IncidentAssignment; incident: Incident }>(
    `/incidents/${incidentId}/assign-verification`,
    accessToken,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );
}

/** Historial de cambios de estado de un incidente (trazabilidad). */
export async function getIncidentHistory(
  accessToken: string,
  incidentId: number,
): Promise<ApiResponse<{ history: IncidentHistoryEntry[] }>> {
  return api<{ history: IncidentHistoryEntry[] }>(
    `/incidents/${incidentId}/history`,
    accessToken,
  );
}

/**
 * HU11: lista los incidentes asignados al verificador autenticado
 * (asignación VERIFICACION activa), con búsqueda y paginación.
 */
export async function getAssignedVerificationIncidents(
  accessToken: string,
  params: { page?: number; limit?: number; search?: string } = {},
): Promise<ApiResponse<IncidentListData>> {
  const query = new URLSearchParams();

  if (params.page !== undefined) query.set('page', String(params.page));
  if (params.limit !== undefined) query.set('limit', String(params.limit));
  if (params.search) query.set('search', params.search);

  const qs = query.toString();

  return api<IncidentListData>(
    `/incidents/assigned-verification${qs ? `?${qs}` : ''}`,
    accessToken,
  );
}

/**
 * HU11: registra la decisión de verificación del incidente asignado
 * (VERIFICADO cuando verified=true; RECHAZADO con rejectedReason en caso
 * contrario). Completa la asignación y notifica al ciudadano en el backend.
 */
export async function verifyIncident(
  accessToken: string,
  incidentId: number,
  payload: VerifyIncidentPayload,
): Promise<ApiResponse<VerifyIncidentResult>> {
  return api<VerifyIncidentResult>(`/incidents/${incidentId}/verify`, accessToken, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/** HU12: lista el personal de solución disponible (encargado de solución). */
export async function getSolutionStaff(
  accessToken: string,
): Promise<ApiResponse<{ staff: SolutionUser[] }>> {
  return api<{ staff: SolutionUser[] }>(
    '/incidents/solution-staff',
    accessToken,
  );
}

/** HU12: lista los incidentes verificados pendientes de solución. */
export async function getPendingSolutionIncidents(
  accessToken: string,
  params: { page?: number; limit?: number; search?: string } = {},
): Promise<ApiResponse<IncidentListData>> {
  const query = new URLSearchParams();

  if (params.page !== undefined) query.set('page', String(params.page));
  if (params.limit !== undefined) query.set('limit', String(params.limit));
  if (params.search) query.set('search', params.search);

  const qs = query.toString();

  return api<IncidentListData>(
    `/incidents/pending-solution${qs ? `?${qs}` : ''}`,
    accessToken,
  );
}

/**
 * HU12: asigna un incidente verificado a un responsable de solución.
 * Cambia el estado a ASIGNADO_PARA_SOLUCION, registra la asignación y
 * las notificaciones en el backend.
 */
export async function assignSolution(
  accessToken: string,
  incidentId: number,
  payload: AssignSolutionPayload,
): Promise<
  ApiResponse<{ assignment: IncidentAssignment; incident: Incident }>
> {
  return api<{ assignment: IncidentAssignment; incident: Incident }>(
    `/incidents/${incidentId}/assign-solution`,
    accessToken,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );
}

/**
 * HU13: lista los incidentes asignados activamente al responsable de
 * solución autenticado (cola de atención), con búsqueda y paginación.
 */
export async function getAssignedSolutionIncidents(
  accessToken: string,
  params: { page?: number; limit?: number; search?: string } = {},
): Promise<ApiResponse<IncidentListData>> {
  const query = new URLSearchParams();

  if (params.page !== undefined) query.set('page', String(params.page));
  if (params.limit !== undefined) query.set('limit', String(params.limit));
  if (params.search) query.set('search', params.search);

  const qs = query.toString();

  return api<IncidentListData>(
    `/incidents/assigned-solution${qs ? `?${qs}` : ''}`,
    accessToken,
  );
}

/**
 * HU13: inicia la atención de un incidente asignado (ASIGNADO_PARA_SOLUCION
 * → EN_ATENCION). Registra las acciones realizadas y notifica al ciudadano.
 */
export async function attendIncident(
  accessToken: string,
  incidentId: number,
  payload: AttendIncidentPayload,
): Promise<ApiResponse<AttendIncidentResult>> {
  return api<AttendIncidentResult>(`/incidents/${incidentId}/attend`, accessToken, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * HU13: marca un incidente en atención como atendido (EN_ATENCION →
 * ATENDIDO), con acciones y observaciones opcionales.
 */
export async function markIncidentAttended(
  accessToken: string,
  incidentId: number,
  payload: AttendIncidentPayload,
): Promise<ApiResponse<AttendIncidentResult>> {
  return api<AttendIncidentResult>(
    `/incidents/${incidentId}/mark-attended`,
    accessToken,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );
}

/**
 * HU13: cierra un incidente atendido (ATENDIDO → CERRADO). Completa la
 * asignación de solución y notifica al ciudadano.
 */
export async function closeIncident(
  accessToken: string,
  incidentId: number,
  payload: AttendIncidentPayload,
): Promise<ApiResponse<AttendIncidentResult>> {
  return api<AttendIncidentResult>(`/incidents/${incidentId}/close`, accessToken, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
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
