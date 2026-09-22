/**
 * Controlador de incidentes (MVC - Controller).
 *
 * HU06 — Registro de incidentes por parte del ciudadano.
 * HU09 — Consultar y gestionar incidentes (personal municipal).
 * Editar / eliminar el reporte del ciudadano (estado REPORTADO, edición única).
 *
 * Es la capa de presentación HTTP. Recibe la solicitud, extrae el usuario
 * autenticado (req.user) y el payload, delega en incidentService y devuelve
 * la respuesta estandarizada con `ok()` de utils/response. No contiene lógica
 * de negocio (el service la tiene).
 *
 * La evidencia (HU07), la ubicación (HU08), la asignación a verificación
 * (HU10), la verificación (HU11) y la transición de estados viven en sus
 * propios controllers (evidence, location, assignment, verification, status).
 *
 * Replica el patrón de category.controller.js (try/next + ok + toPublic).
 *
 * @format
 */

'use strict';

const incidentService = require('../services/incident.service');
const { ok } = require('../utils/response');

const incidentController = {
  async createIncident(req, res, next) {
    try {
      const incident = await incidentService.createIncident(
        req.user,
        req.body,
      );

      return ok(res, 201, 'Incidente registrado correctamente.', {
        incident,
      });
    } catch (error) {
      return next(error);
    }
  },

  async getIncidentById(req, res, next) {
    try {
      const incident = await incidentService.getIncidentById(
        req.params.id,
        req.user,
      );

      return ok(res, 200, 'Incidente consultado correctamente.', {
        incident,
      });
    } catch (error) {
      return next(error);
    }
  },

  async listIncidents(req, res, next) {
    try {
      const data = await incidentService.listIncidents(req.user, req.query);

      return ok(res, 200, 'Incidentes consultados correctamente.', data);
    } catch (error) {
      return next(error);
    }
  },

  async updateIncident(req, res, next) {
    try {
      const incident = await incidentService.updateIncident(
        req.user,
        req.params.id,
        req.body,
      );

      return ok(res, 200, 'Reporte editado correctamente.', { incident });
    } catch (error) {
      return next(error);
    }
  },

  async deleteIncident(req, res, next) {
    try {
      const deleted = await incidentService.deleteIncident(
        req.user,
        req.params.id,
      );

      return ok(res, 200, 'Reporte eliminado correctamente.', deleted);
    } catch (error) {
      return next(error);
    }
  },
};

module.exports = incidentController;