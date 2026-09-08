/**
 * Configuración de la aplicación (MVC - src/config).
 *
 * Centraliza la lectura de variables de entorno y
 * la configuración general del backend.
 *
 * @format
 */

'use strict';

const dotenv = require('dotenv');

dotenv.config();

const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
};

module.exports = config;