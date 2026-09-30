/**
 * Repositorio de ubicaciones (MVC - Repository).
 *
 * Responsable únicamente del acceso a datos de la tabla `locations`
 * de Supabase (PostgreSQL). Sin lógica de negocio.
 *
 * @format
 */

'use strict';

const { supabaseAdmin } = require('../config/supabase');

const create = async ({ incidentId, latitude, longitude, address, capturedAt }) => {
  const payload = {
    incident_id: incidentId,
    latitude,
    longitude,
  };

  if (address) {
    payload.address = address;
  }

  if (capturedAt) {
    payload.captured_at = capturedAt;
  }

  const { data, error } = await supabaseAdmin
    .from('locations')
    .insert(payload)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data;
};

const findLatestByIncidentId = async (incidentId) => {
  const { data, error } = await supabaseAdmin
    .from('locations')
    .select('*')
    .eq('incident_id', incidentId)
    .order('captured_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
};

const deleteByIncident = async (incidentId) => {
  const { data, error } = await supabaseAdmin
    .from('locations')
    .delete()
    .eq('incident_id', incidentId);

  if (error) {
    throw error;
  }

  return data ?? [];
};

module.exports = {
  create,
  findLatestByIncidentId,
  deleteByIncident,
};