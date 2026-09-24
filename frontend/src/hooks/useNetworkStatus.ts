/**
 * Hook compartido: estado de conexión a internet (MVC - hooks).
 *
 * Devuelve `true` si el dispositivo tiene conexión a internet y `false`
 * en caso contrario. Detecta los cambios en tiempo real usando la
 * implementación de red correspondiente a cada plataforma (navegador vs
 * netinfo nativo).
 *
 * @format
 */

import { useEffect, useState } from 'react';

import { subscribeToNetwork } from '../utils/networkStatus';

export function useNetworkStatus(): boolean {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToNetwork(setIsOnline);

    return unsubscribe;
  }, []);

  return isOnline;
}