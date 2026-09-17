/**
 * Repositorio de historial de cambios de estado (MVC - Repository).
 *
 * Responsable únicamente del acceso a datos de la tabla `history`
 * de Supabase (PostgreSQL). Sin lógica de negocio.
 *
 * @format
 */

'use strict';

const { supabaseAdmin } = require('../config/supabase');

const create = async ({ incidentId, fromStatus, toStatus, changedBy, comment }) => {
  const { data, error } = await supabaseAdmin
    .from('history')
    .insert({
      incident_id: incidentId,
      from_status: fromStatus,
      to_status: toStatus,
      changed_by: changedBy,
      comment: comment || null,
    })
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data;
};

const findByIncident = async (incidentId) => {
  const { data, error } = await supabaseAdmin
    .from('history')
    .select('*, changed_by:users(id, first_name, last_name)')
    .eq('incident_id', incidentId)
    .order('created_at', { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
};

module.exports = {
  create,
  findByIncident,
};