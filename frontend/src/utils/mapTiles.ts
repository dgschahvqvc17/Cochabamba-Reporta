/**
 * Utilidades de tiles de mapa (MVC - utils).
 *
 * HU08 — Registrar ubicación del incidente.
 * Calcula el tile (x, y, zoom) de un mapa Web Mercator correspondiente
 * a unas coordenadas, junto con el desfase en submúltiplos de tile para
 * centrar la posición con precisión. Usado por `MapPreview` con tiles
 * de OpenStreetMap/CARTO (sin depender de SDKs nativos de mapas).
 *
 * @format
 */

export const MAP_TILE_SIZE = 128;

/** Máximo paralelo soportado por el Web Mercator (≈85.05°). */
export const MAX_MERCATOR_LATITUDE = 85.0511287798066;

export const MIN_TILE_ZOOM = 1;
export const MAX_TILE_ZOOM = 19;

export interface MercatorTile {
  x: number;
  y: number;
  zoom: number;
  /** Fracción [0,1) del punto dentro de su tile en X. */
  offsetX: number;
  /** Fracción [0,1) del punto dentro de su tile en Y. */
  offsetY: number;
}

export function clampLatitude(latitude: number): number {
  return Math.max(
    -MAX_MERCATOR_LATITUDE,
    Math.min(MAX_MERCATOR_LATITUDE, latitude),
  );
}

/**
 * Latitud/longitud → tile Web Mercator + desfase dentro del tile.
 * Los límites de la HU08 ([-90, 90], [-180, 180]) ya están validados
 * antes de llegar aquí (utils/location.ts).
 */
export function mercatorTile(
  latitude: number,
  longitude: number,
  zoom: number,
): MercatorTile {
  const safeZoom = Math.max(MIN_TILE_ZOOM, Math.min(MAX_TILE_ZOOM, zoom));
  const scale = 2 ** safeZoom;
  const clampedLatitude = clampLatitude(latitude);

  const worldX = (longitude + 180) / 360;
  const latRad = (clampedLatitude * Math.PI) / 180;
  const worldY =
    (1 -
      Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) /
    2;

  const x = Math.floor(worldX * scale);
  const y = Math.floor(worldY * scale);

  return {
    x,
    y,
    zoom: safeZoom,
    offsetX: worldX * scale - x,
    offsetY: worldY * scale - y,
  };
}

/** Estilos de tiles CARTO disponibles (sin API key). */
export type MapTileStyle = 'light_all' | 'dark_all' | 'rastertiles/voyager';

/**
 * URL de un tile CARTO para {z}/{x}/{y}.
 * Por defecto usa `light_all`: un mapa claro y legible con calles
 * etiquetadas, más intuitivo que los fondos oscuros.
 */
export function tileUrl(
  x: number,
  y: number,
  zoom: number,
  style: MapTileStyle = 'light_all',
): string {
  const wrappedX = ((x % (2 ** zoom)) + 2 ** zoom) % (2 ** zoom);
  const wrappedY = Math.max(0, Math.min(2 ** zoom - 1, y));
  const server = 'abcdef'[Math.abs(x) % 6];
  return `https://${server}.basemaps.cartocdn.com/${style}/${zoom}/${wrappedX}/${wrappedY}.png`;
}