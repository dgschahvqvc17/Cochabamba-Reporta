/**
 * Controlador de autenticación (MVC - Controller).
 *
 * Recibe las solicitudes HTTP y devuelve las respuestas.
 *
 * @format
 */

'use strict';

const authService = require('../services/auth.service');

const authController = {
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const user = await authService.login(email, password);

      res.json({
        success: true,
        message: 'Inicio de sesión exitoso',
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = authController;