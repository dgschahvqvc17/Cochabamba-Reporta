/**
 * Rutas de notificaciones (MVC - Routes).
 *
 * HU14:
 *   - GET    /api/v1/notifications       → listar las del ciudadano autenticado.
 *   - GET    /api/v1/notifications/:id   → detalle de una notificación propia.
 *   - PATCH  /api/v1/notifications/:id/read → marcar como leída (propia).
 * No contiene lógica de negocio.
 *
 * @format
 */

'use strict';

const express = require('express');

const notificationController = require('../controllers/notification.controller');
const { authenticate } = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/', authenticate, notificationController.listNotifications);
router.get('/:id', authenticate, notificationController.getNotification);
router.patch('/:id/read', authenticate, notificationController.markNotificationAsRead);

module.exports = router;