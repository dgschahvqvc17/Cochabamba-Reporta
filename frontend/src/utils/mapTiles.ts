/**
 * Utilidades de tiles de mapa (MVC - utils).
 *
 * HU08 — Registrar ubicación del incidente.
 * Calcula el tile (x, y, zoom) de un mapa Web Mercator correspondiente
 * a unas coordenadas, junto con el desfase en submúltiplos de tile para
 * centrar la posición con precisión. Usado por `MapPreview` con tiles
 * de OpenStreetMap/CARTO (sin depender de SDKs nativos de mapas).
 *
 * Además, el mapa interactivo de incidentes necesita dos operaciones
 * sobre la misma proyección: `panCenter` (arrastrar el mapa) y
 * `fitPointsToView` (encuadrar todos los reportes a la vez).
 *
 * @format
 */

export const MAP_TILE_SIZE = 256;

/** Máximo paralelo soportado por el Web Mercator (≈85.05°). */
export const MAX_MERCATOR_LATITUDE = 85.0511287798066;

export const MIN_TILE_ZOOM = 1;
export const MAX_TILE_ZOOM = 19;

/** Zoom con el que arranca el mapa de incidentes (vista de ciudad). */
export const DEFAULT_MAP_ZOOM = 13;

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
 * Longitud/latitud → coordenadas normalizadas del mundo (0..1) en la
 * proyección Web Mercator. X crece hacia el este e Y hacia el sur (Y = 0
 * es el norte, Y = 1 el sur), que es la convención usada por los tiles.
 */
export function lonLatToWorld(
  latitude: number,
  longitude: number,
): { x: number; y: number } {
  const x = (longitude + 180) / 360;
  const latRad = (clampLatitude(latitude) * Math.PI) / 180;

  return {
    x,
    y: (1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2,
  };
}

/** Coordenadas normalizadas del mundo (0..1) → longitud/latitud. */
export function worldToLonLat(x: number, y: number): {
  longitude: number;
  latitude: number;
} {
  const yClamped = Math.max(0, Math.min(1, y));
  const n = Math.PI * (1 - 2 * yClamped);
  const latRad = Math.atan(Math.sinh(n));

  return {
    longitude: x * 360 - 180,
    latitude: (latRad * 180) / Math.PI,
  };
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
  const world = lonLatToWorld(latitude, longitude);

  const x = Math.floor(world.x * scale);
  const y = Math.floor(world.y * scale);

  return {
    x,
    y,
    zoom: safeZoom,
    offsetX: world.x * scale - x,
    offsetY: world.y * scale - y,
  };
}

/**
 * Desplaza el centro del mapa un número de píxeles, como si se arrastrara
 * el mapa con el dedo o el mouse. `dxPixels`/`dyPixels` positivos llevan el
 * centro hacia la derecha (este) y hacia abajo (sur) en pantalla, es decir,
 * el punto geográfico que queda en el centro del visor. Es la operación
 * inversa de convertir una coordenada a píxeles en `latLngToPixel`.
 */
export function panCenter(
  centerLatitude: number,
  centerLongitude: number,
  zoom: number,
  dxPixels: number,
  dyPixels: number,
): { latitude: number; longitude: number } {
  const safeZoom = Math.max(MIN_TILE_ZOOM, Math.min(MAX_TILE_ZOOM, zoom));
  const world = lonLatToWorld(centerLatitude, centerLongitude);
  const worldPixels = 2 ** safeZoom * MAP_TILE_SIZE;

  return worldToLonLat(
    world.x + dxPixels / worldPixels,
    world.y + dyPixels / worldPixels,
  );
}

export interface MapView {
  latitude: number;
  longitude: number;
  zoom: number;
}

export interface FitPointsOptions {
  /** Margen en píxeles alrededor de los puntos (para no pegarlos al borde). */
  padding?: number;
  minZoom?: number;
  maxZoom?: number;
  /**
   * Zoom usado cuando todos los puntos coinciden (o son indistinguibles):
   * sin encuadre que los separe, se muestra la zona con el zoom de partida
   * en lugar de acercarse al máximo.
   */
  defaultZoom?: number;
}

/**
 * Encuadra varios puntos geográficos dentro de un viewport: devuelve el
 * centro y el zoom (nunca mayor que el permitido) que los mete a todos en
 * pantalla. Se usa en el mapa para mostrar de una vez todos los reportes
 * del alcance del rol. Devuelve `null` si no hay puntos con ubicación.
 */
export function fitPointsToView(
  points: { latitude: number; longitude: number }[],
  viewWidth: number,
  viewHeight: number,
  {
    padding = 48,
    minZoom = MIN_TILE_ZOOM,
    maxZoom = MAX_TILE_ZOOM,
    defaultZoom = DEFAULT_MAP_ZOOM,
  }: FitPointsOptions = {},
): MapView | null {
  if (points.length === 0 || viewWidth <= 0 || viewHeight <= 0) {
    return null;
  }

  const worlds = points.map((point) =>
    lonLatToWorld(point.latitude, point.longitude),
  );

  const minX = Math.min(...worlds.map((point) => point.x));
  const maxX = Math.max(...worlds.map((point) => point.x));
  const minY = Math.min(...worlds.map((point) => point.y));
  const maxY = Math.max(...worlds.map((point) => point.y));

  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const center = worldToLonLat(centerX, centerY);

  const spanX = Math.max(maxX - minX, 1e-9);
  const spanY = Math.max(maxY - minY, 1e-9);

  // Con un único reporte (o varios en el mismo punto) no hay nada que
  // encuadrar: quedarse en el zoom de partida evita un acercamiento máximo
  // que no aporta información.
  const defaultWorldPixels = 2 ** defaultZoom * MAP_TILE_SIZE;
  if (spanX * defaultWorldPixels < 1 && spanY * defaultWorldPixels < 1) {
    return {
      latitude: center.latitude,
      longitude: center.longitude,
      zoom: Math.max(minZoom, Math.min(maxZoom, defaultZoom)),
    };
  }

  const usableWidth = Math.max(1, viewWidth - padding * 2);
  const usableHeight = Math.max(1, viewHeight - padding * 2);

  // Ancho en píxeles = fracción del mundo × tiles del mundo × tamaño de tile.
  const zoomForWidth = Math.log2(usableWidth / (spanX * MAP_TILE_SIZE));
  const zoomForHeight = Math.log2(usableHeight / (spanY * MAP_TILE_SIZE));
  const zoom = Math.max(
    minZoom,
    Math.min(maxZoom, Math.floor(Math.min(zoomForWidth, zoomForHeight))),
  );

  return { latitude: center.latitude, longitude: center.longitude, zoom };
}

/**
 * URL de un tile Esri "World Street Map" para {z}/{x}/{y}.
 * Estilo colorido tipo Google Maps (calles, manzanas, parques, agua y
 * etiquetas) con buena cobertura mundial, sin API key. Es el proveedor
 * usado por `MapPreview` porque en Bolivia CARTO "voyager" devuelve tiles
 * prácticamente vacíos (~16 colores).
 */
export function esriStreetUrl(x: number, y: number, zoom: number): string {
  const wrappedX = ((x % (2 ** zoom)) + 2 ** zoom) % (2 ** zoom);
  const wrappedY = Math.max(0, Math.min(2 ** zoom - 1, y));
  return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/${zoom}/${wrappedY}/${wrappedX}`;
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