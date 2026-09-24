/**
 * Servicio de categorías (MVC - services).
 *
 * Consumo de la API REST del backend para la gestión de categorías de
 * incidentes (HU04). La creación, edición y activación/desactivación
 * requieren el token del administrador autenticado.
 *
 * @format
 */

import type {
  Category,
  CategoryListData,
  CategoryListParams,
  CategoryPayload,
} from '../models/Category';
import { clearSession } from '../utils/session';
import { API_BASE_URL as BASE_URL } from '../config/api';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: {
    code?: string;
    details?: { field: string; message: string }[];
  };
}

const api = async <T>(
  path: string,
  accessToken: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    clearSession();
  }

  return response.json();
};

export async function getCategories(
  accessToken: string,
  params: CategoryListParams = {},
): Promise<ApiResponse<CategoryListData>> {
  const query = new URLSearchParams();

  if (params.search) {
    query.set('search', params.search);
  }

  const queryString = query.toString();

  return api<CategoryListData>(
    `/categories${queryString ? `?${queryString}` : ''}`,
    accessToken,
  );
}

export async function createCategory(
  accessToken: string,
  payload: CategoryPayload,
): Promise<ApiResponse<{ category: Category }>> {
  return api<{ category: Category }>('/categories', accessToken, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateCategory(
  accessToken: string,
  categoryId: number,
  payload: CategoryPayload,
): Promise<ApiResponse<{ category: Category }>> {
  return api<{ category: Category }>(`/categories/${categoryId}`, accessToken, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function updateCategoryStatus(
  accessToken: string,
  categoryId: number,
  active: boolean,
): Promise<ApiResponse<{ category: Category }>> {
  return api<{ category: Category }>(`/categories/${categoryId}/status`, accessToken, {
    method: 'PATCH',
    body: JSON.stringify({ active }),
  });
}