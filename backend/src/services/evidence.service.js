/**
 * Servicio de evidencias (MVC - Service).
 *
 * HU07 — Adjuntar evidencia fotográfica:
 *   - Valida autenticación, existencia y propiedad del incidente.
 *   - Valida formato/tamaño de la imagen y el límite por incidente.
 *   - Delega la subida a Supabase Storage en storage.repository.
 *   - Registra la referencia en la tabla `evidence`.
 * HU11 — El verificador adjunta la evidencia de la constatación en campo
 * mientras el incidente está en verificación.
 *
 * @format
 */

'use strict';

const incidentRepository = require('../repositories/incident.repository');
const evidenceRepository = require('../repositories/evidence.repository');
const storageRepository = require('../repositories/storage.repository');
const ROLES = require('../utils/roles');
const { buildError } = require('../utils/errors');
const {
  MAX_IMAGE_SIZE,
  MAX_EVIDENCE_COUNT,
  detectImageMime,
} = require('../utils/evidence');
const { INCIDENT_STATUS } = require('../utils/incidentStatus');
const { toPublicEvidence } = require('../utils/incidentMappers');
const assignmentService = require('./assignment.service');

const evidenceService = {
  /**
   * Adjunta una imagen como evidencia de un incidente.
   * El ciudadano solo en sus reportes; el verificador (o administrador)
   * mientras el incidente esté en verificación y le esté asignado.
   */
  async addEvidence(user, incidentId, file) {
    const userId = user && user.id;

    if (!userId) {
      throw buildError(
        'Debe iniciar sesión para adjuntar evidencia.',
        401,
        'AUTHENTICATION_REQUIRED',
      );
    }

    const incident = await incidentRepository.findById(incidentId);

    if (!incident) {
      throw buildError('El incidente no existe.', 404, 'INCIDENT_NOT_FOUND');
    }

    const isOwner = Number(incident.user_id) === Number(userId);
    const isVerificationStaff = user
      ? [ROLES.VERIFICADOR, ROLES.ADMINISTRADOR].includes(user.role)
      : false;

    if (!isOwner) {
      if (!isVerificationStaff) {
        throw buildError(
          'Solo puedes adjuntar evidencia a tus propios incidentes.',
          403,
          'FORBIDDEN',
        );
      }

      // HU11: el verificador adjunta evidencia de la constatación en campo.
      if (incident.status !== INCIDENT_STATUS.EN_VERIFICACION) {
        throw buildError(
          'La evidencia de verificación solo puede adjuntarse mientras el incidente está en verificación.',
          409,
          'INVALID_TRANSITION',
        );
      }

      if (!(await assignmentService.isVerificationAssignee(user, incident.id))) {
        throw buildError(
          'Este incidente no está asignado a ti para verificación.',
          403,
          'FORBIDDEN',
        );
      }
    }

    if (!file || !file.buffer) {
      throw buildError(
        'Debe adjuntar una imagen como evidencia.',
        422,
        'VALIDATION_ERROR',
        'image',
      );
    }

    // El formato se determina por el contenido real (magic bytes), no por
    // el mimetype/extensión que reporte el cliente.
    const detectedMime = detectImageMime(file.buffer);

    if (!detectedMime) {
      throw buildError(
        'El formato de la imagen no es válido. Solo se permiten JPG, JFIF, PNG y WebP.',
        422,
        'VALIDATION_ERROR',
        'image',
      );
    }

    if (file.size > MAX_IMAGE_SIZE) {
      throw buildError(
        'La imagen supera el tamaño máximo permitido (5 MB).',
        422,
        'VALIDATION_ERROR',
        'image',
      );
    }

    const currentCount = await evidenceRepository.countByIncident(
      Number(incidentId),
    );

    if (currentCount >= MAX_EVIDENCE_COUNT) {
      throw buildError(
        `Solo puedes adjuntar hasta ${MAX_EVIDENCE_COUNT} imágenes por incidente.`,
        422,
        'EVIDENCE_LIMIT_REACHED',
        'image',
      );
    }

    const { storagePath, publicUrl } = await storageRepository.uploadEvidence({
      incidentId: incident.id,
      mimeType: detectedMime,
      buffer: file.buffer,
    });

    const created = await evidenceRepository.create({
      incidentId: incident.id,
      url: publicUrl,
      storagePath,
      mimeType: detectedMime,
      sizeBytes: file.size,
      uploadedBy: userId,
    });

    return toPublicEvidence(created);
  },
};

module.exports = evidenceService;