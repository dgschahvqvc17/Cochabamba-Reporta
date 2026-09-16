/**
 * Servicio de incidentes (MVC - Service).
 *
 * HU06 — Registro de incidentes por parte del ciudadano.
 * HU07 — Adjuntar evidencia fotográfica.
 * HU08 — Registrar ubicación del incidente.
 * HU09 — Consultar y gestionar incidentes (personal municipal).
 *
 * Contiene la lógica de negocio del módulo de incidentes:
 *   - Requiere ciudadano autenticado (asocia `user_id`).
 *   - Valida que la categoría exista y esté activa.
 *   - Valida título y descripción (longitudes idénticas al validator:
 *     se importan las constantes MIN/MAX desde incident.validator para no
 *     duplicar valores mágicos).
 *   - Genera el código único del incidente (INC-AAAAMMDD-NNN) a partir del
 *     conteo de incidentes del día (countToday) + 1.
 *   - Crea el incidente con estado inicial REPORTADO (definido en el
 *     repository.release_create).
 *   - Adjunta evidencia fotográfica (HU07): valida autenticación, existencia
 *     y propiedad del incidente, formato/tamaño de la imagen, límite de
 *     imágenes por incidente, sube el archivo a Supabase Storage y registra
 *     la referencia en la tabla `evidence`.
 * Replica el patrón exacto de category.service.js (buildError + normalizeText
 * + toPublicIncident), solo con la capa de datos hacia incidentRepository.
 *
 * @format
 */

'use strict';

const crypto = require('crypto');

const incidentRepository = require('../repositories/incident.repository');
const categoryRepository = require('../repositories/category.repository');
const evidenceRepository = require('../repositories/evidence.repository');
const locationRepository = require('../repositories/location.repository');
const { supabaseAdmin } = require('../config/supabase');
const {
  ALLOWED_MIME_TYPES,
  MAX_IMAGE_SIZE,
  MAX_EVIDENCE_COUNT,
  EVIDENCE_BUCKET,
  extensionFromMime,
} = require('../utils/evidence');
const {
  toNumber,
  isValidLatitude,
  isValidLongitude,
  MAX_ADDRESS_LENGTH,
  normalizeAddress,
  toPublicLocation,
} = require('../utils/location');
const {
  MIN_TITLE_LENGTH,
  MAX_TITLE_LENGTH,
  MIN_DESCRIPTION_LENGTH,
  MAX_DESCRIPTION_LENGTH,
  INCIDENT_STATUSES,
  DEFAULT_LIST_PAGE_SIZE,
  MAX_LIST_PAGE_SIZE,
} = require('../validators/incident.validator');
const ROLES = require('../utils/roles');

const MIN_CATEGORY_ID = 1;

/** Único estado en el que el ciudadano puede editar o eliminar su reporte. */
const EDITABLE_STATUS = 'REPORTADO';

/**
 * Roles municipales que consultan todos los incidentes (HU09).
 * El ciudadano solo consulta sus propios reportes.
 */
const MANAGED_ROLES = [
  ROLES.RECEPCION,
  ROLES.VERIFICADOR,
  ROLES.ENCARGADO_SOLUCION,
  ROLES.PERSONAL_SOLUCION,
  ROLES.ADMINISTRADOR,
];

const buildError = (message, status, code, field = null) => {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  if (field) {
    error.details = [{ field, message }];
  }
  return error;
};

const normalizeText = (value) => (value ? String(value).trim() : '');

const parsePositiveInt = (value, fallback, max) => {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 1) {
    return fallback;
  }
  return Math.min(parsed, max);
};

/**
 * Ciudadano que realizó el reporte (HU09). Campos mínimos necesarios
 * para que el encargado de recepción identifique al reportante.
 */
const toPublicReporter = (citizen) =>
  citizen
    ? {
        id: citizen.id,
        firstName: citizen.first_name,
        lastName: citizen.last_name,
        identityNumber: citizen.identity_number,
        phone: citizen.phone,
        email: citizen.email,
      }
    : null;

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

/**
 * Un reporte es editable si está REPORTADO y nunca fue editado
 * (updated_at === created_at: la única edición permitida es del ciudadano).
 */
const isEditable = (incident) =>
  Boolean(
    incident &&
      incident.status === EDITABLE_STATUS &&
      String(incident.updated_at) === String(incident.created_at),
  );

const toPublicIncident = (incident) => ({
  id: incident.id,
  code: incident.code,
  userId: incident.user_id,
  categoryId: incident.category_id,
  title: incident.title,
  description: incident.description,
  status: incident.status,
  createdAt: incident.created_at,
  updatedAt: incident.updated_at,
  canEdit: isEditable(incident),
  canDelete: incident.status === EDITABLE_STATUS,
  reporter: toPublicReporter(incident.citizen),
});

