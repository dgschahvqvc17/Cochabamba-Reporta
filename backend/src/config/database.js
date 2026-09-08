/**
 * Configuración de la base de datos (MVC - src/config).
 *
 * La base de datos del sistema está gestionada por Supabase
 * (PostgreSQL en la nube). Esta capa centraliza el acceso a
 * los datos a través del cliente de Supabase.
 *
 * @format
 */

'use strict';

const { supabaseAdmin } = require('./supabase');

module.exports = {
  client: supabaseAdmin,
};