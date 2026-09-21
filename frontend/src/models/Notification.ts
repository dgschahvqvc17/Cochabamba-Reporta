/**
 * Modelo de Notificación (MVC - Model).
 *
 * Define la estructura de una notificación para el ciudadano
 * autenticado (respuesta del backend en formato público):
 *   - `incidentId`: id del incidente asociado.
 *   - `incidentCode`: código público del incidente (p. ej. INC-0001).
 *   - `message`: texto de la alerta.
 *   - `read`: si el usuario ya la leyó.
 *   - `createdAt`: fecha de creación en formato ISO.
 *
 * @format
 */

export interface Notification {
  id: number;
  incidentId: number;
  incidentCode: string | null;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface NotificationListData {
  notifications: Notification[];
}