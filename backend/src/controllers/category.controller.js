/**
 * Controlador de categorías (MVC - Controller).
 *
 * Recibe las solicitudes HTTP de gestión de categorías de incidentes
 * (HU04), delega la lógica al service y devuelve las respuestas.
 * Ligero: sin lógica de negocio.
 *
 * @format
 */

'use strict';

const categoryService = require('../services/category.service');
const { ok } = require('../utils/response');

const categoryController = {
  async listCategories(req, res, next) {
    try {
      const data = await categoryService.listCategories(req.user, req.query);

      return ok(res, 200, 'Categorías consultadas correctamente.', data);
    } catch (error) {
      return next(error);
    }
  },

  async createCategory(req, res, next) {
    try {
      const category = await categoryService.createCategory(req.body);

      return ok(res, 201, 'Categoría registrada correctamente.', { category });
    } catch (error) {
      return next(error);
    }
  },

  async updateCategory(req, res, next) {
    try {
      const category = await categoryService.updateCategory(req.params.id, req.body);

      return ok(res, 200, 'Categoría actualizada correctamente.', { category });
    } catch (error) {
      return next(error);
    }
  },

  async updateCategoryStatus(req, res, next) {
    try {
      const category = await categoryService.setCategoryStatus(
        req.params.id,
        req.body.active,
      );

      const message = category.active
        ? 'Categoría activada correctamente.'
        : 'Categoría desactivada correctamente.';

      return ok(res, 200, message, { category });
    } catch (error) {
      return next(error);
    }
  },
};

module.exports = categoryController;