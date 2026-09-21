/**
 * Controlador de incidentes (MVC - Controller).
 *
 * HU06 — Registro de incidentes por parte del ciudadano.
 * HU07 — Adjuntar evidencia fotográfica.
 * HU08 — Registrar ubicación del incidente.
 * HU09 — Consultar y gestionar incidentes (personal municipal).
 * Traduce el resultado de la API (incidentService) en un `ActionResult`
 * con `fieldErrors` tipados por campo, igual que categoryController.
 * No contiene lógica de negocio ni llamadas directas a fetch.
 *
 * @format
 */

import {
  assignVerification as assignVerificationRequest,
  attachEvidence as attachEvidenceRequest,
  attachLocation as attachLocationRequest,
  createIncident as createIncidentRequest,
  deleteIncident as deleteIncidentRequest,
  getAssignedVerificationIncidents as getAssignedVerificationIncidentsRequest,
  getIncidentById as getIncidentByIdRequest,
  getIncidents as getIncidentsRequest,
  getMyIncidents as getMyIncidentsRequest,
  getPendingVerificationIncidents as getPendingVerificationIncidentsRequest,
  getVerifiers as getVerifiersRequest,
  updateIncident as updateIncidentRequest,
  verifyIncident as verifyIncidentRequest,
  type IncidentListParams,
} from '../services/incidentService';
import type {
  AssignVerificationPayload,
  Evidence,
  Incident,
  IncidentAssignment,
  IncidentListData,
  IncidentLocation,
  IncidentPayload,
  LocationPayload,
  VerifierUser,
  VerifyIncidentPayload,
  VerifyIncidentResult,
} from '../models/Incident';
import { getAccessToken } from '../utils/session';
import { pickEvidence as pickEvidenceRequest, type PickerSource } from '../utils/imagePicker';
import {
  validateEvidence,
  toUploadImage,
  type PickedEvidence,
} from '../utils/evidence';
import {
  getCurrentPosition as getCurrentPositionRequest,
  type LocationResult,
} from '../utils/location';

export type FieldErrors = Record<string, string>;

export interface ActionResult<T> {
  success: boolean;
  message: string;
  data?: T;
  fieldErrors?: FieldErrors;
  code?: string;
}

export interface EvidenceActionResult extends ActionResult<Evidence> {}

const toFieldErrors = (
  details?: { field: string; message: string }[],
): FieldErrors | undefined => {
  if (!details || details.length === 0) return undefined;

  const fieldErrors: FieldErrors = {};
  details.forEach((detail) => {
    fieldErrors[detail.field] = detail.message;
  });

  return fieldErrors;
};

export async function registerIncident(
  payload: IncidentPayload,
): Promise<ActionResult<Incident>> {
  const accessToken = getAccessToken();
  const result = await createIncidentRequest(accessToken, payload);

  if (!result.success) {
    return {
      success: false,
      message: result.message,
      ...(toFieldErrors(result.error?.details) && {
        fieldErrors: toFieldErrors(result.error?.details),
      }),
    };
  }

  return {
    success: true,
    message: result.message,
    data: result.data?.incident,
  };
}

/** Lista los reportes del ciudadano autenticado (Mis reportes). */
export async function loadMyIncidents(
  status?: string,
): Promise<ActionResult<Incident[]>> {
  const accessToken = getAccessToken();
  const result = await getMyIncidentsRequest(accessToken, status);

  if (!result.success) {
    return {
      success: false,
      message: result.message,
    };
  }

  return {
    success: true,
    message: result.message,
    data: result.data?.incidents,
  };
}

/** Detalle de un incidente (evidencia + ubicación) para ver seguimiento. */
export async function loadIncidentById(
  incidentId: number,
): Promise<ActionResult<Incident>> {
  const accessToken = getAccessToken();
  const result = await getIncidentByIdRequest(accessToken, incidentId);

  if (!result.success) {
    return {
      success: false,
      message: result.message,
    };
  }

  return {
    success: true,
    message: result.message,
    data: result.data?.incident,
  };
}

/** HU09: listado paginado de incidentes para el personal municipal. */
export async function loadManagedIncidents(
  params: IncidentListParams = {},
): Promise<ActionResult<IncidentListData>> {
  const accessToken = getAccessToken();
  const result = await getIncidentsRequest(accessToken, params);

  if (!result.success) {
    return {
      success: false,
      message: result.message,
    };
  }

  return {
    success: true,
    message: result.message,
    data: result.data,
  };
}

/** HU10: lista los funcionarios de verificación disponibles. */
export async function loadVerifiers(): Promise<ActionResult<VerifierUser[]>> {
  const accessToken = getAccessToken();
  const result = await getVerifiersRequest(accessToken);

  if (!result.success) {
    return {
      success: false,
      message: result.message,
    };
  }

  return {
    success: true,
    message: result.message,
    data: result.data?.verifiers,
  };
}

/** HU10: lista los incidentes pendientes de verificación (paginado). */
export async function loadPendingVerification(params: {
  page?: number;
  limit?: number;
  search?: string;
} = {}): Promise<ActionResult<IncidentListData>> {
  const accessToken = getAccessToken();
  const result = await getPendingVerificationIncidentsRequest(
    accessToken,
    params,
  );

  if (!result.success) {
    return {
      success: false,
      message: result.message,
    };
  }

  return {
    success: true,
    message: result.message,
    data: result.data,
  };
}

