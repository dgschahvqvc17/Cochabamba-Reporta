/**
 * Servicio de ciclo de vida del incidente (MVC - Service).
 *
 * Núcleo de toda transición de estado (reglas de Backend.md):
 * 1. Aplica el nuevo estado al incidente.
 * 2. Registra el cambio en el historial (estado anterior/nuevo,
 *    usuario responsable, fecha y hora).
 * 3. Genera una notificación informando al ciudadano.
 *
 * También gestiona la transición genérica por rol (PATCH /:id/status)
 * y el historial completo del incidente (trazabilidad).
 * Las validaciones de transición específicas de cada historia las hace
 * el service que la dispara (asignación, verificación, etc.).
 *
 * @format
 */

'use strict';

const incidentRepository = require('../repositories/incident.repository');
const historyRepository = require('../repositories/history.repository');
const notificationRepository = require('../repositories/notification.repository');
const evidenceRepository = require('../repositories/evidence.repository');
const { buildError } = require('../utils/errors');
const { normalizeText } = require('../utils/text');
const ROLES = require('../utils/roles');
const {
  INCIDENT_STATUS,
  INCIDENT_STATUS_LABELS,
  ROLE_STATUS_TRANSITIONS,
} = require('../utils/incidentStatus');
const {
  toPublicIncident,
  toPublicHistoryEntry,
} = require('../utils/incidentMappers');

const statusService = {
  /**
   * Aplica un cambio de estado, registra el historial y notifica al
   * ciudadano. `extraFields` permite persistir campos extra del nuevo
   * estado (por ejemplo rejected_reason en HU11).
   */
  async applyStatusChange(
    incident,
    toStatus,
    changedBy,
    comment = null,
    extraFields = {},
  ) {
    // Un reporte no puede salir de REPORTADO (comenzar el proceso de
    // atención) sin al menos una evidencia fotográfica.
    if (
      incident.status === INCIDENT_STATUS.REPORTADO &&
      (await evidenceRepository.countByIncident(incident.id)) < 1
    ) {
      throw buildError(
        'El reporte debe incluir al menos una evidencia fotográfica.',
        422,
        'EVIDENCE_REQUIRED',
        'evidence',
      );
    }

    const updated = await incidentRepository.updateStatus(
      incident.id,
      toStatus,
      extraFields,
    );

    const normalizedComment = normalizeText(comment) || null;

    await historyRepository.create({
      incidentId: incident.id,
      fromStatus: incident.status,
      toStatus,
      changedBy,
      comment: normalizedComment,
    });

    await notificationRepository.create({
      incidentId: incident.id,
      userId: incident.user_id,
      message: `Su reporte ${incident.code} cambió de estado a ${
        INCIDENT_STATUS_LABELS[toStatus] ?? toStatus
      }.`,
    });

    return updated;
  },

  /**
   * Transición genérica de estado (PATCH /incidents/:id/status).
   * Solo permite las transiciones definidas para el rol del usuario;
   * el resto de las historias usan sus endpoints específicos.
   */
  async changeIncidentStatus(user, incidentId, payload) {
    const allowedFrom = ROLE_STATUS_TRANSITIONS[user.role];

    if (!allowedFrom) {
      throw buildError(
        'No tienes permisos para cambiar el estado.',
        403,
        'FORBIDDEN',
      );
    }

    const incident = await incidentRepository.findById(incidentId);

    if (!incident) {
      throw buildError('El incidente no existe.', 404, 'INCIDENT_NOT_FOUND');
    }

    const toStatus = payload && payload.status;
    const comment =
      payload && payload.comment ? normalizeText(payload.comment) : '';

    if (toStatus === incident.status) {
      throw buildError(
        'El incidente ya se encuentra en ese estado.',
        409,
        'INVALID_TRANSITION',
      );
    }

    const nextStatuses = allowedFrom[incident.status];

    if (!nextStatuses || !nextStatuses.includes(toStatus)) {
      throw buildError(
        `La transición de ${incident.status} a ${toStatus} no está permitida.`,
        409,
        'INVALID_TRANSITION',
      );
    }

    const updated = await this.applyStatusChange(
      incident,
      toStatus,
      user.id,
      comment || null,
    );

    return toPublicIncident(updated);
  },

  /**
   * Historial completo de cambios de estado de un incidente.
   * Muestra la trazabilidad registrada por cada transición (HU10+).
   * HU14 — Un ciudadano solo puede consultar el seguimiento de sus
   * propios reportes (quién realizó cada cambio cuando corresponda).
   */
  async getIncidentHistory(user, incidentId) {
    const incident = await incidentRepository.findById(incidentId);

    if (!incident) {
      throw buildError('El incidente no existe.', 404, 'INCIDENT_NOT_FOUND');
    }

    if (user && user.role === ROLES.CIUDADANO) {
      if (Number(incident.user_id) !== Number(user.id)) {
        throw buildError(
          'Solo puedes consultar el seguimiento de tus propios reportes.',
          403,
          'FORBIDDEN',
        );
      }
    }

    const history = await historyRepository.findByIncident(incident.id);

    return { history: history.map(toPublicHistoryEntry) };
  },
};

module.exports = statusService;