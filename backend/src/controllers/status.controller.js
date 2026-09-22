/**
 * Controlador del ciclo de vida del incidente (MVC - Controller).
 *
 * Transición de estados (transiciones autorizadas por rol):
 *   - PATCH /incidents/:id/status → cambiar estado (con historial y
 *     notificación).
 *   - GET  /incidents/:id/history → historial de cambios de estado.
 *
 * Capa de presentación HTTP: delega en statusService y responde
 * estandarizado con `ok()`.
 *
 * @format
 */

'use strict';

const statusService = require('../services/status.service');
const { ok } = require('../utils/response');

const statusController = {
  async changeIncidentStatus(req, res, next) {
    try {
      const incident = await statusService.changeIncidentStatus(
        req.user,
        req.params.id,
        req.body,
      );

      return ok(res, 200, 'Estado del incidente actualizado correctamente.', {
        incident,
      });
    } catch (error) {
      return next(error);
    }
  },

  async getIncidentHistory(req, res, next) {
    try {
      const data = await statusService.getIncidentHistory(
        req.user,
        req.params.id,
      );

      return ok(
        res,
        200,
        'Historial del incidente consultado correctamente.',
        data,
      );
    } catch (error) {
      return next(error);
    }
  },
};

module.exports = statusController;