/**
 * Modelo de Incidente (MVC - Model).
 *
 * HU06 — Registro de incidentes por parte del ciudadano.
 * HU07 — Adjuntar evidencia fotográfica.
 * HU08 — Registrar ubicación del incidente.
 * HU09 — Consultar y gestionar incidentes (personal municipal): agrega el
 *   tipo `IncidentReporter` (ciudadano que reportó), el campo opcional
 *   `reporter` y la interfaz `IncidentListData` (paginación del listado).
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

/**
 * Ciudadano que reportó el incidente (HU09). Solo viaja en las respuestas
 * destinadas al personal municipal (Encargado de recepción).
 */
export interface IncidentReporter {
  id: number;
  firstName: string;
  lastName: string;
  identityNumber: string | null;
  phone: string | null;
  email: string | null;
}

/** Respuesta paginada del listado de incidentes para el personal (HU09). */
export interface IncidentListData {
  incidents: Incident[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

/**
 * Funcionario municipal de verificación disponible para asignar
 * un incidente (HU10).
 */
export interface VerifierUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

/** Payload para asignar un incidente para verificación (HU10). */
export interface AssignVerificationPayload {
  assignedToId: number;
  note?: string;
}

/**
 * Personal de solución disponible para asignar (HU12). Misma forma que
 * `VerifierUser`, por lo que se reutiliza su estructura (DRY).
 */
export type SolutionUser = VerifierUser;

/** Payload para asignar un incidente verificado para solución (HU12). */
export interface AssignSolutionPayload {
  assignedToId: number;
  note?: string;
}

/**
 * Asignación de un incidente a un funcionario (HU10). `assignmentType`
 * puede ser 'VERIFICACION' (HU10) o 'SOLUCION' (HU12).
 */
export interface IncidentAssignment {
  id: number;
  incidentId: number;
  assignmentType: 'VERIFICACION' | 'SOLUCION';
  assignedBy: number;
  assignedTo: number;
  note: string | null;
  active: boolean;
  createdAt: string;
  completedAt: string | null;
}

/**
 * Entrada del historial de cambios de estado de un incidente
 * (transiciones validadas, con usuario responsable y fecha/hora).
 */
export interface IncidentHistoryEntry {
  id: number;
  incidentId: number;
  fromStatus: IncidentStatus | null;
  toStatus: IncidentStatus;
  changedBy: {
    id: number;
    firstName: string;
    lastName: string;
  } | null;
  comment: string | null;
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
  /** true si está REPORTADO y nunca fue editado (permite editar una sola vez). */
  canEdit?: boolean;
  /** true si está REPORTADO (permite eliminar). */
  canDelete?: boolean;
  /** Ciudadano que reportó (solo disponible para el personal municipal, HU09). */
  reporter?: IncidentReporter | null;
  location?: IncidentLocation | null;
  evidence?: Evidence[];
  /** Motivo del rechazo (HU11, estado RECHAZADO). */
  rejectedReason?: string | null;
}

/** Payload para registrar la decisión de verificación (HU11). */
export interface VerifyIncidentPayload {
  verified: boolean;
  observations?: string;
  rejectedReason?: string;
}

/** Respuesta de la verificación: incidente actualizado + asignación completada. */
export interface VerifyIncidentResult {
  incident: Incident & {
    observations?: string | null;
    rejectedReason?: string | null;
  };
  assignment: IncidentAssignment;
}

/**
 * Payload de una acción del personal de solución (HU13): acciones
 * realizadas obligatorias al iniciar la atención; observaciones opcionales.
 */
export interface AttendIncidentPayload {
  actions?: string;
  observations?: string;
}

/**
 * Respuesta de una acción de solución (HU13): incidente actualizado con
 * las acciones/observaciones registradas y la asignación (solo al cerrar).
 */
export interface AttendIncidentResult {
  incident: Incident & {
    actions?: string | null;
    observations?: string | null;
  };
  assignment?: IncidentAssignment | null;
}