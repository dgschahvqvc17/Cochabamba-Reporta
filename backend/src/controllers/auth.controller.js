/**
 * Controlador de autenticación (MVC - Controller).
 *
 * Recibe las solicitudes HTTP de autenticación, delega la
 * lógica de negocio al service y devuelve las respuestas.
 *
 * @format
 */

'use strict';

const authService = require('../services/auth.service');
const { ok } = require('../utils/response');

const authController = {
  async register(req, res, next) {
    try {
      const user = await authService.register(req.body);

      return ok(res, 201, 'Cuenta creada correctamente.', { user });
    } catch (error) {
      return next(error);
    }
  },

  async login(req, res, next) {
    // TODO: HU02 — Iniciar sesión.
    try {
      const { email, password } = req.body;
      const user = await authService.login(email, password);

      return ok(res, 200, 'Inicio de sesión exitoso.', { user });
    } catch (error) {
      return next(error);
    }
  },
};

module.exports = authController;