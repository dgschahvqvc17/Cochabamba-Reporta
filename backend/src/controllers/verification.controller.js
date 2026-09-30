/**
 * Controlador de verificación de incidentes (MVC - Controller).
 *
 * HU11 — Verificar incidente (personal de verificación):
 *   - listAssignedForVerification: cola del verificador asignado.
 *   - verifyIncident: decisión VERIFICADO/RECHAZADO (la evidencia en
 *     campo se adjunta por POST /:id/evidence → evidence.controller).
 *
 * Capa de presentación HTTP: delega en verificationService y responde
 * estandarizado con `ok()`.
 *
 * @format
 */

'use strict';

const verificationService = require('../services/verification.service');
const { ok } = require('../utils/response');

const verificationController = {
  async listAssignedForVerification(req, res, next) {
    try {
      const data = await verificationService.listAssignedForVerification(
        req.user,
        req.query,
      );

      return ok(
        res,
        200,
        'Incidentes asignados para verificación consultados correctamente.',
        data,
      );
    } catch (error) {
      return next(error);
    }
  },

  async verifyIncident(req, res, next) {
    try {
      const data = await verificationService.verifyIncident(
        req.user,
        req.params.id,
        req.body,
      );

      return ok(res, 200, 'Incidente verificado correctamente.', data);
    } catch (error) {
      return next(error);
    }
  },
};

module.exports = verificationController;