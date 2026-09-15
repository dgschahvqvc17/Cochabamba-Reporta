/**
 * Pruebas unitarias — HU08 (utils/mapTiles.ts).
 *
 * Verifica la conversión Web Mercator lat/lng → tile (x, y, zoom)
 * y la generación de URLs usadas por MapPreview.
 *
 * @format
 */

import {
  MAX_MERCATOR_LATITUDE,
  clampLatitude,
  mercatorTile,
  tileUrl,
} from '../src/utils/mapTiles';

describe('mapTiles utils (HU08)', () => {
  test('calcula el tile de un punto conocido (zoom 1)', () => {
    // Ecuador/Greenwich en zoom 1: tile (1, 1).
    const tile = mercatorTile(0, 0, 1);
    expect(tile.x).toBe(1);
    expect(tile.y).toBe(1);
    expect(tile.zoom).toBe(1);
  });

  test('ubica el punto dentro del tile con offset en [0, 1)', () => {
    // 19.43, -99.13 (CDMX) en zoom 16.
    const tile = mercatorTile(19.4326084, -99.1332099, 16);
    expect(tile.zoom).toBe(16);
    expect(tile.offsetX).toBeGreaterThanOrEqual(0);
    expect(tile.offsetX).toBeLessThan(1);
    expect(tile.offsetY).toBeGreaterThanOrEqual(0);
    expect(tile.offsetY).toBeLessThan(1);
  });

  test('clampa latitudes fuera del rango Mercator (±85.05)', () => {
    expect(clampLatitude(90)).toBe(MAX_MERCATOR_LATITUDE);
    expect(clampLatitude(-90)).toBe(-MAX_MERCATOR_LATITUDE);
    expect(clampLatitude(19.43)).toBe(19.43);
  });

  test('genera URLs de tile y las envuelve por el borde del mundo', () => {
    const url = tileUrl(1, 1, 1);
    expect(url).toMatch(
      /^https:\/\/[a-f]\.basemaps\.cartocdn\.com\/dark_all\/1\/1\/1\.png$/,
    );

    // x negativo debe envolverse al final de la fila (zoom 1 → 2 tiles).
    expect(tileUrl(-1, 1, 1)).toContain('/1/1/1.png');
  });
});