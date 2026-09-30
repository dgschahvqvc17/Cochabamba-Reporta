/**
 * Rutas de gestión de usuarios y roles (MVC - Routes).
 *
 * HU03 — Todas las operaciones están restringidas al ADMINISTRADOR
 * (autenticación + middleware de roles). No contiene lógica de negocio.
 *
 * @format
 */

'use strict';

const express = require('express');

const userController = require('../controllers/user.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');
const { validate } = require('../middlewares/validation.middleware');
const {
  createInternalUserValidation,
  updateUserValidation,
  updateUserStatusValidation,
  updateUserRoleValidation,
} = require('../validators/user.validator');
const ROLES = require('../utils/roles');

const router = express.Router();

router.use(authenticate, requireRole(ROLES.ADMINISTRADOR));

router.get('/', userController.listUsers);
router.get('/roles', userController.listRoles);
router.get('/:id', userController.getUserDetail);
router.post('/', validate(createInternalUserValidation), userController.createUser);
router.patch(
  '/:id',
  validate(updateUserValidation),
  userController.updateUser,
);
router.patch(
  '/:id/status',
  validate(updateUserStatusValidation),
  userController.updateUserStatus,
);
router.patch(
  '/:id/role',
  validate(updateUserRoleValidation),
  userController.updateUserRole,
);

module.exports = router;