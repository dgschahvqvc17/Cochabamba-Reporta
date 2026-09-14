/**
 * Repositorio de categorías (MVC - Repository).
 *
 * Responsable únicamente del acceso a datos de la tabla `categories`
 * de Supabase (PostgreSQL). Sin lógica de negocio.
 *
 * @format
 */

'use strict';

const { supabaseAdmin } = require('../config/supabase');

const sanitizeSearchTerm = (value) =>
  value
    .replace(/[%,]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const findAll = async ({ onlyActive = false, search = '' } = {}) => {
  let query = supabaseAdmin.from('categories').select('*');

  if (onlyActive) {
    query = query.eq('active', true);
  }

  const term = search ? sanitizeSearchTerm(search) : '';
  if (term) {
    query = query.or(`name.ilike.%${term}%,description.ilike.%${term}%`);
  }

  const { data, error } = await query.order('name', { ascending: true });

  if (error) {
    throw error;
  }

  return data;
};

const findById = async (id) => {
  const { data, error } = await supabaseAdmin
    .from('categories')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
};

const findByName = async (name) => {
  const { data, error } = await supabaseAdmin
    .from('categories')
    .select('id')
    .ilike('name', name)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
};

const findByNameExcludingId = async (name, excludeId) => {
  const { data, error } = await supabaseAdmin
    .from('categories')
    .select('id')
    .ilike('name', name)
    .neq('id', excludeId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
};

const create = async ({ name, description }) => {
  const { data, error } = await supabaseAdmin
    .from('categories')
    .insert({ name, description })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

const update = async (id, fields) => {
  const { data, error } = await supabaseAdmin
    .from('categories')
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
    .from('categories')
    .update({ active })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

module.exports = {
  findAll,
  findById,
  findByName,
  findByNameExcludingId,
  create,
  update,
  updateActive,
};