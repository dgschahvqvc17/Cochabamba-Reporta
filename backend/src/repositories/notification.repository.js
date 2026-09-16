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

module.exports = {
  create,
};