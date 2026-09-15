/**
 * Controlador de incidentes (MVC - Controller).
 *
 * HU06 — Registro de incidentes por parte del ciudadano.
 * Traduce el resultado de la API (incidentService) en un `ActionResult`
 * con `fieldErrors` tipados por campo, igual que categoryController.
 * No contiene lógica de negocio ni llamadas directas a fetch.
 *
 * @format
 */

import { createIncident as createIncidentRequest } from '../services/incidentService';
import type { Incident, IncidentPayload } from '../models/Incident';
import { getAccessToken } from '../utils/session';

export type FieldErrors = Record<string, string>;

export interface ActionResult<T> {
  success: boolean;
  message: string;
  data?: T;
  fieldErrors?: FieldErrors;
}

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
