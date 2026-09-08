/**
 * Servicio de autenticación (MVC - Service).
 *
 * Contiene la lógica de negocio del inicio de sesión.
 *
 * @format
 */

'use strict';

const authService = {
  async login(email, password) {
    // TODO: validar credenciales, generar token JWT y devolver el usuario.
    if (!email || !password) {
      const error = new Error('Credenciales incompletas');
      error.status = 422;
      throw error;
    }

    return {
      id: 1,
      firstName: 'Ciudadano',
      lastName: 'Ejemplo',
      email,
      role: 'CIUDADANO',
    };
  },
};

module.exports = authService;