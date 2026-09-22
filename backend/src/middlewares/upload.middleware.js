/**
 * Middleware de carga de evidencias (MVC - middlewares).
 *
 * HU07 — Adjuntar evidencia fotográfica.
 * Procesa la imagen enviada como multipart/form-data (campo "image")
 * con multer en memoria y valida:
 *   - Formato (MIME y extensión permitidos).
 *   - Tamaño máximo (MAX_IMAGE_SIZE).
 *   - Cantidad por solicitud (máx. 1).
 * Los errores de multer se traducen a la respuesta estándar
 * { success, message, error }. Sin lógica de negocio.
 *
 * @format
 */

'use strict';

const multer = require('multer');

const { fail } = require('../utils/response');
const { buildError } = require('../utils/errors');
const {
  ALLOWED_MIME_TYPES,
  ALLOWED_EXTENSIONS,
  MAX_IMAGE_SIZE,
  formatFileSize,
} = require('../utils/evidence');

const EVIDENCE_FIELD = 'image';

const hasAllowedExtension = (file) => {
  const name = String((file && file.originalname) || '').toLowerCase();
  return ALLOWED_EXTENSIONS.some((extension) => name.endsWith(extension));
};

const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_IMAGE_SIZE,
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(
        buildError(
          'El formato de la imagen no es válido. Solo se permiten JPG, JFIF, PNG y WebP.',
          422,
          'INVALID_IMAGE_FORMAT',
          'image',
        ),
      );
    }

    if (!hasAllowedExtension(file)) {
      return cb(
        buildError(
          'La extensión de la imagen no es válida. Usa .jpg, .jpeg, .jfif, .png o .webp.',
          422,
          'INVALID_IMAGE_FORMAT',
          'image',
        ),
      );
    }

    return cb(null, true);
  },
});

const uploadSingleEvidenceImage = (req, res, next) => {
  uploadImage.single(EVIDENCE_FIELD)(req, res, (err) => {
    if (!err) {
      return next();
    }

    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return fail(
          res,
          422,
          `La imagen supera el tamaño máximo permitido (${formatFileSize(
            MAX_IMAGE_SIZE,
          )}).`,
          'IMAGE_TOO_LARGE',
        );
      }

      if (err.code === 'LIMIT_FILE_COUNT') {
        return fail(
          res,
          422,
          'Solo se permite adjuntar una imagen por solicitud.',
          'INVALID_IMAGE_COUNT',
        );
      }

      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return fail(
          res,
          422,
          'Campo de archivo no esperado. Envía la imagen en el campo "image".',
          'INVALID_IMAGE_FIELD',
        );
      }
    }

    return next(err);
  });
};

module.exports = { uploadSingleEvidenceImage, EVIDENCE_FIELD };