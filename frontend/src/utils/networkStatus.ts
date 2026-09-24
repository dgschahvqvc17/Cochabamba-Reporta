/**
 * Estado de red — implementación nativa (MVC - utils).
 *
 * Usa @react-native-community/netinfo para detectar la conexión a
 * internet en Android/iOS (incluido en Expo Go). La variante web vive
 * en networkStatus.web.ts y se resuelve automáticamente por la
 * plataforma.
 *
 * @format
 */

import NetInfo from '@react-native-community/netinfo';

export type NetworkStatusListener = (isOnline: boolean) => void;

/**
 * Se subscribe a los cambios de conectividad. Ejecuta `listener` de
 * inmediato con el estado actual y en cada cambio. Devuelve una función
 * para cancelar la suscripción.
 */
export function subscribeToNetwork(
  listener: NetworkStatusListener,
): () => void {
  return NetInfo.addEventListener((state) => {
    const online =
      state.isConnected === true && state.isInternetReachable !== false;
    listener(online);
  });
}