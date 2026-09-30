/**
 * Controlador de atención y cierre de incidentes (MVC - Controller).
 *
 * HU13 — Atender y cerrar incidente (personal de solución):
 *   - listAssignedForSolution: cola del responsable asignado.
 *   - attendIncident: inicia la atención (EN_ATENCION).
 *   - markAttended: marca el incidente como atendido (ATENDIDO).
 *   - closeIncident: cierra la solicitud (CERRADO).
 *   - La evidencia del trabajo realizado se adjunta por
 *     POST /:id/evidence (evidence.controller).
 *
 * Capa de presentación HTTP: delega en solutionService y responde
 * estandarizado con `ok()`.
 *
 * @format
 */

'use strict';

const solutionService = require('../services/solution.service');
const { ok } = require('../utils/response');

const solutionController = {
  async listAssignedForSolution(req, res, next) {
    try {
      const data = await solutionService.listAssignedForSolution(
        req.user,
        req.query,
      );

      return ok(
        res,
        200,
        'Incidentes asignados para atención consultados correctamente.',
        data,
      );
    } catch (error) {
      return next(error);
    }
  },

  async attendIncident(req, res, next) {
    try {
      const data = await solutionService.attendIncident(
        req.user,
        req.params.id,
        req.body,
      );

      return ok(res, 200, 'Atención del incidente iniciada correctamente.', data);
    } catch (error) {
      return next(error);
    }
  },

  async markAttended(req, res, next) {
    try {
      const data = await solutionService.markAttended(
        req.user,
        req.params.id,
        req.body,
      );

      return ok(res, 200, 'Incidente marcado como atendido correctamente.', data);
    } catch (error) {
      return next(error);
    }
  },

  async closeIncident(req, res, next) {
    try {
      const data = await solutionService.closeIncident(
        req.user,
        req.params.id,
        req.body,
      );

      return ok(res, 200, 'Incidente cerrado correctamente.', data);
    } catch (error) {
      return next(error);
    }
  },
};

module.exports = solutionController;