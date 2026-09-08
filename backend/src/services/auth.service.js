/**
 * Servicio de autenticación (MVC - Service).
 *
 * Contiene la lógica de negocio del registro de ciudadano (HU01):
 *   - Detecta correos y documentos duplicados.
 *   - Crea la identidad en Supabase Auth (la contraseña nunca se
 *     almacena en texto plano; Supabase la guarda con hash seguro).
 *   - Crea el registro del ciudadano en la tabla `users` con rol CIUDADANO.
 *
 * @format
 */

'use strict';

const { supabaseAdmin } = require('../config/supabase');
const userRepository = require('../repositories/user.repository');

const ROLE_CIUDADANO = 'CIUDADANO';

const buildError = (message, status, code) => {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
};

const toPublicUser = (user) => ({
  id: user.id,
  firstName: user.first_name,
  lastName: user.last_name,
  birthDate: user.birth_date,
  identityNumber: user.identity_number,
  phone: user.phone,
  email: user.email,
  address: user.address,
  role: ROLE_CIUDADANO,
  active: user.active,
});

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

    return toPublicUser(createdUser);
  },
};

module.exports = authService;