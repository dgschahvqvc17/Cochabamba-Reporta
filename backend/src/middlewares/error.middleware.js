/**
 * Middleware de manejo de errores (MVC - middlewares).
 *
 * Centraliza la respuesta de errores de la API.
 * Errores con .status y .code se usan para respuestas
 * específicas (duplicados, validación, etc.).
 *
 * @format
 */

'use strict';

const errorMiddleware = (err, req, res, _next) => {
  const statusCode = err.status || 500;
  const message = err.message || 'Error interno del servidor';

  const body = { success: false, message };

  if (err.code) {
    body.error = { code: err.code };
  }

  console.error(`[ERROR] ${statusCode} ${message}`);

  res.status(statusCode).json(body);
};

module.exports = errorMiddleware;