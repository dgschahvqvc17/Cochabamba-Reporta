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
  countToday,
  update,
  remove,
};
