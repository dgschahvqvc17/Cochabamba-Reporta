/**
 * Rutas de notificaciones (MVC - Routes).
 *
 *   - GET /api/v1/notifications → listar las notificaciones del
 *     usuario autenticado (ciudadano).
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

module.exports = router;