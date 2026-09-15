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
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
};

const countToday = async () => {
  const startOfDay = new Date().toISOString().slice(0, 10);

  const { count, error } = await supabaseAdmin
    .from('incidents')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', startOfDay);

  if (error) {
    throw error;
  }

  return count ?? 0;
};

module.exports = {
  create,
  findById,
  countToday,
};
