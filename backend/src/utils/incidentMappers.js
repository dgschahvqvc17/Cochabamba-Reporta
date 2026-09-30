/**
 * Mapeos públicos del módulo de incidentes (MVC - utils).
 *
 * Convierten los registros de Supabase en los objetos que se devuelven
 * al frontend. Es la única fuente de verdad para no repetir los mapeos
 * entre los services de incidentes (principio DRY).
 *
 * @format
 */

'use strict';

const { EDITABLE_STATUS } = require('./incidentRules');
const { INCIDENT_STATUS } = require('./incidentStatus');
const ROLES = require('./roles');

/**
 * Estado de reapertura de un incidente (derivado del historial):
 * `reopened` = el ciudadano ya lo reabrió alguna vez; `editedAfterReopen` =
 * ya usó la edición única que abre esa reapertura.
 */
const NO_REOPEN = { reopened: false, editedAfterReopen: false };

const normalizeReopenState = (reopenState) => ({
  reopened: Boolean(reopenState?.reopened),
  editedAfterReopen: Boolean(reopenState?.editedAfterReopen),
});

/**
 * El documento de identidad del reportante es un dato sensible: el
 * personal municipal solo necesita saber con quién trata, no su carnet.
 * Solo se devuelve al propio ciudadano (en su reporte) y al
 * administrador, que administra las cuentas. Para el resto, la respuesta
 * ni siquiera incluye el campo.
 */
const canViewReporterIdentity = (incident, viewer) => {
  if (!incident || !viewer) {
    return false;
  }

  if (viewer.role === ROLES.ADMINISTRADOR) {
    return true;
  }

  return (
    viewer.role === ROLES.CIUDADANO &&
    Number(incident.user_id) === Number(viewer.id)
  );
};

/**
 * Ciudadano que realizó el reporte (HU09). Campos mínimos necesarios
 * para que el encargado de recepción identifique al reportante.
 */
const toPublicReporter = (citizen, includeIdentityNumber = false) => {
  if (!citizen) {
    return null;
  }

  const reporter = {
    id: citizen.id,
    firstName: citizen.first_name,
    lastName: citizen.last_name,
    phone: citizen.phone,
    email: citizen.email,
  };

  if (includeIdentityNumber) {
    reporter.identityNumber = citizen.identity_number;
  }

  return reporter;
};

/**
 * Un reporte es editable si está REPORTADO y conserva una oportunidad de
 * edición: la edición única original (updated_at === created_at) o la
 * edición única que abre la reapertura del reporte rechazado.
 */
const isEditable = (incident, reopenState) => {
  if (!incident || incident.status !== EDITABLE_STATUS) {
    return false;
  }

  if (String(incident.updated_at) === String(incident.created_at)) {
    return true;
  }

  const state = normalizeReopenState(reopenState);

  return state.reopened && !state.editedAfterReopen;
};

/** El ciudadano puede reabrir un reporte rechazado que nunca fue reabierto. */
const canReopenIncident = (incident, reopenState) =>
  Boolean(
    incident &&
      incident.status === INCIDENT_STATUS.RECHAZADO &&
      !normalizeReopenState(reopenState).reopened,
  );

/**
 * Opciones de mapeo de un incidente:
 *   - `reopenState`: estado de reapertura (ver NO_REOPEN).
 *   - `viewer`: usuario que consulta; decide si puede ver el carnet del
 *     reportante (ver canViewReporterIdentity).
 */
const toPublicIncident = (incident, { reopenState = null, viewer = null } = {}) => ({
  id: incident.id,
  code: incident.code,
  userId: incident.user_id,
  categoryId: incident.category_id,
  category: incident.category
    ? { id: incident.category.id, name: incident.category.name }
    : null,
  title: incident.title,
  description: incident.description,
  status: incident.status,
  createdAt: incident.created_at,
  updatedAt: incident.updated_at,
  responseDeadlineAt: incident.response_deadline_at ?? null,
  rejectedReason: incident.rejected_reason ?? null,
  canEdit: isEditable(incident, reopenState),
  canDelete: incident.status === EDITABLE_STATUS,
  canReopen: canReopenIncident(incident, reopenState),
  reporter: toPublicReporter(
    incident.citizen,
    canViewReporterIdentity(incident, viewer),
  ),
});

const toPublicIncidentListItem = (incident, { reopenState = null, viewer = null } = {}) => ({
  id: incident.id,
  code: incident.code,
  categoryId: incident.category_id,
  category: incident.category
    ? { id: incident.category.id, name: incident.category.name }
    : null,
  title: incident.title,
  description: incident.description,
  status: incident.status,
  createdAt: incident.created_at,
  updatedAt: incident.updated_at,
  responseDeadlineAt: incident.response_deadline_at ?? null,
  rejectedReason: incident.rejected_reason ?? null,
  canEdit: isEditable(incident, reopenState),
  canDelete: incident.status === EDITABLE_STATUS,
  canReopen: canReopenIncident(incident, reopenState),
  reporter: toPublicReporter(
    incident.citizen,
    canViewReporterIdentity(incident, viewer),
  ),
});

const toPublicEvidence = (evidence) => ({
  id: evidence.id,
  incidentId: evidence.incident_id,
  url: evidence.url,
  mimeType: evidence.mime_type,
  sizeBytes: evidence.size_bytes,
  createdAt: evidence.created_at,
});

const toPublicVerifier = (verifier) => ({
  id: verifier.id,
  firstName: verifier.first_name,
  lastName: verifier.last_name,
  email: verifier.email,
});

/**
 * HU12 — Personal de solución disponible para asignar (misma forma que
 * toPublicVerifier; fuente única compartida).
 */
const toPublicSolutionStaff = (staff) => toPublicVerifier(staff);

/**
 * Incidente en verificación (EN_VERIFICACION) con su verificador asignado
 * actualmente, para que la recepción pueda reasignarlo. Reutiliza la forma
 * del ítem de lista y agrega `verifier`.
 */
const toPublicVerificationListItem = (incident, verifier, options = {}) => ({
  ...toPublicIncidentListItem(incident, options),
  verifier: verifier || null,
});

const toPublicAssignment = (assignment) => ({
  id: assignment.id,
  incidentId: assignment.incident_id,
  assignmentType: assignment.assignment_type,
  assignedBy: assignment.assigned_by,
  assignedTo: assignment.assigned_to,
  note: assignment.note,
  active: assignment.active,
  createdAt: assignment.created_at,
  completedAt: assignment.completed_at,
});

const toPublicHistoryEntry = (entry) => ({
  id: entry.id,
  incidentId: entry.incident_id,
  fromStatus: entry.from_status,
  toStatus: entry.to_status,
  changedBy: entry.changed_by
    ? {
        id: entry.changed_by.id,
        firstName: entry.changed_by.first_name,
        lastName: entry.changed_by.last_name,
      }
    : null,
  comment: entry.comment,
  createdAt: entry.created_at,
});

module.exports = {
  toPublicReporter,
  canViewReporterIdentity,
  isEditable,
  canReopenIncident,
  NO_REOPEN,
  toPublicIncident,
  toPublicIncidentListItem,
  toPublicEvidence,
  toPublicVerifier,
  toPublicSolutionStaff,
  toPublicVerificationListItem,
  toPublicAssignment,
  toPublicHistoryEntry,
};