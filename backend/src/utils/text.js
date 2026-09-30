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

/**
 * Normaliza un texto para comparaciones de duplicados: minúsculas, sin
 * tildes, solo letras/números/espacios y espacios únicos. Así "ALUMBRADO
 * PÚBLICO" y "alumbrado publico" se consideran iguales.
 */
const normalizeForCompare = (value) =>
  String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Similitud de Jaccard entre los conjuntos de palabras (tokens) de dos
 * textos normalizados: |A ∩ B| / |A ∪ B|. 1 = textos idénticos en sus
 * palabras; 0 = sin palabras en común.
 */
const tokenizeForCompare = (value) => {
  const normalized = normalizeForCompare(value);

  return normalized ? new Set(normalized.split(' ')) : new Set();
};

const textSimilarity = (left, right) => {
  const a = tokenizeForCompare(left);
  const b = tokenizeForCompare(right);

  if (a.size === 0 || b.size === 0) {
    return 0;
  }

  let intersection = 0;

  for (const token of a) {
    if (b.has(token)) {
      intersection += 1;
    }
  }

  const union = a.size + b.size - intersection;

  return union === 0 ? 0 : intersection / union;
};

/**
 * Máximo de letras iguales seguidas permitidas en un campo de texto
 * ("aaa" ya es relleno del teclado). Dos seguidas sí se aceptan porque son
 * normales en español: "ll" en Castillo, "rr" en Barrow.
 */
const MAX_REPEATED_LETTERS_RUN = 2;

/**
 * true si el texto tiene más de `maxRun` letras iguales consecutivas
 * ("aaa", "lloo…", "bbbb"). Detecta el relleno con teclado en lugar de
 * escribir en serio, sin falsos positivos con nombres españoles
 * legítimos: "Castillo" y "Reyes" tienen "ll" y no "lll".
 *
 * Los espacios, guiones y apóstrofos cortan la serie (son separadores de
 * palabras) y las mayúsculas/minúsculas no cambian el resultado.
 */
const hasExcessiveRepeatedLetters = (
  value,
  maxRun = MAX_REPEATED_LETTERS_RUN,
) => {
  const text = String(value ?? '').toLowerCase();
  let run = 0;
  let previous = '';

  for (const char of text) {
    const isLetter = /\p{L}|\p{M}/u.test(char);

    if (isLetter && char === previous) {
      run += 1;

      if (run > maxRun) {
        return true;
      }
    } else {
      run = isLetter ? 1 : 0;
    }

    previous = char;
  }

  return false;
};

/**
 * true si el texto contiene espacios en blanco inútiles: dos o más
 * seguidos, al principio o al final. Evita que "  Juan   Perez  " pase
 * como un nombre válido y luego se duplique al guardarse.
 */
const hasUselessSpaces = (value) => {
  const text = String(value ?? '');

  return text !== text.trim() || / {2,}/.test(text.trim());
};

module.exports = {
  normalizeText,
  sanitizeSearchTerm,
  normalizeForCompare,
  textSimilarity,
  MAX_REPEATED_LETTERS_RUN,
  hasExcessiveRepeatedLetters,
  hasUselessSpaces,
};