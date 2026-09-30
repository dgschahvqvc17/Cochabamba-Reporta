/**
 * Repositorio de auditoría de usuarios (MVC - Repository).
 *
 * Responsable únicamente del acceso a datos de la tabla
 * `user_audit_log` de Supabase (PostgreSQL). Sin lógica de negocio.
 *
 * @format
 */

'use strict';

const { supabaseAdmin } = require('../config/supabase');

const create = async (entry) => {
  const { error } = await supabaseAdmin.from('user_audit_log').insert(entry);

  if (error) {
    throw error;
  }
};

const findByUserId = async (userId) => {
  const { data, error } = await supabaseAdmin
    .from('user_audit_log')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    throw error;
  }

  return data;
};

module.exports = {
  createAudit: create,
  findAuditByUserId: findByUserId,
};