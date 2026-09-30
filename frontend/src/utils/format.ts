/**
 * Utilidades de formato (MVC - utils).
 *
 * @format
 */

const pad = (value: number): string => String(value).padStart(2, '0');

/** Formatea una fecha ISO completa (AAAA-MM-DDTHH:mm:ss) a DD/MM/AAAA HH:mm. */
export function formatDateTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

/** Formatea una fecha ISO de calendario (AAAA-MM-DD) a DD/MM/AAAA. */
export function formatDate(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (match) {
    return `${match[3]}/${match[2]}/${match[1]}`;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}