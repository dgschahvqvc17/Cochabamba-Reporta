/**
 * Estado de red — implementación web (MVC - utils).
 *
 * En navegadores se usa Navigator.onLine + los eventos `online`/`offline`
 * del window. La variante nativa vive en networkStatus.ts y se elige la
 * correcta según la plataforma (Metro/webpack resuelven `.web.ts`).
 *
 * @format
 */

export type NetworkStatusListener = (isOnline: boolean) => void;

function getOnline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine === true;
}

/**
 * Se subscribe a los cambios de conectividad. Ejecuta `listener` de
 * inmediato con el estado actual y en cada cambio. Devuelve una función
 * para cancelar la suscripción.
 */
export function subscribeToNetwork(
  listener: NetworkStatusListener,
): () => void {
  const handleOnline = () => listener(true);
  const handleOffline = () => listener(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  listener(getOnline());

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}