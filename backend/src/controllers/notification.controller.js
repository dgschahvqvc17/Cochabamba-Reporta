/**
 * Controlador de notificaciones (MVC - Controller).
 *
 * Recibe las solicitudes HTTP del módulo de notificaciones
 * (listar las del usuario autenticado), delega la lógica al service
 * y devuelve las respuestas. Ligero: sin lógica de negocio.
 *
 * @format
 */

'use strict';

const notificationService = require('../services/notification.service');
const { ok } = require('../utils/response');

const notificationController = {
  async listNotifications(req, res, next) {
    try {
      const data = await notificationService.listNotifications(req.user, req.query);

      return ok(res, 200, 'Notificaciones consultadas correctamente.', data);
    } catch (error) {
      return next(error);
    }
  },

  async getNotification(req, res, next) {
    try {
      const data = await notificationService.getNotificationById(
        req.user,
        req.params.id,
      );

      return ok(res, 200, 'Notificación consultada correctamente.', data);
    } catch (error) {
      return next(error);
    }
  },

  async markNotificationAsRead(req, res, next) {
    try {
      const data = await notificationService.markAsRead(req.user, req.params.id);

      return ok(res, 200, 'Notificación marcada como leída.', data);
    } catch (error) {
      return next(error);
    }
  },
};

module.exports = notificationController;