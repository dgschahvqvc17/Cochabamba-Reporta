/**
 * Modelo de Usuario (MVC - Model).
 *
 * Define la estructura de datos del usuario en el frontend.
 *
 * @format
 */

export type Role =
  | 'CIUDADANO'
  | 'RECEPCION'
  | 'VERIFICADOR'
  | 'ENCARGADO_SOLUCION'
  | 'PERSONAL_SOLUCION'
  | 'ADMINISTRADOR';

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: Role;
}