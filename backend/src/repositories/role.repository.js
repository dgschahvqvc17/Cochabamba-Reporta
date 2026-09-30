/**
 * Repositorio de roles (MVC - Repository).
 *
 * Responsable únicamente del acceso a datos de la tabla `roles` de
 * Supabase (PostgreSQL). Sin lógica de negocio.
 *
 * @format
 */

'use strict';

const { supabaseAdmin } = require('../config/supabase');

const findByName = async (roleName) => {
  const { data, error } = await supabaseAdmin
    .from('roles')
    .select('id')
    .eq('name', roleName)
    .single();

  if (error) {
    throw error;
  }

  return data;
};

const findAll = async () => {
  const { data, error } = await supabaseAdmin
    .from('roles')
    .select('id, name, description, active')
    .eq('active', true)
    .order('name');

  if (error) {
    throw error;
  }

  return data;
};

module.exports = {
  findByRoleName: findByName,
  findRoles: findAll,
};