/**
 * Controlador de autenticación (MVC - Controller).
 *
 * Recibe las acciones del usuario en la vista y coordina
 * la comunicación con el servicio (API REST).
 *
 * @format
 */

import {
  login,
  logout,
  registerCitizen,
  type ApiResponse,
} from '../services/authService';
import type { Citizen, CitizenRegistration } from '../models/Citizen';
import type { User } from '../models/User';
import {
  clearSession,
  getStoredSession,
  saveSession,
  type StoredSession,
} from '../utils/session';

export type FieldErrors = Record<string, string>;

export interface RegisterResult {
  success: boolean;
  message: string;
  user?: Citizen;
  fieldErrors?: FieldErrors;
}

export interface LoginResult {
  success: boolean;
  session?: StoredSession;
  fieldErrors?: FieldErrors;
  error?: string;
}

export interface LogoutResult {
  success: boolean;
  error?: string;
}

export async function handleRegister(
  payload: CitizenRegistration,
): Promise<RegisterResult> {
  const result: ApiResponse<{ user: Citizen }> = await registerCitizen(payload);

  if (!result.success) {
    const fieldErrors: FieldErrors = {};

    result.error?.details?.forEach((detail) => {
      fieldErrors[detail.field] = detail.message;
    });

    return {
      success: false,
      message: result.message,
      ...(Object.keys(fieldErrors).length > 0 ? { fieldErrors } : {}),
    };
  }

  return {
    success: true,
    message: result.message,
    user: result.data?.user,
  };
}

export async function handleLogin(
  email: string,
  password: string,
  remember: boolean,
): Promise<LoginResult> {
  const result = await login(email.trim().toLowerCase(), password);

  if (!result.success) {
    const fieldErrors: FieldErrors = {};

    result.error?.details?.forEach((detail) => {
      fieldErrors[detail.field] = detail.message;
    });

    return {
      success: false,
      error: result.message,
      ...(Object.keys(fieldErrors).length > 0 ? { fieldErrors } : {}),
    };
  }

  const data = result.data;
  const session: StoredSession = {
    user: data?.user as User,
    accessToken: data?.session.accessToken ?? '',
    refreshToken: data?.session.refreshToken ?? '',
    expiresAt: data?.session.expiresAt ?? 0,
  };

  saveSession(session, remember);

  return { success: true, session };
}

export async function handleLogout(): Promise<LogoutResult> {
  const storedSession = getStoredSession();

  if (!storedSession?.accessToken) {
    clearSession();
    return { success: false, error: 'No hay una sesión activa.' };
  }

  const result = await logout(storedSession.accessToken);
  clearSession();

  if (!result.success) {
    return { success: false, error: result.message };
  }

  return { success: true };
}