/**
 * Repositorio de notificaciones (MVC - Repository).
 *
 * Responsable únicamente del acceso a datos de la tabla `notifications`
 * de Supabase (PostgreSQL). Sin lógica de negocio.
 *
 * @format
 */

'use strict';

const { supabaseAdmin } = require('../config/supabase');

const create = async ({ incidentId, userId, message }) => {
  const { data, error } = await supabaseAdmin
    .from('notifications')
    .insert({
      incident_id: incidentId,
      user_id: userId,
      message,
      read: false,
    })
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data;
};

const findByUser = async ({ userId, limit = 50 }) => {
  const { data, error } = await supabaseAdmin
    .from('notifications')
    .select('*, incident:incidents(code)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return data ?? [];
};

const findById = async (id) => {
  const { data, error } = await supabaseAdmin
    .from('notifications')
    .select('*, incident:incidents(code)')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
};

const countUnreadByUser = async (userId) => {
  const { count, error } = await supabaseAdmin
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false);

  if (error) {
    throw error;
  }

  return count ?? 0;
};

const markAsRead = async (id) => {
  const { data, error } = await supabaseAdmin
    .from('notifications')
    .update({ read: true })
    .eq('id', id)
    .select('*, incident:incidents(code)')
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
};

module.exports = {
  create,
  findByUser,
  findById,
  countUnreadByUser,
  markAsRead,
};