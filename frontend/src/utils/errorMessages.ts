/**
 * Mensajes de error y de estado para los usuarios (MVC - utils).
 *
 * La app la usan ciudadanos sin conocimiento técnico, así que ningún
 * mensaje puede mencionar "backend", "token", "HTTP", "servidor" ni
 * "reiniciar". Aquí viven los textos únicos de los fallos de comunicación
 * (sin conexión, respuesta lenta, sistema caído) y de la sesión cerrada,
 * para que todas las pantallas muestren siempre lo mismo.
 *
 * @format
 */

/** Título del aviso de sin conexión (banner superior). */
export const OFFLINE_TITLE = 'Sin conexión a internet';

/** Aviso de sin conexión: qué pasó y qué puede hacer el usuario. */
export const OFFLINE_MESSAGE =
  'Revisa tu conexión a internet. No podrás enviar ni guardar información hasta que vuelvas a estar conectado.';

/** No se pudo alcanzar el sistema (sin internet o sistema caído). */
export const NETWORK_ERROR_MESSAGE =
  'No pudimos comunicarnos con el sistema. Revisa tu conexión a internet e inténtalo de nuevo.';

/** La respuesta tardó demasiado. */
export const SLOW_CONNECTION_MESSAGE =
  'El sistema está tardando mucho en responder. Espera un momento e inténtalo de nuevo.';

/** Respuesta vacía del sistema. */
export const EMPTY_RESPONSE_MESSAGE =
  'El sistema no devolvió una respuesta. Inténtalo de nuevo en un momento.';

/** Respuesta con un formato que la app no entiende. */
export const UNEXPECTED_RESPONSE_MESSAGE =
  'No pudimos interpretar la respuesta del sistema. Inténtalo de nuevo en un momento.';

/** Error genérico del sistema (HTTP 5xx o estado inesperado). */
export const SYSTEM_ERROR_MESSAGE =
  'Ocurrió un problema en el sistema. Inténtalo de nuevo en unos minutos.';

/** Notificación de que el servidor no está disponible. */
export const SERVICE_UNAVAILABLE_MESSAGE =
  'El sistema está momentáneamente fuera de servicio. Inténtalo de nuevo en unos minutos.';

/** Título del aviso de sesión cerrada. */
export const SESSION_CLOSED_TITLE = 'Tu sesión se cerró';

/**
 * Sesión cerrada: solo aparece cuando el sistema confirma que ya no puede
 * seguir validando al usuario. Nunca se muestra por falta de internet.
 */
export const SESSION_CLOSED_MESSAGE =
  'Por seguridad, tu sesión se cerró después de un tiempo sin actividad. Inicia sesión nuevamente para seguir usando la app.';

/**
 * true cuando el dispositivo ya sabe que no tiene internet. Permite
 * diferenciar "no hay comunicación" de "el sistema falló" sin esperar a
 * que la petición agote el tiempo de espera.
 */
export function isDeviceOffline(): boolean {
  if (
    typeof navigator !== 'undefined' &&
    typeof navigator.onLine === 'boolean'
  ) {
    return navigator.onLine === false;
  }

  return false;
}
