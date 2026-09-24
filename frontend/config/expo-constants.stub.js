/**
 * Stub de `expo-constants` para el build web (webpack).
 *
 * En web la API base siempre apunta a localhost, por lo que no hace falta
 * leer `hostUri`. Este stub evita resolver el paquete real en ese build.
 *
 * @format
 */

module.exports = {
  expoConfig: null,
  default: {
    expoConfig: null,
    manifest: null,
  },
};