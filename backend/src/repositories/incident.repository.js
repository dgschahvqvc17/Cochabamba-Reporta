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
const { MAX_MAP_INCIDENTS } = require('../utils/mapScope');

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
 * Una misma fila puede repetirse cuando el filtro por asignación usa el
 * `inner join` de `assignments`. Se conserva el primer registro de cada
 * incidente para no duplicar pines en el mapa.
 */
const uniqueById = (rows) => {
  if (!rows || rows.length === 0) {
    return [];
  }

  const seen = new Set();
  const result = [];

  for (const row of rows) {
    if (seen.has(row.id)) {
      continue;
    }

    seen.add(row.id);
    result.push(row);
  }

  return result;
};

/**
 * Consulta de incidentes para el mapa interactivo.
 * Devuelve incidentes que tienen ubicación registrada, con filtros opcionales.
 *
 * `statuses` acota por estado (alcance del rol) y `assignment` acota a los
 * incidentes con una asignación activa de un tipo y persona concreta
 * (`{ type, assignedTo }`), que es lo que ve el verificador y el personal
 * de solución: únicamente lo que le asignaron. `locations!inner` mantiene
 * fuera del resultado los reportes sin ubicación.
 */
const findMapIncidents = async ({
  categoryId = null,
  status = null,
  statuses = null,
  assignment = null,
  search = '',
} = {}) => {
  const assignmentFilter =
    assignment && assignment.type && assignment.assignedTo ? assignment : null;

  const baseSelect =
    '*, category:categories(id, name), citizen:users(id, first_name, last_name, phone), location:locations!inner(id, latitude, longitude, address, captured_at)';

  const select = assignmentFilter
    ? `${baseSelect}, assignments!inner(assignment_type, assigned_to, active)`
    : baseSelect;

  let query = supabaseAdmin
    .from('incidents')
    .select(select)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(MAX_MAP_INCIDENTS);

  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  if (status) {
    query = query.eq('status', status);
  }

  if (Array.isArray(statuses) && statuses.length > 0) {
    query = query.in('status', statuses);
  }

  if (assignmentFilter) {
    query = query
      .eq('assignments.assignment_type', assignmentFilter.type)
      .eq('assignments.assigned_to', assignmentFilter.assignedTo)
      .eq('assignments.active', true);
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

  return uniqueById(data);
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
