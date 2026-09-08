/**
 * Rutas de autenticación (MVC - Routes).
 *
 * Define los endpoints de autenticación sin lógica de negocio.
 *
 * @format
 */

'use strict';

const express = require('express');
const authController = require('../controllers/auth.controller');

const router = express.Router();

router.post('/login', authController.login);

module.exports = router;