const toPublicIncidentListItem = (incident) => ({
  id: incident.id,
  code: incident.code,
  categoryId: incident.category_id,
  category: incident.category ? { id: incident.category.id, name: incident.category.name } : null,
  title: incident.title,
  description: incident.description,
  status: incident.status,
  createdAt: incident.created_at,
  updatedAt: incident.updated_at,
  canEdit: isEditable(incident),
  canDelete: incident.status === EDITABLE_STATUS,
  reporter: toPublicReporter(incident.citizen),
});

const toPublicEvidence = (evidence) => ({
  id: evidence.id,
  incidentId: evidence.incident_id,
  url: evidence.url,
  mimeType: evidence.mime_type,
  sizeBytes: evidence.size_bytes,
  createdAt: evidence.created_at,
});

const randomToken = (bytes) => crypto.randomBytes(bytes).toString('hex');

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
      total,
      page,
      limit,
      pages: Math.max(1, Math.ceil(total / limit)),
    };
  },

  async addEvidence(user, incidentId, file) {
    const userId = user && user.id;

    if (!userId) {
      throw buildError(
        'Debe iniciar sesión para adjuntar evidencia.',
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
        'Solo puedes adjuntar evidencia a tus propios incidentes.',
        403,
        'FORBIDDEN',
      );
    }

    if (!file || !file.buffer) {
      throw buildError(
        'Debe adjuntar una imagen como evidencia.',
        422,
        'VALIDATION_ERROR',
        'image',
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw buildError(
        'El formato de la imagen no es válido. Solo se permiten JPG, JFIF, PNG y WebP.',
        422,
        'VALIDATION_ERROR',
        'image',
      );
    }

    if (file.size > MAX_IMAGE_SIZE) {
      throw buildError(
        'La imagen supera el tamaño máximo permitido (5 MB).',
        422,
        'VALIDATION_ERROR',
        'image',
      );
    }

    const currentCount = await evidenceRepository.countByIncident(
      Number(incidentId),
    );

    if (currentCount >= MAX_EVIDENCE_COUNT) {
      throw buildError(
        `Solo puedes adjuntar hasta ${MAX_EVIDENCE_COUNT} imágenes por incidente.`,
        422,
        'EVIDENCE_LIMIT_REACHED',
        'image',
      );
    }

    const extension = extensionFromMime(file.mimetype);
    const storagePath = `incidents/${incident.id}/${Date.now()}-${randomToken(6)}${extension}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from(EVIDENCE_BUCKET)
      .upload(storagePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      throw buildError(
        'No se pudo almacenar la imagen.',
        500,
        'EVIDENCE_UPLOAD_ERROR',
      );
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from(EVIDENCE_BUCKET)
      .getPublicUrl(storagePath);

    const publicUrl = publicUrlData && publicUrlData.publicUrl;

    const created = await evidenceRepository.create({
      incidentId: incident.id,
      url: publicUrl,
      storagePath,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      uploadedBy: userId,
    });

    return toPublicEvidence(created);
  },

  async addLocation(user, incidentId, payload) {
    const userId = user && user.id;

    if (!userId) {
      throw buildError(
        'Debe iniciar sesión para registrar la ubicación.',
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
        'Solo puedes registrar la ubicación de tus propios incidentes.',
        403,
        'FORBIDDEN',
      );
    }

    const latitude = toNumber(payload && payload.latitude);
    const longitude = toNumber(payload && payload.longitude);
    const address = normalizeAddress(payload && payload.address);

    if (latitude === null || !isValidLatitude(latitude)) {
      throw buildError(
        `La latitud debe estar entre -90 y 90.`,
        422,
        'VALIDATION_ERROR',
        'latitude',
      );
    }

    if (longitude === null || !isValidLongitude(longitude)) {
      throw buildError(
        `La longitud debe estar entre -180 y 180.`,
        422,
        'VALIDATION_ERROR',
        'longitude',
      );
    }

    if (address && address.length > MAX_ADDRESS_LENGTH) {
      throw buildError(
        `La dirección no debe superar los ${MAX_ADDRESS_LENGTH} caracteres.`,
        422,
        'VALIDATION_ERROR',
        'address',
      );
    }

    const capturedAt = payload.capturedAt || undefined;

    const created = await locationRepository.create({
      incidentId: incident.id,
      latitude,
      longitude,
      address,
      capturedAt,
    });

    return toPublicLocation(created);
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

      if (storagePaths.length > 0) {
        await supabaseAdmin.storage
          .from(EVIDENCE_BUCKET)
          .remove(storagePaths);
      }
    }

    await locationRepository.deleteByIncident(incident.id);
    await incidentRepository.remove(incident.id);

    return { id: incident.id, code: incident.code };
  },
};

module.exports = incidentService;
