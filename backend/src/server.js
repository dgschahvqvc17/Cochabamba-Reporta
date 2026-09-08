/**
 * Servidor del backend.
 *
 * @format
 */

'use strict';

const app = require('./app');
const environment = require('./config/environment');

app.listen(environment.port, () => {
  console.log(`API REST iniciada en el puerto ${environment.port}`);
});