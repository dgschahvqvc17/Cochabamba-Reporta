/**
 * Repositorio de Supabase Storage (MVC - Repository).
 *
 * HU07 — Adjuntar evidencia fotográfica.
 * Responsable únicamente de la comunicación con Supabase Storage:
 * subida, URL pública y eliminación de evidencias. Aísla la
 * implementación de Storage del resto de la lógica (principio DRY y
 * separación de responsabilidades).
 *
 * @format
 */

'use strict';

const crypto = require('crypto');

const { supabaseAdmin } = require('../config/supabase');
const { buildError } = require('../utils/errors');
const {
  EVIDENCE_BUCKET,
  extensionFromMime,
} = require('../utils/evidence');

const randomToken = (bytes) => crypto.randomBytes(bytes).toString('hex');

const buildStoragePath = (incidentId, mimeType) => {
  const extension = extensionFromMime(mimeType);
  return `incidents/${incidentId}/${Date.now()}-${randomToken(6)}${extension}`;
};

/**
 * Sube una imagen al bucket de evidencias y devuelve el path de
 * almacenamiento y su URL pública.
 */
const uploadEvidence = async ({ incidentId, mimeType, buffer }) => {
  const storagePath = buildStoragePath(incidentId, mimeType);

  const { error: uploadError } = await supabaseAdmin.storage
    .from(EVIDENCE_BUCKET)
    .upload(storagePath, buffer, {
      contentType: mimeType,
      upsert: false,
    });

  if (uploadError) {
    throw buildError(
      'No se pudo almacenar la imagen.',
      500,
      'EVIDENCE_UPLOAD_ERROR',
    );
  }

  const { data: publicUrlData } = supabaseAdmin.storage
    .from(EVIDENCE_BUCKET)
    .getPublicUrl(storagePath);

  return {
    storagePath,
    publicUrl: publicUrlData && publicUrlData.publicUrl,
  };
};

/**
 * Elimina las evidencias del bucket. `storagePaths` debe ser un array
 * de paths (vacío o nulo se ignora).
 */
const removeEvidence = async (storagePaths) => {
  const paths = Array.isArray(storagePaths)
    ? storagePaths.filter(Boolean)
    : [];

  if (paths.length === 0) {
    return;
  }

  const { error } = await supabaseAdmin.storage
    .from(EVIDENCE_BUCKET)
    .remove(paths);

  if (error) {
    throw error;
  }
};

module.exports = {
  uploadEvidence,
  removeEvidence,
};