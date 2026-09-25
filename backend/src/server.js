/**
 * Servidor del backend.
 *
 * @format
 */

'use strict';

/**
 * Manejadores globales de promesas sin manejar.
 *
 * Un rechazo no atendido (p. ej. un error de red de Supabase en LAN) no debe
 * tumbar el proceso sin dejar rastro. Se registra el motivo real y se evita
 * que nodemon reinicie por un `#<Object>` ininteligible.
 *
 * @format
 */

process.on('unhandledRejection', (reason) => {
  const detail =
    reason instanceof Error
      ? reason.stack || reason.message
      : JSON.stringify(reason) || String(reason);
  console.error(`[unhandledRejection] Promesa rechazada sin manejar: ${detail}`);
});

process.on('uncaughtException', (error) => {
  console.error(`[uncaughtException] Error no capturado: ${error.stack || error}`);
});

const app = require('./app');
const environment = require('./config/environment');

app.listen(environment.port, () => {
  console.log(`API REST iniciada en el puerto ${environment.port}`);
});