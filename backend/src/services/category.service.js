/**
 * Servicio de categorías (MVC - Service).
 *
 * Contiene la lógica de negocio de HU04 — Gestionar categorías de
 * incidentes:
 *   - Listar categorías. El administrador ve todas (activas e
 *     inactivas); el ciudadano y el público solo ven las activas.
 *   - Registrar categorías.
 *   - Editar categorías.
 *   - Activar / desactivar categorías.
 * Incluye la validación de nombre obligatorio y la prevención de
 * categorías duplicadas.
 *
 * @format
 */

'use strict';

const categoryRepository = require('../repositories/category.repository');
const ROLES = require('../utils/roles');

const MAX_NAME_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 255;

const buildError = (message, status, code) => {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
};

const toPublicCategory = (category) => ({
  id: category.id,
  name: category.name,
  description: category.description,
  active: category.active,
  createdAt: category.created_at,
  updatedAt: category.updated_at,
});

const normalizeText = (value) => (value ? String(value).trim() : '');

const categoryService = {
  async listCategories(user, query = {}) {
    const isAdmin = Boolean(user && user.role === ROLES.ADMINISTRADOR);
    const search = query.search ? String(query.search).trim() : '';

    const categories = await categoryRepository.findAll({
      onlyActive: !isAdmin,
      search: isAdmin ? search : '',
    });

    return {
      categories: categories.map(toPublicCategory),
      onlyActive: !isAdmin,
    };
  },

  async createCategory(payload) {
    const name = normalizeText(payload.name);

    if (!name) {
      throw buildError('El nombre de la categoría es obligatorio.', 422, 'VALIDATION_ERROR');
    }

    if (name.length > MAX_NAME_LENGTH) {
      throw buildError(
        `El nombre no debe superar los ${MAX_NAME_LENGTH} caracteres.`,
        422,
        'VALIDATION_ERROR',
      );
    }

    const description = payload.description
      ? normalizeText(payload.description)
      : null;

    if (description && description.length > MAX_DESCRIPTION_LENGTH) {
      throw buildError(
        `La descripción no debe superar los ${MAX_DESCRIPTION_LENGTH} caracteres.`,
        422,
        'VALIDATION_ERROR',
      );
    }

    const duplicate = await categoryRepository.findByName(name);
    if (duplicate) {
      throw buildError(
        'Ya existe una categoría con ese nombre.',
        409,
        'CATEGORY_ALREADY_EXISTS',
      );
    }

    const created = await categoryRepository.create({ name, description });

    return toPublicCategory(created);
  },

  async updateCategory(id, payload) {
    const current = await categoryRepository.findById(id);
    if (!current) {
      throw buildError('La categoría no existe.', 404, 'CATEGORY_NOT_FOUND');
    }

    const updates = {};

    if (payload.name !== undefined) {
      const name = normalizeText(payload.name);

      if (!name) {
        throw buildError(
          'El nombre de la categoría es obligatorio.',
          422,
          'VALIDATION_ERROR',
        );
      }

      if (name.length > MAX_NAME_LENGTH) {
        throw buildError(
          `El nombre no debe superar los ${MAX_NAME_LENGTH} caracteres.`,
          422,
          'VALIDATION_ERROR',
        );
      }

      const duplicate = await categoryRepository.findByNameExcludingId(name, id);
      if (duplicate) {
        throw buildError(
          'Ya existe una categoría con ese nombre.',
          409,
          'CATEGORY_ALREADY_EXISTS',
        );
      }

      updates.name = name;
    }

    if (payload.description !== undefined) {
      const description = normalizeText(payload.description) || null;

      if (description && description.length > MAX_DESCRIPTION_LENGTH) {
        throw buildError(
          `La descripción no debe superar los ${MAX_DESCRIPTION_LENGTH} caracteres.`,
          422,
          'VALIDATION_ERROR',
        );
      }

      updates.description = description;
    }

    if (Object.keys(updates).length === 0) {
      return toPublicCategory(current);
    }

    const updated = await categoryRepository.update(id, updates);

    return toPublicCategory(updated);
  },

  async setCategoryStatus(id, active) {
    const current = await categoryRepository.findById(id);
    if (!current) {
      throw buildError('La categoría no existe.', 404, 'CATEGORY_NOT_FOUND');
    }

    if (current.active === Boolean(active)) {
      return toPublicCategory(current);
    }

    const updated = await categoryRepository.updateActive(id, Boolean(active));

    return toPublicCategory(updated);
  },
};

module.exports = categoryService;