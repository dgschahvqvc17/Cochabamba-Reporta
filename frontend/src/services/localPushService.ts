/**
 * Servicio de alerta local en el dispositivo (MVC - Service).
 *
 * HU14 — "Recibir notificaciones y consultar seguimiento".
 *
 * Muestra una notificación en el dispositivo (banner/línea de estado del
 * sistema, como hacen otras apps) cuando el ciudadano tiene un cambio de
 * estado nuevo SIN leer en su reporte. No depende de email ni de correo.
 *
 * Se implementa con `expo-notifications` (notificación LOCAL):
 *   - No requiere credenciales FCM/APNs ni servidor de push externo.
 *   - Funciona en Android/iOS con Expo Go y en builds nativos.
 *   - En web es un no-op controlado (se conserva el badge en-app).
 *
 * Las llamadas a expo-notifications NO se importan a nivel de módulo para no
 * romper la compilación web ni los tests (solo requieren módulos nativos).
 *
 * @format
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';

let nativeNotifications: typeof import('expo-notifications') | null = null;
let ready = false;
let channelReady = false;

/**
 * Devuelve `true` cuando la app corre dentro de **Expo Go**.
 *
 * Con SDK 53+, `expo-notifications` lanza `warnOfExpoGoPushUsage` al ser
 * importado dentro de Expo Go (el bundle de Expo Go ya no incluye el módulo
 * nativo de notificaciones). Por eso, en Expo Go NUNCA llegamos a importar el
 * módulo: el ciudadano ve el badge in-app y el aviso, y el banner de sistema
 * ("como otras apps") se activa solo en un development build / build nativo.
 */
function isExpoGo(): boolean {
  try {
    return (
      Platform.OS !== 'web' &&
      Constants.executionEnvironment === Constants.ExecutionEnvironment.StoreClient
    );
  } catch {
    return false;
  }
}

/** Carga dinámica de expo-notifications, solo en plataformas nativas. */
async function getNative(): Promise<typeof import('expo-notifications') | null> {
  if (ready) {
    return nativeNotifications;
  }

  ready = true;

  if (Platform.OS === 'web' || isExpoGo()) {
    nativeNotifications = null;
    return null;
  }

  try {
    // Carga diferida: evita romper web (Metro resuelve el módulo nativo solo
    // fuera de web; en CI/web la rama inferior devuelve null antes).
    const mod = await import('expo-notifications');
    nativeNotifications = mod;
  } catch {
    nativeNotifications = null;
  }

  return nativeNotifications;
}

/** Configura el canal de notificación Android + el handler del banner. */
async function ensureChannelAndHandler(notifications: typeof import('expo-notifications')): Promise<void> {
  if (channelReady) {
    return;
  }

  channelReady = true;

  try {
    if (Platform.OS === 'android') {
      await notifications.setNotificationChannelAsync('incidentes', {
        name: 'Cambios de incidentes',
        importance: notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 120, 60, 120],
        lightColor: '#3B82A0',
      });
    }

    // Banner mientras la app está en primer plano (HU14: "mostrar alertas
    // de nuevos cambios" dentro de la pantalla como otras apps).
    notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
  } catch {
    // El handler/channel falla silenciosamente en entornos sin módulos nativos.
  }
}

/**
 * Pide permiso para mostrar notificaciones en el dispositivo.
 * Devuelve `false` sin lanzar error cuando no hay soporte nativo.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  const notifications = await getNative();
  if (!notifications) {
    return false;
  }

  try {
    await ensureChannelAndHandler(notifications);

    const current = await notifications.getPermissionsAsync();
    if (current.granted) {
      return true;
    }

    const requested = await notifications.requestPermissionsAsync();
    return requested.granted;
  } catch {
    return false;
  }
}

/**
 * Prepara el servicio (canal + handler + permiso). Idempotente y seguro
 * de llamar en cada montaje de la pantalla principal.
 */
export async function initializeLocalNotifications(): Promise<boolean> {
  const notifications = await getNative();
  if (!notifications) {
    return false;
  }

  try {
    await ensureChannelAndHandler(notifications);
    return await requestNotificationPermission();
  } catch {
    return false;
  }
}

/**
 * Presenta una notificación local en el dispositivo.
 *
 * @param title Título corto (p. ej. "Cambio de estado").
 * @param body  Mensaje (p. ej. "Tu reporte #INC-0001 pasó a En atención").
 * @returns `true` si se mostró en el dispositivo.
 */
export async function presentDeviceNotification(
  title: string,
  body: string,
): Promise<boolean> {
  const notifications = await getNative();
  if (!notifications) {
    return false;
  }

  try {
    await ensureChannelAndHandler(notifications);
    await notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: 'default' as unknown as boolean,
      },
      trigger: null,
    });
    return true;
  } catch {
    return false;
  }
}

export default {
  initializeLocalNotifications,
  requestNotificationPermission,
  presentDeviceNotification,
};
