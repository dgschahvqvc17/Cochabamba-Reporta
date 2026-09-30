/**
 * Almacén de sesión (MVC - utils).
 *
 * Persiste la sesión del usuario entre aperturas de la aplicación:
 *   - Web: usa localStorage (soporta "Recordarme").
 *   - Nativo: almacena en memoria (la persistencia nativa requeriría
 *     AsyncStorage, que se configura en una historia futura si aplica).
 * Sin comunicación con el sistema no se puede comprobar la vigencia de la
 * sesión, así que `peekStoredSession` la devuelve tal cual y el cierre de
 * sesión se pospone hasta que vuelva la conexión (ver AppNavigator).
 *
 * @format
 */

import { Platform } from 'react-native';

import type { User } from '../models/User';

const SESSION_KEY = 'cbba_reporta_session_v1';

export interface StoredSession {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

type StorageLike = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

const isWeb = Platform.OS === 'web';

const memoryStore = new Map<string, string>();

function getStorage(): StorageLike | null {
  if (!isWeb) {
    return null;
  }

  try {
    const storage = (
      globalThis as unknown as { localStorage?: StorageLike }
    ).localStorage;

    return storage || null;
  } catch {
    return null;
  }
}

function isExpired(session: StoredSession): boolean {
  return session.expiresAt * 1000 <= Date.now();
}

/**
 * `true` si hay una sesión guardada y su vigencia sigue vigente. Es la
 * comprobación que se usa solo cuando hay conexión; sin internet el usuario
 * no se cierra la sesión.
 */
export function isSessionValid(): boolean {
  const session = peekStoredSession();

  if (!session || isExpired(session)) {
    clearSession();
    return false;
  }

  return true;
}

export function saveSession(session: StoredSession, remember: boolean): void {
  const raw = JSON.stringify(session);

  if (isWeb) {
    const storage = getStorage();
    if (storage) {
      if (remember) {
        storage.setItem(SESSION_KEY, raw);
      } else {
        storage.removeItem(SESSION_KEY);
      }
    }
  }

  // Siempre disponible en la sesión actual de la app.
  memoryStore.set(SESSION_KEY, raw);
}

export function clearSession(): void {
  memoryStore.delete(SESSION_KEY);

  const storage = getStorage();
  if (storage) {
    storage.removeItem(SESSION_KEY);
  }
}

export function getStoredSession(): StoredSession | null {
  const parsed = peekStoredSession();

  if (parsed && !isExpired(parsed)) {
    return parsed;
  }

  clearSession();
  return null;
}

/**
 * Devuelve la sesión guardada aunque su vigencia haya terminado, sin
 * borrarla. Sin comunicación con el sistema no se puede saber si la sesión
 * sigue siendo válida, así que leer el token nunca debe expulsar al usuario:
 * el cierre se decide en AppNavigator (al volver la conexión) o cuando la
 * API responde 401 de verdad.
 */
export function peekStoredSession(): StoredSession | null {
  const memoryRaw = memoryStore.get(SESSION_KEY) ?? null;
  const storage = getStorage();
  const raw = memoryRaw ?? (storage ? storage.getItem(SESSION_KEY) : null);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as StoredSession;
  } catch {
    return null;
  }
}

/**
 * Token para las peticiones. No borra la sesión: si el token ya no sirve,
 * el servidor responde 401 y entonces sí se cierra (ver apiClient).
 */
export function getAccessToken(): string {
  return peekStoredSession()?.accessToken ?? '';
}

export function getSessionUser(): User | null {
  return peekStoredSession()?.user ?? null;
}