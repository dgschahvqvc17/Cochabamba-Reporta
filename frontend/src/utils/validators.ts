/**
 * Validaciones de los datos que escriben los usuarios (HU01, HU03, HU06).
 *
 * Mismas reglas que el backend (utils/text.js y utils/userRules.js): el
 * frontend valida en vivo para explicar el error al instante, pero el
 * backend siempre vuelve a validar.
 *
 * @format
 */

export const MIN_PASSWORD_LENGTH = 8;

/** Longitudes de nombre y apellido (persona real, no texto libre). */
export const MIN_NAME_LENGTH = 2;
export const MAX_NAME_LENGTH = 30;
export const MIN_LAST_NAME_LENGTH = 2;
export const MAX_LAST_NAME_LENGTH = 40;

/** Dirección de residencia del ciudadano. */
export const MAX_ADDRESS_LENGTH = 200;

/**
 * Máximo de letras iguales seguidas permitidas. Dos seguidas sí se aceptan
 * porque son normales en español: "ll" en Castillo, "rr" en Barrow.
 */
export const MAX_REPEATED_LETTERS_RUN = 2;

export const isValidEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

export const isValidPhone = (phone: string): boolean =>
  /^\d{7,8}$/.test(phone.trim());

export const isValidIdentityNumber = (identityNumber: string): boolean =>
  /^\d{5,8}$/.test(identityNumber.trim());

export const isValidPassword = (password: string): boolean =>
  password.length >= MIN_PASSWORD_LENGTH;

/**
 * Deja únicamente dígitos en el texto (útil para teléfono y carnet).
 * Evita que el usuario escriba letras o símbolos en campos numéricos.
 */
export const onlyDigits = (value: string): string =>
  value.replace(/\D/g, '');

/**
 * Deja únicamente letras (incluye acentos y ñ), espacios, apóstrofos y
 * guiones (útil para nombres y apellidos compuestos).
 */
export const onlyLetters = (value: string): string =>
  value.replace(/[^\p{L}\p{M}\s'’-]/gu, '');

/**
 * Colapsa los espacios en blanco de más ("Juan   Perez" → "Juan Perez").
 *
 * No recorta el texto a propósito: se aplica mientras el usuario escribe, y
 * quitar el espacio final impediría empezar la siguiente palabra. El recorte
 * se hace al validar y al enviar.
 */
export const singleSpaced = (value: string): string =>
  value.replace(/[^\S\n]+/g, ' ').replace(/[ \t]{2,}/g, ' ');

/**
 * true si el texto tiene más de `maxRun` letras iguales seguidas
 * ("aaa", "lllooo"). Los espacios, guiones y apóstrofos cortan la serie y
 * las mayúsculas no cambian el resultado.
 */
export const hasRepeatedLetters = (
  value: string,
  maxRun: number = MAX_REPEATED_LETTERS_RUN,
): boolean => {
  const text = value.toLowerCase();
  let run = 0;
  let previous = '';

  for (const char of text) {
    const isLetter = /[\p{L}\p{M}]/u.test(char);

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

/** Mensaje de error para un campo con letras repetidas. */
export const repeatedLettersMessage = (label: string): string =>
  `${label} no puede tener más de ${MAX_REPEATED_LETTERS_RUN} letras iguales seguidas. Revisa que esté bien escrito.`;

/**
 * Valida un nombre o un apellido: obligatorio, largo correcto, sin letras
 * repetidas. Devuelve el mensaje de error o null si está bien. Los mínimos y
 * máximos son los mismos del backend (utils/userRules.js).
 */
export const validatePersonName = (
  value: string,
  label: string,
  maxLength: number = MAX_NAME_LENGTH,
): string | null => {
  const text = value.trim();

  if (!text) return `${label} es obligatorio.`;
  if (text.length < MIN_NAME_LENGTH || text.length > maxLength) {
    return `${label} debe tener entre ${MIN_NAME_LENGTH} y ${maxLength} caracteres.`;
  }
  if (hasRepeatedLetters(text)) {
    return repeatedLettersMessage(label);
  }

  return null;
};

/** Convierte DD/MM/AAAA a AAAA-MM-DD y valida que la fecha sea real. */
export const parseBirthDate = (value: string): string | null => {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());

  if (!match) {
    return null;
  }

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

export const isValidAdultBirthDate = (value: string): string | null => {
  const iso = parseBirthDate(value);

  if (!iso) {
    return null;
  }

  const birthDate = new Date(iso + 'T00:00:00');
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age -= 1;
  }

  return age >= 18 ? iso : null;
};