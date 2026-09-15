/**
 * Controlador de incidentes (MVC - Controller).
 *
 * HU06 — Registro de incidentes por parte del ciudadano.
 * HU07 — Adjuntar evidencia fotográfica.
 * Traduce el resultado de la API (incidentService) en un `ActionResult`
 * con `fieldErrors` tipados por campo, igual que categoryController.
 * No contiene lógica de negocio ni llamadas directas a fetch.
 *
 * @format
 */

import {
  attachEvidence as attachEvidenceRequest,
  createIncident as createIncidentRequest,
} from '../services/incidentService';
import type { Evidence, Incident, IncidentPayload } from '../models/Incident';
import { getAccessToken } from '../utils/session';
import { pickEvidence as pickEvidenceRequest, type PickerSource } from '../utils/imagePicker';
import {
  validateEvidence,
  toUploadImage,
  type PickedEvidence,
} from '../utils/evidence';

export type FieldErrors = Record<string, string>;

export interface ActionResult<T> {
  success: boolean;
  message: string;
  data?: T;
  fieldErrors?: FieldErrors;
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
