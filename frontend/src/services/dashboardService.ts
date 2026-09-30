/**
 * Servicio del dashboard de supervisión (MVC - Service, HU15).
 *
 * Capa de red del panel de indicadores y alertas del administrador.
 * Usa el cliente HTTP compartido (services/apiClient): Bearer token,
 * manejo de 401 (clearSession) y respuesta tipada `ApiResponse<T>`.
 *
 * @format
 */

import type { DashboardSnapshot } from '../models/Dashboard';
import { api, type ApiResponse } from './apiClient';

export type { ApiResponse };

/** GET /dashboard — snapshot de indicadores del sistema (solo ADMINISTRADOR). */
export async function getDashboard(
  accessToken: string,
): Promise<ApiResponse<DashboardSnapshot>> {
  return api<DashboardSnapshot>('/dashboard', accessToken);
}
