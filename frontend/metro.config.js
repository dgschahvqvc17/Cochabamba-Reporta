const { getDefaultConfig } = require('expo/metro-config');

/**
 * Configuración de Metro (Expo).
 *
 * Parte de la base de Expo (maneja fuentes, node modules de expo, web, etc.)
 * y suma la extensión de asset `jfif` usada por la aplicación.
 *
 * @type {import('expo/metro-config').MetroConfig}
 */
const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push('jfif');

module.exports = config;