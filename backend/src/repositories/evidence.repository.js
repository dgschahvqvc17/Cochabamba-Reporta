/**
 * Repositorio de evidencias (MVC - Repository).
 *
 * HU07 — Adjuntar evidencia fotográfica.
 * Responsable únicamente del acceso a datos de la tabla `evidence`
 * de Supabase (PostgreSQL). Sin lógica de negocio.
 *
 * @format
 */

'use strict';

const { supabaseAdmin } = require('../config/supabase');

const countByIncident = async (incidentId) => {
  const { count, error } = await supabaseAdmin
    .from('evidence')
    .select('id', { count: 'exact', head: true })
    .eq('incident_id', incidentId);

  if (error) {
    throw error;
  }

  return count ?? 0;
};

const create = async ({
  incidentId,
  url,
  storagePath,
  mimeType,
  sizeBytes,
  uploadedBy,
}) => {
  const { data, error } = await supabaseAdmin
    .from('evidence')
    .insert({
      incident_id: incidentId,
      url,
      storage_path: storagePath,
      mime_type: mimeType,
      size_bytes: sizeBytes,
      uploaded_by: uploadedBy,
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
    .from('evidence')
    .select('*')
    .eq('incident_id', incidentId)
    .order('created_at', { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
};

module.exports = {
  countByIncident,
  create,
  findByIncident,
};