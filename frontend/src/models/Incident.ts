/**
 * Modelo de Incidente (MVC - Model).
 *
 * HU06 — Registro de incidentes por parte del ciudadano.
 * HU07 — Adjuntar evidencia fotográfica.
 * HU08 — Registrar ubicación del incidente.
 *
 * Define la estructura del incidente en el frontend, incluyendo:
 *   - El tipo `IncidentStatus` con todos los estados del ciclo de vida
 *     (coincide con el enum `incident_status` de Supabase).
 *   - La interfaz `Incident` (respuesta del backend, formato público),
 *     que ahora incluye las evidencias fotográficas (`evidence`) y la
 *     ubicación registrada (`location`, HU08).
 *   - La interfaz `IncidentPayload` (lo que envía el ciudadano al crear:
 *     categoryId obligatorio, título y descripción con longitudes).
 *   - Interface de respuesta de creación (`IncidentCreateResponse`).
 *   - La interfaz `Evidence` (HU07): referencia de una imagen adjunta.
 *   - La interfaz `IncidentLocation` y `LocationPayload` (HU08):
 *     coordenadas, dirección opcional y fecha de captura.
 * Las longitudes se comparten con los validators (utils/validators.ts).
 *
 * @format
 */

export interface IncidentPayload {
  categoryId: number;
  title: string;
  description: string;
}

export interface IncidentCreateResponse {
  incident: Incident;
}

export type IncidentStatus =
  | 'REPORTADO'
  | 'RECIBIDO'
  | 'EN_VERIFICACION'
  | 'VERIFICADO'
  | 'ASIGNADO_PARA_SOLUCION'
  | 'EN_ATENCION'
  | 'ATENDIDO'
  | 'CERRADO'
  | 'RECHAZADO';

export interface Evidence {
  id: number;
  incidentId: number;
  url: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
}

export interface LocationPayload {
  latitude: number;
  longitude: number;
  address?: string;
  capturedAt?: string;
}

export interface IncidentLocation {
  id: number;
  incidentId: number;
  latitude: number;
  longitude: number;
  address: string | null;
  capturedAt: string;
}

export interface Incident {
  id: number;
  code: string;
  categoryId: number;
  category: {
    id: number;
    name: string;
  } | null;
  title: string;
  description: string;
  status: IncidentStatus;
  createdAt: string;
  updatedAt: string;
  /** true si está REPORTADO y nunca fue editado (permite editar una sola vez). */
  canEdit?: boolean;
  /** true si está REPORTADO (permite eliminar). */
  canDelete?: boolean;
  location?: IncidentLocation | null;
  evidence?: Evidence[];
}