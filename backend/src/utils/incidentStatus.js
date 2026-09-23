/**
 * Estados e incidencias de transición (MVC - utils).
 *
 * Fuente única (principio DRY) de los estados del ciclo de vida del
 * incidente, de las transiciones permitidas y de las etiquetas para
 * mostrar y notificar. Definido en Backend.md:
 *   REPORTADO → RECIBIDO → EN_VERIFICACION → VERIFICADO →
 *   ASIGNADO_PARA_SOLUCION → EN_ATENCION → ATENDIDO → CERRADO
 * y RECHAZADO cuando la verificación determina que el reporte no es válido.
 *
 * `ROLE_STATUS_TRANSITIONS` son las transiciones que el personal puede
 * realizar mediante el endpoint genérico PATCH /incidents/:id/status.
 * Las historias específicas (HU10 asignar verificación, HU11 verificar,
 * HU12 asignar solución, HU13 atender/cerrar) disparan sus propias
 * transiciones a través del service.
 *
 * @format
 */

'use strict';

const ROLES = require('./roles');

const INCIDENT_STATUS = {
  REPORTADO: 'REPORTADO',
  RECIBIDO: 'RECIBIDO',
  EN_VERIFICACION: 'EN_VERIFICACION',
  VERIFICADO: 'VERIFICADO',
  ASIGNADO_PARA_SOLUCION: 'ASIGNADO_PARA_SOLUCION',
  EN_ATENCION: 'EN_ATENCION',
  ATENDIDO: 'ATENDIDO',
  CERRADO: 'CERRADO',
  RECHAZADO: 'RECHAZADO',
};

const INCIDENT_STATUSES = Object.values(INCIDENT_STATUS);

/** Estados desde los que el encargado de recepción puede asignar a verificación (HU10). */
const ASSIGNABLE_TO_VERIFICATION = [
  INCIDENT_STATUS.REPORTADO,
  INCIDENT_STATUS.RECIBIDO,
];

/** Estados que se muestran como "pendientes de verificación". */
const PENDING_VERIFICATION_STATUSES = [...ASSIGNABLE_TO_VERIFICATION];

/** Estados desde los que el encargado de solución puede asignar a solución (HU12). */
const ASSIGNABLE_TO_SOLUTION = [INCIDENT_STATUS.VERIFICADO];

/** Estados que se muestran como "pendientes de asignación para solución". */
const PENDING_SOLUTION_STATUSES = [...ASSIGNABLE_TO_SOLUTION];

/** Etiquetas legibles en español para mensajes y notificaciones. */
const INCIDENT_STATUS_LABELS = {
  [INCIDENT_STATUS.REPORTADO]: 'Reportado',
  [INCIDENT_STATUS.RECIBIDO]: 'Recibido',
  [INCIDENT_STATUS.EN_VERIFICACION]: 'En verificación',
  [INCIDENT_STATUS.VERIFICADO]: 'Verificado',
  [INCIDENT_STATUS.ASIGNADO_PARA_SOLUCION]: 'Asignado para solución',
  [INCIDENT_STATUS.EN_ATENCION]: 'En atención',
  [INCIDENT_STATUS.ATENDIDO]: 'Atendido',
  [INCIDENT_STATUS.CERRADO]: 'Cerrado',
  [INCIDENT_STATUS.RECHAZADO]: 'Rechazado',
};

/**
 * Grafo completo de transiciones permitidas del ciclo de vida.
 * Las historias específicas validan aquí antes de cambiar el estado.
 */
const ALLOWED_TRANSITIONS = {
  [INCIDENT_STATUS.REPORTADO]: [
    INCIDENT_STATUS.RECIBIDO,
    INCIDENT_STATUS.EN_VERIFICACION,
  ],
  [INCIDENT_STATUS.RECIBIDO]: [INCIDENT_STATUS.EN_VERIFICACION],
  [INCIDENT_STATUS.EN_VERIFICACION]: [
    INCIDENT_STATUS.VERIFICADO,
    INCIDENT_STATUS.RECHAZADO,
  ],
  [INCIDENT_STATUS.VERIFICADO]: [INCIDENT_STATUS.ASIGNADO_PARA_SOLUCION],
  [INCIDENT_STATUS.ASIGNADO_PARA_SOLUCION]: [INCIDENT_STATUS.EN_ATENCION],
  [INCIDENT_STATUS.EN_ATENCION]: [
    INCIDENT_STATUS.ATENDIDO,
    INCIDENT_STATUS.RECHAZADO,
  ],
  [INCIDENT_STATUS.ATENDIDO]: [INCIDENT_STATUS.CERRADO],
  [INCIDENT_STATUS.CERRADO]: [],
  [INCIDENT_STATUS.RECHAZADO]: [],
};

/** Transiciones vía PATCH /incidents/:id/status según el rol. */
const ROLE_STATUS_TRANSITIONS = {
  [ROLES.RECEPCION]: {
    [INCIDENT_STATUS.REPORTADO]: [INCIDENT_STATUS.RECIBIDO],
  },
  [ROLES.ADMINISTRADOR]: {
    [INCIDENT_STATUS.REPORTADO]: [INCIDENT_STATUS.RECIBIDO],
  },
};

const isTransitionAllowed = (fromStatus, toStatus) =>
  Boolean(
    ALLOWED_TRANSITIONS[fromStatus] &&
      ALLOWED_TRANSITIONS[fromStatus].includes(toStatus),
  );

module.exports = {
  INCIDENT_STATUS,
  INCIDENT_STATUSES,
  INCIDENT_STATUS_LABELS,
  ASSIGNABLE_TO_VERIFICATION,
  PENDING_VERIFICATION_STATUSES,
  ASSIGNABLE_TO_SOLUTION,
  PENDING_SOLUTION_STATUSES,
  ALLOWED_TRANSITIONS,
  ROLE_STATUS_TRANSITIONS,
  isTransitionAllowed,
};