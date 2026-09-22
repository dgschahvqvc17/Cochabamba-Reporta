/**
 * Helpers de paginación (MVC - utils).
 *
 * Centraliza el parseo de los parámetros page/limit y el cálculo de la
 * respuesta paginada para evitar duplicarlo en los services (DRY).
 *
 * @format
 */

'use strict';

const parsePositiveInt = (value, fallback, max) => {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 1) {
    return fallback;
  }
  return Math.min(parsed, max);
};

const buildPaginationResponse = ({ total, page, limit }) => ({
  total,
  page,
  limit,
  pages: Math.max(1, Math.ceil(total / limit)),
});

module.exports = { parsePositiveInt, buildPaginationResponse };