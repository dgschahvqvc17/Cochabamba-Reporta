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
 * Usa el cliente HTTP compartido (services/apiClient) y, para la evidencia
 * en móvil, una subida nativa por XMLHttpRequest (ver attachEvidenceNative).
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
  IncidentOrder,
  IncidentPayload,
  LocationPayload,
  RejectIncidentPayload,
  RejectIncidentResult,
  SolutionUser,
  VerifierUser,
  VerifyIncidentPayload,
  VerifyIncidentResult,
} from '../models/Incident';
import {
  EMPTY_RESPONSE_MESSAGE,
  NETWORK_ERROR_MESSAGE,
  SLOW_CONNECTION_MESSAGE,
  SYSTEM_ERROR_MESSAGE,
  UNEXPECTED_RESPONSE_MESSAGE,
} from '../utils/errorMessages';
import { clearSession } from '../utils/session';
import { API_BASE_URL as BASE_URL } from '../config/api';
import {
  REQUEST_TIMEOUT_MS,
  api,
  type ApiResponse,
} from './apiClient';

export type { ApiResponse };

/** Respuesta del mapa interactivo: incidentes del alcance del rol. */
export interface MapIncidentData {
  incidents: Incident[];
  /** true si el alcance del rol tenía más reportes de los que se envían. */
  truncated?: boolean;
}

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
  /** `asc` muestra primero los reportes más antiguos (más atrasados). */
  order?: IncidentOrder;
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
  if (params.order) query.set('order', params.order);

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
              ? EMPTY_RESPONSE_MESSAGE
              : SYSTEM_ERROR_MESSAGE,
          ),
        );
        return;
      }

      try {
        resolve(JSON.parse(text) as ApiResponse<{ evidence: Evidence }>);
      } catch {
        resolve(invalid('INVALID_RESPONSE', UNEXPECTED_RESPONSE_MESSAGE));
      }
    };

    xhr.onerror = () =>
      resolve(invalid('NETWORK_ERROR', NETWORK_ERROR_MESSAGE));

    xhr.ontimeout = () =>
      resolve(invalid('NETWORK_ERROR', SLOW_CONNECTION_MESSAGE));

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

/**
 * HU — lista los incidentes actualmente en verificación (EN_VERIFICACION)
 * con su verificador asignado, para que la recepción pueda reasignarlo.
 */
export async function getInVerificationIncidents(
  accessToken: string,
  params: { page?: number; limit?: number; search?: string } = {},
): Promise<ApiResponse<IncidentListData>> {
  const query = new URLSearchParams();

  if (params.page !== undefined) query.set('page', String(params.page));
  if (params.limit !== undefined) query.set('limit', String(params.limit));
  if (params.search) query.set('search', params.search);

  const qs = query.toString();

  return api<IncidentListData>(
    `/incidents/in-verification${qs ? `?${qs}` : ''}`,
    accessToken,
  );
}

/**
 * HU — reasigna el verificador de un incidente en verificación
 * (EN_VERIFICACION). Completa la asignación actual y crea la nueva en
 * el backend (el estado del incidente permanece EN_VERIFICACION).
 */
export async function reassignVerification(
  accessToken: string,
  incidentId: number,
  payload: AssignVerificationPayload,
): Promise<
  ApiResponse<{ assignment: IncidentAssignment; incident: Incident }>
> {
  return api<{ assignment: IncidentAssignment; incident: Incident }>(
    `/incidents/${incidentId}/reassign-verification`,
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

/**
 * Rechazo del encargado de recepción (reporte no válido): solo desde
 * REPORTADO/RECIBIDO, guarda el motivo, registra el historial y notifica
 * al ciudadano en el backend.
 */
export async function rejectIncident(
  accessToken: string,
  incidentId: number,
  payload: RejectIncidentPayload,
): Promise<ApiResponse<RejectIncidentResult>> {
  return api<RejectIncidentResult>(`/incidents/${incidentId}/reject`, accessToken, {
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

/**
 * Reabre un reporte rechazado por el ciudadano (solo una vez). Devuelve el
 * reporte a REPORTADO y habilita una única edición para mejorarlo.
 */
export async function reopenIncident(
  accessToken: string,
  incidentId: number,
): Promise<ApiResponse<{ incident: Incident }>> {
  return api<{ incident: Incident }>(
    `/incidents/${incidentId}/reopen`,
    accessToken,
    { method: 'POST' },
  );
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

/**
 * Mapa interactivo de incidentes con ubicación registrada.
 * Devuelve los incidentes que tienen coordenadas GPS dentro del alcance del
 * rol (el backend lo define: el ciudadano ve todos los reportes, el personal
 * municipal solo lo que le corresponde). `truncated` indica que el alcance
 * tenía más reportes de los que se envían.
 */
export async function getMapIncidents(
  accessToken: string,
  params: { categoryId?: number; status?: string; search?: string } = {},
): Promise<ApiResponse<MapIncidentData>> {
  const query = new URLSearchParams();

  if (params.categoryId !== undefined) {
    query.set('categoryId', String(params.categoryId));
  }
  if (params.status) query.set('status', params.status);
  if (params.search) query.set('search', params.search);

  const qs = query.toString();

  return api<MapIncidentData>(
    `/incidents/map-incidents${qs ? `?${qs}` : ''}`,
    accessToken,
  );
}
