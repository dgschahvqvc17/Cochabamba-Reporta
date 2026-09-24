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

const MAX_OBSERVATIONS_LENGTH = 500;
const MAX_REJECTED_REASON_LENGTH = 500;

/** Longitud máxima de las acciones realizadas por el personal de solución (HU13). */
const MAX_ACTIONS_LENGTH = 1000;

const MIN_CATEGORY_ID = 1;

/** Único estado en el que el ciudadano puede editar o eliminar su reporte. */
const EDITABLE_STATUS = 'REPORTADO';

module.exports = {
  MIN_TITLE_LENGTH,
  MAX_TITLE_LENGTH,
  MIN_DESCRIPTION_LENGTH,
  MAX_DESCRIPTION_LENGTH,
  DEFAULT_LIST_PAGE_SIZE,
  MAX_LIST_PAGE_SIZE,
  MAX_OBSERVATIONS_LENGTH,
  MAX_REJECTED_REASON_LENGTH,
  MAX_ACTIONS_LENGTH,
  MIN_CATEGORY_ID,
  EDITABLE_STATUS,
};