/**
 * Etiquetas de roles (MVC - utils).
 *
 * Nombres legibles de los roles del sistema (HU03). Única fuente de
 * verdad para no repetir etiquetas en las pantallas (principio DRY).
 *
 * @format
 */

import type { Role } from '../models/User';

export const ROLES: Role[] = [
  'CIUDADANO',
  'RECEPCION',
  'VERIFICADOR',
  'ENCARGADO_SOLUCION',
  'PERSONAL_SOLUCION',
  'ADMINISTRADOR',
];

export const ROLE_LABELS: Record<Role, string> = {
  CIUDADANO: 'Ciudadano',
  RECEPCION: 'Encargado de recepción',
  VERIFICADOR: 'Personal de verificación',
  ENCARGADO_SOLUCION: 'Encargado de solución',
  PERSONAL_SOLUCION: 'Personal de solución',
  ADMINISTRADOR: 'Administrador',
};