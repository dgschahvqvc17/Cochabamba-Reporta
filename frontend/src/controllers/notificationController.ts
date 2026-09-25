/**
 * Controlador de notificaciones (MVC - Controller).
 *
 * Traduce el resultado de la API (notificationService) en un
 * `ActionResult`, igual que incidentController. No contiene lógica de
 * negocio ni llamadas directas a fetch.
 *
 * @format
 */

import {
  getMyNotifications,
  getNotificationById,
  markNotificationRead,
} from '../services/notificationService';
import type { Notification } from '../models/Notification';
import { getAccessToken } from '../utils/session';

export interface ActionResult<T> {
  success: boolean;
  message: string;
  data?: T;
}

/** Lista las notificaciones del ciudadano autenticado. */
export async function loadMyNotifications(): Promise<
  ActionResult<Notification[]>
> {
  const accessToken = getAccessToken();
  const result = await getMyNotifications(accessToken);

  if (!result.success) {
    return {
      success: false,
      message: result.message,
    };
  }

  return {
    success: true,
    message: result.message,
    data: result.data?.notifications,
  };
}

/** Cantidad de notificaciones no leídas (alertas de nuevos cambios, HU14). */
export async function loadUnreadNotificationCount(): Promise<
  ActionResult<number>
> {
  const accessToken = getAccessToken();
  const result = await getMyNotifications(accessToken);

  if (!result.success) {
    return {
      success: false,
      message: result.message,
    };
  }

  return {
    success: true,
    message: result.message,
    data: result.data?.unreadCount ?? 0,
  };
}

/** Detalle de una notificación propia (HU14). */
export async function loadNotificationById(
  notificationId: number,
): Promise<ActionResult<Notification>> {
  const accessToken = getAccessToken();
  const result = await getNotificationById(accessToken, notificationId);

  if (!result.success) {
    return {
      success: false,
      message: result.message,
    };
  }

  return {
    success: true,
    message: result.message,
    data: result.data,
  };
}

/** Marca una notificación propia como leída (HU14). */
export async function markNotificationAsRead(
  notificationId: number,
): Promise<ActionResult<Notification>> {
  const accessToken = getAccessToken();
  const result = await markNotificationRead(accessToken, notificationId);

  if (!result.success) {
    return {
      success: false,
      message: result.message,
    };
  }

  return {
    success: true,
    message: result.message,
    data: result.data,
  };
}