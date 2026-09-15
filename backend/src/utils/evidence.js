/**
 * Constantes de evidencias fotográficas (MVC - utils).
 *
 * HU07 — Adjuntar evidencia fotográfica.
 * Centraliza las reglas de las imágenes para evitar valores mágicos
 * (principio DRY). Se usan en el middleware de carga, en el service
 * y en los mensajes de error.
 *
 * @format
 */

'use strict';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

/** Tamaño máximo de una imagen en bytes (5 MB). */
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

/** Cantidad máxima de imágenes por incidente. */
const MAX_EVIDENCE_COUNT = 5;

/** Nombre del bucket de Supabase Storage para las evidencias. */
const EVIDENCE_BUCKET = 'evidence';

const MIME_TO_EXTENSION = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const EXTENSION_TO_MIME = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

const extensionFromMime = (mimeType) =>
  MIME_TO_EXTENSION[mimeType] || '.jpg';

const mimeFromExtension = (fileName) => {
  const name = String(fileName || '').toLowerCase();
  const ext = name.substring(name.lastIndexOf('.'));
  return EXTENSION_TO_MIME[ext] || null;
};

const formatFileSize = (bytes) => {
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) {
    return `${mb.toFixed(1).replace(/\.0$/, '')} MB`;
  }
  return `${Math.round(bytes / 1024)} KB`;
};

module.exports = {
  ALLOWED_MIME_TYPES,
  ALLOWED_EXTENSIONS,
  MAX_IMAGE_SIZE,
  MAX_EVIDENCE_COUNT,
  EVIDENCE_BUCKET,
  extensionFromMime,
  mimeFromExtension,
  formatFileSize,
};