/**
 * Rutas de incidentes (MVC - Routes).
 *
 * HU06 — Registro de incidentes por parte del ciudadano:
 *   - POST /api/v1/incidents                     → crear (ciudadano).
 *   - GET  /api/v1/incidents/:id                 → consultar por id (incluye evidencia).
 * HU07 — Adjuntar evidencia fotográfica:
 *   - POST /api/v1/incidents/:id/evidence        → adjuntar imagen (ciudadano).
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
} = require('../validators/incident.validator');
const ROLES = require('../utils/roles');

const router = express.Router();

router.post(
  '/',
  authenticate,
  requireRole(ROLES.CIUDADANO),
  validate(createIncidentValidation),
  incidentController.createIncident,
);

router.post(
  '/:id/evidence',
  authenticate,
  requireRole(ROLES.CIUDADANO),
  uploadSingleEvidenceImage,
  incidentController.addEvidence,
);

router.get('/:id', authenticate, incidentController.getIncidentById);

module.exports = router;
