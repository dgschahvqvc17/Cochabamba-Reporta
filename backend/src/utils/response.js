/**
 * Helpers de respuesta (MVC - utils).
 *
 * Estandariza el formato JSON de todas las respuestas de la API:
 *   { success, message, data | error }
 *
 * @format
 */

'use strict';

const ok = (res, statusCode, message, data = null) => {
  const body = { success: true, message };

  if (data !== null) {
    body.data = data;
  }

  return res.status(statusCode).json(body);
};

const fail = (res, statusCode, message, code = null, details = null) => {
  const body = { success: false, message };

  if (code) {
    body.error = { code };
  }

  if (details) {
    body.error = { ...body.error, details };
  }

  return res.status(statusCode).json(body);
};

module.exports = { ok, fail };