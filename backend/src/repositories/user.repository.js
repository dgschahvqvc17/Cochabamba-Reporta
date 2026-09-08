/**
 * Repositorio de usuarios (MVC - Repository).
 *
 * Responsable únicamente del acceso a datos de la tabla `users`
 * y de la gestión de identidades en Supabase Auth.
 *
 * @format
 */

'use strict';

const { supabaseAdmin } = require('../config/supabase');

const findByEmail = async (email) => {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
};

const findByIdentityNumber = async (identityNumber) => {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('identity_number', identityNumber)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
};

const findByRoleName = async (roleName) => {
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

const createAuthUser = async ({ email, password, metadata }) => {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: metadata,
  });

  if (error) {
    throw error;
  }

  return data.user;
};

const create = async (user) => {
  const { data, error } = await supabaseAdmin
    .from('users')
    .insert(user)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

module.exports = {
  findByEmail,
  findByIdentityNumber,
  findByRoleName,
  createAuthUser,
  create,
};