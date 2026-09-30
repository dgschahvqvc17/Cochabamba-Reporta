/**
 * Reglas y constantes del dominio de incidentes (MVC - utils).
 *
 * Fuente única de las restricciones del módulo de incidentes para no
 * duplicar valores mágicos entre validators y services (DRY).
 *
 * @format
 */

'use strict';

const MIN_TITLE_LENGTH = 8;
const MAX_TITLE_LENGTH = 120;
const MIN_DESCRIPTION_LENGTH = 15;
const MAX_DESCRIPTION_LENGTH = 2000;

/** Tamaño de página por defecto y máximo para listar incidentes (HU09). */
const DEFAULT_LIST_PAGE_SIZE = 10;
const MAX_LIST_PAGE_SIZE = 50;

/**
 * Orden por fecha de llegada del reporte (HU09). `asc` muestra primero los
 * más antiguos, que son los que llevan más tiempo esperando una atención;
 * `desc` (por defecto) muestra primero los más recientes.
 */
const INCIDENT_ORDER_VALUES = ['asc', 'desc'];
const DEFAULT_INCIDENT_ORDER = 'desc';

const MAX_OBSERVATIONS_LENGTH = 500;
const MAX_REJECTED_REASON_LENGTH = 500;

/** Longitud máxima de las acciones realizadas por el personal de solución (HU13). */
const MAX_ACTIONS_LENGTH = 1000;

const MIN_CATEGORY_ID = 1;

/**
 * Plazo máximo de atención comprometido al ciudadano (HU06): la fecha
 * `response_deadline_at` que se asigna a cada reporte al crearlo y que se
 * muestra como fecha estimada de respuesta.
 */
const DEFAULT_RESPONSE_DEADLINE_DAYS = 1;

/** Único estado en el que el ciudadano puede editar o eliminar su reporte. */
const EDITABLE_STATUS = 'REPORTADO';

/**
 * Anti-duplicados (creación de reportes): el ciudadano no debe registrar
 * dos veces el mismo problema. Se comparan título + descripción del nuevo
 * reporte con los de la misma categoría creados en los últimos
 * `DUPLICATE_WINDOW_DAYS` días y que aún no estén rechazados ni cerrados.
 */
const DUPLICATE_WINDOW_DAYS = 30;
const DUPLICATE_SIMILARITY_THRESHOLD = 0.8;
const DUPLICATE_MAX_CANDIDATES = 200;
const DUPLICATE_EXCLUDED_STATUSES = ['RECHAZADO', 'CERRADO'];

/**
 * Longitud máxima del mensaje de notificación (columna `varchar(255)`).
 * Los motivos de rechazo pueden superarla (hasta 500), por lo que las
 * notificaciones lo recortan para no truncar la columna (evita 500).
 */
const NOTIFICATION_MESSAGE_MAX_LENGTH = 255;

/** Recorta un mensaje de notificación para que quepa en varchar(255). */
function truncateNotificationMessage(message) {
  const value = String(message ?? '');

  if (value.length <= NOTIFICATION_MESSAGE_MAX_LENGTH) {
    return value;
  }

  return `${value.slice(0, NOTIFICATION_MESSAGE_MAX_LENGTH - 1)}…`;
}

module.exports = {
  MIN_TITLE_LENGTH,
  MAX_TITLE_LENGTH,
  MIN_DESCRIPTION_LENGTH,
  MAX_DESCRIPTION_LENGTH,
  DEFAULT_LIST_PAGE_SIZE,
  MAX_LIST_PAGE_SIZE,
  INCIDENT_ORDER_VALUES,
  DEFAULT_INCIDENT_ORDER,
  MAX_OBSERVATIONS_LENGTH,
  MAX_REJECTED_REASON_LENGTH,
  MAX_ACTIONS_LENGTH,
  MIN_CATEGORY_ID,
  DEFAULT_RESPONSE_DEADLINE_DAYS,
  EDITABLE_STATUS,
  DUPLICATE_WINDOW_DAYS,
  DUPLICATE_SIMILARITY_THRESHOLD,
  DUPLICATE_MAX_CANDIDATES,
  DUPLICATE_EXCLUDED_STATUSES,
  NOTIFICATION_MESSAGE_MAX_LENGTH,
  truncateNotificationMessage,
};