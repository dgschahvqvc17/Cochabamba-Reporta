/**
 * Roles del sistema (MVC - utils).
 *
 * Constantes de roles de la aplicación (HU03). Se usan en la
 * autorización por roles y en las validaciones para evitar
 * valores mágicos (principio DRY).
 *
 * @format
 */

'use strict';

const ROLES = {
  CIUDADANO: 'CIUDADANO',
  RECEPCION: 'RECEPCION',
  VERIFICADOR: 'VERIFICADOR',
  ENCARGADO_SOLUCION: 'ENCARGADO_SOLUCION',
  PERSONAL_SOLUCION: 'PERSONAL_SOLUCION',
  ADMINISTRADOR: 'ADMINISTRADOR',
};

module.exports = ROLES;