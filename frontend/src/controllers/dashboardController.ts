/**
 * Controlador del dashboard de supervisión (MVC - Controller, HU15).
 *
 * Traduce la respuesta de `dashboardService.getDashboard` en un
 * `ActionResult<DashboardSnapshot>` con mensajes amigables, igual que
 * `userController`/`incidentController`. Sin lógica de negocio.
 *
 * @format
 */

import { getDashboard as getDashboardRequest } from '../services/dashboardService';
import type { DashboardSnapshot } from '../models/Dashboard';
import { getAccessToken } from '../utils/session';

export interface ActionResult<T> {
  success: boolean;
  message: string;
  data?: T;
}

export async function loadDashboard(): Promise<
  ActionResult<DashboardSnapshot>
> {
  const accessToken = getAccessToken();

  if (!accessToken) {
    return { success: false, message: 'Sesión expirada. Vuelve a iniciar sesión.' };
  }

  const result = await getDashboardRequest(accessToken);

  if (!result.success || !result.data) {
    return {
      success: false,
      message: result.message || 'No se pudieron cargar los indicadores.',
    };
  }

  return {
    success: true,
    message: result.message,
    data: result.data,
  };
}
