/**
 * Modelo de Incidente (MVC - Model).
 *
 * Define la estructura de datos del incidente urbano en el frontend.
 *
 * @format
 */

export type IncidentStatus =
  | 'REPORTADO'
  | 'RECIBIDO'
  | 'EN_VERIFICACION'
  | 'VERIFICADO'
  | 'ASIGNADO_PARA_SOLUCION'
  | 'EN_ATENCION'
  | 'ATENDIDO'
  | 'CERRADO'
  | 'RECHAZADO';

export interface Incident {
  id: number;
  userId: number;
  categoryId: number;
  title: string;
  description: string;
  status: IncidentStatus;
  createdAt: string;
  updatedAt: string;
}