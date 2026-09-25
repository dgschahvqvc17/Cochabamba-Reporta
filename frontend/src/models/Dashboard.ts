/**
 * Modelos del dashboard de supervisión (HU15 - MVC Model).
 *
 * Espejo tipado de la respuesta `GET /api/v1/dashboard` del backend
 * (`buildDashboardSnapshot`). Solo lo consulta el ADMINISTRADOR.
 *
 * @format
 */

export interface DashboardIndicators {
  totalCitizens: number;
  totalIncidents: number;
  incidentsToday: number;
  attendedIncidents: number;
  pendingIncidents: number;
  activeReceptionStaff: number;
  activeVerifiers: number;
  activeSolutionStaff: number;
}

export type DashboardAlertSeverity = 'warning' | 'info';

export interface DashboardAlert {
  severity: DashboardAlertSeverity;
  message: string;
}

export interface RecentIncident {
  id: string;
  code: string;
  title: string;
  status: string;
  created_at: string;
  user_id: string;
}

export interface DashboardSnapshot {
  indicators: DashboardIndicators;
  alerts: DashboardAlert[];
  recent: RecentIncident[];
  [key: string]: unknown;
}
