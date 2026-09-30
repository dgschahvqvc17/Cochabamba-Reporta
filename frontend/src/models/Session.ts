/**
 * Modelo de Sesión (MVC - Model).
 *
 * Estructura de datos de la sesión de Supabase Auth devuelta
 * por el backend al iniciar sesión (HU02).
 *
 * @format
 */

export interface Session {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}