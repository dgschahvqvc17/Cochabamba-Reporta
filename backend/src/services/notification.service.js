/**
 * Servicio de notificaciones (MVC - Service).
 *
 * Lógica de negocio del módulo de notificaciones:
 *   - Listar las notificaciones del usuario autenticado (ciudadano),
 *     ordenadas de la más reciente a la más antigua, con el código del
 *     incidente asociado.
 * Incluye la validación de sesión y el límite de resultados.
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

    return {
      notifications: notifications.map(toPublicNotification),
    };
  },
};

module.exports = notificationService;