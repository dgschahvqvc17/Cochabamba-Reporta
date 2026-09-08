/**
 * Middleware de manejo de errores (MVC - middlewares).
 *
 * Centraliza la respuesta de errores de la API.
 *
 * @format
 */

'use strict';

const errorMiddleware = (err, req, res, next) => {
  const status = err.status || 500;

  res.status(status).json({
    success: false,
    message: err.message || 'Error interno del servidor',
  });
};

module.exports = errorMiddleware;