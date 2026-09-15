/**
 * Rutas de incidentes (MVC - Routes).
 *
 * HU06 — Registro de incidentes por parte del ciudadano:
 *   - POST /api/v1/incidents                     → crear (ciudadano).
 *   - GET  /api/v1/incidents/:id                 → consultar por id (incluye evidencia).
 * HU07 — Adjuntar evidencia fotográfica:
 *   - POST /api/v1/incidents/:id/evidence        → adjuntar imagen (ciudadano).
 * HU08 — Registrar ubicación del incidente:
 *   - POST /api/v1/incidents/:id/location        → registrar ubicación (ciudadano).
 * Editar / eliminar reporte (solo estado REPORTADO y edición única):
 *   - PATCH /api/v1/incidents/:id                → editar (ciudadano).
 *   - DELETE /api/v1/incidents/:id               → eliminar (ciudadano).
 * Sigue el patrón de category.routes.js (router + authenticate +
 * requireRole + validate). Solo enrutan, sin lógica de negocio.
 *
 * @format
 */

'use strict';

const express = require('express');

const incidentController = require('../controllers/incident.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');
const { validate } = require('../middlewares/validation.middleware');
const {
  uploadSingleEvidenceImage,
} = require('../middlewares/upload.middleware');
const {
  createIncidentValidation,
  listIncidentsValidation,
} = require('../validators/incident.validator');
const {
  locationValidation,
} = require('../validators/location.validator');
const ROLES = require('../utils/roles');

const router = express.Router();

router.post(
  '/',
  authenticate,
  requireRole(ROLES.CIUDADANO),
  validate(createIncidentValidation),
  incidentController.createIncident,
);

router.get(
  '/',
  authenticate,
  validate(listIncidentsValidation),
  incidentController.listIncidents,
);

router.post(
  '/:id/evidence',
  authenticate,
  requireRole(ROLES.CIUDADANO),
  uploadSingleEvidenceImage,
  incidentController.addEvidence,
);

router.post(
  '/:id/location',
  authenticate,
  requireRole(ROLES.CIUDADANO),
  validate(locationValidation),
  incidentController.addLocation,
);

router.patch(
  '/:id',
  authenticate,
  requireRole(ROLES.CIUDADANO),
  validate(createIncidentValidation),
  incidentController.updateIncident,
);

router.delete(
  '/:id',
  authenticate,
  requireRole(ROLES.CIUDADANO),
  incidentController.deleteIncident,
);

router.get('/:id', authenticate, incidentController.getIncidentById);

module.exports = router;
