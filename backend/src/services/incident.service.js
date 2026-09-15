/**
 * Servicio de incidentes (MVC - Service).
 *
 * HU06 — Registro de incidentes por parte del ciudadano.
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
 * Replica el patrón exacto de category.service.js (buildError + normalizeText
 * + toPublicIncident), solo con la capa de datos hacia incidentRepository.
 *
 * @format
 */

'use strict';

const incidentRepository = require('../repositories/incident.repository');
const categoryRepository = require('../repositories/category.repository');
const {
  MIN_TITLE_LENGTH,
  MAX_TITLE_LENGTH,
  MIN_DESCRIPTION_LENGTH,
  MAX_DESCRIPTION_LENGTH,
} = require('../validators/incident.validator');

const MIN_CATEGORY_ID = 1;

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

const buildIncidentCode = (sequence) => {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `INC-${year}${month}${day}-${String(sequence).padStart(3, '0')}`;
};

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
});

const incidentService = {
  async createIncident(user, payload) {
    const userId = user && user.id;
    const categoryId = Number(payload && payload.categoryId);
    const title = normalizeText(payload && payload.title);
    const description = normalizeText(payload && payload.description);

    if (!userId) {
      throw buildError(
        'Debe iniciar sesión para registrar un incidente.',
        401,
        'AUTHENTICATION_REQUIRED',
      );
    }

    if (!categoryId || categoryId < MIN_CATEGORY_ID) {
      throw buildError(
        'Debe seleccionar una categoría.',
        422,
        'VALIDATION_ERROR',
        'categoryId',
      );
    }

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

  async getIncidentById(id) {
    const incident = await incidentRepository.findById(id);

    if (!incident) {
      throw buildError('El incidente no existe.', 404, 'INCIDENT_NOT_FOUND');
    }

    return toPublicIncident(incident);
  },
};

module.exports = incidentService;
