/**
 * Controlador de evidencias (MVC - Controller).
 *
 * HU07 — Adjuntar evidencia fotográfica (ciudadano).
 * HU11 — Evidencia de la constatación en campo (verificador).
 *
 * Capa de presentación HTTP: recibe el archivo (req.file) subido por
 * uploadSingleEvidenceImage y el incidente (req.params.id), delega en
 * evidenceService y responde estandarizado con `ok()`.
 *
 * @format
 */

'use strict';

const evidenceService = require('../services/evidence.service');
const { ok } = require('../utils/response');

const evidenceController = {
  async addEvidence(req, res, next) {
    try {
      const evidence = await evidenceService.addEvidence(
        req.user,
        req.params.id,
        req.file,
      );

      return ok(res, 201, 'Evidencia adjuntada correctamente.', {
        evidence,
      });
    } catch (error) {
      return next(error);
    }
  },
};

module.exports = evidenceController;