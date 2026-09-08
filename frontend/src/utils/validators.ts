/**
 * Validaciones del registro de ciudadano (HU01).
 *
 * Mismas reglas que el backend (rules/Backend.md: número 15 "Validación
 * de datos"): el frontend valida en vivo, pero el backend valida siempre.
 *
 * @format
 */

export const MIN_PASSWORD_LENGTH = 8;

export const isValidEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

export const isValidPhone = (phone: string): boolean =>
  /^\d{7,8}$/.test(phone.trim());

export const isValidIdentityNumber = (identityNumber: string): boolean =>
  /^\d{5,8}$/.test(identityNumber.trim());

export const isValidPassword = (password: string): boolean =>
  password.length >= MIN_PASSWORD_LENGTH;

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