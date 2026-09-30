/**
 * Modelo de Usuario (MVC - Model).
 *
 * Define la estructura de datos del usuario en el frontend:
 *   - Usuario autenticado / detalle (HU02, HU03).
 *   - Tipos para la gestión de usuarios y roles (HU03): registro de
 *     usuarios internos, edición, asignación de rol y auditoría.
 *
 * @format
 */

export type Role =
  | 'CIUDADANO'
  | 'RECEPCION'
  | 'VERIFICADOR'
  | 'ENCARGADO_SOLUCION'
  | 'PERSONAL_SOLUCION'
  | 'ADMINISTRADOR';

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  birthDate: string;
  identityNumber: string;
  phone: string;
  email: string;
  address: string | null;
  role: Role;
  active: boolean;
}

export interface RoleOption {
  id: number;
  name: Role;
  description: string | null;
  active: boolean;
}

export type UserAuditAction =
  | 'create'
  | 'update'
  | 'activate'
  | 'deactivate'
  | 'role_change';

export interface UserAuditEntry {
  id: number;
  action: UserAuditAction;
  fieldName: string | null;
  oldValue: string | null;
  newValue: string | null;
  changedBy: number | null;
  changedByName: string | null;
  createdAt: string;
}

export interface InternalUserRegistration {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: Role;
  phone?: string;
  identityNumber?: string;
  birthDate?: string;
  address?: string;
}

export interface UserUpdatePayload {
  firstName?: string;
  lastName?: string;
  phone?: string;
  identityNumber?: string;
  birthDate?: string;
  address?: string;
}

export interface UserListData {
  users: User[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface UserDetailData {
  user: User;
  audit: UserAuditEntry[];
}