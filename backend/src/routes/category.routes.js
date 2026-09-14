/**
 * Rutas de categorías de incidentes (MVC - Routes).
 *
 * HU04 — Endpoints de gestión de categorías:
 *   - GET  /api/v1/categories          → listar. Público: solo activas;
 *                                        administrador: todas.
 *   - POST /api/v1/categories          → crear (administrador).
 *   - PATCH /api/v1/categories/:id     → editar (administrador).
 *   - PATCH /api/v1/categories/:id/status → activar/desactivar (administrador).
 * No contiene lógica de negocio.
 *
 * @format
 */

'use strict';

const express = require('express');

const categoryController = require('../controllers/category.controller');
const { authenticate, authenticateOptional } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');
const { validate } = require('../middlewares/validation.middleware');
const {
  createCategoryValidation,
  updateCategoryValidation,
  updateCategoryStatusValidation,
} = require('../validators/category.validator');
const ROLES = require('../utils/roles');

const router = express.Router();

router.get('/', authenticateOptional, categoryController.listCategories);

router.use(authenticate, requireRole(ROLES.ADMINISTRADOR));

router.post('/', validate(createCategoryValidation), categoryController.createCategory);
router.patch(
  '/:id',
  validate(updateCategoryValidation),
  categoryController.updateCategory,
);
router.patch(
  '/:id/status',
  validate(updateCategoryStatusValidation),
  categoryController.updateCategoryStatus,
);

module.exports = router;