/**
 * Controlador de categorías (MVC - Controller).
 *
 * Recibe las acciones del usuario administrador en las vistas y
 * coordina la comunicación con el servicio (API REST). Traduce los
 * errores del backend en mensajes por campo.
 *
 * @format
 */

import {
  createCategory as createCategoryRequest,
  getCategories,
  updateCategory as updateCategoryRequest,
  updateCategoryStatus as updateCategoryStatusRequest,
  type ApiResponse,
} from '../services/categoryService';
import type {
  Category,
  CategoryListData,
  CategoryListParams,
  CategoryPayload,
} from '../models/Category';
import { getAccessToken } from '../utils/session';

export type FieldErrors = Record<string, string>;

export interface ActionResult<T> {
  success: boolean;
  message: string;
  data?: T;
  fieldErrors?: FieldErrors;
}

const toFieldErrors = (
  details?: { field: string; message: string }[],
): FieldErrors | undefined => {
  const fieldErrors: FieldErrors = {};

  details?.forEach((detail) => {
    fieldErrors[detail.field] = detail.message;
  });

  return Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined;
};

export async function loadCategories(
  params: CategoryListParams = {},
): Promise<ActionResult<CategoryListData>> {
  const accessToken = getAccessToken();
  const result: ApiResponse<CategoryListData> = await getCategories(
    accessToken,
    params,
  );

  if (!result.success) {
    return {
      success: false,
      message: result.message,
      fieldErrors: toFieldErrors(result.error?.details),
    };
  }

  return { success: true, message: result.message, data: result.data };
}

export async function createCategory(
  payload: CategoryPayload,
): Promise<ActionResult<Category>> {
  const accessToken = getAccessToken();
  const result = await createCategoryRequest(accessToken, payload);

  if (!result.success) {
    return {
      success: false,
      message: result.message,
      ...(toFieldErrors(result.error?.details) && {
        fieldErrors: toFieldErrors(result.error?.details),
      }),
    };
  }

  return { success: true, message: result.message, data: result.data?.category };
}

export async function editCategory(
  categoryId: number,
  payload: CategoryPayload,
): Promise<ActionResult<Category>> {
  const accessToken = getAccessToken();
  const result = await updateCategoryRequest(accessToken, categoryId, payload);

  if (!result.success) {
    return {
      success: false,
      message: result.message,
      ...(toFieldErrors(result.error?.details) && {
        fieldErrors: toFieldErrors(result.error?.details),
      }),
    };
  }

  return { success: true, message: result.message, data: result.data?.category };
}

export async function setCategoryActive(
  categoryId: number,
  active: boolean,
): Promise<ActionResult<Category>> {
  const accessToken = getAccessToken();
  const result = await updateCategoryStatusRequest(accessToken, categoryId, active);

  if (!result.success) {
    return { success: false, message: result.message };
  }

  return { success: true, message: result.message, data: result.data?.category };
}