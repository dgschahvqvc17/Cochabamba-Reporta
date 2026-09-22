/**
 * Helpers de texto y normalización (MVC - utils).
 *
 * Normalización de cadenas y saneamiento de términos de búsqueda.
 * Fuente única para evitar copias en repositorios y services (DRY).
 *
 * @format
 */

'use strict';

const normalizeText = (value) => (value ? String(value).trim() : '');

const sanitizeSearchTerm = (value) =>
  value
    .replace(/[%,]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

module.exports = { normalizeText, sanitizeSearchTerm };