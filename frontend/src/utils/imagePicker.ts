/**
 * Utilidades de selección de imágenes (MVC - utils).
 *
 * HU07 — Adjuntar evidencia fotográfica.
 * Envuelve `expo-image-picker` (compatible con Expo Go) con una interfaz
 * común para galería y cámara en web y móvil. En web:
 *   - Galería: abre el selector del sistema. El resultado se devuelve con
 *     `base64`, por lo que `normalizeEvidence` puede armar una data URL.
 *   - Cámara: pide el permiso del sistema y abre la cámara.
 * `normalizeEvidence` (utils/evidence.ts) deriva los metadatos que faltan.
 *
 * @format
 */

import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

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
  canceled: boolean,
  assets: ImagePicker.ImagePickerAsset[] | null | undefined,
): PickerResult => {
  if (canceled || !assets || assets.length === 0) {
    return { ok: false, cancelled: true };
  }

  const asset = assets[0];

  return {
    ok: true,
    evidence: normalizeEvidence({
      uri: asset.uri,
      base64: asset.base64 ?? undefined,
      fileName: asset.fileName ?? undefined,
      type: asset.mimeType ?? undefined,
      fileSize: asset.fileSize,
      width: asset.width,
      height: asset.height,
    }),
  };
};

export async function pickEvidence(source: PickerSource): Promise<PickerResult> {
  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: ['images'],
    allowsMultipleSelection: false,
    quality: 0.8,
    // En web `expo-image-picker` entrega la imagen como blob URL; se pide
    // el base64 para reconstruir una data URL y mantener el flujo de subida.
    base64: Platform.OS === 'web',
  };

  try {
    if (source === 'camera') {
      const permission = await ImagePicker.requestCameraPermissionsAsync();

      if (!permission.granted) {
        return {
          ok: false,
          message:
            'No se pudo acceder a la cámara. Actívala en los ajustes e inténtalo de nuevo.',
        };
      }

      const result = await ImagePicker.launchCameraAsync(options);
      return toPickerResult(result.canceled, result.assets ?? undefined);
    }

    const result = await ImagePicker.launchImageLibraryAsync(options);
    return toPickerResult(result.canceled, result.assets ?? undefined);
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