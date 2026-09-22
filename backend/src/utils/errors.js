/**
 * Helpers de errores (MVC - utils).
 *
 * Construye los errores de negocio con la forma que el middleware de
 * errores espera: mensaje, status HTTP, código y (opcional) detalles de
 * campo. Fuente única para que los services no dupliquen esta lógica.
 *
 * @format
 */

'use strict';

const buildError = (message, status, code, field = null) => {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  if (field) {
    error.details = [{ field, message }];
  }
  return error;
};

module.exports = { buildError };