/**
 * Servicio del dashboard de supervisión (HU15 - MVC Service) y alertas
 * de gestión de la plataforma.
 *
 * Agrega los conteos del panel administrativo y deriva alertas a partir
 * de umbrales configurables (pendientes, sin atender, pico de reportes
 * recientes) y de los últimos registros. Reutiliza el repositorio
 * `dashboard.repository` (dato) y los nombres de roles y estados del
 * backend para mantener una única fuente de verdad.
 *
 * @format
 */

'use strict';

const dashboardRepository = require('../repositories/dashboard.repository');
const { buildError } = require('../utils/errors');
const ROLES = require('../utils/roles');
const INCIDENT_STATUS = require('../utils/incidentStatus');

/** Umbral de incidentes pendientes para emitir la alerta de gestión. */
const PENDING_ALERT_THRESHOLD = 8;

/** Considerados "pendientes de gestión" (no han llegado a solución). */
const PENDING_STATUSES = new Set([
  INCIDENT_STATUS.REPORTADO,
  INCIDENT_STATUS.RECIBIDO,
  INCIDENT_STATUS.EN_VERIFICACION,
  INCIDENT_STATUS.VERIFICADO,
  INCIDENT_STATUS.ASIGNADO_PARA_SOLUCION,
  INCIDENT_STATUS.EN_ATENCION,
]);

/** Estados que significan "incidente atendido". */
const ATTENDED_STATUSES = new Set([
  INCIDENT_STATUS.ATENDIDO,
  INCIDENT_STATUS.CERRADO,
]);

/**
 * Construye el snapshot completo del dashboard: indicadores por rol de
 * personal activo, totales de ciudadanos/incidentes, distribución por
 * estado y por categoría, y alertas de gestión.
 *
 * HU15: solo el ADMINISTRADOR recibe esta foto consolidada.
 */
const buildDashboardSnapshot = async ({ user } = {}) => {
  if (!user || user.role !== ROLES.ADMINISTRADOR) {
    throw buildError(
      'Solo el administrador puede supervisar el sistema.',
      403,
      'FORBIDDEN',
    );
  }

  const [
    citizens,
    totalIncidents,
    incidentsToday,
    reception,
    verifiers,
    solutionStaff,
    pending,
    attended,
    recent,
  ] = await Promise.all([
    dashboardRepository.countTotalCitizens(),
    dashboardRepository.countTotalIncidents(),
    dashboardRepository.countIncidentsToday(),
    dashboardRepository.countActiveUsersByRole(ROLES.RECEPCION),
    dashboardRepository.countActiveUsersByRole(ROLES.VERIFICADOR),
    (await dashboardRepository.countActiveUsersByRole(ROLES.ENCARGADO_SOLUCION)) +
      (await dashboardRepository.countActiveUsersByRole(ROLES.PERSONAL_SOLUCION)),
    dashboardRepository.countIncidentsByStatus(INCIDENT_STATUS.REPORTADO),
    dashboardRepository.countIncidentsByStatus(INCIDENT_STATUS.ATENDIDO),
    dashboardRepository.findRecentIncidents({ limit: 6 }),
  ]);

  const alerts = [];

  if (pending > PENDING_ALERT_THRESHOLD) {
    alerts.push({
      severity: 'warning',
      message: `Hay ${pending} incidentes reportados pendientes de recepción.`,
    });
  }

  if (totalIncidents > 0 && incidentsToday === 0) {
    alerts.push({
      severity: 'info',
      message: 'No se registraron incidentes en el día de hoy.',
    });
  }

  return {
    indicators: {
      totalCitizens: citizens,
      totalIncidents,
      incidentsToday,
      attendedIncidents: attended,
      pendingIncidents: pending,
      activeReceptionStaff: reception,
      activeVerifiers: verifiers,
      activeSolutionStaff: solutionStaff,
    },
    alerts,
    recent,
  };
};

module.exports = {
  buildDashboardSnapshot,
};
