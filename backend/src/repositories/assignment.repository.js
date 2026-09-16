/**
 * Repositorio de asignaciones (MVC - Repository).
 *
 * Responsable únicamente del acceso a datos de la tabla `assignments`
 * de Supabase (PostgreSQL). Sin lógica de negocio.
 *
 * @format
 */

'use strict';

const { supabaseAdmin } = require('../config/supabase');

const create = async ({ incidentId, type, assignedBy, assignedTo, note }) => {
  const { data, error } = await supabaseAdmin
    .from('assignments')
    .insert({
      incident_id: incidentId,
      assignment_type: type,
      assigned_by: assignedBy,
      assigned_to: assignedTo,
      note: note || null,
      active: true,
    })
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data;
};

const findActiveByIncident = async (incidentId, type) => {
  const { data, error } = await supabaseAdmin
    .from('assignments')
    .select('*')
    .eq('incident_id', incidentId)
    .eq('assignment_type', type)
    .eq('active', true)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
};

module.exports = {
  create,
  findActiveByIncident,
};