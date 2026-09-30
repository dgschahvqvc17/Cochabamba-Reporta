/**
 * Pruebas unitarias — HU07 (utils/evidence.ts).
 *
 * Verifica la normalización de la imagen seleccionada (web/nativo),
 * la validación de formato y tamaño, y las conversiones auxiliares
 * usadas por el flujo "Adjuntar evidencia fotográfica".
 *
 * @format
 */

import { Platform } from 'react-native';

import {
  ALLOWED_MIME_TYPES,
  MAX_IMAGE_SIZE,
  MAX_EVIDENCE_COUNT,
  dataUrlToBlob,
  extensionFromMime,
  formatFileSize,
  mimeFromFileName,
  normalizeEvidence,
  toUploadImage,
  validateEvidence,
} from '../src/utils/evidence';
import type { PickedEvidence } from '../src/utils/evidence';

// PNG de 1x1 (base64), suficiente para los casos de data URL.
const TINY_PNG_B64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

const WEB_DATA_URL = `data:image/png;base64,${TINY_PNG_B64}`;

const originalOS = Platform.OS;

const withPlatformOS = (os: typeof Platform.OS) => {
  Object.defineProperty(Platform, 'OS', {
    get: () => os,
    configurable: true,
  });
};

afterAll(() => {
  Object.defineProperty(Platform, 'OS', {
    get: () => originalOS,
    configurable: true,
  });
});

const makeEvidence = (overrides: Partial<PickedEvidence> = {}): PickedEvidence => ({
  uri: 'file:///tmp/placeholder.png',
  fileName: 'placeholder.png',
  mimeType: 'image/png',
  sizeBytes: 1000,
  ...overrides,
});

describe('evidence utils (HU07)', () => {
  test('normaliza una data URL de web (galería)', () => {
    withPlatformOS('web');

    const evidence = normalizeEvidence({
      uri: WEB_DATA_URL,
      base64: TINY_PNG_B64,
    });

    expect(evidence.mimeType).toBe('image/png');
    expect(evidence.fileName).toMatch(/^evidencia-\d+\.png$/);
    expect(evidence.sizeBytes).toBeGreaterThan(0);
  });

  test('normaliza un asset nativo con metadatos completos', () => {
    const evidence = normalizeEvidence({
      uri: 'file:///tmp/photo.jpg',
      fileName: 'foto.jpg',
      type: 'image/jpeg',
      fileSize: 123456,
    });

    expect(evidence.uri).toBe('file:///tmp/photo.jpg');
    expect(evidence.mimeType).toBe('image/jpeg');
    expect(evidence.sizeBytes).toBe(123456);
  });

  test('infiere el MIME desde el nombre de archivo', () => {
    expect(mimeFromFileName('evidencia.png')).toBe('image/png');
    expect(mimeFromFileName('foto.jpeg')).toBe('image/jpeg');
    expect(mimeFromFileName('foto.jfif')).toBe('image/jpeg');
    expect(mimeFromFileName('sin extension')).toBeNull();
  });

  test('mapea MIME → extensión y formatea tamaños', () => {
    expect(extensionFromMime('image/webp')).toBe('.webp');
    expect(formatFileSize(1024)).toBe('1 KB');
    expect(formatFileSize(3 * 1024 * 1024)).toBe('3 MB');
  });

  test('acepta imágenes válidas y rechaza formato inválido', () => {
    expect(validateEvidence(makeEvidence({ mimeType: 'image/jpeg' }))).toEqual({
      ok: true,
      message: '',
    });

    expect(
      validateEvidence(makeEvidence({ mimeType: 'image/gif' })).ok,
    ).toBe(false);

    expect(
      validateEvidence(
        makeEvidence({ sizeBytes: MAX_IMAGE_SIZE + 1 }),
      ).ok,
    ).toBe(false);
  });

  test('prepara un Blob tipado desde una data URL (web)', () => {
    withPlatformOS('web');

    const upload = toUploadImage({
      uri: WEB_DATA_URL,
      base64: TINY_PNG_B64,
      fileName: 'evidencia-1.png',
      mimeType: 'image/png',
      sizeBytes: 16,
    });

    expect(upload.kind).toBe('blob');
    expect(upload.object).toBeInstanceOf(Blob);
  });

  test('en nativo siempre usa {uri,name,type} (RN Blob no admite bytes)', () => {
    withPlatformOS('ios');

    const upload = toUploadImage({
      uri: 'file:///tmp/foto.jpg',
      base64: TINY_PNG_B64,
      fileName: 'foto.jpg',
      mimeType: 'image/png',
      sizeBytes: 16,
    });

    expect(upload.kind).toBe('native-file');
    expect(upload.object).toEqual({
      uri: 'file:///tmp/foto.jpg',
      name: 'foto.jpg',
      type: 'image/png',
    });
  });

  test('en nativo sin base64 cae al respaldo {uri,name,type}', () => {
    withPlatformOS('android');

    const upload = toUploadImage(
      makeEvidence({ mimeType: 'image/jpeg' }),
    );

    expect(upload.kind).toBe('native-file');
    expect(upload.object).toEqual({
      uri: 'file:///tmp/placeholder.png',
      name: 'placeholder.png',
      type: 'image/jpeg',
    });
  });

  test('las constantes coinciden con el límite de la HU07', () => {
    expect(MAX_IMAGE_SIZE).toBe(5 * 1024 * 1024);
    expect(MAX_EVIDENCE_COUNT).toBe(5);
    expect(ALLOWED_MIME_TYPES).toEqual([
      'image/jpeg',
      'image/png',
      'image/webp',
    ]);
  });

  test('convierte una data URL a Blob con su tipo MIME', () => {
    const blob = dataUrlToBlob(WEB_DATA_URL);
    expect(blob.type).toBe('image/png');
    expect(blob.size).toBeGreaterThan(0);
  });
});