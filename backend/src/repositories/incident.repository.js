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
const { INCIDENT_STATUS } = require('../utils/incidentStatus');

const create = async ({
  code,
  userId,
  categoryId,
  title,
  description,
  responseDeadlineAt,
}) => {
  const { data, error } = await supabaseAdmin
    .from('incidents')
    .insert({
      code,
      user_id: userId,
      category_id: categoryId,
      title,
      description,
      status: 'REPORTADO',
      response_deadline_at: responseDeadlineAt || null,
    })
    .select('*, category:categories(id, name)')
    .single();

  if (error) {
    throw error;
  }

  return data;
};

const findById = async (id) => {
  const { data, error } = await supabaseAdmin
    .from('incidents')
    .select(
      '*, citizen:users(id, first_name, last_name, identity_number, phone, email), category:categories(id, name)',
    )
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
    .select('*, category:categories(id, name), location:locations(id, latitude, longitude, address, captured_at)')
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
  order = 'desc',
} = {}) => {
  let query = supabaseAdmin
    .from('incidents')
    .select(
      '*, category:categories(id, name), citizen:users(id, first_name, last_name, identity_number, phone, email), location:locations(id, latitude, longitude, address, captured_at)',
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

  // `order=asc` deja primero los reportes más antiguos, que son los que
  // llevan más tiempo esperando; `desc` (por defecto) deja primero los más
  // recientes. `id` desempata porque varios reportes pueden registrarse en
  // el mismo segundo.
  const ascending = order === 'asc';

  const { data, error, count } = await query
    .order('created_at', { ascending })
    .order('id', { ascending })
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
/**
 * HU — Incidentes actualmente EN_VERIFICACION con su asignación de
 * verificación activa (para que la recepción pueda reasignar al
 * verificador). Con búsqueda y paginación.
 */
const findAllInVerification = async ({
  page = 1,
  limit = 10,
  search = '',
} = {}) => {
  let query = supabaseAdmin
    .from('incidents')
    .select(
      '*, category:categories(id, name), citizen:users(id, first_name, last_name, identity_number, phone, email), assignments!inner(id, assignment_type, assigned_to, assigned_by, note, active)',
      { count: 'exact' },
    )
    .eq('status', INCIDENT_STATUS.EN_VERIFICACION)
    .eq('assignments.assignment_type', 'VERIFICACION')
    .eq('assignments.active', true);

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

/**
 * HU13 — Incidentes asignados activamente a un usuario para su atención
 * (assignments tipo SOLUCION, active). El propio service limita el uso a
 * los roles PERSONAL_SOLUCION/ADMINISTRADOR. Con búsqueda y paginación.
 */
const findAssignedForSolution = async ({
  userId,
  page = 1,
  limit = 10,
  search = '',
  status = null,
} = {}) => {
  let query = supabaseAdmin
    .from('incidents')
    .select(
      '*, category:categories(id, name), citizen:users(id, first_name, last_name, identity_number, phone, email), assignments!inner(assignment_type)',
      { count: 'exact' },
    )
    .eq('assignments.assignment_type', 'SOLUCION')
    .eq('assignments.active', true)
    .eq('assignments.assigned_to', userId);

  if (status) {
    query = query.eq('status', status);
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

const findPotentialDuplicates = async ({
  categoryId,
  since,
  excludedStatuses,
  limit = 200,
} = {}) => {
  let query = supabaseAdmin
    .from('incidents')
    .select('id, code, title, description, status, created_at')
    .eq('category_id', categoryId)
    .gte('created_at', since);

  if (Array.isArray(excludedStatuses) && excludedStatuses.length > 0) {
    query = query.not('status', 'in', `(${excludedStatuses.join(',')})`);
  }

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return data ?? [];
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
    .select('*, category:categories(id, name)')
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
    .select(
      '*, citizen:users(id, first_name, last_name, identity_number, phone, email), category:categories(id, name)',
    )
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

/**
 * Consulta de incidentes para el mapa interactivo.
 * Devuelve incidentes que tienen ubicación registrada, con filtros opcionales.
 */
const findMapIncidents = async ({ categoryId = null, status = null, search = '' } = {}) => {
  let query = supabaseAdmin
    .from('incidents')
    .select(
      '*, category:categories(id, name), citizen:users(id, first_name, last_name, phone), location:locations!inner(id, latitude, longitude, address, captured_at)',
    )
    .order('created_at', { ascending: false });

  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  if (status) {
    query = query.eq('status', status);
  }

  const term = sanitizeSearchTerm(search);
  if (term) {
    query = query.or(
      `code.ilike.%${term}%,title.ilike.%${term}%,description.ilike.%${term}%`,
    );
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data ?? [];
};

module.exports = {
  create,
  findById,
  findByUserId,
  findAllManaged,
  findAllInVerification,
  findAssignedForVerification,
  findAssignedForSolution,
  findMapIncidents,
  countToday,
  update,
  updateStatus,
  remove,
  findPotentialDuplicates,
};
