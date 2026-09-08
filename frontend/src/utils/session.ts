/**
 * Almacén de sesión (MVC - utils).
 *
 * Persiste la sesión del usuario entre aperturas de la aplicación:
 *   - Web: usa localStorage (soporta "Recordarme").
 *   - Nativo: almacena en memoria (la persistencia nativa requeriría
 *     AsyncStorage, que se configura en una historia futura si aplica).
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
  const memoryRaw = memoryStore.get(SESSION_KEY) ?? null;
  const storage = getStorage();
  const raw = memoryRaw ?? (storage ? storage.getItem(SESSION_KEY) : null);

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as StoredSession;

    if (!isExpired(parsed)) {
      return parsed;
    }
  } catch {
    // Valor corrupto: se limpia debajo.
  }

  clearSession();
  return null;
}

export function getAccessToken(): string {
  return getStoredSession()?.accessToken ?? '';
}

export function getSessionUser(): User | null {
  return getStoredSession()?.user ?? null;
}