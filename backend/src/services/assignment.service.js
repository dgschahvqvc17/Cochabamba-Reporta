/**
 * Servicio de asignación a verificación (MVC - Service).
 *
 * HU10 — Asignar incidente para verificación (encargado de recepción):
 *   - Lista los funcionarios de verificación disponibles.
 *   - Lista los incidentes pendientes de verificación.
 *   - Asigna el incidente a un verificador, cambia el estado a
 *     EN_VERIFICACION y registra asignación, historial y
 *     notificaciones (funcionario + ciudadano).
 * HU12 — Asignar incidente para solución (encargado de solución):
 *   - Lista el personal de solución disponible.
 *   - Lista los incidentes verificados pendientes de solución.
 *   - Asigna el incidente a un responsable, cambia el estado a
 *     ASIGNADO_PARA_SOLUCION y registra asignación, historial y
 *     notificaciones (responsable + ciudadano).
 * También expone `isVerificationAssignee` (HU11) e `isSolutionAssignee`
 * (HU13) para saber si el usuario es el verificador / responsable de
 * solución asignado activo de un incidente.
 *
 * @format
 */

'use strict';

const incidentRepository = require('../repositories/incident.repository');
const assignmentRepository = require('../repositories/assignment.repository');
const notificationRepository = require('../repositories/notification.repository');
const historyRepository = require('../repositories/history.repository');
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
  ASSIGNABLE_TO_SOLUTION,
  PENDING_SOLUTION_STATUSES,
} = require('../utils/incidentStatus');
const {
  toPublicIncident,
  toPublicVerifier,
  toPublicSolutionStaff,
  toPublicVerificationListItem,
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
      incidents: incidents.map((item) => toPublicIncidentListItem(item, { viewer: user })),
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
   * HU — Incidentes actualmente en verificación (EN_VERIFICACION) con su
   * verificador asignado, para que la recepción pueda reasignarlo.
   */
  async listInVerification(user, query = {}) {
    if (!this.isRecepcionStaff(user)) {
      throw buildError(
        'No tienes permisos para consultar los incidentes en verificación.',
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
      await incidentRepository.findAllInVerification({
        page,
        limit,
        search,
      });

    const verifierIds = incidents
      .map((incident) =>
        Array.isArray(incident.assignments) && incident.assignments[0]
          ? Number(incident.assignments[0].assigned_to)
          : null,
      )
      .filter((id) => id !== null);

    const verifierByName = new Map();
    if (verifierIds.length > 0) {
      const verifiers = await userRepository.findUsersByIds(
        [...new Set(verifierIds)],
      );
      verifiers.forEach((verifier) =>
        verifierByName.set(Number(verifier.id), verifier),
      );
    }

    return {
      incidents: incidents.map((incident) => {
        const assignment =
          Array.isArray(incident.assignments) && incident.assignments[0]
            ? incident.assignments[0]
            : null;
        const verifier = assignment
          ? verifierByName.get(Number(assignment.assigned_to)) || null
          : null;

        return toPublicVerificationListItem(
          incident,
          verifier
            ? {
                id: verifier.id,
                firstName: verifier.first_name,
                lastName: verifier.last_name,
                email: verifier.email,
              }
            : null,
          { viewer: user },
        );
      }),
      ...buildPaginationResponse({ total, page, limit }),
    };
  },

  /**
   * HU — Reasignar el verificador de un incidente en verificación.
   * Completa la asignación actual, crea una nueva activa para el nuevo
   * verificador, registra el historial (el estado permanece EN_VERIFICACION)
   * y notifica al verificador saliente, al nuevo y al ciudadano.
   */
  async reassignForVerification(user, incidentId, payload) {
    if (!this.isRecepcionStaff(user)) {
      throw buildError(
        'No tienes permisos para reasignar incidentes.',
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
        'El incidente no se encuentra en verificación.',
        409,
        'INVALID_TRANSITION',
      );
    }

    const currentAssignment =
      await assignmentRepository.findActiveByIncident(
        incident.id,
        'VERIFICACION',
      );

    if (!currentAssignment) {
      throw buildError(
        'El incidente no tiene una asignación de verificación activa.',
        409,
        'ASSIGNMENT_NOT_FOUND',
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

    if (Number(currentAssignment.assigned_to) === assignedToId) {
      throw buildError(
        'Debe seleccionar un verificador distinto al asignado actualmente.',
        422,
        'INVALID_ASSIGNEE',
        'assignedToId',
      );
    }

    const note = payload && payload.note ? normalizeText(payload.note) : '';

    await assignmentRepository.complete(currentAssignment.id);

    const assignment = await assignmentRepository.create({
      incidentId: incident.id,
      type: 'VERIFICACION',
      assignedBy: user.id,
      assignedTo: assignedToId,
      note: note || null,
    });

    const comment =
      note ||
      `Verificador reasignado a ${verifier.first_name} ${verifier.last_name}.`;

    await historyRepository.create({
      incidentId: incident.id,
      fromStatus: INCIDENT_STATUS.EN_VERIFICACION,
      toStatus: INCIDENT_STATUS.EN_VERIFICACION,
      changedBy: user.id,
      comment,
    });

    await notificationRepository.create({
      incidentId: incident.id,
      userId: assignedToId,
      message: `Se le asignó el incidente ${incident.code} para su verificación.`,
    });

    await notificationRepository.create({
      incidentId: incident.id,
      userId: currentAssignment.assigned_to,
      message: `Se le retiró la asignación del incidente ${incident.code}; fue reasignado a otro verificador.`,
    });

    await notificationRepository.create({
      incidentId: incident.id,
      userId: incident.user_id,
      message: `Su reporte ${incident.code} fue reasignado a otro funcionario de verificación.`,
    });

    return {
      assignment: toPublicAssignment(assignment),
      incident: toPublicIncident(incident, { viewer: user }),
    };
  },

  /**
   * HU13 — true si el usuario es el responsable de solución asignado
   * activo del incidente (o un administrador, que puede atender cualquier
   * incidente).
   */
  async isSolutionAssignee(user, incidentId) {
    if (!user || !user.id) {
      return false;
    }

    if (user.role === ROLES.ADMINISTRADOR) {
      return true;
    }

    const assignment = await assignmentRepository.findActiveByIncident(
      incidentId,
      'SOLUCION',
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
      incident: toPublicIncident(updated, { viewer: user }),
    };
  },

  /**
   * Roles que pueden asignar incidentes para solución (HU12) y
   * consultar los pendientes de solución y el personal disponible.
   */
  isEncargadoSolutionStaff(user) {
    return Boolean(
      user &&
        [ROLES.ENCARGADO_SOLUCION, ROLES.ADMINISTRADOR].includes(user.role),
    );
  },

  /**
   * HU12 — Personal de solución responsable disponible para asignar.
   */
  async listSolutionStaff(user) {
    if (!this.isEncargadoSolutionStaff(user)) {
      throw buildError(
        'No tienes permisos para consultar el personal de solución.',
        403,
        'FORBIDDEN',
      );
    }

    const staff = await userRepository.findSolutionStaff();

    return { staff: staff.map(toPublicSolutionStaff) };
  },

  /**
   * HU12 — Incidentes verificados pendientes de asignación para
   * solución (estado VERIFICADO).
   */
  async listPendingSolution(user, query = {}) {
    if (!this.isEncargadoSolutionStaff(user)) {
      throw buildError(
        'No tienes permisos para consultar los incidentes pendientes de solución.',
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
      statuses: PENDING_SOLUTION_STATUSES,
      search,
    });

    return {
      incidents: incidents.map((item) => toPublicIncidentListItem(item, { viewer: user })),
      ...buildPaginationResponse({ total, page, limit }),
    };
  },

  /**
   * HU12 — Asignar un incidente verificado para su solución
   * (encargado de solución). Cambia el estado a ASIGNADO_PARA_SOLUCION,
   * crea la asignación (con quién, a quién, fecha/hora y nota), registra
   * el historial y notifica al responsable asignado y al ciudadano.
   */
  async assignForSolution(user, incidentId, payload) {
    if (!this.isEncargadoSolutionStaff(user)) {
      throw buildError(
        'No tienes permisos para asignar incidentes para solución.',
        403,
        'FORBIDDEN',
      );
    }

    const incident = await incidentRepository.findById(incidentId);

    if (!incident) {
      throw buildError('El incidente no existe.', 404, 'INCIDENT_NOT_FOUND');
    }

    if (!ASSIGNABLE_TO_SOLUTION.includes(incident.status)) {
      throw buildError(
        'El incidente no está verificado para asignarse a solución.',
        409,
        'INVALID_TRANSITION',
      );
    }

    const existingAssignment = await assignmentRepository.findActiveByIncident(
      incident.id,
      'SOLUCION',
    );

    if (existingAssignment) {
      throw buildError(
        'El incidente ya está asignado para solución.',
        409,
        'ALREADY_ASSIGNED',
      );
    }

    const assignedToId = Number(payload && payload.assignedToId);
    const staffMember = await userRepository.findByIdWithRole(assignedToId);

    if (
      !staffMember ||
      String(staffMember.roles && staffMember.roles.name) !==
        ROLES.PERSONAL_SOLUCION ||
      !staffMember.active
    ) {
      throw buildError(
        'El responsable seleccionado no es personal de solución activo.',
        422,
        'INVALID_ASSIGNEE',
        'assignedToId',
      );
    }

    const note = payload && payload.note ? normalizeText(payload.note) : '';

    const assignment = await assignmentRepository.create({
      incidentId: incident.id,
      type: 'SOLUCION',
      assignedBy: user.id,
      assignedTo: assignedToId,
      note: note || null,
    });

    const updated = await statusService.applyStatusChange(
      incident,
      INCIDENT_STATUS.ASIGNADO_PARA_SOLUCION,
      user.id,
      note || 'Asignado para solución.',
    );

    await notificationRepository.create({
      incidentId: incident.id,
      userId: assignedToId,
      message: `Se le asignó el incidente ${incident.code} para su atención.`,
    });

    return {
      assignment: toPublicAssignment(assignment),
      incident: toPublicIncident(updated, { viewer: user }),
    };
  },
};

module.exports = assignmentService;