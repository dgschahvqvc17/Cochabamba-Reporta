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

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.jfif', '.png', '.webp'];

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
  '.jfif': 'image/jpeg',
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

/**
 * Detecta el formato real de una imagen leyendo sus bytes de cabecera
 * (magic bytes), sin confiar en el mimetype/extensión que reporta el
 * cliente (que puede ser "image/jpg", "image/jfif", application/octet-stream,
 * etc.). Devuelve el mimetype canónico o null si no es JPG/PNG/WebP.
 */
const detectImageMime = (buffer) => {
  if (!buffer || !Buffer.isBuffer(buffer) || buffer.length < 12) {
    return null;
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'image/png';
  }

  // WebP: RIFF .... WEBP
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return 'image/webp';
  }

  return null;
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
  detectImageMime,
  formatFileSize,
};