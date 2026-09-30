/**
 * Servicio de notificaciones (MVC - Service).
 *
 * Consumo de la API REST del backend para el módulo de notificaciones
 * del ciudadano autenticado (HU14):
 *   - GET   /api/v1/notifications         → listar notificaciones.
 *   - GET   /api/v1/notifications/:id     → detalle de una notificación.
 *   - PATCH /api/v1/notifications/:id/read → marcar una notificación como leída.
 * Usa el cliente HTTP compartido (services/apiClient): manejo de 401
 * (clearSession), ApiResponse genérico y mensajes para el usuario.
 *
 * @format
 */

import type { Notification, NotificationListData } from '../models/Notification';
import { api, type ApiResponse } from './apiClient';

export type { ApiResponse };

export async function getMyNotifications(
  accessToken: string,
): Promise<ApiResponse<NotificationListData>> {
  return api<NotificationListData>('/notifications', accessToken);
}

/** Detalle de una notificación (HU14). */
export async function getNotificationById(
  accessToken: string,
  notificationId: number,
): Promise<ApiResponse<Notification>> {
  return api<Notification>(`/notifications/${notificationId}`, accessToken);
}

/** Marca una notificación como leída (HU14). */
export async function markNotificationRead(
  accessToken: string,
  notificationId: number,
): Promise<ApiResponse<Notification>> {
  return api<Notification>(`/notifications/${notificationId}/read`, accessToken, {
    method: 'PATCH',
  });
}