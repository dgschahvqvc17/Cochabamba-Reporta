/**
 * Servicio de autenticación (MVC - services).
 *
 * Encargado del consumo de la API REST del backend para
 * las operaciones de registro (HU01) e inicio de sesión,
 * sesión actual y cierre de sesión (HU02).
 *
 * @format
 */

import type { Citizen, CitizenRegistration } from '../models/Citizen';
import type { Session } from '../models/Session';
import type { User } from '../models/User';

const BASE_URL = 'http://localhost:3000/api/v1';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: {
    code?: string;
    details?: { field: string; message: string }[];
  };
}

export interface LoginData {
  user: User;
  session: Session;
}

const authHeaders = (accessToken: string): Record<string, string> => ({
  Authorization: `Bearer ${accessToken}`,
});

export async function registerCitizen(
  payload: CitizenRegistration,
): Promise<ApiResponse<{ user: Citizen }>> {
  const response = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return response.json();
}

export async function login(
  email: string,
  password: string,
): Promise<ApiResponse<LoginData>> {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  return response.json();
}

export async function me(
  accessToken: string,
): Promise<ApiResponse<{ user: User }>> {
  const response = await fetch(`${BASE_URL}/auth/me`, {
    method: 'GET',
    headers: authHeaders(accessToken),
  });

  return response.json();
}

export async function logout(accessToken: string): Promise<ApiResponse<null>> {
  const response = await fetch(`${BASE_URL}/auth/logout`, {
    method: 'POST',
    headers: authHeaders(accessToken),
  });

  return response.json();
}