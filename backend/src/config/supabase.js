/**
 * Conexión a Supabase (MVC - src/config).
 *
 * Supabase proporciona la base de datos (PostgreSQL), la autenticación
 * y el almacenamiento de evidencias del sistema.
 *
 * - supabasePublic: cliente con la clave "publishable" (anon), para operaciones
 *   públicas del frontend cuando corresponda.
 * - supabaseAdmin: cliente con la clave "secret" (service role), usado por el
 *   backend para operaciones con privilegios sobre la base de datos.
 *
 * @format
 */

'use strict';

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabasePublishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabasePublishableKey || !supabaseSecretKey) {
  throw new Error('Faltan variables de entorno de Supabase (ver .env.example)');
}

const supabasePublic = createClient(supabaseUrl, supabasePublishableKey);

const supabaseAdmin = createClient(supabaseUrl, supabaseSecretKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

module.exports = { supabasePublic, supabaseAdmin };