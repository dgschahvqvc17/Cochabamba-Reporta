/**
 * Controlador de ubicaciones (MVC - Controller).
 *
 * HU08 — Registrar ubicación del incidente (ciudadano).
 *
 * Capa de presentación HTTP: recibe la solicitud y el payload, delega en
 * locationService y responde estandarizado con `ok()`.
 *
 * @format
 */

'use strict';

const locationService = require('../services/location.service');
const { ok } = require('../utils/response');

const locationController = {
  async addLocation(req, res, next) {
    try {
      const location = await locationService.addLocation(
        req.user,
        req.params.id,
        req.body,
      );

      return ok(res, 201, 'Ubicación registrada correctamente.', {
        location,
      });
    } catch (error) {
      return next(error);
    }
  },
};

module.exports = locationController;