/**
 * Repositorio de usuarios (MVC - Repository).
 *
 * Responsable únicamente del acceso a datos de la tabla `users`
 * y de la gestión de identidades en Supabase Auth.
 *
 * @format
 */

'use strict';

const { supabaseAdmin } = require('../config/supabase');
const { sanitizeSearchTerm } = require('../utils/text');

const findByEmail = async (email) => {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
};

const findByEmailExcludingId = async (email, excludeId) => {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('email', email)
    .neq('id', excludeId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
};

const findByIdentityNumberExcludingId = async (identityNumber, excludeId) => {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('identity_number', identityNumber)
    .neq('id', excludeId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
};

const findByEmailWithRole = async (email) => {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*, roles(name)')
    .eq('email', email)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
};

const findByIdWithRole = async (id) => {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*, roles(name)')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
};

const findByIdentityNumber = async (identityNumber) => {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('identity_number', identityNumber)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
};

const createAuthUser = async ({ email, password, metadata }) => {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: metadata,
  });

  if (error) {
    throw error;
  }

  return data.user;
};

const create = async (user) => {
  const { data, error } = await supabaseAdmin
    .from('users')
    .insert(user)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

const findById = async (id) => {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
};

const findAll = async ({ page, limit, search, role, active }) => {
  let query = supabaseAdmin
    .from('users')
    .select('*, roles(id, name)', { count: 'exact' });

  if (role) {
    query = query.eq('roles.name', role);
  }

  if (typeof active === 'boolean') {
    query = query.eq('active', active);
  }

  const term = search ? sanitizeSearchTerm(search) : '';
  if (term) {
    query = query.or(
      `first_name.ilike.%${term}%,last_name.ilike.%${term}%,email.ilike.%${term}%,identity_number.ilike.%${term}%`,
    );
  }

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    throw error;
  }

  return { users: data, total: count ?? data.length };
};

const countActiveByRoleName = async (roleName) => {
  const { count, error } = await supabaseAdmin
    .from('users')
    .select('roles!inner(id)', { count: 'exact', head: true })
    .eq('active', true)
    .eq('roles.name', roleName);

  if (error) {
    throw error;
  }

  return count ?? 0;
};

const findVerifiers = async () => {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('id, first_name, last_name, email, roles!inner(name)')
    .eq('active', true)
    .eq('roles.name', 'VERIFICADOR')
    .order('first_name');

  if (error) {
    throw error;
  }

  return data ?? [];
};

const update = async (id, fields) => {
  const { data, error } = await supabaseAdmin
    .from('users')
    .update(fields)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

const updateActive = async (id, active) => {
  const { data, error } = await supabaseAdmin
    .from('users')
    .update({ active })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

const updateRole = async (id, roleId) => {
  const { data, error } = await supabaseAdmin
    .from('users')
    .update({ role_id: roleId })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

const findUsersByIds = async (ids) => {
  if (ids.length === 0) {
    return [];
  }

  const { data, error } = await supabaseAdmin
    .from('users')
    .select('id, email, first_name, last_name')
    .in('id', ids);

  if (error) {
    throw error;
  }

  return data;
};

module.exports = {
  findByEmail,
  findByEmailWithRole,
  findByIdWithRole,
  findById,
  findByIdentityNumber,
  findByEmailExcludingId,
  findByIdentityNumberExcludingId,
  createAuthUser,
  create,
  findAll,
  countActiveByRoleName,
  update,
  updateActive,
  updateRole,
  findUsersByIds,
  findVerifiers,
};