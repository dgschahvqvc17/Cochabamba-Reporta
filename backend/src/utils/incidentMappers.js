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

/**
 * Ciudadano que realizó el reporte (HU09). Campos mínimos necesarios
 * para que el encargado de recepción identifique al reportante.
 */
const toPublicReporter = (citizen) =>
  citizen
    ? {
        id: citizen.id,
        firstName: citizen.first_name,
        lastName: citizen.last_name,
        identityNumber: citizen.identity_number,
        phone: citizen.phone,
        email: citizen.email,
      }
    : null;

/**
 * Un reporte es editable si está REPORTADO y nunca fue editado
 * (updated_at === created_at: la única edición permitida es del ciudadano).
 */
const isEditable = (incident) =>
  Boolean(
    incident &&
      incident.status === EDITABLE_STATUS &&
      String(incident.updated_at) === String(incident.created_at),
  );

const toPublicIncident = (incident) => ({
  id: incident.id,
  code: incident.code,
  userId: incident.user_id,
  categoryId: incident.category_id,
  title: incident.title,
  description: incident.description,
  status: incident.status,
  createdAt: incident.created_at,
  updatedAt: incident.updated_at,
  canEdit: isEditable(incident),
  canDelete: incident.status === EDITABLE_STATUS,
  reporter: toPublicReporter(incident.citizen),
});

const toPublicIncidentListItem = (incident) => ({
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
  canEdit: isEditable(incident),
  canDelete: incident.status === EDITABLE_STATUS,
  reporter: toPublicReporter(incident.citizen),
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
  isEditable,
  toPublicIncident,
  toPublicIncidentListItem,
  toPublicEvidence,
  toPublicVerifier,
  toPublicAssignment,
  toPublicHistoryEntry,
};