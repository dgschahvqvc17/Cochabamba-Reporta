/**
 * Servicio de incidentes (MVC - Service).
 *
 * HU06 — Registro de incidentes por parte del ciudadano.
 * HU09 — Consultar y gestionar incidentes (personal municipal).
 * Editar / eliminar el reporte del ciudadano (estado REPORTADO, edición única).
 *
 * Responsabilidades:
 *   - Crear, consultar y listar incidentes (rol-aware).
 *   - Editar y eliminar el reporte del ciudadano (delega la eliminación de
 *     archivos de Storage en storage.repository).
 * La evidencia (HU07), la ubicación (HU08), la asignación a verificación
 * (HU10) y la verificación (HU11) viven en sus propios services.
 *
 * @format
 */

'use strict';

const incidentRepository = require('../repositories/incident.repository');
const categoryRepository = require('../repositories/category.repository');
const evidenceRepository = require('../repositories/evidence.repository');
const locationRepository = require('../repositories/location.repository');
const storageRepository = require('../repositories/storage.repository');
const ROLES = require('../utils/roles');
const { buildError } = require('../utils/errors');
const { normalizeText } = require('../utils/text');
const { parsePositiveInt, buildPaginationResponse } = require('../utils/pagination');
const { INCIDENT_STATUSES } = require('../utils/incidentStatus');
const {
  MIN_TITLE_LENGTH,
  MAX_TITLE_LENGTH,
  MIN_DESCRIPTION_LENGTH,
  MAX_DESCRIPTION_LENGTH,
  DEFAULT_LIST_PAGE_SIZE,
  MAX_LIST_PAGE_SIZE,
  MIN_CATEGORY_ID,
  EDITABLE_STATUS,
} = require('../utils/incidentRules');
const {
  toPublicIncident,
  toPublicIncidentListItem,
  toPublicEvidence,
} = require('../utils/incidentMappers');
const { toPublicLocation } = require('../utils/location');

/** Único estado en el que el ciudadano puede editar o eliminar su reporte. */
const buildIncidentCode = (sequence) => {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `INC-${year}${month}${day}-${String(sequence).padStart(3, '0')}`;
};

/**
 * Valida el payload de creación/edición (categoría + título + descripción)
 * y devuelve los valores ya normalizados. Usado por createIncident y
 * updateIncident para no duplicar reglas (principio DRY).
 */
const validateIncidentPayload = (userId, payload) => {
  if (!userId) {
    throw buildError(
      'Debe iniciar sesión para registrar un incidente.',
      401,
      'AUTHENTICATION_REQUIRED',
    );
  }

  const categoryId = Number(payload && payload.categoryId);
  const title = normalizeText(payload && payload.title);
  const description = normalizeText(payload && payload.description);

  if (!categoryId || categoryId < MIN_CATEGORY_ID) {
    throw buildError(
      'Debe seleccionar una categoría.',
      422,
      'VALIDATION_ERROR',
      'categoryId',
    );
  }

  if (!title) {
    throw buildError(
      'El título es obligatorio.',
      422,
      'VALIDATION_ERROR',
      'title',
    );
  }

  if (
    title.length < MIN_TITLE_LENGTH ||
    title.length > MAX_TITLE_LENGTH
  ) {
    throw buildError(
      `El título debe tener entre ${MIN_TITLE_LENGTH} y ${MAX_TITLE_LENGTH} caracteres.`,
      422,
      'VALIDATION_ERROR',
      'title',
    );
  }

  if (!description) {
    throw buildError(
      'La descripción es obligatoria.',
      422,
      'VALIDATION_ERROR',
      'description',
    );
  }

  if (
    description.length < MIN_DESCRIPTION_LENGTH ||
    description.length > MAX_DESCRIPTION_LENGTH
  ) {
    throw buildError(
      `La descripción debe tener entre ${MIN_DESCRIPTION_LENGTH} y ${MAX_DESCRIPTION_LENGTH} caracteres.`,
      422,
      'VALIDATION_ERROR',
      'description',
    );
  }

  return { categoryId, title, description };
};

