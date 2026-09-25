/**
 * Controlador del dashboard de supervisión (HU15 - MVC Controller).
 *
 * Capa de presentación: recibe `req.user` (ya autenticado y con rol
 * ADMINISTRADOR por `requireRole` en las rutas), delega la agregación
 * en `dashboardService.buildDashboardSnapshot` y responde con `ok()`.
 * Sin lógica de negocio propia (la tiene el service).
 *
 * @format
 */

'use strict';

const dashboardService = require('../services/dashboard.service');
const { ok } = require('../utils/response');

const dashboardController = {
  async getDashboard(req, res, next) {
    try {
      const snapshot = await dashboardService.buildDashboardSnapshot({
        user: req.user,
      });

      return ok(
        res,
        200,
        'Indicadores del sistema consultados correctamente.',
        snapshot,
      );
    } catch (error) {
      return next(error);
    }
  },
};

module.exports = dashboardController;
