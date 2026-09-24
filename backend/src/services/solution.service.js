/**
 * Servicio de atención y cierre de incidentes (MVC - Service).
 *
 * HU13 — Atender y cerrar incidente (personal de solución):
 *   - listAssignedForSolution: cola del responsable asignado
 *     (ASIGNADO_PARA_SOLUCION / EN_ATENCION / ATENDIDO).
 *   - attendIncident: inicia la atención (EN_ATENCION) registrando las
 *     acciones realizadas.
 *   - markAttended: marca el incidente como atendido (ATENDIDO).
 *   - closeIncident: cierra la solicitud (CERRADO) y completa la
 *     asignación de solución.
 *   - La evidencia del trabajo realizado se adjunta por
 *     POST /:id/evidence (ver evidence.service, HU13).
 *
 * Cada transición valida que el responsable sea el asignado activo,
 * registra el historial y notifica al ciudadano (applyStatusChange).
 *
 * @format
 */

'use strict';

const incidentRepository = require('../repositories/incident.repository');
const assignmentRepository = require('../repositories/assignment.repository');
const ROLES = require('../utils/roles');
const { buildError } = require('../utils/errors');
const { normalizeText } = require('../utils/text');
const {
  DEFAULT_LIST_PAGE_SIZE,
  MAX_LIST_PAGE_SIZE,
  MAX_ACTIONS_LENGTH,
  MAX_OBSERVATIONS_LENGTH,
} = require('../utils/incidentRules');
const {
  INCIDENT_STATUS,
  SOLUTION_QUEUE_STATUSES,
} = require('../utils/incidentStatus');
const {
  toPublicIncident,
  toPublicAssignment,
  toPublicIncidentListItem,
} = require('../utils/incidentMappers');
const { parsePositiveInt, buildPaginationResponse } = require('../utils/pagination');
const assignmentService = require('./assignment.service');
const statusService = require('./status.service');

