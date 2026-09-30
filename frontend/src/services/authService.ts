/**
 * Servicio de autenticación (MVC - services).
 *
 * Encargado del consumo de la API REST del backend para
 * las operaciones de registro (HU01) e inicio de sesión,
 * sesión actual y cierre de sesión (HU02).
 *
 * Usa el cliente HTTP compartido (services/apiClient) para que, sin
 * internet, la app muestre un mensaje de conexión comprensible en vez de
 * quedar cargando o fallar en silencio.
 *
 * @format
 */

import type { Citizen, CitizenRegistration } from '../models/Citizen';
import type { Session } from '../models/Session';
import type { User } from '../models/User';
import { api, type ApiResponse } from './apiClient';

export type { ApiResponse };

export interface LoginData {
  user: User;
  session: Session;
}

export async function registerCitizen(
  payload: CitizenRegistration,
): Promise<ApiResponse<{ user: Citizen }>> {
  return api<{ user: Citizen }>('/auth/register', '', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function login(
  email: string,
  password: string,
): Promise<ApiResponse<LoginData>> {
  return api<LoginData>('/auth/login', '', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function me(
  accessToken: string,
): Promise<ApiResponse<{ user: User }>> {
  return api<{ user: User }>('/auth/me', accessToken, { method: 'GET' });
}

export async function logout(accessToken: string): Promise<ApiResponse<null>> {
  return api<null>('/auth/logout', accessToken, { method: 'POST' });
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export async function changePassword(
  accessToken: string,
  payload: ChangePasswordPayload,
): Promise<ApiResponse<null>> {
  return api<null>('/auth/change-password', accessToken, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}
