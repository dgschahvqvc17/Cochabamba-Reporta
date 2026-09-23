/**
 * Utilidades de evidencias fotográficas (MVC - utils).
 *
 * HU07 — Adjuntar evidencia fotográfica.
 * Centraliza las reglas de las imágenes (constantes, inferencia de
 * formato/tamaño según la plataforma, validaciones y conversión de la
 * imagen seleccionada para su envío como multipart/form-data).
 *
 * Comportamiento por plataforma (expo-image-picker):
 *   - Web: devuelve `uri` como blob URL y el `base64` (si se pidió). Como
 *     el envío multipart depende de una data URL, se reconstruye aquí
 *     (`data:<mime>;base64,…`). La librería puede no entregar
 *     fileName/type/fileSize, por lo que se derivan del contenido.
 *   - Nativo: devuelve una URI de archivo local con fileName/mimeType/fileSize.
 *
 * @format
 */

import { Platform } from 'react-native';

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB

export const MAX_EVIDENCE_COUNT = 5;

export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.jfif', '.png', '.webp'];

export interface PickedEvidence {
  /** Nativo: file://… | Web: data URL. */
  uri: string;
  /** Solo en web (incluido con includeBase64). */
  base64?: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  width?: number;
  height?: number;
}

export interface UploadImageFile {
  kind: 'web-blob' | 'native-file';
  /** Web: Blob; Nativo: objeto { uri, name, type }. */
  object: Blob | { uri: string; name: string; type: string };
  name: string;
  type: string;
}

const MIME_TO_EXTENSION: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const EXTENSION_TO_MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.jfif': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

export function extensionFromMime(mimeType: string): string {
  return MIME_TO_EXTENSION[mimeType] ?? '.jpg';
}

export function mimeFromFileName(fileName: string): string | null {
  const name = String(fileName || '').toLowerCase();
  const index = name.lastIndexOf('.');
  if (index === -1) {
    return null;
  }
  return EXTENSION_TO_MIME[name.substring(index)] ?? null;
}

export function formatFileSize(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) {
    return `${Number(mb.toFixed(1))} MB`;
  }
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

interface ParsedDataUrl {
  mimeType: string;
  base64: string;
}

function parseDataUrl(dataUrl: string): ParsedDataUrl | null {
  const match = /^data:([^;,]+)(;base64)?,(.+)$/.exec(String(dataUrl));
  if (!match) {
    return null;
  }
  return {
    mimeType: match[1],
    base64: match[3] ?? '',
  };
}

function computeBase64Size(base64: string): number {
  // Cada carácter base64 equivale a ~6 bits; tamaño aproximado real.
  return Math.floor((base64.length * 3) / 4);
}

/**
 * Convierte la respuesta del selector de imagen (Asset) en una
 * `PickedEvidence` normalizada con fileName/mimeType/sizeBytes derivados
 * según la plataforma.
 */
export function normalizeEvidence(asset: {
  uri?: string;
  base64?: string;
  fileName?: string;
  type?: string;
  fileSize?: number;
  width?: number;
  height?: number;
}): PickedEvidence {
  let uri = asset.uri ?? '';

  if (Platform.OS === 'web') {
    const parsed = parseDataUrl(uri);
    const mimeType = (asset.type && asset.type.toLowerCase()) ||
      (parsed && parsed.mimeType) ||
      'image/jpeg';
    const base64 = asset.base64 || (parsed ? parsed.base64 : '');

    // expo-image-picker (web) entrega blob URLs: se reconstruye la data URL
    // para que `dataUrlToBlob` y la subida multipart sigan funcionando.
    if (!parsed && base64) {
      uri = `data:${mimeType};base64,${base64}`;
    }

    const sizeBytes =
      asset.fileSize || (base64 ? computeBase64Size(base64) : 0);
    const fileName =
      asset.fileName || `evidencia-${Date.now()}${extensionFromMime(mimeType)}`;

    return {
      uri,
      base64: base64 || undefined,
      fileName,
      mimeType,
      sizeBytes,
      width: asset.width,
      height: asset.height,
    };
  }

  const mimeType =
    (asset.type && asset.type.toLowerCase()) ||
    mimeFromFileName(asset.fileName ?? '') ||
    'image/jpeg';
  const fileName =
    asset.fileName || `evidencia-${Date.now()}${extensionFromMime(mimeType)}`;

  return {
    uri,
    base64: asset.base64,
    fileName,
    mimeType,
    sizeBytes: asset.fileSize ?? 0,
    width: asset.width,
    height: asset.height,
  };
}

/**
 * Valida una evidencia ya normalizada. Devuelve `ok: true` o un mensaje
 * comprensible para la alerta (HU07: validar formato y tamaño).
 */
export function validateEvidence(
  evidence: PickedEvidence,
): { ok: boolean; message: string } {
  const mimeType = evidence.mimeType.toLowerCase();

  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    return {
      ok: false,
      message:
        'El formato de la imagen no es válido. Solo se permiten JPG, JFIF, PNG y WebP.',
    };
  }

  if (evidence.sizeBytes <= 0 || evidence.sizeBytes > MAX_IMAGE_SIZE) {
    return {
      ok: false,
      message: `La imagen supera el tamaño máximo permitido (${formatFileSize(
        MAX_IMAGE_SIZE,
      )}).`,
    };
  }

  return { ok: true, message: '' };
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const parsed = parseDataUrl(dataUrl);
  const mimeType = (parsed && parsed.mimeType) || 'image/jpeg';
  const base64 = (parsed && parsed.base64) || '';

  const binary = globalThis.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new Blob([bytes], { type: mimeType });
}

/** Prepara la imagen para `FormData.append('image', …)` por plataforma. */
export function toUploadImage(evidence: PickedEvidence): UploadImageFile {
  if (Platform.OS === 'web') {
    return {
      kind: 'web-blob',
      object: dataUrlToBlob(evidence.uri),
      name: evidence.fileName,
      type: evidence.mimeType,
    };
  }

  return {
    kind: 'native-file',
    object: {
      uri: evidence.uri,
      name: evidence.fileName,
      type: evidence.mimeType,
    },
    name: evidence.fileName,
    type: evidence.mimeType,
  };
}