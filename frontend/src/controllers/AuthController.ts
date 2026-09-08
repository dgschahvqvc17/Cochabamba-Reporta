/**
 * Controlador de autenticación (MVC - Controller).
 *
 * Recibe las acciones del usuario en la vista y coordina
 * la comunicación con el servicio (API REST).
 *
 * @format
 */

import { login, type LoginResponse } from '../services/authService';
import type { User } from '../models/User';

export async function handleLogin(
  email: string,
  password: string,
): Promise<{ success: boolean; user?: User; error?: string }> {
  const result: LoginResponse = await login(email, password);

  if (!result.success) {
    return { success: false, error: result.message };
  }

  return { success: true, user: result.user };
}