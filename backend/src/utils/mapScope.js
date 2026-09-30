/**
 * Alcance del mapa de incidentes (MVC - utils).
 *
 * Fuente única (principio DRY) de qué incidentes ve cada rol en el mapa
 * interactivo (GET /api/v1/incidents/map-incidents):
 *
 *   - CIUDADANO          → todos los reportes con ubicación, para comprobar
 *                          si lo que quiere reportar ya fue reportado.
 *   - RECEPCION          → los reportes que le llegan: pendientes de
 *                          verificación (REPORTADO/RECIBIDO).
 *   - VERIFICADOR        → solo los incidentes que le asignaron y que
 *                          tiene activos (asignación VERIFICACION).
 *   - ENCARGADO_SOLUCION → los verificados que debe revisar para asignar
 *                          a solución (VERIFICADO).
 *   - PERSONAL_SOLUCION  → solo los incidentes que le asignaron y que
 *                          tiene activos (asignación SOLUCION).
 *   - ADMINISTRADOR      → todos los reportes.
 *
 * `statuses: null` significa "sin restricción de estado" y
 * `assignment: null` significa "sin restricción por asignación": el
 * alcance se define solo por rol, nunca por lo que pida el cliente.
 * El usuario concreto (assignedTo) lo resuelve el service con la sesión.
 *
 * @format
 */

'use strict';

const ROLES = require('./roles');
const {
  INCIDENT_STATUSES,
  PENDING_VERIFICATION_STATUSES,
  ASSIGNABLE_TO_SOLUTION,
} = require('./incidentStatus');

/** Tipos de asignación de la tabla `assignments`. */
const ASSIGNMENT_TYPE = {
  VERIFICACION: 'VERIFICACION',
  SOLUCION: 'SOLUCION',
};

/**
 * Tope de incidentes que devuelve el mapa. El ciudadano y el administrador
 * ven todo el alcance, así que la consulta se limita a los más recientes
 * para no enviar una respuesta desproporcionada; el personal municipal ve
 * mucho menos y nunca llega al tope.
 */
const MAX_MAP_INCIDENTS = 500;

/**
 * Alcance del mapa por rol. `statuses` acota los estados visibles y
 * `assignmentType` acota a los incidentes con una asignación activa de
 * ese tipo. El service completa la asignación con el id del usuario.
 */
const MAP_ROLE_SCOPE = {
  [ROLES.CIUDADANO]: { statuses: INCIDENT_STATUSES, assignmentType: null },
  [ROLES.RECEPCION]: {
    statuses: PENDING_VERIFICATION_STATUSES,
    assignmentType: null,
  },
  [ROLES.VERIFICADOR]: {
    statuses: null,
    assignmentType: ASSIGNMENT_TYPE.VERIFICACION,
  },
  [ROLES.ENCARGADO_SOLUCION]: {
    statuses: ASSIGNABLE_TO_SOLUTION,
    assignmentType: null,
  },
  [ROLES.PERSONAL_SOLUCION]: {
    statuses: null,
    assignmentType: ASSIGNMENT_TYPE.SOLUCION,
  },
  [ROLES.ADMINISTRADOR]: { statuses: null, assignmentType: null },
};

/** Alcance sin restricciones (roles administrativos por defecto). */
const FULL_MAP_SCOPE = { statuses: null, assignmentType: null };

/**
 * Alcance efectivo del mapa para un usuario autenticado. Un rol
 * desconocido nunca ve menos que el administrador: se aplica el alcance
 * completo, y la autorización por rol la aplica el middleware de la ruta.
 *
 * @param {{id: number, role: string}|null|undefined} user Usuario de la sesión.
 * @returns {{statuses: string[]|null, assignmentType: string|null,
 *            assignment: {type: string, assignedTo: number}|null}}
 */
/**
 * Deriva el alcance del mapa a partir del rol del usuario.
 *
 * Devuelve los `statuses` o la `assignment` que debe aplicar la consulta; lo
 * que no se indique queda abierto, de modo que un rol desconocido conserva
 * el mismo alcance que el administrador. La ruta exige un rol conocido, así
 * que ese caso solo existe como defensa ante datos corruptos.
 */
const resolveMapScope = (user) => {
  const role = user && user.role;
  const userId = user && user.id;
  const scope = MAP_ROLE_SCOPE[role] || FULL_MAP_SCOPE;

  return {
    statuses: scope.statuses,
    assignmentType: scope.assignmentType,
    assignment:
      scope.assignmentType && userId
        ? { type: scope.assignmentType, assignedTo: userId }
        : null,
  };
};

module.exports = {
  ASSIGNMENT_TYPE,
  MAX_MAP_INCIDENTS,
  MAP_ROLE_SCOPE,
  FULL_MAP_SCOPE,
  resolveMapScope,
};
