/**
 * Servicio de autenticación (MVC - Service).
 *
 * Contiene la lógica de negocio de autenticación:
 *   - HU01: Registro de ciudadano (detecta duplicados, crea la
 *     identidad en Supabase Auth y el registro en la tabla `users`).
 *   - HU02: Inicio de sesión (valida credenciales contra Supabase
 *     Auth, devuelve sesión y datos del usuario).
 *
 * La contraseña nunca se almacena en texto plano; Supabase la guarda
 * con hash seguro.
 *
 * @format
 */

'use strict';

const { supabaseAdmin, supabasePublic } = require('../config/supabase');
const userRepository = require('../repositories/user.repository');
const { toPublicUser } = require('../utils/userMapper');
const ROLES = require('../utils/roles');

const ROLE_CIUDADANO = ROLES.CIUDADANO;

const buildError = (message, status, code) => {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
};

const claimDuplicateEmail = 'Ya existe una cuenta con este correo electrónico.';
const claimDuplicateIdentity =
  'Ya existe una cuenta registrada con este documento de identidad.';

const authService = {
  async register(payload) {
    const email = payload.email.trim().toLowerCase();
    const identityNumber = payload.identityNumber.trim();

    const existingByEmail = await userRepository.findByEmail(email);
    if (existingByEmail) {
      throw buildError(claimDuplicateEmail, 409, 'EMAIL_ALREADY_EXISTS');
    }

    const existingByIdentity = await userRepository.findByIdentityNumber(
      identityNumber,
    );
    if (existingByIdentity) {
      throw buildError(claimDuplicateIdentity, 409, 'IDENTITY_ALREADY_EXISTS');
    }

    const role = await userRepository.findByRoleName(ROLE_CIUDADANO);
    if (!role) {
      throw buildError(
        'El rol CIUDADANO no está configurado.',
        500,
        'ROLE_NOT_FOUND',
      );
    }

    const authUser = await userRepository.createAuthUser({
      email,
      password: payload.password,
      metadata: {
        first_name: payload.firstName.trim(),
        last_name: payload.lastName.trim(),
        identity_number: identityNumber,
        phone: payload.phone.trim(),
      },
    });

    let createdUser;
    try {
      createdUser = await userRepository.create({
        auth_id: authUser.id,
        first_name: payload.firstName.trim(),
        last_name: payload.lastName.trim(),
        birth_date: payload.birthDate,
        identity_number: identityNumber,
        phone: payload.phone.trim(),
        email,
        address: payload.address ? payload.address.trim() : null,
        role_id: role.id,
      });
    } catch (error) {
      // Revertir la identidad de autenticación si falla el registro en la tabla.
      await supabaseAdmin.auth.admin.deleteUser(authUser.id);
      throw error;
    }

    return toPublicUser(createdUser, ROLE_CIUDADANO);
  },

  async login(email, password) {
    const normalizedEmail = email.trim().toLowerCase();

    const { data: sessionData, error: signInError } =
      await supabasePublic.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

    if (signInError || !sessionData.session) {
      throw buildError(
        'Correo o contraseña incorrectos.',
        401,
        'INVALID_CREDENTIALS',
      );
    }

    const appUser = await userRepository.findByEmailWithRole(normalizedEmail);
    if (!appUser) {
      throw buildError(
        'La cuenta no se encontró en la aplicación.',
        401,
        'ACCOUNT_NOT_FOUND',
      );
    }

    if (appUser.active === false) {
      throw buildError(
        'Tu cuenta está inactiva. Contacta con el soporte.',
        403,
        'USER_INACTIVE',
      );
    }

    const { session } = sessionData;

    return {
      user: toPublicUser(appUser, appUser.roles.name),
      session: {
        accessToken: session.access_token,
        refreshToken: session.refresh_token,
        expiresAt: session.expires_at,
      },
    };
  },

  async getCurrentUser(appUserId) {
    const appUser = await userRepository.findByIdWithRole(appUserId);
    if (!appUser) {
      throw buildError('La cuenta no se encontró.', 404, 'ACCOUNT_NOT_FOUND');
    }

    return toPublicUser(appUser, appUser.roles.name);
  },

  async logout(accessToken) {
    const { error } = await supabaseAdmin.auth.admin.signOut(accessToken);

    if (error) {
      throw buildError(
        'No se pudo cerrar la sesión. Intenta nuevamente.',
        400,
        'LOGOUT_FAILED',
      );
    }

    return true;
  },
};

module.exports = authService;