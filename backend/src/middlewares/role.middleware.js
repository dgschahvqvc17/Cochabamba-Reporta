/**
 * Middleware de autorización por roles (MVC - middlewares).
 *
 * Debe usarse después de `authenticate`. Verifica que el rol del
 * usuario autenticado esté entre los roles permitidos para la ruta.
 *
 * @format
 */

'use strict';

const { fail } = require('../utils/response');

const requireRole =
  (...allowedRoles) =>
  (req, res, next) => {
    if (!req.user) {
      return fail(
        res,
        401,
        'Se requiere autenticación para esta operación.',
        'UNAUTHORIZED',
      );
    }

    if (!allowedRoles.includes(req.user.role)) {
      return fail(
        res,
        403,
        'No tienes permisos para realizar esta acción.',
        'FORBIDDEN',
      );
    }

    return next();
  };

module.exports = { requireRole };