/**
 * Modelo de Usuario (MVC - Model).
 *
 * @format
 */

'use strict';

const User = {
  tableName: 'users',
  fields: {
    id: 'INTEGER PRIMARY KEY AUTO_INCREMENT',
    firstName: "VARCHAR(100) NOT NULL",
    lastName: "VARCHAR(100) NOT NULL",
    birthDate: 'DATE',
    identityNumber: 'VARCHAR(20)',
    phone: 'VARCHAR(20)',
    email: "VARCHAR(150) UNIQUE NOT NULL",
    password: 'VARCHAR(255) NOT NULL',
    role: "VARCHAR(50) DEFAULT 'CIUDADANO'",
    active: 'BOOLEAN DEFAULT TRUE',
    createdAt: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
    updatedAt: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
  },
};

module.exports = User;