/** HU10: asigna un incidente a un funcionario de verificación. */
export async function assignIncidentForVerification(
  incidentId: number,
  payload: AssignVerificationPayload,
): Promise<ActionResult<{ assignment: IncidentAssignment; incident: Incident }>> {
  const accessToken = getAccessToken();
  const result = await assignVerificationRequest(accessToken, incidentId, payload);

  if (!result.success) {
    return {
      success: false,
      message: result.message,
      code: result.error?.code,
      ...(toFieldErrors(result.error?.details) && {
        fieldErrors: toFieldErrors(result.error?.details),
      }),
    };
  }

  return {
    success: true,
    message: result.message,
    data: result.data,
  };
}

/** HU11: lista los incidentes asignados al verificador (paginado). */
export async function loadAssignedVerification(params: {
  page?: number;
  limit?: number;
  search?: string;
} = {}): Promise<ActionResult<IncidentListData>> {
  const accessToken = getAccessToken();
  const result = await getAssignedVerificationIncidentsRequest(
    accessToken,
    params,
  );

  if (!result.success) {
    return {
      success: false,
      message: result.message,
    };
  }

  return {
    success: true,
    message: result.message,
    data: result.data,
  };
}

/** HU11: envía la decisión de verificación del incidente asignado. */
export async function verifyIncidentById(
  incidentId: number,
  payload: VerifyIncidentPayload,
): Promise<ActionResult<VerifyIncidentResult>> {
  const accessToken = getAccessToken();
  const result = await verifyIncidentRequest(accessToken, incidentId, payload);

  if (!result.success) {
    return {
      success: false,
      message: result.message,
      code: result.error?.code,
      ...(toFieldErrors(result.error?.details) && {
        fieldErrors: toFieldErrors(result.error?.details),
      }),
    };
  }

  return {
    success: true,
    message: result.message,
    data: result.data,
  };
}

/** HU07: abre la cámara o la galería y devuelve la imagen ya normalizada. */
export async function pickEvidence(
  source: PickerSource,
): Promise<{ ok: boolean; evidence?: PickedEvidence; cancelled?: boolean; message?: string }> {
  const result = await pickEvidenceRequest(source);

  if (result.cancelled) {
    return { ok: false, cancelled: true };
  }

  if (!result.ok || !result.evidence) {
    return {
      ok: false,
      message: result.message ?? 'No se pudo obtener la imagen.',
    };
  }

  const validation = validateEvidence(result.evidence);
  if (!validation.ok) {
    return { ok: false, message: validation.message };
  }

  return { ok: true, evidence: result.evidence };
}

/** HU07: sube una imagen ya seleccionada al incidente recién creado. */
export async function attachEvidenceToIncident(
  incidentId: number,
  evidence: PickedEvidence,
): Promise<EvidenceActionResult> {
  const accessToken = getAccessToken();
  const upload = toUploadImage(evidence);

  const result = await attachEvidenceRequest(
    accessToken,
    incidentId,
    upload.object,
    upload.name,
  );

  if (!result.success) {
    return {
      success: false,
      message: result.message,
      ...(toFieldErrors(result.error?.details) && {
        fieldErrors: toFieldErrors(result.error?.details),
      }),
    };
  }

  return {
    success: true,
    message: result.message,
    data: result.data?.evidence,
  };
}

/** HU08: pide permiso y obtiene la ubicación actual del dispositivo. */
export async function captureCurrentLocation(): Promise<LocationResult> {
  return getCurrentPositionRequest();
}

/** HU08: envía la ubicación ya capturada y confirmada al incidente. */
export async function attachLocationToIncident(
  incidentId: number,
  payload: LocationPayload,
): Promise<ActionResult<IncidentLocation>> {
  const accessToken = getAccessToken();
  const result = await attachLocationRequest(accessToken, incidentId, payload);

  if (!result.success) {
    return {
      success: false,
      message: result.message,
      ...(toFieldErrors(result.error?.details) && {
        fieldErrors: toFieldErrors(result.error?.details),
      }),
    };
  }

  return {
    success: true,
    message: result.message,
    data: result.data?.location,
  };
}

/** Edita un reporte propio en estado REPORTADO (una sola edición permitida). */
export async function editIncident(
  incidentId: number,
  payload: IncidentPayload,
): Promise<ActionResult<Incident>> {
  const accessToken = getAccessToken();
  const result = await updateIncidentRequest(accessToken, incidentId, payload);

  if (!result.success) {
    return {
      success: false,
      message: result.message,
      ...(toFieldErrors(result.error?.details) && {
        fieldErrors: toFieldErrors(result.error?.details),
      }),
    };
  }

  return {
    success: true,
    message: result.message,
    data: result.data?.incident,
  };
}

/** Elimina un reporte propio en estado REPORTADO. */
export async function deleteIncidentById(
  incidentId: number,
): Promise<ActionResult<{ id: number; code: string }>> {
  const accessToken = getAccessToken();
  const result = await deleteIncidentRequest(accessToken, incidentId);

  if (!result.success) {
    return {
      success: false,
      message: result.message,
    };
  }

  return {
    success: true,
    message: result.message,
    data: result.data,
  };
}
