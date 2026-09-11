/**
 * Servicio de usuarios (MVC - services).
 *
 * Consumo de la API REST del backend para la gestión de usuarios
 * y roles (HU03). Todas las operaciones requieren el token del
 * administrador autenticado.
 *
 * @format
 */

import type {
  InternalUserRegistration,
  RoleOption,
  User,
  UserDetailData,
  UserListData,
  UserUpdatePayload,
} from '../models/User';

const BASE_URL = 'http://localhost:3000/api/v1';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: {
    code?: string;
    details?: { field: string; message: string }[];
  };
}

export interface UserListParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  active?: boolean;
}

const api = async <T>(
  path: string,
  accessToken: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> => {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      ...(options.headers || {}),
    },
  });

  return response.json();
};

export async function getUsers(
  accessToken: string,
  params: UserListParams = {},
): Promise<ApiResponse<UserListData>> {
  const query = new URLSearchParams();

  if (params.page) {
    query.set('page', String(params.page));
  }
  if (params.limit) {
    query.set('limit', String(params.limit));
  }
  if (params.search) {
    query.set('search', params.search);
  }
  if (params.role) {
    query.set('role', params.role);
  }
  if (params.active !== undefined) {
    query.set('active', String(params.active));
  }

  const queryString = query.toString();

  return api<UserListData>(
    `/users${queryString ? `?${queryString}` : ''}`,
    accessToken,
  );
}

export async function getRoles(
  accessToken: string,
): Promise<ApiResponse<{ roles: RoleOption[] }>> {
  return api<{ roles: RoleOption[] }>('/users/roles', accessToken);
}

export async function getUserById(
  accessToken: string,
  userId: number,
): Promise<ApiResponse<UserDetailData>> {
  return api<UserDetailData>(`/users/${userId}`, accessToken);
}

export async function createInternalUser(
  accessToken: string,
  payload: InternalUserRegistration,
): Promise<ApiResponse<{ user: User }>> {
  return api<{ user: User }>('/users', accessToken, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateUser(
  accessToken: string,
  userId: number,
  payload: UserUpdatePayload,
): Promise<ApiResponse<{ user: User }>> {
  return api<{ user: User }>(`/users/${userId}`, accessToken, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function updateUserStatus(
  accessToken: string,
  userId: number,
  active: boolean,
): Promise<ApiResponse<{ user: User }>> {
  return api<{ user: User }>(`/users/${userId}/status`, accessToken, {
    method: 'PATCH',
    body: JSON.stringify({ active }),
  });
}

export async function updateUserRole(
  accessToken: string,
  userId: number,
  role: string,
): Promise<ApiResponse<{ user: User }>> {
  return api<{ user: User }>(`/users/${userId}/role`, accessToken, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  });
}