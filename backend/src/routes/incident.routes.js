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
 * HU09 — Consultar y gestionar incidentes (personal municipal):
 *   - GET  /api/v1/incidents                     → listar con búsqueda, filtros
 *                                                 (estado, categoría, fecha) y
 *                                                 paginación (rol-aware).
 *   - GET  /api/v1/incidents/:id                 → consultar detalle (incluye
 *                                                 ciudadano, ubicación y evidencia).
 * HU10 — Asignar incidente para verificación:
 *   - GET  /api/v1/incidents/verifiers    → funcionarios de verificación
 *                                             (encargado de recepción).
 *   - GET  /api/v1/incidents/pending-verification → incidentes pendientes
 *                                             de verificación (REPORTADO/RECIBIDO).
 *   - POST /api/v1/incidents/:id/assign-verification → asignar a verificación
 *                                             (cambia a EN_VERIFICACION).
 * HU11 — Verificar incidente (personal de verificación):
 *   - GET  /api/v1/incidents/assigned-verification → incidentes asignados
 *                                             al verificador.
 *   - POST /api/v1/incidents/:id/verify → registrar decisión de verificación
 *                                             (VERIFICADO/RECHAZADO).
 *   - POST /api/v1/incidents/:id/evidence → evidencia del verificador/ciudadano.
 * Transición de estados:
 *   - PATCH /api/v1/incidents/:id/status    → cambiar estado (transiciones
 *                                             autorizadas por rol, con
 *                                             historial y notificación).
 *   - GET  /api/v1/incidents/:id/history    → historial de cambios de estado.
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
const evidenceController = require('../controllers/evidence.controller');
const locationController = require('../controllers/location.controller');
const assignmentController = require('../controllers/assignment.controller');
const verificationController = require('../controllers/verification.controller');
const statusController = require('../controllers/status.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');
const { validate } = require('../middlewares/validation.middleware');
const {
  uploadSingleEvidenceImage,
} = require('../middlewares/upload.middleware');
const {
  createIncidentValidation,
  listIncidentsValidation,
  assignVerificationValidation,
  changeStatusValidation,
  verifyIncidentValidation,
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

/** HU10 — Funcionarios de verificación disponibles (encargado de recepción). */
router.get(
  '/verifiers',
  authenticate,
  requireRole(ROLES.RECEPCION, ROLES.ADMINISTRADOR),
  assignmentController.listVerifiers,
);

/** HU10 — Incidentes pendientes de verificación (REPORTADO/RECIBIDO). */
router.get(
  '/pending-verification',
  authenticate,
  requireRole(ROLES.RECEPCION, ROLES.ADMINISTRADOR),
  assignmentController.listPendingVerification,
);

/** HU11 — Incidentes asignados al verificador para su verificación. */
router.get(
  '/assigned-verification',
  authenticate,
  requireRole(ROLES.VERIFICADOR, ROLES.ADMINISTRADOR),
  validate(listIncidentsValidation),
  verificationController.listAssignedForVerification,
);

/** HU11 — Verificar un incidente asignado (VERIFICADO/RECHAZADO). */
router.post(
  '/:id/verify',
  authenticate,
  requireRole(ROLES.VERIFICADOR, ROLES.ADMINISTRADOR),
  validate(verifyIncidentValidation),
  verificationController.verifyIncident,
);

/** HU10 — Asignar un incidente a verificación. */
router.post(
  '/:id/assign-verification',
  authenticate,
  requireRole(ROLES.RECEPCION, ROLES.ADMINISTRADOR),
  validate(assignVerificationValidation),
  assignmentController.assignVerification,
);

/** Transición de estado (transiciones autorizadas por rol). */
router.patch(
  '/:id/status',
  authenticate,
  requireRole(ROLES.RECEPCION, ROLES.ADMINISTRADOR),
  validate(changeStatusValidation),
  statusController.changeIncidentStatus,
);

/** Historial de cambios de estado del incidente. */
router.get(
  '/:id/history',
  authenticate,
  requireRole(
    ROLES.RECEPCION,
    ROLES.VERIFICADOR,
    ROLES.ENCARGADO_SOLUCION,
    ROLES.PERSONAL_SOLUCION,
    ROLES.ADMINISTRADOR,
  ),
  statusController.getIncidentHistory,
);

router.post(
  '/:id/evidence',
  authenticate,
  requireRole(ROLES.CIUDADANO, ROLES.VERIFICADOR, ROLES.ADMINISTRADOR),
  uploadSingleEvidenceImage,
  evidenceController.addEvidence,
);

router.post(
  '/:id/location',
  authenticate,
  requireRole(ROLES.CIUDADANO),
  validate(locationValidation),
  locationController.addLocation,
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
