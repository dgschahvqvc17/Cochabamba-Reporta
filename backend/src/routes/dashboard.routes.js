/**
 * Rutas del dashboard de supervisión — HU15 (MVC, Routes).
 *
 * Exclusivas del rol ADMINISTRADOR (requiere autenticación + rol),
 * reutilizando `authenticate` y `requireRole` como user.routes.
 *
 * @format
 */

'use strict';

const { Router } = require('express');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');
const ROLES = require('../utils/roles');
const dashboardController = require('../controllers/dashboard.controller');

const router = Router();

router.use(authenticate, requireRole(ROLES.ADMINISTRADOR));

router.get('/', dashboardController.getDashboard);

module.exports = router;
