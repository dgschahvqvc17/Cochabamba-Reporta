/**
 * Servicio de verificación de incidentes (MVC - Service).
 *
 * HU11 — Verificar incidente (personal de verificación):
 *   - listAssignedForVerification: cola del verificador asignado.
 *   - verifyIncident: decisión VERIFICADO/RECHAZADO.
 *   - La evidencia constatada en campo la adjunta evidence.service.
 *
 * @format
 */

'use strict';

const incidentRepository = require('../repositories/incident.repository');
const assignmentRepository = require('../repositories/assignment.repository');
const notificationRepository = require('../repositories/notification.repository');
const ROLES = require('../utils/roles');
const { buildError } = require('../utils/errors');
const { normalizeText } = require('../utils/text');
const {
  DEFAULT_LIST_PAGE_SIZE,
  MAX_LIST_PAGE_SIZE,
  MAX_OBSERVATIONS_LENGTH,
  MAX_REJECTED_REASON_LENGTH,
} = require('../utils/incidentRules');
const { INCIDENT_STATUS } = require('../utils/incidentStatus');
const {
  toPublicIncident,
  toPublicAssignment,
  toPublicIncidentListItem,
} = require('../utils/incidentMappers');
const { parsePositiveInt, buildPaginationResponse } = require('../utils/pagination');
const assignmentService = require('./assignment.service');
const statusService = require('./status.service');

const verificationService = {
  /**
   * HU11 — Incidentes asignados al verificador para su verificación
   * (asignación VERIFICACION activa; en la práctica EN_VERIFICACION).
   * Solo el personal de verificación y el administrador.
   */
  async listAssignedForVerification(user, query = {}) {
    const userId = user && user.id;

    if (!userId) {
      throw buildError(
        'Debe iniciar sesión para consultar los incidentes asignados.',
        401,
        'AUTHENTICATION_REQUIRED',
      );
    }

    if (![ROLES.VERIFICADOR, ROLES.ADMINISTRADOR].includes(user.role)) {
      throw buildError(
        'No tienes permisos para consultar la cola de verificación.',
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

    const { incidents, total } =
      await incidentRepository.findAssignedForVerification({
        userId,
        page,
        limit,
        search,
      });

    return {
      incidents: incidents.map(toPublicIncidentListItem),
      ...buildPaginationResponse({ total, page, limit }),
    };
  },

  /**
   * HU11 — Verificar un incidente (decisión del personal de verificación).
   * - Solo el verificador asignado o un administrador.
   * - Solo desde EN_VERIFICACION y mientras la asignación siga activa.
   * - verified=true  → VERIFICADO.
   * - verified=false → RECHAZADO (rejectedReason obligatorio).
   * Completa la asignación, registra el historial (con observaciones como
   * comentario) y notifica al ciudadano el resultado.
   */
  async verifyIncident(user, incidentId, payload) {
    const userId = user && user.id;

    if (!userId) {
      throw buildError(
        'Debe iniciar sesión para verificar un incidente.',
        401,
        'AUTHENTICATION_REQUIRED',
      );
    }

    if (![ROLES.VERIFICADOR, ROLES.ADMINISTRADOR].includes(user.role)) {
      throw buildError(
        'No tienes permisos para verificar incidentes.',
        403,
        'FORBIDDEN',
      );
    }

    const incident = await incidentRepository.findById(incidentId);

    if (!incident) {
      throw buildError('El incidente no existe.', 404, 'INCIDENT_NOT_FOUND');
    }

    if (incident.status !== INCIDENT_STATUS.EN_VERIFICACION) {
      throw buildError(
        'El incidente no está en verificación.',
        409,
        'INVALID_TRANSITION',
      );
    }

    if (!(await assignmentService.isVerificationAssignee(user, incident.id))) {
      throw buildError(
        'Este incidente no está asignado a ti para verificación.',
        403,
        'FORBIDDEN',
        'incident',
      );
    }

    const rawVerified = payload && payload.verified;
    const verified = rawVerified === true || rawVerified === 'true';
    const observations = payload && payload.observations
      ? normalizeText(payload.observations)
      : '';
    const rejectedReason = payload && payload.rejectedReason
      ? normalizeText(payload.rejectedReason)
      : '';

    if (!verified && !rejectedReason) {
      throw buildError(
        'Debe indicar el motivo por el que rechaza el incidente.',
        422,
        'VALIDATION_ERROR',
        'rejectedReason',
      );
    }

    if (observations.length > MAX_OBSERVATIONS_LENGTH) {
      throw buildError(
        `Las observaciones no deben superar los ${MAX_OBSERVATIONS_LENGTH} caracteres.`,
        422,
        'VALIDATION_ERROR',
        'observations',
      );
    }

    if (rejectedReason.length > MAX_REJECTED_REASON_LENGTH) {
      throw buildError(
        `El motivo de rechazo no debe superar los ${MAX_REJECTED_REASON_LENGTH} caracteres.`,
        422,
        'VALIDATION_ERROR',
        'rejectedReason',
      );
    }

    const toStatus = verified
      ? INCIDENT_STATUS.VERIFICADO
      : INCIDENT_STATUS.RECHAZADO;

    const extraFields = verified
      ? {}
      : { rejected_reason: rejectedReason || null };

    const comment = verified
      ? observations || 'Reporte verificado.'
      : rejectedReason || 'Reporte rechazado.';

    const assignment = await assignmentRepository.findActiveByIncident(
      incident.id,
      'VERIFICACION',
    );

    const updated = await statusService.applyStatusChange(
      incident,
      toStatus,
      user.id,
      comment,
      extraFields,
    );

    if (assignment) {
      await assignmentRepository.complete(assignment.id);
    }

    if (!verified) {
      await notificationRepository.create({
        incidentId: incident.id,
        userId: incident.user_id,
        message: `Su reporte ${incident.code} fue rechazado${
          rejectedReason ? `: ${rejectedReason}` : '.'
        }`,
      });
    }

    return {
      incident: {
        ...toPublicIncident(updated),
        observations: observations || null,
        rejectedReason: updated.rejected_reason || null,
      },
      assignment: assignment ? toPublicAssignment(assignment) : null,
    };
  },
};

module.exports = verificationService;