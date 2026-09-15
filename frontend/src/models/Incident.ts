/**
 * Modelo de Incidente (MVC - Model).
 *
 * HU06 — Registro de incidentes por parte del ciudadano.
 * HU07 — Adjuntar evidencia fotográfica.
 *
 * Define la estructura del incidente en el frontend, incluyendo:
 *   - El tipo `IncidentStatus` con todos los estados del ciclo de vida
 *     (coincide con el enum `incident_status` de Supabase).
 *   - La interfaz `Incident` (respuesta del backend, formato público),
 *     que ahora incluye las evidencias fotográficas (`evidence`).
 *   - La interfaz `IncidentPayload` (lo que envía el ciudadano al crear:
 *     categoryId obligatorio, título y descripción con longitudes).
 *   - Interface de respuesta de creación (`IncidentCreateResponse`).
 *   - La interfaz `Evidence` (HU07): referencia de una imagen adjunta.
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
  evidence?: Evidence[];
}