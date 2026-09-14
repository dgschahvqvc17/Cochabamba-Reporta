/**
 * Modelo de Categoría (MVC - Model).
 *
 * Representa la estructura de la tabla `categories` de la base de
 * datos (ver backend/supabase/schema.sql). Las categorías permiten
 * organizar y clasificar los incidentes reportados (HU04).
 *
 * @format
 */

'use strict';

const Category = {
  tableName: 'categories',
  fields: {
    id: 'INTEGER PRIMARY KEY AUTO_INCREMENT',
    name: 'VARCHAR(100) UNIQUE NOT NULL',
    description: 'VARCHAR(255)',
    active: 'BOOLEAN DEFAULT TRUE',
    createdAt: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
    updatedAt: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
  },
};

module.exports = Category;