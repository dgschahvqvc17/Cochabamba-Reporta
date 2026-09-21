/**
 * Controlador de notificaciones (MVC - Controller).
 *
 * Traduce el resultado de la API (notificationService) en un
 * `ActionResult`, igual que incidentController. No contiene lógica de
 * negocio ni llamadas directas a fetch.
 *
 * @format
 */

import { getMyNotifications } from '../services/notificationService';
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