/**
 * Servicio de asignación a verificación (MVC - Service).
 *
 * HU10 — Asignar incidente para verificación (encargado de recepción):
 *   - Lista los funcionarios de verificación disponibles.
 *   - Lista los incidentes pendientes de verificación.
 *   - Asigna el incidente a un verificador, cambia el estado a
 *     EN_VERIFICACION y registra asignación, historial y
 *     notificaciones (funcionario + ciudadano).
 * También expone `isVerificationAssignee` (HU11) para saber si el
 * usuario es el verificador asignado activo de un incidente.
 *
 * @format
 */

'use strict';

const incidentRepository = require('../repositories/incident.repository');
const assignmentRepository = require('../repositories/assignment.repository');
const notificationRepository = require('../repositories/notification.repository');
const userRepository = require('../repositories/user.repository');
const ROLES = require('../utils/roles');
const { buildError } = require('../utils/errors');
const { normalizeText } = require('../utils/text');
const {
  DEFAULT_LIST_PAGE_SIZE,
  MAX_LIST_PAGE_SIZE,
} = require('../utils/incidentRules');
const {
  INCIDENT_STATUS,
  ASSIGNABLE_TO_VERIFICATION,
  PENDING_VERIFICATION_STATUSES,
} = require('../utils/incidentStatus');
const {
  toPublicIncident,
  toPublicVerifier,
  toPublicAssignment,
  toPublicIncidentListItem,
} = require('../utils/incidentMappers');
const { parsePositiveInt, buildPaginationResponse } = require('../utils/pagination');
const statusService = require('./status.service');

const assignmentService = {
  /**
   * Roles que pueden asignar incidentes a verificación (HU10) y
   * consultar los pendientes de verificación y los funcionarios.
   */
  isRecepcionStaff(user) {
    return Boolean(
      user &&
        [ROLES.RECEPCION, ROLES.ADMINISTRADOR].includes(user.role),
    );
  },

  /**
   * HU10 — Funcionarios de verificación disponibles para asignar.
   */
  async listVerifiers(user) {
    if (!this.isRecepcionStaff(user)) {
      throw buildError(
        'No tienes permisos para consultar los funcionarios.',
        403,
        'FORBIDDEN',
      );
    }

    const verifiers = await userRepository.findVerifiers();

    return { verifiers: verifiers.map(toPublicVerifier) };
  },

  /**
   * HU10 — Incidentes pendientes de verificación (REPORTADO/RECIBIDO).
   */
  async listPendingVerification(user, query = {}) {
    if (!this.isRecepcionStaff(user)) {
      throw buildError(
        'No tienes permisos para consultar los incidentes pendientes.',
        403,
        'FORBIDDEN',
      );
    }

    const page = parsePositiveInt(query.page, 1, Number.MAX_SAFE_INTEGER);
    const limit = parsePositiveInt(
      query.limit,
      DEFAULT_LIST_PAGE_SIZE,
      MAX_LIST_PAGE_SIZE,
    );
    const search = query && query.search ? String(query.search).trim() : '';

    const { incidents, total } = await incidentRepository.findAllManaged({
      page,
      limit,
      statuses: PENDING_VERIFICATION_STATUSES,
      search,
    });

    return {
      incidents: incidents.map(toPublicIncidentListItem),
      ...buildPaginationResponse({ total, page, limit }),
    };
  },

  /**
   * HU11 — true si el usuario es el verificador asignado activo del
   * incidente (o un administrador, que puede verificar cualquier incidente).
   */
  async isVerificationAssignee(user, incidentId) {
    if (!user || !user.id) {
      return false;
    }

    if (user.role === ROLES.ADMINISTRADOR) {
      return true;
    }

    const assignment = await assignmentRepository.findActiveByIncident(
      incidentId,
      'VERIFICACION',
    );

    return Boolean(
      assignment && Number(assignment.assigned_to) === Number(user.id),
    );
  },

  /**
   * HU10 — Asignar un incidente a verificación (encargado de recepción).
   * Cambia el estado a EN_VERIFICACION, crea la asignación (con quién,
   * a quién, fecha/hora y nota), registra el historial y notifica al
   * funcionario asignado y al ciudadano.
   */
  async assignForVerification(user, incidentId, payload) {
    if (!this.isRecepcionStaff(user)) {
      throw buildError(
        'No tienes permisos para asignar incidentes.',
        403,
        'FORBIDDEN',
      );
    }

    const incident = await incidentRepository.findById(incidentId);

    if (!incident) {
      throw buildError('El incidente no existe.', 404, 'INCIDENT_NOT_FOUND');
    }

    if (!ASSIGNABLE_TO_VERIFICATION.includes(incident.status)) {
      throw buildError(
        'El incidente no está pendiente de verificación.',
        409,
        'INVALID_TRANSITION',
      );
    }

    const existingAssignment = await assignmentRepository.findActiveByIncident(
      incident.id,
      'VERIFICACION',
    );

    if (existingAssignment) {
      throw buildError(
        'El incidente ya está asignado para verificación.',
        409,
        'ALREADY_ASSIGNED',
      );
    }

    const assignedToId = Number(payload && payload.assignedToId);
    const verifier = await userRepository.findByIdWithRole(assignedToId);

    if (
      !verifier ||
      String(verifier.roles && verifier.roles.name) !== ROLES.VERIFICADOR ||
      !verifier.active
    ) {
      throw buildError(
        'El funcionario seleccionado no es un verificador activo.',
        422,
        'INVALID_ASSIGNEE',
        'assignedToId',
      );
    }

    const note = payload && payload.note ? normalizeText(payload.note) : '';

    const assignment = await assignmentRepository.create({
      incidentId: incident.id,
      type: 'VERIFICACION',
      assignedBy: user.id,
      assignedTo: assignedToId,
      note: note || null,
    });

    const updated = await statusService.applyStatusChange(
      incident,
      INCIDENT_STATUS.EN_VERIFICACION,
      user.id,
      note || 'Asignado para verificación.',
    );

    await notificationRepository.create({
      incidentId: incident.id,
      userId: assignedToId,
      message: `Se le asignó el incidente ${incident.code} para su verificación.`,
    });

    return {
      assignment: toPublicAssignment(assignment),
      incident: toPublicIncident(updated),
    };
  },
};

module.exports = assignmentService;