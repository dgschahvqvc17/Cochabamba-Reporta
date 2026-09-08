/**
 * Modelo de Incidente (MVC - Model).
 *
 * @format
 */

'use strict';

const Incident = {
  tableName: 'incidents',
  fields: {
    id: 'INTEGER PRIMARY KEY AUTO_INCREMENT',
    userId: 'INTEGER NOT NULL',
    categoryId: 'INTEGER NOT NULL',
    title: 'VARCHAR(150) NOT NULL',
    description: 'TEXT NOT NULL',
    status: "VARCHAR(50) DEFAULT 'REPORTADO'",
    latitude: 'DECIMAL(10,7)',
    longitude: 'DECIMAL(10,7)',
    createdAt: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
    updatedAt: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
  },
};

module.exports = Incident;