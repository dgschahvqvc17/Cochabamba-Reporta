/**
 * Servicio de usuarios (MVC - Service).
 *
 * Contiene la lógica de negocio de HU03 — Gestionar usuarios y roles:
 *   - Listar usuarios con búsqueda, filtros y paginación.
 *   - Listar roles disponibles.
 *   - Registrar usuarios internos.
 *   - Consultar el detalle de un usuario (incluye su historial de auditoría).
 *   - Editar usuarios.
 *   - Activar / desactivar usuarios.
 *   - Asignar roles.
 * Todas las operaciones quedan registradas en `user_audit_log`.
 *
 * @format
 */

'use strict';

const { supabaseAdmin } = require('../config/supabase');
const userRepository = require('../repositories/user.repository');
const { toPublicUser } = require('../utils/userMapper');
const ROLES = require('../utils/roles');

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

const buildError = (message, status, code) => {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
};

const normalizeRoleName = (role) => String(role || '').trim().toUpperCase();

const parsePositiveInt = (value, fallback, max) => {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 1) {
    return fallback;
  }
  return Math.min(parsed, max);
};

const buildAuditActorMap = (rows, actors) => {
  const nameById = new Map(
    actors.map((actor) => [actor.id, `${actor.first_name} ${actor.last_name}`.trim()]),
  );

  return rows.map((row) => ({
    id: row.id,
    action: row.action,
    fieldName: row.field_name,
    oldValue: row.old_value,
    newValue: row.new_value,
    changedBy: row.changed_by,
    changedByName: row.changed_by ? nameById.get(row.changed_by) || null : null,
    createdAt: row.created_at,
  }));
};

