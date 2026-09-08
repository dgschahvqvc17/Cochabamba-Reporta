/**
 * Modelo de Usuario (MVC - Model).
 *
 * Define la estructura de datos del usuario autenticado (HU02),
 * tal como lo devuelve el backend en el inicio de sesión.
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
  birthDate: string;
  identityNumber: string;
  phone: string;
  email: string;
  address: string | null;
  role: Role;
  active: boolean;
}