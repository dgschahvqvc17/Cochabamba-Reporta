/**
 * Servicio de categorías (MVC - services).
 *
 * Consumo de la API REST del backend para la gestión de categorías de
 * incidentes (HU04). La creación, edición y activación/desactivación
 * requieren el token del administrador autenticado.
 * Usa el cliente HTTP compartido (services/apiClient).
 *
 * @format
 */

import type {
  Category,
  CategoryListData,
  CategoryListParams,
  CategoryPayload,
} from '../models/Category';
import { api, type ApiResponse } from './apiClient';

export type { ApiResponse };

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