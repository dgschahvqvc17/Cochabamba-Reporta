/**
 * Repositorio del dashboard de supervisión (HU15 - MVC Repository).
 *
 * Únicamente conteos exactos sobre Supabase (PostgreSQL) para el panel
 * del administrador. Sin lógica de negocio. Usa `supabaseAdmin`.
 *
 * @format
 */

'use strict';

const { supabaseAdmin } = require('../config/supabase');

const countActiveUsersByRole = async (roleName) => {
  const { count, error } = await supabaseAdmin
    .from('users')
    .select('*, roles!inner(id)', { count: 'exact', head: true })
    .eq('active', true)
    .eq('roles.name', roleName);

  if (error) {
    throw error;
  }

  return count ?? 0;
};

const countTotalCitizens = async () => {
  const { count, error } = await supabaseAdmin
    .from('users')
    .select('*, roles!inner(id)', { count: 'exact', head: true })
    .eq('roles.name', 'CIUDADANO');

  if (error) {
    throw error;
  }

  return count ?? 0;
};

const countTotalIncidents = async () => {
  const { count, error } = await supabaseAdmin
    .from('incidents')
    .select('*', { count: 'exact', head: true });

  if (error) {
    throw error;
  }

  return count ?? 0;
};

const countIncidentsByStatus = async (status) => {
  const { count, error } = await supabaseAdmin
    .from('incidents')
    .select('*', { count: 'exact', head: true })
    .eq('status', status);

  if (error) {
    throw error;
  }

  return count ?? 0;
};

const countIncidentsByCategory = async (categoryId) => {
  const { count, error } = await supabaseAdmin
    .from('incidents')
    .select('*', { count: 'exact', head: true })
    .eq('category_id', categoryId);

  if (error) {
    throw error;
  }

  return count ?? 0;
};

const countIncidentsToday = async () => {
  const localMidnight = new Date();
  localMidnight.setHours(0, 0, 0, 0);

  const { count, error } = await supabaseAdmin
    .from('incidents')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', localMidnight.toISOString());

  if (error) {
    throw error;
  }

  return count ?? 0;
};

const findRecentIncidents = async ({ limit = 6 } = {}) => {
  const { data, error } = await supabaseAdmin
    .from('incidents')
    .select('id, code, title, status, created_at, user_id')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return data ?? [];
};

const countIncidentsGroupedByStatus = async () => {
  const { data, error } = await supabaseAdmin.from('incidents').select('status');

  if (error) {
    throw error;
  }

  const counts = {};
  for (const row of data ?? []) {
    counts[row.status] = (counts[row.status] ?? 0) + 1;
  }

  return Object.entries(counts)
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count);
};

const countIncidentsGroupedByCategory = async ({ limit = 5 } = {}) => {
  const { data, error } = await supabaseAdmin
    .from('incidents')
    .select('categories(name)');

  if (error) {
    throw error;
  }

  const counts = {};
  for (const row of data ?? []) {
    const name = (row.categories && row.categories.name) || 'Sin categoría';
    counts[name] = (counts[name] ?? 0) + 1;
  }

  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
};

module.exports = {
  countActiveUsersByRole,
  countTotalCitizens,
  countTotalIncidents,
  countIncidentsByStatus,
  countIncidentsByCategory,
  countIncidentsToday,
  findRecentIncidents,
  countIncidentsGroupedByStatus,
  countIncidentsGroupedByCategory,
};
