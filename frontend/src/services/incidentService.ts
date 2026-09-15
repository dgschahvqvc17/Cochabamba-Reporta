/**
 * Servicio de incidentes (MVC - Service).
 *
 * HU06 — Registro de incidentes por parte del ciudadano.
 * HU07 — Adjuntar evidencia fotográfica.
 * Contiene únicamente la comunicación HTTP con la API REST:
 *   - `createIncident(accessToken, payload)` → POST /incidents
 *   - `getIncidentById(accessToken, id)`      → GET /incidents/:id
 *   - `attachEvidence(accessToken, id, file)` → POST /incidents/:id/evidence
 *     (multipart/form-data — HU07).
 * Replica el patrón de categoryService.ts: helper `api` con manejo
 * de 401 (clearSession), ApiResponse genérico y BASE_URL compartido.
 *
 * @format
 */

import type {
  Evidence,
  Incident,
  IncidentCreateResponse,
  IncidentPayload,
} from '../models/Incident';
import { clearSession } from '../utils/session';

const BASE_URL = 'http://localhost:3000/api/v1';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: {
    code?: string;
    details?: { field: string; message: string }[];
  };
}

const api = async <T>(
  path: string,
  accessToken: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> => {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
  };

  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    clearSession();
  }

  return response.json();
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
