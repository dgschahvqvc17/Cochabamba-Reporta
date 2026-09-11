/**
 * Controlador de usuarios (MVC - Controller).
 *
 * Recibe las solicitudes HTTP de gestión de usuarios y roles (HU03),
 * delega la lógica al service y devuelve las respuestas. Ligero:
 * sin lógica de negocio.
 *
 * @format
 */

'use strict';

const userService = require('../services/user.service');
const { ok } = require('../utils/response');

const userController = {
  async listUsers(req, res, next) {
    try {
      const data = await userService.listUsers(req.query);

      return ok(res, 200, 'Usuarios consultados correctamente.', data);
    } catch (error) {
      return next(error);
    }
  },

  async listRoles(req, res, next) {
    try {
      const roles = await userService.listRoles();

      return ok(res, 200, 'Roles consultados correctamente.', { roles });
    } catch (error) {
      return next(error);
    }
  },

  async getUserDetail(req, res, next) {
    try {
      const data = await userService.getUserDetail(req.params.id);

      return ok(
        res,
        200,
        'Detalle del usuario consultado correctamente.',
        data,
      );
    } catch (error) {
      return next(error);
    }
  },

  async createUser(req, res, next) {
    try {
      const user = await userService.createInternalUser(req.body, req.user);

      return ok(res, 201, 'Usuario registrado correctamente.', { user });
    } catch (error) {
      return next(error);
    }
  },

  async updateUser(req, res, next) {
    try {
      const user = await userService.updateUser(req.params.id, req.body, req.user);

      return ok(res, 200, 'Usuario actualizado correctamente.', { user });
    } catch (error) {
      return next(error);
    }
  },

  async updateUserStatus(req, res, next) {
    try {
      const user = await userService.setUserStatus(
        req.params.id,
        req.body.active,
        req.user,
      );

      const message = user.active
        ? 'Usuario activado correctamente.'
        : 'Usuario desactivado correctamente.';

      return ok(res, 200, message, { user });
    } catch (error) {
      return next(error);
    }
  },

  async updateUserRole(req, res, next) {
    try {
      const user = await userService.assignRole(req.params.id, req.body.role, req.user);

      return ok(res, 200, 'Rol asignado correctamente.', { user });
    } catch (error) {
      return next(error);
    }
  },
};

module.exports = userController;