/**
 * Controlador de usuarios (MVC - Controller).
 *
 * Recibe las acciones del usuario administrador en las vistas y
 * coordina la comunicación con el servicio (API REST). Traduce los
 * errores del backend en mensajes por campo.
 *
 * @format
 */

import {
  createInternalUser as createInternalUserRequest,
  getRoles,
  getUserById,
  getUsers,
  updateUser as updateUserRequest,
  updateUserRole as updateUserRoleRequest,
  updateUserStatus as updateUserStatusRequest,
  type ApiResponse,
  type UserListParams,
} from '../services/userService';
import type {
  InternalUserRegistration,
  RoleOption,
  User,
  UserDetailData,
  UserListData,
  UserUpdatePayload,
} from '../models/User';
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

export async function loadUsers(
  params: UserListParams,
): Promise<ActionResult<UserListData>> {
  const accessToken = getAccessToken();
  const result: ApiResponse<UserListData> = await getUsers(accessToken, params);

  if (!result.success) {
    return {
      success: false,
      message: result.message,
      fieldErrors: toFieldErrors(result.error?.details),
    };
  }

  return { success: true, message: result.message, data: result.data };
}

export async function loadRoles(): Promise<ActionResult<RoleOption[]>> {
  const accessToken = getAccessToken();
  const result = await getRoles(accessToken);

  if (!result.success) {
    return { success: false, message: result.message };
  }

  return { success: true, message: result.message, data: result.data?.roles };
}

export async function loadUserDetail(
  userId: number,
): Promise<ActionResult<UserDetailData>> {
  const accessToken = getAccessToken();
  const result = await getUserById(accessToken, userId);

  if (!result.success) {
    return { success: false, message: result.message };
  }

  return { success: true, message: result.message, data: result.data };
}

export async function createUser(
  payload: InternalUserRegistration,
): Promise<ActionResult<User>> {
  const accessToken = getAccessToken();
  const result = await createInternalUserRequest(accessToken, payload);

  if (!result.success) {
    return {
      success: false,
      message: result.message,
      ...(toFieldErrors(result.error?.details) && {
        fieldErrors: toFieldErrors(result.error?.details),
      }),
    };
  }

  return { success: true, message: result.message, data: result.data?.user };
}

export async function editUser(
  userId: number,
  payload: UserUpdatePayload,
): Promise<ActionResult<User>> {
  const accessToken = getAccessToken();
  const result = await updateUserRequest(accessToken, userId, payload);

  if (!result.success) {
    return {
      success: false,
      message: result.message,
      ...(toFieldErrors(result.error?.details) && {
        fieldErrors: toFieldErrors(result.error?.details),
      }),
    };
  }

  return { success: true, message: result.message, data: result.data?.user };
}

export async function setUserActive(
  userId: number,
  active: boolean,
): Promise<ActionResult<User>> {
  const accessToken = getAccessToken();
  const result = await updateUserStatusRequest(accessToken, userId, active);

  if (!result.success) {
    return { success: false, message: result.message };
  }

  return { success: true, message: result.message, data: result.data?.user };
}

export async function assignUserRole(
  userId: number,
  role: string,
): Promise<ActionResult<User>> {
  const accessToken = getAccessToken();
  const result = await updateUserRoleRequest(accessToken, userId, role);

  if (!result.success) {
    return { success: false, message: result.message };
  }

  return { success: true, message: result.message, data: result.data?.user };
}