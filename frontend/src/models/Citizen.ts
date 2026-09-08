/**
 * Modelo de Ciudadano (MVC - Model).
 *
 * Estructura de datos del formulario de registro (HU01)
 * y del ciudadano devuelto por el backend.
 *
 * @format
 */

export interface Citizen {
  id: number;
  firstName: string;
  lastName: string;
  birthDate: string;
  identityNumber: string;
  phone: string;
  email: string;
  address: string | null;
  role: string;
  active: boolean;
}

export interface CitizenRegistration {
  firstName: string;
  lastName: string;
  birthDate: string; // formato AAAA-MM-DD
  identityNumber: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
  address?: string;
}