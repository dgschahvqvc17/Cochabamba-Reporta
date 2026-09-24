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

// Asset de imágenes y fuentes web usadas por la aplicación. Metro por
// defecto no reconoce `jfif` ni los formatos woff/woff2 (a diferencia de
// webpack), por lo que hay que registrarlos explícitamente para que el
// bundle web (`expo start` → web) resuelva las fuentes de @fontsource.
config.resolver.assetExts.push('jfif', 'woff', 'woff2');

module.exports = config;