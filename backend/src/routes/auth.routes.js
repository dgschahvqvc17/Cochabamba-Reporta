/**
 * Rutas de autenticación (MVC - Routes).
 *
 * Define los endpoints de autenticación. No contiene lógica de negocio.
 *
 * @format
 */

'use strict';

const express = require('express');

const authController = require('../controllers/auth.controller');
const { registerValidation } = require('../validators/user.validator');
const { validate } = require('../middlewares/validation.middleware');

const router = express.Router();

router.post('/register', validate(registerValidation), authController.register);
router.post('/login', authController.login);

module.exports = router;