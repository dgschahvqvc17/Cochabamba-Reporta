/**
 * Configuración de la API REST (MVC - config).
 *
 * Centraliza la URL base del backend:
 *   - Web: la app y la API corren en la misma máquina → localhost.
 *   - Móvil (Expo Go): se conecta al mismo host de LAN que sirve el bundle
 *     de Metro (`hostUri`), para que el celular alcance el backend del PC.
 *     Si no se puede deducir el host (export en producción), usa localhost.
 *
 * @format
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';

const API_PORT = 3000;
const API_PATH = '/api/v1';

function resolveApiHost(): string {
  if (Platform.OS === 'web') {
    return 'localhost';
  }

  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants as typeof Constants & {
      expoGoConfig?: { debuggerHost?: string };
    }).expoGoConfig?.debuggerHost ??
    '';

  const host = hostUri.split(':')[0].trim();

  return host || 'localhost';
}

export const API_BASE_URL = `http://${resolveApiHost()}:${API_PORT}${API_PATH}`;