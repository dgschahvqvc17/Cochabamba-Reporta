/**
 * Servicio de notificaciones (MVC - Service).
 *
 * Consumo de la API REST del backend para el módulo de notificaciones
 * del ciudadano autenticado (GET /api/v1/notifications).
 * Replica el patrón de categoryService.ts: helper `api` con manejo de
 * 401 (clearSession), ApiResponse genérico y BASE_URL compartido.
 *
 * @format
 */

import type { NotificationListData } from '../models/Notification';
import { clearSession } from '../utils/session';
import { API_BASE_URL as BASE_URL } from '../config/api';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: {
    code?: string;
    details?: { field: string; message: string }[];
  };
}

const api = async <T>(
  path: string,
  accessToken: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    clearSession();
  }

  return response.json();
};

export async function getMyNotifications(
  accessToken: string,
): Promise<ApiResponse<NotificationListData>> {
  return api<NotificationListData>('/notifications', accessToken);
}