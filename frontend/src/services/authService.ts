/**
 * Servicio de autenticación (MVC - services).
 *
 * Encargado del consumo de la API REST del backend para
 * las operaciones de registro e inicio de sesión.
 *
 * @format
 */

import type { User } from '../models/User';

const BASE_URL = 'http://localhost:3000/api/v1';

export interface LoginResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: User;
}

export async function login(
  email: string,
  password: string,
): Promise<LoginResponse> {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  return response.json();
}