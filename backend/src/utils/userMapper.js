/**
 * Mapeo público de usuarios (MVC - utils).
 *
 * Convierte un registro de la tabla `users` en el objeto que se
 * entrega al frontend (sin datos sensibles). Es la única fuente de
 * verdad para no repetir el mapeo en auth y user (principio DRY).
 *
 * @format
 */

'use strict';

const toPublicUser = (user, roleName) => ({
  id: user.id,
  firstName: user.first_name,
  lastName: user.last_name,
  birthDate: user.birth_date,
  identityNumber: user.identity_number,
  phone: user.phone,
  email: user.email,
  address: user.address,
  role: roleName,
  active: user.active,
});

module.exports = { toPublicUser };