const solutionService = {
  /**
   * HU13 — Incidentes asignados activamente al responsable de solución
   * (asignación SOLUCION activa; ASIGNADO_PARA_SOLUCION/EN_ATENCION/
   * ATENDIDO). Solo el personal de solución y el administrador.
   */
  async listAssignedForSolution(user, query = {}) {
    const userId = user && user.id;

    if (!userId) {
      throw buildError(
        'Debe iniciar sesión para consultar los incidentes asignados.',
        401,
        'AUTHENTICATION_REQUIRED',
      );
    }

    if (![ROLES.PERSONAL_SOLUCION, ROLES.ADMINISTRADOR].includes(user.role)) {
      throw buildError(
        'No tienes permisos para consultar la cola de atención.',
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
    const status = query && query.status ? String(query.status).trim() : null;

    if (status && !SOLUTION_QUEUE_STATUSES.includes(status)) {
      throw buildError(
        'El estado indicado no es válido.',
        422,
        'VALIDATION_ERROR',
        'status',
      );
    }

    const { incidents, total } =
      await incidentRepository.findAssignedForSolution({
        userId,
        page,
        limit,
        search,
        status,
      });

    return {
      incidents: incidents.map(toPublicIncidentListItem),
      ...buildPaginationResponse({ total, page, limit }),
    };
  },

  /**
   * Valida el payload de una acción de solución (acciones realizadas y
   * observaciones) y devuelve texto normalizado. `actionsRequired` fuerza
   * el registro de las acciones (inicio de atención).
   */
  normalizeActionPayload(payload, { actionsRequired = false } = {}) {
    const actions = payload && payload.actions
      ? normalizeText(payload.actions)
      : '';
    const observations = payload && payload.observations
      ? normalizeText(payload.observations)
      : '';

    if (actionsRequired && !actions) {
      throw buildError(
        'Debe registrar las acciones realizadas para iniciar la atención.',
        422,
        'VALIDATION_ERROR',
        'actions',
      );
    }

    if (actions.length > MAX_ACTIONS_LENGTH) {
      throw buildError(
        `Las acciones no deben superar los ${MAX_ACTIONS_LENGTH} caracteres.`,
        422,
        'VALIDATION_ERROR',
        'actions',
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

    return { actions, observations };
  },

  /**
   * HU13 — Iniciar la atención de un incidente asignado.
   * - Solo el responsable de solución asignado o un administrador.
   * - Solo desde ASIGNADO_PARA_SOLUCION y mientras la asignación siga activa.
   * - Cambia a EN_ATENCION registrando las acciones realizadas en el
   *   historial y notificando al ciudadano.
   */
  async attendIncident(user, incidentId, payload) {
    const userId = user && user.id;

    if (!userId) {
      throw buildError(
        'Debe iniciar sesión para atender un incidente.',
        401,
        'AUTHENTICATION_REQUIRED',
      );
    }

    if (![ROLES.PERSONAL_SOLUCION, ROLES.ADMINISTRADOR].includes(user.role)) {
      throw buildError(
        'No tienes permisos para atender incidentes.',
        403,
        'FORBIDDEN',
      );
    }

    const incident = await incidentRepository.findById(incidentId);

    if (!incident) {
      throw buildError('El incidente no existe.', 404, 'INCIDENT_NOT_FOUND');
    }

    if (incident.status !== INCIDENT_STATUS.ASIGNADO_PARA_SOLUCION) {
      throw buildError(
        'El incidente no está asignado para su atención.',
        409,
        'INVALID_TRANSITION',
      );
    }

    if (!(await assignmentService.isSolutionAssignee(user, incident.id))) {
      throw buildError(
        'Este incidente no está asignado a ti para su atención.',
        403,
        'FORBIDDEN',
        'incident',
      );
    }

    const { actions, observations } = this.normalizeActionPayload(payload, {
      actionsRequired: true,
    });

    const comment = [actions, observations].filter(Boolean).join(' | ');

    const updated = await statusService.applyStatusChange(
      incident,
      INCIDENT_STATUS.EN_ATENCION,
      user.id,
      comment || 'Iniciado el trabajo de atención.',
    );

    return {
      incident: {
        ...toPublicIncident(updated),
        actions: actions || null,
        observations: observations || null,
      },
    };
  },

  /**
   * HU13 — Marcar un incidente como atendido.
   * - Solo desde EN_ATENCION y por el responsable asignado (o administrador).
   * - Registra acciones y observaciones en el historial y notifica.
   */
  async markAttended(user, incidentId, payload) {
    const userId = user && user.id;

    if (!userId) {
      throw buildError(
        'Debe iniciar sesión para marcar un incidente como atendido.',
        401,
        'AUTHENTICATION_REQUIRED',
      );
    }

    if (![ROLES.PERSONAL_SOLUCION, ROLES.ADMINISTRADOR].includes(user.role)) {
      throw buildError(
        'No tienes permisos para gestionar incidentes.',
        403,
        'FORBIDDEN',
      );
    }

    const incident = await incidentRepository.findById(incidentId);

    if (!incident) {
      throw buildError('El incidente no existe.', 404, 'INCIDENT_NOT_FOUND');
    }

    if (incident.status !== INCIDENT_STATUS.EN_ATENCION) {
      throw buildError(
        'El incidente no está en atención.',
        409,
        'INVALID_TRANSITION',
      );
    }

    if (!(await assignmentService.isSolutionAssignee(user, incident.id))) {
      throw buildError(
        'Este incidente no está asignado a ti para su atención.',
        403,
        'FORBIDDEN',
        'incident',
      );
    }

    const { actions, observations } = this.normalizeActionPayload(payload);

    const comment = [actions, observations].filter(Boolean).join(' | ');

    const updated = await statusService.applyStatusChange(
      incident,
      INCIDENT_STATUS.ATENDIDO,
      user.id,
      comment || 'Trabajo finalizado.',
    );

    return {
      incident: {
        ...toPublicIncident(updated),
        actions: actions || null,
        observations: observations || null,
      },
    };
  },

  /**
   * HU13 — Cerrar un incidente ya atendido.
   * - Solo desde ATENDIDO y por el responsable asignado (o administrador).
   * - Cambia a CERRADO, completa la asignación de solución y notifica.
   */
  async closeIncident(user, incidentId, payload) {
    const userId = user && user.id;

    if (!userId) {
      throw buildError(
        'Debe iniciar sesión para cerrar un incidente.',
        401,
        'AUTHENTICATION_REQUIRED',
      );
    }

    if (![ROLES.PERSONAL_SOLUCION, ROLES.ADMINISTRADOR].includes(user.role)) {
      throw buildError(
        'No tienes permisos para cerrar incidentes.',
        403,
        'FORBIDDEN',
      );
    }

    const incident = await incidentRepository.findById(incidentId);

    if (!incident) {
      throw buildError('El incidente no existe.', 404, 'INCIDENT_NOT_FOUND');
    }

    if (incident.status !== INCIDENT_STATUS.ATENDIDO) {
      throw buildError(
        'El incidente no está atendido.',
        409,
        'INVALID_TRANSITION',
      );
    }

    if (!(await assignmentService.isSolutionAssignee(user, incident.id))) {
      throw buildError(
        'Este incidente no está asignado a ti para su atención.',
        403,
        'FORBIDDEN',
        'incident',
      );
    }

    const { actions, observations } = this.normalizeActionPayload(payload);

    const comment = [actions, observations].filter(Boolean).join(' | ');

    const assignment = await assignmentRepository.findActiveByIncident(
      incident.id,
      'SOLUCION',
    );

    const updated = await statusService.applyStatusChange(
      incident,
      INCIDENT_STATUS.CERRADO,
      user.id,
      comment || 'Incidente cerrado.',
    );

    if (assignment) {
      await assignmentRepository.complete(assignment.id);
    }

    return {
      incident: {
        ...toPublicIncident(updated),
        actions: actions || null,
        observations: observations || null,
      },
      assignment: assignment ? toPublicAssignment(assignment) : null,
    };
  },
};

module.exports = solutionService;