const incidentService = {
  async createIncident(user, payload) {
    const userId = user && user.id;
    const { categoryId, title, description } = validateIncidentPayload(
      userId,
      payload,
    );

    const category = await categoryRepository.findById(categoryId);

    if (!category) {
      throw buildError(
        'La categoría seleccionada no existe.',
        422,
        'VALIDATION_ERROR',
        'categoryId',
      );
    }

    if (!category.active) {
      throw buildError(
        'La categoría seleccionada no está activa.',
        422,
        'VALIDATION_ERROR',
        'categoryId',
      );
    }

    const countToday = await incidentRepository.countToday();
    const code = buildIncidentCode(countToday + 1);

    const created = await incidentRepository.create({
      code,
      userId,
      categoryId,
      title,
      description,
    });

    return toPublicIncident(created);
  },

  async getIncidentById(id, user) {
    const incident = await incidentRepository.findById(id);

    if (!incident) {
      throw buildError('El incidente no existe.', 404, 'INCIDENT_NOT_FOUND');
    }

    const userId = user && user.id;

    if (userId && user.role === ROLES.CIUDADANO) {
      if (Number(incident.user_id) !== Number(userId)) {
        throw buildError(
          'Solo puedes consultar el detalle de tus propios reportes.',
          403,
          'FORBIDDEN',
        );
      }
    }

    const evidence = await evidenceRepository.findByIncident(incident.id);
    const location = await locationRepository.findLatestByIncidentId(
      incident.id,
    );

    return {
      ...toPublicIncident(incident),
      location: location ? toPublicLocation(location) : null,
      evidence: evidence.map(toPublicEvidence),
    };
  },

  async listMyIncidents(user, query) {
    const userId = user && user.id;

    if (!userId) {
      throw buildError(
        'Debe iniciar sesión para consultar sus reportes.',
        401,
        'AUTHENTICATION_REQUIRED',
      );
    }

    const status = query && query.status ? String(query.status) : null;

    if (status && !INCIDENT_STATUSES.includes(status)) {
      throw buildError(
        'El estado indicado no es válido.',
        422,
        'VALIDATION_ERROR',
        'status',
      );
    }

    const incidents = await incidentRepository.findByUserId({ userId, status });

    return incidents.map(toPublicIncidentListItem);
  },

  /**
   * Lista de incidentes según el rol (HU09).
   * - Ciudadano: solo sus reportes.
   * - Personal municipal (RECEPCION y demás): todos los incidentes con
   *   búsqueda, filtros y paginación.
   */
  async listIncidents(user, query = {}) {
    const userId = user && user.id;

    if (!userId) {
      throw buildError(
        'Debe iniciar sesión para consultar incidentes.',
        401,
        'AUTHENTICATION_REQUIRED',
      );
    }

    if (user.role === ROLES.CIUDADANO) {
      const incidents = await this.listMyIncidents(user, query);
      return { incidents };
    }

    return this.listManagedIncidents(user, query);
  },

  /**
   * Consulta y gestión de incidentes para el personal municipal
   * (HU09, actor Encargado de recepción). Filtros por estado, categoría,
   * fecha (desde/hasta) y búsqueda por código, título o descripción.
   */
  async listManagedIncidents(user, query = {}) {
    const page = parsePositiveInt(query.page, 1, Number.MAX_SAFE_INTEGER);
    const limit = parsePositiveInt(
      query.limit,
      DEFAULT_LIST_PAGE_SIZE,
      MAX_LIST_PAGE_SIZE,
    );
    const status =
      query && query.status ? String(query.status).trim() : null;
    const categoryId = query.categoryId ? Number(query.categoryId) : null;
    const from = query && query.from ? String(query.from).trim() : null;
    const to = query && query.to ? String(query.to).trim() : null;
    const search = query && query.search ? String(query.search).trim() : '';

    if (status && !INCIDENT_STATUSES.includes(status)) {
      throw buildError(
        'El estado indicado no es válido.',
        422,
        'VALIDATION_ERROR',
        'status',
      );
    }

    if (
      from &&
      to &&
      /^\d{4}-\d{2}-\d{2}$/.test(from) &&
      /^\d{4}-\d{2}-\d{2}$/.test(to) &&
      from > to
    ) {
      throw buildError(
        'La fecha "desde" no puede ser posterior a la fecha "hasta".',
        422,
        'VALIDATION_ERROR',
        'from',
      );
    }

    const { incidents, total } = await incidentRepository.findAllManaged({
      page,
      limit,
      status,
      categoryId,
      from: from ? `${from}T00:00:00.000` : null,
      to: to ? `${to}T23:59:59.999` : null,
      search,
    });

    return {
      incidents: incidents.map(toPublicIncidentListItem),
      ...buildPaginationResponse({ total, page, limit }),
    };
  },

  async updateIncident(user, incidentId, payload) {
    const userId = user && user.id;

    if (!userId) {
      throw buildError(
        'Debe iniciar sesión para editar un reporte.',
        401,
        'AUTHENTICATION_REQUIRED',
      );
    }

    const incident = await incidentRepository.findById(incidentId);

    if (!incident) {
      throw buildError('El incidente no existe.', 404, 'INCIDENT_NOT_FOUND');
    }

    if (incident.user_id !== userId) {
      throw buildError(
        'Solo puedes editar tus propios reportes.',
        403,
        'FORBIDDEN',
      );
    }

    if (incident.status !== EDITABLE_STATUS) {
      throw buildError(
        'Solo puedes editar un reporte en estado REPORTADO.',
        409,
        'INCIDENT_NOT_EDITABLE',
      );
    }

    if (String(incident.updated_at) !== String(incident.created_at)) {
      throw buildError(
        'Este reporte ya fue editado anteriormente. Solo se permite una edición.',
        409,
        'INCIDENT_ALREADY_EDITED',
      );
    }

    const { categoryId, title, description } = validateIncidentPayload(
      userId,
      payload,
    );

    const category = await categoryRepository.findById(categoryId);

    if (!category || !category.active) {
      throw buildError(
        'La categoría seleccionada no está disponible.',
        422,
        'VALIDATION_ERROR',
        'categoryId',
      );
    }

    const updated = await incidentRepository.update({
      id: incident.id,
      userId,
      categoryId,
      title,
      description,
    });

    return toPublicIncident(updated);
  },

  async deleteIncident(user, incidentId) {
    const userId = user && user.id;

    if (!userId) {
      throw buildError(
        'Debe iniciar sesión para eliminar un reporte.',
        401,
        'AUTHENTICATION_REQUIRED',
      );
    }

    const incident = await incidentRepository.findById(incidentId);

    if (!incident) {
      throw buildError('El incidente no existe.', 404, 'INCIDENT_NOT_FOUND');
    }

    if (incident.user_id !== userId) {
      throw buildError(
        'Solo puedes eliminar tus propios reportes.',
        403,
        'FORBIDDEN',
      );
    }

    if (incident.status !== EDITABLE_STATUS) {
      throw buildError(
        'Solo puedes eliminar un reporte en estado REPORTADO.',
        409,
        'INCIDENT_NOT_EDITABLE',
      );
    }

    const evidence = await evidenceRepository.findByIncident(incident.id);

    if (evidence.length > 0) {
      await evidenceRepository.deleteByIncident(incident.id);

      const storagePaths = evidence
        .map((item) => item.storage_path)
        .filter(Boolean);

      await storageRepository.removeEvidence(storagePaths);
    }

    await locationRepository.deleteByIncident(incident.id);
    await incidentRepository.remove(incident.id);

    return { id: incident.id, code: incident.code };
  },
};

module.exports = incidentService;