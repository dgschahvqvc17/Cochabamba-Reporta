/**
 * Servicio de notificaciones (MVC - Service).
 *
 * Lógica de negocio del módulo de notificaciones (HU14):
 *   - Listar las notificaciones del usuario autenticado (ciudadano),
 *     ordenadas de la más reciente a la más antigua, con el código del
 *     incidente asociado y el total de no leídas (para alertas).
 *   - Consultar el detalle de una notificación propia.
 *   - Marcar una notificación propia como leída.
 * Incluye la validación de sesión, la pertenencia de la notificación
 * (solo su dueño; evita filtraciones a otros ciudadanos) y el límite.
 *
 * @format
 */

'use strict';

const notificationRepository = require('../repositories/notification.repository');
const { buildError } = require('../utils/errors');

const MAX_NOTIFICATIONS = 50;

const toPublicNotification = (notification) => ({
  id: notification.id,
  incidentId: notification.incident_id,
  incidentCode: notification.incident ? notification.incident.code : null,
  message: notification.message,
  read: notification.read,
  createdAt: notification.created_at,
});

/**
 * Valida que la notificación exista y pertenezca al usuario autenticado
 * (HU14: evitar notificar/consultar notificaciones ajenas).
 */
const findOwnedNotification = async (userId, notificationId) => {
  const notification = await notificationRepository.findById(notificationId);

  if (!notification) {
    throw buildError(
      'La notificación no existe.',
      404,
      'NOTIFICATION_NOT_FOUND',
    );
  }

  if (Number(notification.user_id) !== Number(userId)) {
    throw buildError(
      'Solo puedes consultar tus propias notificaciones.',
      403,
      'FORBIDDEN',
    );
  }

  return notification;
};

const notificationService = {
  async listNotifications(user, query = {}) {
    const userId = user && user.id;

    if (!userId) {
      throw buildError(
        'Debe iniciar sesión para consultar sus notificaciones.',
        401,
        'AUTHENTICATION_REQUIRED',
      );
    }

    let limit = MAX_NOTIFICATIONS;
    const parsedLimit = Number.parseInt(query.limit, 10);

    if (Number.isInteger(parsedLimit) && parsedLimit >= 1 && parsedLimit <= MAX_NOTIFICATIONS) {
      limit = parsedLimit;
    }

    const notifications = await notificationRepository.findByUser({
      userId,
      limit,
    });
    const unreadCount = await notificationRepository.countUnreadByUser(userId);

    return {
      notifications: notifications.map(toPublicNotification),
      unreadCount,
    };
  },

  async getNotificationById(user, notificationId) {
    const userId = user && user.id;

    if (!userId) {
      throw buildError(
        'Debe iniciar sesión para consultar la notificación.',
        401,
        'AUTHENTICATION_REQUIRED',
      );
    }

    const notification = await findOwnedNotification(userId, notificationId);

    return toPublicNotification(notification);
  },

  async markAsRead(user, notificationId) {
    const userId = user && user.id;

    if (!userId) {
      throw buildError(
        'Debe iniciar sesión para marcar la notificación como leída.',
        401,
        'AUTHENTICATION_REQUIRED',
      );
    }

    await findOwnedNotification(userId, notificationId);

    const updated = await notificationRepository.markAsRead(notificationId);

    return toPublicNotification(updated);
  },
};

module.exports = notificationService;