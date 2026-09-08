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
  registerCitizen,
  type ApiResponse,
} from '../services/authService';
import type { Citizen, CitizenRegistration } from '../models/Citizen';
import type { User } from '../models/User';

export type FieldErrors = Record<string, string>;

export interface RegisterResult {
  success: boolean;
  message: string;
  user?: Citizen;
  fieldErrors?: FieldErrors;
}

export interface LoginResult {
  success: boolean;
  user?: User;
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
): Promise<LoginResult> {
  const result = await login(email, password);

  if (!result.success) {
    return { success: false, error: result.message };
  }

  return { success: true, user: result.user };
}