const userService = {
  async listUsers(query = {}) {
    const page = parsePositiveInt(query.page, 1, Number.MAX_SAFE_INTEGER);
    const limit = parsePositiveInt(query.limit, DEFAULT_LIMIT, MAX_LIMIT);
    const role = query.role ? normalizeRoleName(query.role) : null;
    const active =
      query.active === undefined || query.active === ''
        ? undefined
        : query.active === 'true';
    const search = query.search ? String(query.search).trim() : '';

    const { users, total } = await userRepository.findAll({
      page,
      limit,
      search,
      role,
      active,
    });

    return {
      users: users.map((user) => toPublicUser(user, user.roles?.name)),
      total,
      page,
      limit,
      pages: Math.max(1, Math.ceil(total / limit)),
    };
  },

  async listRoles() {
    return userRepository.findRoles();
  },

  async getUserDetail(id) {
    const user = await userRepository.findByIdWithRole(id);
    if (!user) {
      throw buildError('El usuario no existe.', 404, 'USER_NOT_FOUND');
    }

    const audit = await this.getUserAudit(id);

    return {
      user: toPublicUser(user, user.roles.name),
      audit,
    };
  },

  async getUserAudit(userId) {
    const rows = await userRepository.findAuditByUserId(userId);
    const actorIds = [...new Set(rows.map((row) => row.changed_by).filter(Boolean))];
    const actors = await userRepository.findUsersByIds(actorIds);

    return buildAuditActorMap(rows, actors);
  },

  async createInternalUser(payload, adminUser) {
    const email = payload.email.trim().toLowerCase();
    const roleName = normalizeRoleName(payload.role);
    const identityNumber = payload.identityNumber
      ? payload.identityNumber.trim()
      : null;
    const phone = payload.phone ? payload.phone.trim() : null;

    if (!ROLES[roleName]) {
      throw buildError('El rol seleccionado no es válido.', 422, 'INVALID_ROLE');
    }

    const existingByEmail = await userRepository.findByEmail(email);
    if (existingByEmail) {
      throw buildError(
        'Ya existe un usuario con este correo electrónico.',
        409,
        'EMAIL_ALREADY_EXISTS',
      );
    }

    if (identityNumber) {
      const existingByIdentity = await userRepository.findByIdentityNumber(
        identityNumber,
      );
      if (existingByIdentity) {
        throw buildError(
          'Ya existe un usuario con este documento de identidad.',
          409,
          'IDENTITY_ALREADY_EXISTS',
        );
      }
    }

    const role = await userRepository.findByRoleName(roleName);
    if (!role) {
      throw buildError(
        'El rol seleccionado no está configurado.',
        500,
        'ROLE_NOT_FOUND',
      );
    }

    const authUser = await userRepository.createAuthUser({
      email,
      password: payload.password,
      metadata: {
        first_name: payload.firstName.trim(),
        last_name: payload.lastName.trim(),
        identity_number: identityNumber,
        phone,
      },
    });

    let createdUser;
    try {
      createdUser = await userRepository.create({
        auth_id: authUser.id,
        first_name: payload.firstName.trim(),
        last_name: payload.lastName.trim(),
        birth_date: payload.birthDate || null,
        identity_number: identityNumber,
        phone,
        email,
        address: payload.address ? payload.address.trim() : null,
        role_id: role.id,
      });
    } catch (error) {
      await supabaseAdmin.auth.admin.deleteUser(authUser.id);
      throw error;
    }

    await userRepository.createAudit({
      user_id: createdUser.id,
      action: 'create',
      field_name: 'role',
      old_value: null,
      new_value: roleName,
      changed_by: adminUser.id,
    });

    return toPublicUser(createdUser, roleName);
  },

  async updateUser(id, payload, adminUser) {
    const current = await userRepository.findByIdWithRole(id);
    if (!current) {
      throw buildError('El usuario no existe.', 404, 'USER_NOT_FOUND');
    }

    const updates = {};
    const auditEntries = [];

    const setIfChanged = (dbField, fieldName, value) => {
      if (value === undefined) {
        return;
      }

      const normalized = typeof value === 'string' ? value.trim() : value;
      const target = normalized || null;

      if (target !== current[dbField]) {
        updates[dbField] = target;
        auditEntries.push({
          field_name: fieldName,
          old_value: current[dbField],
          new_value: target,
        });
      }
    };

    setIfChanged('first_name', 'firstName', payload.firstName);
    setIfChanged('last_name', 'lastName', payload.lastName);
    setIfChanged('phone', 'phone', payload.phone);
    setIfChanged('identity_number', 'identityNumber', payload.identityNumber);
    setIfChanged('birth_date', 'birthDate', payload.birthDate);
    setIfChanged('address', 'address', payload.address);

    if (Object.keys(updates).length === 0) {
      return toPublicUser(current, current.roles.name);
    }

    if (updates.identity_number) {
      const duplicate = await userRepository.findByIdentityNumberExcludingId(
        updates.identity_number,
        id,
      );
      if (duplicate) {
        throw buildError(
          'Ya existe un usuario con este documento de identidad.',
          409,
          'IDENTITY_ALREADY_EXISTS',
        );
      }
    }

    const updated = await userRepository.update(id, updates);

    for (const entry of auditEntries) {
      await userRepository.createAudit({
        user_id: id,
        action: 'update',
        ...entry,
        changed_by: adminUser.id,
      });
    }

    return toPublicUser(updated, current.roles.name);
  },

  async setUserStatus(id, active, adminUser) {
    const current = await userRepository.findByIdWithRole(id);
    if (!current) {
      throw buildError('El usuario no existe.', 404, 'USER_NOT_FOUND');
    }

    if (Number(id) === Number(adminUser.id) && active === false) {
      throw buildError(
        'No puedes desactivar tu propia cuenta.',
        400,
        'SELF_STATUS_CHANGE',
      );
    }

    if (
      active === false &&
      current.roles.name === ROLES.ADMINISTRADOR &&
      (await userRepository.countActiveByRoleName(ROLES.ADMINISTRADOR)) <= 1
    ) {
      throw buildError(
        'No puedes desactivar el último administrador activo.',
        400,
        'LAST_ADMIN_DESACTIVATION',
      );
    }

    if (current.active === Boolean(active)) {
      return toPublicUser(current, current.roles.name);
    }

    const updated = await userRepository.updateActive(id, Boolean(active));

    await userRepository.createAudit({
      user_id: id,
      action: active ? 'activate' : 'deactivate',
      field_name: 'active',
      old_value: String(!active),
      new_value: String(active),
      changed_by: adminUser.id,
    });

    return toPublicUser(updated, current.roles.name);
  },

  async assignRole(id, roleName, adminUser) {
    const current = await userRepository.findByIdWithRole(id);
    if (!current) {
      throw buildError('El usuario no existe.', 404, 'USER_NOT_FOUND');
    }

    const normalized = normalizeRoleName(roleName);
    if (!ROLES[normalized]) {
      throw buildError('El rol seleccionado no es válido.', 422, 'INVALID_ROLE');
    }

    if (current.roles.name === normalized) {
      return toPublicUser(current, current.roles.name);
    }

    if (
      Number(id) === Number(adminUser.id) &&
      normalized !== ROLES.ADMINISTRADOR
    ) {
      throw buildError(
        'No puedes cambiar tu propio rol de administrador.',
        400,
        'SELF_ROLE_CHANGE',
      );
    }

    if (
      current.roles.name === ROLES.ADMINISTRADOR &&
      (await userRepository.countActiveByRoleName(ROLES.ADMINISTRADOR)) <= 1
    ) {
      throw buildError(
        'No puedes cambiar el rol del último administrador activo.',
        400,
        'LAST_ADMIN_DEMOTION',
      );
    }

    const role = await userRepository.findByRoleName(normalized);
    if (!role) {
      throw buildError(
        'El rol seleccionado no está configurado.',
        500,
        'ROLE_NOT_FOUND',
      );
    }

    const updated = await userRepository.updateRole(id, role.id);

    await userRepository.createAudit({
      user_id: id,
      action: 'role_change',
      field_name: 'role',
      old_value: current.roles.name,
      new_value: normalized,
      changed_by: adminUser.id,
    });

    return toPublicUser(updated, normalized);
  },
};

module.exports = userService;