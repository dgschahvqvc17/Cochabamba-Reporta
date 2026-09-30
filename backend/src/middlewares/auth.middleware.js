/**
 * Middleware de autenticación (MVC - middlewares).
 *
 * Protege los endpoints que requieren sesión. Valida el token JWT
 * de Supabase Auth (Authorization: Bearer) y adjunta el usuario de
 * la aplicación (tabla `users`) a req.user.
 *
 * @format
 */

'use strict';

const { supabasePublic } = require('../config/supabase');
const userRepository = require('../repositories/user.repository');
const { fail } = require('../utils/response');

const extractToken = (req) => {
  const header = req.headers.authorization || '';

  if (!header.startsWith('Bearer ')) {
    return null;
  }

  return header.slice('Bearer '.length).trim();
};

const authenticate = async (req, res, next) => {
  try {
    const token = extractToken(req);

    if (!token) {
      return fail(res, 401, 'Se requiere un token de acceso.', 'UNAUTHORIZED');
    }

    const { data, error } = await supabasePublic.auth.getUser(token);

    if (error || !data.user) {
      return fail(
        res,
        401,
        'El token no es válido o expiró.',
        'INVALID_TOKEN',
      );
    }

    const appUser = await userRepository.findByEmailWithRole(data.user.email);

    if (!appUser) {
      return fail(
        res,
        401,
        'La cuenta no se encontró en la aplicación.',
        'ACCOUNT_NOT_FOUND',
      );
    }

    if (appUser.active === false) {
      return fail(
        res,
        403,
        'Tu cuenta está inactiva. Contacta con el soporte.',
        'USER_INACTIVE',
      );
    }

    req.user = {
      id: appUser.id,
      authId: appUser.auth_id,
      email: appUser.email,
      firstName: appUser.first_name,
      lastName: appUser.last_name,
      role: appUser.roles.name,
    };
    req.accessToken = token;

    return next();
  } catch (error) {
    return next(error);
  }
};

/**
 * Autenticación opcional.
 *
 * Intenta autenticar al usuario si el request incluye un token válido,
 * pero nunca rechaza la solicitud si no lo hay (o si es inválido).
 * Se usa en endpoints públicos que cambian su respuesta según el rol
 * (por ejemplo, GET /categories: el administrador ve todas las
 * categorías y el ciudadano solo las activas).
 *
 * @format
 */

const authenticateOptional = async (req, res, next) => {
  try {
    const token = extractToken(req);

    if (!token) {
      return next();
    }

    const { data, error } = await supabasePublic.auth.getUser(token);

    if (error || !data.user) {
      return next();
    }

    const appUser = await userRepository.findByEmailWithRole(data.user.email);

    if (appUser && appUser.active) {
      req.user = {
        id: appUser.id,
        authId: appUser.auth_id,
        email: appUser.email,
        firstName: appUser.first_name,
        lastName: appUser.last_name,
        role: appUser.roles.name,
      };
    }

    return next();
  } catch (error) {
    return next();
  }
};

module.exports = { authenticate, authenticateOptional };