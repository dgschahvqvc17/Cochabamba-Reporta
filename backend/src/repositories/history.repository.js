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

const REOPEN_EDIT_COMMENT =
  'Reporte mejorado por el ciudadano tras reabrir su caso.';

/**
 * Marcas de reapertura de varios incidentes a la vez (para enriquecer el
 * detalle y las listas del ciudadano sin una columna en la base de datos).
 *
 * Devuelve un Map<incident_id, { reopened, editedAfterReopen }>:
 *   - `reopened`: el incidente ya fue reabierto por el ciudadano
 *     (existe una transición RECHAZADO → REPORTADO).
 *   - `editedAfterReopen`: el ciudadano ya usó la edición única que abre la
 *     reapertura (transición REPORTADO → REPORTADO con el comentario de marca).
 */
const findReopenFlags = async (incidentIds) => {
  const ids = [...(incidentIds ?? [])].filter(
    (id) => id !== null && id !== undefined,
  );

  if (ids.length === 0) {
    return new Map();
  }

  const { data, error } = await supabaseAdmin
    .from('history')
    .select('incident_id, from_status, to_status, comment')
    .in('incident_id', ids);

  if (error) {
    throw error;
  }

  const flags = new Map();

  for (const row of data ?? []) {
    const current = flags.get(row.incident_id) ?? {
      reopened: false,
      editedAfterReopen: false,
    };

    if (
      row.from_status === 'RECHAZADO' &&
      row.to_status === 'REPORTADO'
    ) {
      current.reopened = true;
    }

    if (
      row.from_status === 'REPORTADO' &&
      row.to_status === 'REPORTADO' &&
      row.comment === REOPEN_EDIT_COMMENT
    ) {
      current.editedAfterReopen = true;
    }

    flags.set(row.incident_id, current);
  }

  return flags;
};

module.exports = {
  create,
  findByIncident,
  findReopenFlags,
  REOPEN_EDIT_COMMENT,
};