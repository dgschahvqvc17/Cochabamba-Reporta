/**
 * Repositorio de incidentes (MVC - Repository).
 *
 * Responsable únicamente del acceso a datos de la tabla `incidents`
 * de Supabase (PostgreSQL). Sin lógica de negocio.
 *
 * @format
 */

'use strict';

const { supabaseAdmin } = require('../config/supabase');
const { sanitizeSearchTerm } = require('../utils/text');

const create = async ({ code, userId, categoryId, title, description }) => {
  const { data, error } = await supabaseAdmin
    .from('incidents')
    .insert({
      code,
      user_id: userId,
      category_id: categoryId,
      title,
      description,
      status: 'REPORTADO',
    })
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data;
};

const findById = async (id) => {
  const { data, error } = await supabaseAdmin
    .from('incidents')
    .select('*, citizen:users(id, first_name, last_name, identity_number, phone, email)')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
};

const findByUserId = async ({ userId, status = null } = {}) => {
  let query = supabaseAdmin
    .from('incidents')
    .select('*, category:categories(id, name)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data ?? [];
};

/**
 * Lista todos los incidentes (HU09). Uso exclusivo del personal
 * municipal: encargado de recepción y demás roles internos.
 * Filtros: estado, categoría, fecha desde/hasta y búsqueda por
 * código, título o descripción. Con paginación y conteo exacto.
 */
const findAllManaged = async ({
  page = 1,
  limit = 10,
  status = null,
  statuses = null,
  categoryId = null,
  from = null,
  to = null,
  search = '',
} = {}) => {
  let query = supabaseAdmin
    .from('incidents')
    .select(
      '*, category:categories(id, name), citizen:users(id, first_name, last_name, identity_number, phone, email)',
      { count: 'exact' },
    );

  if (Array.isArray(statuses) && statuses.length > 0) {
    query = query.in('status', statuses);
  } else if (status) {
    query = query.eq('status', status);
  }

  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  if (from) {
    query = query.gte('created_at', from);
  }

  if (to) {
    query = query.lte('created_at', to);
  }

  const term = sanitizeSearchTerm(search);
  if (term) {
    query = query.or(
      `code.ilike.%${term}%,title.ilike.%${term}%,description.ilike.%${term}%`,
    );
  }

  const fromIndex = (page - 1) * limit;
  const toIndex = fromIndex + limit - 1;

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(fromIndex, toIndex);

  if (error) {
    throw error;
  }

  return { incidents: data ?? [], total: count ?? data?.length ?? 0 };
};

/**
 * HU11 — Incidentes asignados activamente a un usuario para verificación
 * (assignments tipo VERIFICACION, active). El propio service limita el
 * uso a los roles VERIFICADOR/ADMINISTRADOR. Con búsqueda y paginación.
 */
const findAssignedForVerification = async ({
  userId,
  page = 1,
  limit = 10,
  search = '',
} = {}) => {
  let query = supabaseAdmin
    .from('incidents')
    .select(
      '*, category:categories(id, name), citizen:users(id, first_name, last_name, identity_number, phone, email), assignments!inner(assignment_type)',
      { count: 'exact' },
    )
    .eq('assignments.assignment_type', 'VERIFICACION')
    .eq('assignments.active', true)
    .eq('assignments.assigned_to', userId);

  const term = sanitizeSearchTerm(search);
  if (term) {
    query = query.or(
      `code.ilike.%${term}%,title.ilike.%${term}%,description.ilike.%${term}%`,
    );
  }

  const fromIndex = (page - 1) * limit;
  const toIndex = fromIndex + limit - 1;

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(fromIndex, toIndex);

  if (error) {
    throw error;
  }

  return { incidents: data ?? [], total: count ?? data?.length ?? 0 };
};

const countToday = async () => {
  const localMidnight = new Date();
  localMidnight.setHours(0, 0, 0, 0);

  const { count, error } = await supabaseAdmin
    .from('incidents')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', localMidnight.toISOString());

  if (error) {
    throw error;
  }

  return count ?? 0;
};

const update = async ({ id, userId, categoryId, title, description }) => {
  const { data, error } = await supabaseAdmin
    .from('incidents')
    .update({
      category_id: categoryId,
      title,
      description,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', userId)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data;
};

const updateStatus = async (id, status, extraFields = {}) => {
  const { data, error } = await supabaseAdmin
    .from('incidents')
    .update({ status, updated_at: new Date().toISOString(), ...extraFields })
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data;
};

const remove = async (id) => {
  const { data, error } = await supabaseAdmin
    .from('incidents')
    .delete()
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data;
};

module.exports = {
  create,
  findById,
  findByUserId,
  findAllManaged,
  findAssignedForVerification,
  countToday,
  update,
  updateStatus,
  remove,
};
