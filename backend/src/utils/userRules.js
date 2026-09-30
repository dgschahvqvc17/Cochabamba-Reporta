/**
 * Reglas y constantes del dominio de usuarios (MVC - utils).
 *
 * Fuente única de las restricciones de los datos de las personas
 * (ciudadanos y funcionarios) para no duplicar valores mágicos entre
 * validators y services (DRY).
 *
 * @format
 */

'use strict';

/** Longitudes de nombre y apellido (datos de una persona real). */
const MIN_NAME_LENGTH = 2;
const MAX_NAME_LENGTH = 30;
const MIN_LAST_NAME_LENGTH = 2;
const MAX_LAST_NAME_LENGTH = 40;

/** Dirección de residencia del ciudadano. */
const MAX_ADDRESS_LENGTH = 200;

/**
 * Anti-duplicados de usuarios: además del correo (único en la base), una
 * persona no puede registrarse dos veces con el mismo documento de
 * identidad ni con el mismo nombre, apellido y teléfono. La comparación es
 * exacta tras normalizar (ver services/userDuplicates.service).
 */

module.exports = {
  MIN_NAME_LENGTH,
  MAX_NAME_LENGTH,
  MIN_LAST_NAME_LENGTH,
  MAX_LAST_NAME_LENGTH,
  MAX_ADDRESS_LENGTH,
};
