/**
 * Modelo de Incidente (MVC - Model).
 *
 * HU06 — Registro de incidentes por parte del ciudadano.
 *
 * Define la estructura del incidente en el frontend, incluyendo:
 *   - El tipo `IncidentStatus` con todos los estados del ciclo de vida
 *     (coincide con el enum `incident_status` de Supabase).
 *   - La interfaz `Incident` (respuesta del backend, formato público).
 *   - La interfaz `IncidentPayload` (lo que envía el ciudadano al crear:
 *     categoryId obligatorio, título y descripción con longitudes).
 *   - Interface de respuesta de creación (`IncidentCreateResponse`).
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
}
