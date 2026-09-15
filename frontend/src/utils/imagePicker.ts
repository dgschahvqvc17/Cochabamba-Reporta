/**
 * Utilidades de selección de imágenes (MVC - utils).
 *
 * HU07 — Adjuntar evidencia fotográfica.
 * Envuelve `react-native-image-picker` con una interfaz común para
 * galería y cámara en web y móvil. En web:
 *   - Galería: abre el <input type="file"> del navegador. El resultado es
 *     una data URL (+ base64 si `includeBase64`), sin fileName/type/fileSize.
 *   - Cámara: la librería muestra su propio modal con getUserMedia y
 *     devuelve la captura como data URL PNG.
 * `normalizeEvidence` (utils/evidence.ts) deriva los metadatos que faltan.
 *
 * @format
 */

import { Platform } from 'react-native';
import {
  launchCamera,
  launchImageLibrary,
  type Asset,
  type CameraOptions,
  type ImageLibraryOptions,
  type PhotoQuality,
} from 'react-native-image-picker';

import { normalizeEvidence } from './evidence';
import type { PickedEvidence } from './evidence';

export type PickerSource = 'gallery' | 'camera';

export interface PickerResult {
  ok: boolean;
  evidence?: PickedEvidence;
  /** true si el usuario canceló. */
  cancelled?: boolean;
  message?: string;
}

const toPickerResult = (
  didCancel: boolean | undefined,
  assets: Asset[] | undefined,
  errorMessage?: string,
): PickerResult => {
  if (errorMessage) {
    return { ok: false, message: errorMessage };
  }

  if (didCancel || !assets || assets.length === 0) {
    return { ok: false, cancelled: true };
  }

  return { ok: true, evidence: normalizeEvidence(assets[0]) };
};

export async function pickEvidence(source: PickerSource): Promise<PickerResult> {
  const imageQuality: PhotoQuality = 0.8;

  const commonOptions: {
    mediaType: 'photo';
    maxWidth: number;
    maxHeight: number;
    quality: PhotoQuality;
    includeBase64: boolean;
  } = {
    mediaType: 'photo',
    maxWidth: 1600,
    maxHeight: 1600,
    quality: imageQuality,
    includeBase64: Platform.OS === 'web',
  };

  const cameraOptions: CameraOptions = commonOptions;

  const libraryOptions: ImageLibraryOptions = {
    ...commonOptions,
    selectionLimit: 1,
  };

  try {
    if (source === 'camera') {
      const result = await launchCamera(cameraOptions);
      return toPickerResult(result.didCancel, result.assets, result.errorMessage);
    }

    const result = await launchImageLibrary(libraryOptions);
    return toPickerResult(result.didCancel, result.assets, result.errorMessage);
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : 'No se pudo acceder a las imágenes de tu dispositivo.',
    };
  }
}