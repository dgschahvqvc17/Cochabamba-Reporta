/**
 * Controlador de asignación a verificación (MVC - Controller).
 *
 * HU10 — Asignar incidente para verificación (encargado de recepción):
 *   - listVerifiers: funcionarios de verificación disponibles.
 *   - listPendingVerification: incidentes pendientes de verificación.
 *   - assignVerification: asignar incidente a un verificador
 *     (cambia a EN_VERIFICACION).
 *
 * Capa de presentación HTTP: delega en assignmentService y responde
 * estandarizado con `ok()`.
 *
 * @format
 */

'use strict';

const assignmentService = require('../services/assignment.service');
const { ok } = require('../utils/response');

const assignmentController = {
  async listVerifiers(req, res, next) {
    try {
      const data = await assignmentService.listVerifiers(req.user);

      return ok(
        res,
        200,
        'Funcionarios de verificación consultados correctamente.',
        data,
      );
    } catch (error) {
      return next(error);
    }
  },

  async listPendingVerification(req, res, next) {
    try {
      const data = await assignmentService.listPendingVerification(
        req.user,
        req.query,
      );

      return ok(
        res,
        200,
        'Incidentes pendientes de verificación consultados correctamente.',
        data,
      );
    } catch (error) {
      return next(error);
    }
  },

  async assignVerification(req, res, next) {
    try {
      const data = await assignmentService.assignForVerification(
        req.user,
        req.params.id,
        req.body,
      );

      return ok(
        res,
        200,
        'Incidente asignado para verificación correctamente.',
        data,
      );
    } catch (error) {
      return next(error);
    }
  },
};

module.exports = assignmentController;