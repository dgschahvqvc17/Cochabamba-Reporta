/**
 * Punto de entrada de la aplicación (MVC - app).
 *
 * Configura Express, los middlewares globales, las rutas
 * y el manejo de errores.
 *
 * @format
 */

'use strict';

const express = require('express');
const cors = require('cors');

const environment = require('./config/environment');
const { supabaseAdmin } = require('./config/supabase');

const authRoutes = require('./routes/auth.routes');
const errorMiddleware = require('./middlewares/error.middleware');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'API REST - Alcaldía Municipal de Cochabamba',
  });
});

app.get('/api/health', async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1,
    });

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      message: 'Servicio disponible',
      data: {
        database: 'Supabase',
        status: 'connected',
        environment: environment.nodeEnv,
      },
    });
  } catch (error) {
    next(error);
  }
});

app.use('/api/auth', authRoutes);

app.use(errorMiddleware);

module.exports = app;