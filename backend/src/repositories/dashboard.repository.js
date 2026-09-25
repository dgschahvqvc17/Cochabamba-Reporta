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
    .select('*', { count: 'exact', head: true })
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

module.exports = {
  countActiveUsersByRole,
  countTotalCitizens,
  countTotalIncidents,
  countIncidentsByStatus,
  countIncidentsByCategory,
  countIncidentsToday,
  findRecentIncidents,
};
